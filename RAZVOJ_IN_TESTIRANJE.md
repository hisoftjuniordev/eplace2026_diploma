# ePlače 2026 — Razvoj in testiranje
**Datum:** 17. 8. 2026 | **Avtor:** Miha Bratina | **Status:** MVP dokončan ✅

---

## 1. Pregled projekta

ePlače 2026 je SaaS aplikacija za obračun plač, razvita kot diplomska naloga na ŠC Nova Gorica VSŠ. Aplikacija dokazuje tri hipoteze:

| Hipoteza | Trditev | Status |
|----------|---------|--------|
| **H1** | Asinhroni HTTP endpoint vrne 202 Accepted v <20ms | ✅ Dokazano |
| **H2** | Angular Reactive Forms blokirajo neveljaven vnos | ✅ Dokazano |
| **H3** | MS SQL Row-Level Security izolira podatke med najemniki | ✅ Dokazano |

---

## 2. Tehnološki sklad

| Plast | Tehnologija |
|-------|-------------|
| Frontend | Angular 18, standalone komponente, Signals, Reactive Forms, TailwindCSS |
| Backend | Node.js, TypeScript, Express, express-async-errors, Zod v4 |
| Baza | MS SQL Server 2022, Temporal Tables, Row-Level Security |
| Asinhrono | BullMQ + Redis |
| Varnost | JWT (8h), bcrypt cost 12, RLS predikati |
| Izvoz | SEPA pain.001.001.03 XML, VOD XML |

---

## 3. Struktura baze podatkov

### Tabele
- `tenants` — najemniki (podjetja)
- `users` — uporabniki z vlogami: `SistemskiAdmin`, `Skrbnik`, `Uporabnik`
- `job_positions` — delovna mesta s tarifnimi razredi (1–9) — **Temporal Table**
- `employees` — delavci s plačnimi podatki — **Temporal Table**
- `monthly_hours` — mesečne ure, prehrana, prevoz, nadure
- `payroll_runs` — obračuni plač z napredkom in statusom
- `payroll_lines` — vrstice obračuna po delavcu
- `audit_logs` — revizijska sled

### Migracijske skripte
| Datoteka | Namen |
|----------|-------|
| `01_schema.sql` | Kreacija vseh tabel z omejitvami in indeksi |
| `02_rls.sql` | RLS varnostna funkcija in politika |
| `03_stored_procs.sql` | Shranjene procedure (če obstajajo) |
| `04_seed.sql` — arhiv | Začetni podatki (zamenjani z `seed.ts`) |
| `05_alter.sql` | Migracijske spremembe: nove kolumne, razširitev RLS |

### Row-Level Security (H3)
```sql
CREATE FUNCTION dbo.fn_securitypredicate(@tenant_id UNIQUEIDENTIFIER)
RETURNS TABLE WITH SCHEMABINDING AS
RETURN SELECT 1 AS fn_result
WHERE CAST(SESSION_CONTEXT(N'tenant_id') AS UNIQUEIDENTIFIER) = @tenant_id;
```
- FILTER predikat: `employees`, `monthly_hours`, `payroll_runs`, `payroll_lines`, `audit_logs`, `job_positions`
- BLOCK AFTER INSERT: vse zgornje tabele + `users`
- **Tabela `users` nima FILTER predikata** — login endpoint mora brati vse vrstice brez tenant konteksta

### Temporal Tables
- `employees` in `job_positions` imata `SYSTEM_VERSIONING = ON`
- Pri dodajanju kolumn: potrebno izklopiti `SYSTEM_VERSIONING`, dodati kolumno, vklopiti nazaj
- Pri spremembi RLS politike na temporal tabeli: potrebno **DROPATI politiko** (ne samo onemogočiti)

---

## 4. Backend — Express API

### Struktura
```
backend/src/
├── app.ts                  # Express aplikacija, middleware, routing
├── config/db.ts            # MSSQL pool, withTenant(), sysQuery()
├── controllers/
│   ├── auth.controller.ts  # POST /auth/login, GET /auth/me
│   ├── employees.controller.ts
│   ├── hours.controller.ts
│   ├── jobpositions.controller.ts
│   └── payroll.controller.ts
├── middleware/
│   ├── auth.middleware.ts  # JWT verifikacija
│   ├── role.middleware.ts  # requireRole(...roles)
│   ├── validate.middleware.ts # Zod validacija req.body
│   └── schemas.ts          # Zod sheme za vse endpointe
├── repositories/
│   ├── employee.repo.ts    # CRUD z mehkim brisanjem
│   ├── jobpositions.repo.ts
│   └── payroll.repo.ts
├── engine/
│   └── slovenian-payroll-engine.ts  # Obračun z BigNumber.js
├── workers/
│   └── payroll.worker.ts   # BullMQ delavec
├── xml/
│   ├── sepa.generator.ts   # SEPA pain.001.001.03
│   └── vod.generator.ts    # VOD XML za računovodstvo
└── scripts/seed.ts         # Začetni podatki z bcrypt
```

### Ključne rešitve
- **`withTenant(tenantId, fn)`** — nastavi `SESSION_CONTEXT` pred vsako tenant-scoped poizvedbo
- **`sysQuery(sql, bind)`** — poizvedba brez tenant konteksta (za login, sistemske operacije)
- **`express-async-errors`** — globalni error handler, brez try/catch v routerjih
- **JWT payload** vsebuje: `sub`, `email`, `vloga`, `tenantId`, `ime`, `priimek`
- **Mehko brisanje**: `aktivno = 0` namesto DELETE za delavce in delovna mesta

### Zod validacija — popravki
- **Zod v4 `z.string().uuid()`** zavrača velike črke in nestandardne UUID-je (npr. `dddddddd-...`)
- **Rešitev**: regex z velikimi in malimi + `transform(toLowerCase)`:
  ```typescript
  const uuid = z.string()
    .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-...$/, 'Invalid UUID')
    .transform(v => v.toLowerCase());
  ```
- **`coerceInt` / `coerceNum`** — sprejme `string | number`, pretvori in validira:
  ```typescript
  const coerceInt = (min, max) =>
    z.union([z.number(), z.string().transform(Number)])
     .pipe(z.number().int().min(min).max(max));
  ```

---

## 5. Frontend — Angular 18

### Komponente
| Pot | Komponenta | Namen |
|-----|-----------|-------|
| `/login` | `LoginComponent` | Prijava |
| `/employees` | `EmployeeListComponent` | Seznam delavcev |
| `/employees/new` | `EmployeeFormComponent` | Nov delavec |
| `/employees/:id/edit` | `EmployeeFormComponent` | Uredi delavca |
| `/hours` | `HoursComponent` | Mesečne ure |
| `/payroll` | `PayrollWizardComponent` | Čarovnik za obračun |
| `/payroll/:id/progress` | `PayrollProgressComponent` | Napredek obračuna |
| `/job-positions` | `JobPositionsComponent` | Delovna mesta |

### AuthService — popravek race condition
**Problem:** `authGuard` je preverjal `isLoggedIn()` sinhrono, preden je asinhroni `loadMe()` vrnil odgovor → preusmeri na `/login` takoj po osvežitvi strani.

**Rešitev:** Sinhrono dekodiranje JWT v konstruktorju:
```typescript
constructor() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    const user = this.decodeToken(token);
    if (user) this._user.set(user);
    else localStorage.removeItem(TOKEN_KEY);
  }
}
```
- `decodeToken()` razčleni JWT payload brez klica strežnika
- Preverja `exp` — potekel token je takoj zavrnjen
- JWT payload razširjen z `ime` in `priimek` (dodano v backend)

### JWT Interceptor — popravek
- **Prej:** Vsak 401 odgovor → `auth.logout()` → prekinil sejo med podatkovnimi napakami
- **Popravljeno:** Logout samo ob 401 iz `/auth/` endpointov

### Angular select — `[value]` vs `[ngValue]`
**Problem:** `<option [value]="m.value">` vedno pošlje niz (`"8"`), čeprav je vrednost število. Zod `z.number()` zavrne niz.

**Rešitev:** Zamenjaj z `[ngValue]` za ohranitev tipa:
```html
<option *ngFor="let m of meseci" [ngValue]="m.value">{{ m.label }}</option>
```
Popravljeno v: `hours.component.ts` (mesec + leto) in `wizard.component.ts` (mesec).

### Izvoz XML — popravek datuma
**Problem:** `mssql` driver vrne SQL `DATE` kolumne kot JS `Date` objekte. `xmlbuilder2`'s `.txt()` pokliče `.toString()` → npr. `Mon Aug 31 2026 02:00:00 GMT+0200 (...)`.

**Rešitev:**
```typescript
.ele('DatumKnjizenja')
  .txt(new Date(run.datum_izplacila).toISOString().split('T')[0])
  .up()
```
Popravljeno v: `vod.generator.ts` in `sepa.generator.ts`.

### Izvoz SEPA/VOD — popravek JWT
**Problem:** Izvozni gumbi so bili `<a href target="_blank">` — brskalnik odpre URL brez `Authorization` glave → 401.

**Rešitev:** Zamenjava z `<button (click)="download('sepa')">` ki prenese datoteko prek `HttpClient` (interceptor doda JWT) in ustvari Blob download.

---

## 6. Asinhroni obračun (H1)

### Tok
1. `POST /api/v1/payroll/runs` → vrne **202 Accepted** takoj (brez čakanja)
2. Job se doda v BullMQ čakalno vrsto (Redis)
3. `payroll.worker.ts` pobere job in izvede obračun:
   - Prebere delavce s `getEmployeesForWorker()`
   - Za vsakega pokliče `slovenian-payroll-engine.ts`
   - Sproti posodablja `progress_procent` v bazi
4. Angular frontend polira `/payroll/runs/:id` vsakih **500ms**
5. Ko status postane `Zakljucen`: prikaže plačilne liste

### Obračunski mehanizem (slovenian-payroll-engine.ts)
- **BigNumber.js** za natančno decimalno aritmetiko (ROUND_HALF_UP)
- Pro-rata izračun: `brutoOsnova × (m01Ure / 168)` za nepopolne mesece
- Prispevki delavca: PIZ (15.5%), ZZ (6.36%), ZAP (0.14%), STAR (0.53%)
- Prispevki delodajalca: PIZ (8.85%), ZZ (6.56%), ZAP (0.06%), STAR (0.20%), POSK (0.53%), DO (0.10%)
- Dohodnina: progresivni razredi po slovenskih stopnjah
- Olajšave: splošna, vzdrževani, invalidnost, OZP

---

## 7. E2E testiranje — rezultati

### Testni scenarij (17. 8. 2026)
Testni delavec: **Miha Bratina**, davčna: 55667788, bruto osnova: 2.500 €

### Rezultati po korakih

| Korak | Test | Rezultat |
|-------|------|----------|
| 1 | Login z admin@a.si / Test1234! | ✅ |
| 2 | Prazno stanje brez delavcev | ✅ |
| 3 | Reactive Forms blokira prazno polje | ✅ H2 |
| 3 | Reactive Forms blokira 7-mestno davčno | ✅ H2 |
| 3 | Dodaj delavca Bratina Miha 2500€ | ✅ |
| 4 | Vnos ur: 174 redno / 20 prehrana / 15 km | ✅ |
| 4 | Vrednosti obstanejo po osvežitvi strani | ✅ |
| 5 | Obračun vrne 202 Accepted | ✅ H1 |
| 6 | Progress bar narašča vsakih 500ms | ✅ H1 |
| 6 | Status doseže Zakljucen 100% | ✅ |
| 6 | Plačilne liste: bruto 2500€, dohodnina 335.86€ | ✅ |
| 7 | SEPA XML prenesen, veljavna vsebina | ✅ |
| 7 | VOD XML prenesen, datum 2026-08-31 | ✅ |
| 8 | Osvežitev strani ohrani prijavo | ✅ |
| H3 | Delavec ni viden brez session context | ✅ H3 |

### Napake, najdene in odpravljene

#### Napaka 1 — RLS blokira login (kritična)
- **Vzrok:** `05_alter.sql` je dodal FILTER predikat na `dbo.users`
- **Simptom:** `POST /auth/login` vrača 401 za vse uporabnike
- **Popravek:** Odstranjen FILTER predikat z `users` tabele (BLOCK predikat za INSERT ostane)

#### Napaka 2 — Race condition pri osvežitvi strani
- **Vzrok:** `authGuard` sinhrono preverja `isLoggedIn()`, `loadMe()` je asinhrono
- **Simptom:** Osvežitev strani → takoj preusmeri na `/login`
- **Popravek:** Sinhrono dekodiranje JWT v `AuthService` konstruktorju

#### Napaka 3 — `[value]` na `<option>` vrne niz (Zod 400)
- **Vzrok:** HTML atribut `[value]` vedno stringificira; Zod `z.number()` zavrne `"8"`
- **Simptom:** Sprememba meseca → `POST /hours` vrne 400 Bad Request
- **Popravek:** Zamenjava `[value]` z `[ngValue]` v `hours.component.ts` in `wizard.component.ts`

#### Napaka 4 — Zod v4 UUID validacija prestroga
- **Vzrok:** Zod v4 `z.string().uuid()` zahteva RFC 4122 version/variant bajta; SQL Server vrača `EEEEEEEE-...` (nestandardni UUID)
- **Simptom:** `POST /hours` vrne `{"error":"Invalid UUID"}` za veljavne ID-je iz baze
- **Popravek:** Regex za format + `transform(toLowerCase)` brez `z.uuid()`

#### Napaka 5 — Datum v XML je JS `.toString()`
- **Vzrok:** `mssql` vrne `DATE` kolumne kot JS `Date` objekte; `.txt(date)` pokliče `.toString()`
- **Simptom:** `<DatumKnjizenja>Mon Aug 31 2026 02:00:00 GMT+0200...</DatumKnjizenja>`
- **Popravek:** `new Date(run.datum_izplacila).toISOString().split('T')[0]`

#### Napaka 6 — Izvoz XML brez JWT
- **Vzrok:** `<a href target="_blank">` odpre URL brez `Authorization` glave
- **Simptom:** `GET /api/v1/export/sepa/:id` vrne 401
- **Popravek:** `HttpClient` Blob download prek `download()` metode

#### Napaka 7 — datum_izplacila se ni osveževal ob spremembi meseca
- **Vzrok:** `valueChanges` subscription ni osvežila native `<input type="date">` v realnem času
- **Simptom:** Izbira drugega meseca → datum ostane na prvem mesecu
- **Popravek:** Dodan `(change)="computeDatum()"` na select elementa + `[ngValue]`

#### Napaka 8 — Prazna lista delavcev (employees)
- **Vzrok:** Backend vrača `{data: [], total: N}`, frontend je pričakoval `[]`
- **Simptom:** `/employees` kaže "Ni delavcev" čeprav so v bazi
- **Popravek:** `res.data` namesto `data` v `list.component.ts`

---

## 8. Testni računi

| Email | Geslo | Najemnik | Vloga |
|-------|-------|---------|-------|
| admin@a.si | Test1234! | Testno podjetje A d.o.o. | Skrbnik |
| admin@b.si | Test1234! | Drugo podjetje B d.o.o. | Skrbnik |

---

## 9. Zagon aplikacije

### Predpogoji
- Docker Desktop (MSSQL + Redis)
- Node.js 20+

### Ukazi
```bash
# 1. Zaženi Docker kontejnerje
docker compose up -d

# 2. Počakaj na zdravje MSSQL (~15s), nato poženi migracije
docker exec eplace2026-mssql-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa \
  -P "YourStrong@Passw0rd" -C -i /tmp/01_schema.sql

# 3. Ustvari uporabnike (bcrypt)
cd backend && npm run seed

# 4. Zaženi backend (port 3000)
npm run dev

# 5. Zaženi BullMQ delavec (ločen terminal)
npm run worker

# 6. Zaženi frontend (port 4200)
cd ../frontend && ng serve --proxy-config proxy.conf.json
```

### Dostop
- **Aplikacija:** http://localhost:4200
- **API:** http://localhost:3000/api/v1

---

## 10. Arhitekturne odločitve

| Odločitev | Razlog |
|-----------|--------|
| Multi-tenancy z RLS | H3 hipoteza; izolacija brez aplikacijske logike |
| Temporal Tables | Revizijska sled sprememb delavcev/delovnih mest |
| BullMQ za obračun | H1 hipoteza; 202 Accepted takoj, async procesiranje |
| JWT v localStorage | Enostavnost za MVP; produkcija bi uporabila httpOnly cookie |
| Mehko brisanje | Ohranitev zgodovine za revizijo |
| `[ngValue]` za Angular selekte | Ohranja JS tip (number) skozi `[(ngModel)]` binding |
| Zod v4 coerceInt helper | Brani se pred string/number mešanjem iz HTML form elementov |
