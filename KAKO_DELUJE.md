# ePlače 2026 — Kako sistem deluje

**Verzija:** 1.0 (seja 5, 24. 8. 2026)  
**Namen:** Točen tehnični opis sistema za diplomsko nalogo

---

## 1. Arhitekturni pregled

```
Browser (Angular 18)
    │  HTTP JSON
    ▼
Express API  :3000
    │  SQL (mssql npm)
    │  BullMQ jobs
    ▼               ▼
MS SQL 2022      Redis 7
(Docker)         (Docker)
                    │
                    ▼
              BullMQ Worker
              (payroll.worker.ts)
```

Vse tri komponente (API, worker, frontend dev server) tečejo ločeno. Worker je edina komponenta, ki dejansko izvaja plačilni kalkulator.

---

## 2. Večnajemniška izolacija (Row-Level Security)

### Mehanizem

Vsaka vrstica v vseh poslovnih tabelah (`employees`, `monthly_hours`, `payroll_runs`, `payroll_lines`, `job_positions`, `payroll_params`, `users`) vsebuje stolpec `tenant_id`.

Na vsaki tabeli je varnostna politika `EmployeeRLSPolicy`:

```sql
CREATE SECURITY POLICY EmployeeRLSPolicy
  ADD FILTER PREDICATE dbo.fn_rls_tenant(tenant_id) ON dbo.employees,
  ADD FILTER PREDICATE dbo.fn_rls_tenant(tenant_id) ON dbo.payroll_runs,
  -- ... vse tabele
WITH (STATE = ON);
```

Predikatna funkcija:

```sql
CREATE FUNCTION dbo.fn_rls_tenant(@tid UNIQUEIDENTIFIER)
RETURNS TABLE WITH SCHEMABINDING AS
RETURN SELECT 1 AS r
WHERE CAST(SESSION_CONTEXT(N'tenant_id') AS UNIQUEIDENTIFIER) = @tid;
```

### `withTenant<T>()` vzorec

Vsaka zahteva na backendu nastavi kontekst pred poizvedbo:

```typescript
// backend/src/config/db.ts
export async function withTenant<T>(tenantId: string, fn: (tx: sql.ConnectionPool) => Promise<T>): Promise<T> {
  const pool = await getPool();
  await pool.request()
    .input('tid', sql.UniqueIdentifier, tenantId)
    .query(`EXEC sp_set_session_context N'tenant_id', @tid`);
  return fn(pool);
}
```

### Ključna ugotovitev

RLS filtrira **tudi sistemskega administratorja `sa`**, kadar `SESSION_CONTEXT` ni nastavljen. Za direktno diagnostiko v Docker kontejnerju je treba vedno najprej klicati:

```sql
EXEC sp_set_session_context N'tenant_id', N'<GUID najemnika>';
```

---

## 3. Avtentikacija in avtorizacija

### JWT tok

1. `POST /auth/login` → preveri email + bcrypt hash gesla → vrne JWT (8h)
2. Vsaka nadaljnja zahteva mora imeti `Authorization: Bearer <token>`
3. `auth.middleware.ts` preveri token, dekodira `{ tenantId, userId, role }`, nastavi `req.user`

### Vloge

| Vloga | Dovoljenja |
|-------|-----------|
| `Skrbnik` | CRUD delavcev, ure, obračun, izvoz |
| `SistemskiAdmin` | Vse od Skrbnika + upravljanje najemnikov |
| `Uporabnik` | Branje (rezervirano za prihodnost) |

`requireRole(...)` middleware zavrne z 403, če vloga ne ustreza.

---

## 4. Plačilni kalkulator

### Dual-mode engine (`slovenian-payroll-engine.ts`)

Kalkulator podpira dva načina glede na vrednost `urna_postavka` delavca:

#### Način A — Fiksni bruto

Uporablja se, kadar delavec nima urne postavke (`urna_postavka IS NULL`).

```
BRUTO 1 = bruto_osnova × pro_rata_faktor
pro_rata = m01_redno_ure / POLNI_MESEC_URE  (le kadar < polni mesec)
```

#### Način B — Parametrični (urna postavka)

Uporablja se, kadar delavec ima urno postavko.

```
m01_redno_znesek   = urna_postavka × DOP_FAKTOR(1.00) × m01_redno_ure
m04_dopust_znesek  = urna_postavka × DOP_FAKTOR(1.00) × m04_dopust_ure
m05_bolniska       = urna_postavka × BOL_FAKTOR(0.80) × m05_bolniske_ure
nadure_znesek      = urna_postavka × NAD_FAKTOR(1.30) × m03_nadure_ure
BRUTO 1            = m01 + m04 + m05
```

Minimalna plača 2026: **1.481,88 €** (preverba po izračunu).

### 23-koračni kalkulator

Po določitvi BRUTO 1 kalkulator vedno izračuna iste korake:

| Korak | Opis | Stopnja |
|-------|------|---------|
| PIZ delojemalec | Pokojninsko zavarovanje | 15,50 % |
| ZZ delojemalec | Zdravstveno zavarovanje | 6,36 % |
| ZAP delojemalec | Zaposlovanje | 0,14 % |
| STAR delojemalec | Starševsko varstvo | 0,10 % |
| DO delojemalec | Dodatno pokojninsko | 1,00 % |
| Davčna osnova | BRUTO 1 − prispevki − olajšave | — |
| Dohodnina | Stopničasta lestvica 2026 | 16/27/34/39/50 % |
| OZP | Obvezno zdravstveno prostovoljno | 35 € (opcijsko) |
| Prehrana | Povračilo stroškov prehrane | param × delovni dnevi |
| Prevoz | Povračilo stroškov prevoza | param × km × delovni dnevi |
| PIZ delodajalec | | 8,85 % |
| ZZ delodajalec | | 6,56 % |
| ZAP delodajalec | | 0,06 % |
| STAR delodajalec | | 0,10 % |
| DO delodajalec | | 1,00 % |
| Poškodbe pri delu | | 0,53 % |
| **Skupni strošek (BRUTO 2)** | BRUTO 1 + prispevki delodajalca | — |

Vsi izračuni uporabljajo `BigNumber.js` z zaokroževanjem `ROUND_HALF_UP` na 2 decimalni mesti.

---

## 5. Asinhroni obračun (Hipoteza H1)

```
POST /payroll/runs
    │
    ├── Vstavi vrstico v payroll_runs (status: Procesiranje)
    ├── Doda job v BullMQ redis queue
    └── Takoj vrne HTTP 202 Accepted { id, status }

                    │ (ločen proces)
                    ▼
           payroll.worker.ts (BullMQ)
                    │
                    ├── Prebere vse aktivne delavce najemnika
                    ├── Za vsakega prebere monthly_hours za ta mesec
                    ├── Pokliče slovenian-payroll-engine.ts
                    └── Vstavi vrstice v payroll_lines
```

Frontend nato anketa `GET /payroll/runs/:id` vsako 2 sekundi na progress strani, dokler status ni `Zaključen`.

---

## 6. Mehki izbris delavcev

Gumb "Briši" v meniju Delavci **ne izbriše vrstice** iz tabele `employees`. Nastavi le `aktivno = 0`.

**Posledice:**
- Deaktiviran delavec ni vključen v naslednje obračune (`WHERE e.aktivno = 1`)
- Zgodovinski plačilni listi ostanejo nedotaknjeni (denormalizirani podatki v `payroll_lines`)
- Deaktiviranega delavca je mogoče reaktivirati

**Zakaj to je pravilno vedenje:** Plačilne liste so pravni dokumenti in se ne smejo naknadno brisati ali menjati.

---

## 7. Čarovnik za obračun (wizard.component.ts)

### Tok v 3 korakih

```
Korak 1: Izbira obdobja (leto + mesec + datum izplačila)
    │
Korak 2: Pregled delavcev (GET /employees → prikaz aktivnih)
    │
Korak 3: Sproži obračun → POST /payroll/runs
    │
    ├── 202 Accepted → navigate('/payroll/:id/progress')
    └── 409 Conflict → GET /payroll/runs → najdi po leto+mesec → navigate('/payroll/:id/progress')
```

### 409 logika

Kadar za izbrani mesec obračun že obstaja, sistem:
1. Pokliče `GET /payroll/runs` (vrne vse obračune tega najemnika)
2. Poišče obračun z ujemajočim se `leto` in `mesec`
3. Preusmeri na `/payroll/:id/progress` — brez prikazovanja napake

---

## 8. Izvozni formati

| Format | Pot | Namen |
|--------|-----|-------|
| SEPA pain.001.001.03 | `GET /export/sepa/:runId` | Datoteka za banko (nakazila plač) |
| VOD temeljnica | `GET /export/vod/:runId` | Knjižna temeljnica za računovodstvo |
| REK-O XML | `GET /export/rek/:runId` | Poročilo FURS (davčni organ) |

---

## 9. Podatkovni model (ključne tabele)

```
tenants ──< users
tenants ──< employees ──< monthly_hours
tenants ──< payroll_runs ──< payroll_lines
tenants ──< job_positions
tenants ──< payroll_params
```

- `employees` in `job_positions` imajo **temporalne tabele** (SQL Server Temporal) → historia vseh sprememb
- `payroll_runs` ima unikatni indeks na `(tenant_id, leto, mesec)` → en obračun na mesec na najemnika
- `payroll_lines` FK na `payroll_runs` z `ON DELETE CASCADE`

---

## 10. Zagon za razvoj

```bash
# 1. Zaženi Docker kontejnerje
docker compose up -d

# 2. Prvič: inicializacija baze
cd backend
npm run seed

# 3. Prevedi TypeScript
npm run build

# 4. Zaženi backend (3 ločena okna)
node dist/app.js                    # API na :3000
node dist/workers/payroll.worker.js  # BullMQ worker

# 5. Zaženi frontend
cd ../frontend
ng serve --open                      # Angular na :4200
```

Privzeti dostop: `admin@a.si` / `Test1234!`
