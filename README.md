# ePlače 2026

Spletna aplikacija za mesečni obračun plač po slovenski zakonodaji. Zgrajena kot multi-tenant SaaS sistem — ena instanca strežuje več podjetij, vsako z lastnimi zaposlenimi in obračuni.

---

## Kazalo

- [Tehnologije](#tehnologije)
- [Arhitektura](#arhitektura)
- [Funkcionalnosti](#funkcionalnosti)
- [Struktura projekta](#struktura-projekta)
- [Namestitev in zagon (lokalno)](#namestitev-in-zagon-lokalno)
- [Produkcijska namestitev](#produkcijska-namestitev)
- [Baza podatkov](#baza-podatkov)
- [Varnost](#varnost)
- [API referenca](#api-referenca)
- [Izvozni formati](#izvozni-formati)

---

## Tehnologije

| Sloj | Tehnologija |
|---|---|
| Frontend | Angular 17 (standalone components, signals) |
| Backend | Node.js 22 + Express + TypeScript |
| Baza | Azure SQL (MS SQL Server) |
| Queue | BullMQ + Redis |
| Avtentikacija | JWT (jsonwebtoken) |
| Validacija | Zod |
| XML generacija | xmlbuilder2 |
| Decimalna aritmetika | bignumber.js |
| Frontend hosting | Vercel |
| Backend hosting | Railway |

---

## Arhitektura

```
┌─────────────────────────────────────────────────────────┐
│                     UPORABNIK                           │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              FRONTEND (Angular / Vercel)                │
│  login · delavci · mesečne ure · obračuni · izvoz       │
└────────────────────────┬────────────────────────────────┘
                         │ REST API (JWT)
┌────────────────────────▼────────────────────────────────┐
│              BACKEND (Express / Railway)                 │
│                                                         │
│  ┌──────────────────┐   ┌──────────────────────────┐   │
│  │  HTTP Controller │   │   Payroll Worker          │   │
│  │  auth / emp / hr │   │   (BullMQ, in-process)    │   │
│  │  payroll / export│   │   SlovenianPayrollEngine  │   │
│  └────────┬─────────┘   └────────────┬─────────────┘   │
│           │                          │                  │
│  ┌────────▼──────────────────────────▼─────────────┐   │
│  │         Repository layer (mssql)                 │   │
│  │         withTenant() → SESSION_CONTEXT + RLS     │   │
│  └────────────────────────┬────────────────────────┘   │
└───────────────────────────┼─────────────────────────────┘
                            │ TDS / TCP 1433
┌───────────────────────────▼─────────────────────────────┐
│              AZURE SQL DATABASE                          │
│                                                         │
│  tenants · users · employees · job_positions            │
│  monthly_hours · payroll_runs · payroll_lines           │
│  payroll_params · audit_logs                            │
│                                                         │
│  Row-Level Security (RLS) — vsak tenant vidi samo       │
│  svoje vrstice, filtrirano na nivoju baze               │
└─────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│              REDIS (BullMQ queue)                        │
│  Asinhrona obdelava obračunov — HTTP vrne 202 takoj,    │
│  worker teče v ozadju in posodablja napredek            │
└─────────────────────────────────────────────────────────┘
```

### Asinhroni obračun (BullMQ)

Ko administrator sproži obračun, se zgodi naslednje:

1. Backend ustvari vrstico v `payroll_runs` s statusom `Procesiranje`
2. Vrne `HTTP 202 Accepted` takoj (< 20ms) — brez čakanja
3. Job se doda v BullMQ queue (Redis)
4. Worker (teče v istem procesu) prevzame job
5. Worker izračuna plačo za vsakega zaposlenega, zapisuje napredek v `progress_procent`
6. Frontend polja napredek vsakih 500ms
7. Ko worker zaključi, status postane `Zakljucen`

---

## Funkcionalnosti

### Upravljanje delavcev
- Vnos in urejanje zaposlenih z vsemi davčno-relevantnimi podatki
- Davčna številka, EMŠO, TRR za nakazilo
- Nastavitve: rezident/nerezident, invalid nad kvoto, vzdrževani družinski člani
- Boniteta za službeno vozilo (Zakon o dohodnini, B014)
- Urna postavka ali mesečna bruto osnova (dva načina obračuna)
- Delovni status (aktiven / neaktiven)
- Delovna mesta s tarifnim razredom (temporal history)

### Mesečne ure
- Vnos ur za vsak mesec posebej
- Redne ure, nadure, refundirana odsotnost, dopust, bolniška
- Dnevi prehrane in kilometri za prevoz
- Odtegljaji (krediti)

### Obračun plač (SlovenianPayrollEngine)
Implementira veljavno slovensko zakonodajo 2026:

| Prispevek | Stopnja | Pravna podlaga |
|---|---|---|
| PIZ delojemalec | 15,50 % | ZPIZ-2 |
| ZZ delojemalec | 6,36 % | ZZVZZ |
| ZAP delojemalec | 0,14 % | ZUTD |
| STAR delojemalec | 0,10 % | ZSDP-1 |
| DO delojemalec | 1,00 % | ZDoh-2 |
| PIZ delodajalec | 8,85 % | ZPIZ-2 |
| ZZ delodajalec | 6,56 % | ZZVZZ |
| ZAP delodajalec | 0,06 % | ZUTD |
| STAR delodajalec | 0,10 % | ZSDP-1 |
| Poškodbe pri delu | 0,53 % | ZPIZ-2 |
| DO delodajalec | 1,00 % | ZDoh-2 |
| OZP mesečni odtegljaj | 35,00 € | ZOZPom |

Akontacija dohodnine se izračuna po progresivni lestvici (ZDoh-2, 35. člen), vse stopnje
so nastavljive v tabeli `payroll_params` brez spremembe kode.

Decimalna aritmetika teče z `bignumber.js` (10 decimalnih mest, ROUND_HALF_UP) —
zaokroževanje je skladno z davčnimi predpisi.

### Izvoz
- **SEPA XML** — nakazilni nalog za banko (ISO 20022 pain.001.001.03)
- **VOD XML** — obrazec za FURS (vrstični obračun dohodkov)
- **REK-O XML** — rekapitulacijski obračun za FURS

### Parametri obračuna
Vsi zakonsko določeni parametri (stopnje prispevkov, dohodninska lestvica, minimalna plača,
nadomestilo za prehrano in prevoz) so shranjeni v bazi s časovno veljavnostjo (`veljavno_od`).
Ob spremembi zakonodaje se doda nova vrstica — zgodovinski obračuni ostanejo pravilni.

### Revizijska sled
Vsaka operacija (vnos, urejanje, brisanje, izvoz) se zabeleži v `audit_logs` z:
- email uporabnika
- vrsta akcije
- entiteta
- IP naslov
- časovna znamka

---

## Struktura projekta

```
eplace2026/
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Express aplikacija + worker bootstrap
│   │   ├── config/
│   │   │   ├── db.ts               # MSSQL pool + withTenant() helper
│   │   │   └── redis.ts            # ioredis connection
│   │   ├── controllers/            # HTTP route handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── employees.controller.ts
│   │   │   ├── hours.controller.ts
│   │   │   ├── payroll.controller.ts
│   │   │   ├── export.controller.ts
│   │   │   ├── jobpositions.controller.ts
│   │   │   ├── payroll-params.controller.ts
│   │   │   └── settings.controller.ts
│   │   ├── engine/
│   │   │   └── slovenian-payroll-engine.ts  # Jedro obračuna
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT preverjanje
│   │   │   ├── role.middleware.ts   # RBAC (Skrbnik / Uporabnik / SistemskiAdmin)
│   │   │   └── validate.middleware.ts  # Zod validacija
│   │   ├── queues/
│   │   │   └── payroll.queue.ts    # BullMQ queue definicija
│   │   ├── repositories/           # SQL dostop (parameterized queries)
│   │   │   ├── employee.repo.ts
│   │   │   ├── payroll.repo.ts
│   │   │   ├── payroll-params.repo.ts
│   │   │   └── jobpositions.repo.ts
│   │   ├── workers/
│   │   │   └── payroll.worker.ts   # BullMQ worker
│   │   ├── xml/
│   │   │   ├── sepa.generator.ts
│   │   │   ├── vod.generator.ts
│   │   │   └── reko.generator.ts
│   │   └── types/
│   │       └── interfaces.ts       # Skupni TypeScript tipi
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   └── src/app/
│       ├── core/
│       │   └── auth.service.ts     # JWT shranjevanje, signal za user state
│       ├── features/
│       │   ├── auth/               # Login stran
│       │   ├── employees/          # Seznam + forma za delavce
│       │   ├── hours/              # Vnos mesečnih ur
│       │   ├── payroll/            # Čarovnik, napredek, plačilna lista
│       │   ├── job-positions/      # Delovna mesta
│       │   ├── payroll-params/     # Pregled parametrov obračuna
│       │   └── settings/           # Nastavitve tenanta
│       ├── shell.component.ts      # Layout z navigacijo
│       └── app.routes.ts
│
├── database/
│   ├── 01_schema.sql               # Vse tabele
│   ├── 02_rls.sql                  # Row-Level Security
│   ├── 03_temporal.sql             # Temporal tables (history)
│   ├── 04_seed.sql                 # Testni podatki
│   ├── 05_alter.sql                # Migracija 1
│   ├── 06_payroll_params.sql       # Parametri obračuna
│   └── 07_alter2.sql               # Migracija 2 (dual-mode)
│
├── railway.json                    # Railway deploy config
├── RLS_RAZLAGA.md                  # Podrobna razlaga varnostnega sistema
└── README.md
```

---

## Namestitev in zagon (lokalno)

### Predpogoji

- Node.js >= 22
- MS SQL Server (lokalno ali Azure SQL)
- Redis (lokalno: `docker run -d -p 6379:6379 redis`)

### Backend

```bash
cd backend
cp .env.example .env
# Uredi .env: DB_SERVER, DB_PASSWORD, JWT_SECRET, REDIS_HOST
npm install
npm run dev        # samo API
npm run dev:all    # API + worker vzporedno
```

### Frontend

```bash
cd frontend
npm install
npm start          # ng serve na http://localhost:4200
```

### Baza

Skripta v pravilnem vrstnem redu:

```bash
sqlcmd -S <server> -U <user> -P <geslo> -i database/01_schema.sql
sqlcmd -S <server> -U <user> -P <geslo> -i database/02_rls.sql
sqlcmd -S <server> -U <user> -P <geslo> -i database/03_temporal.sql
sqlcmd -S <server> -U <user> -P <geslo> -i database/04_seed.sql
sqlcmd -S <server> -U <user> -P <geslo> -i database/05_alter.sql
sqlcmd -S <server> -U <user> -P <geslo> -i database/06_payroll_params.sql
sqlcmd -S <server> -U <user> -P <geslo> -i database/07_alter2.sql
```

Testni dostop (ustvarjen v `04_seed.sql`):
- Email: `admin@a.si`
- Geslo: `Test1234!`

---

## Produkcijska namestitev

### Backend → Railway

```bash
# railway.json je že konfiguriran
# Nastavi env vars v Railway dashboardu:
DB_SERVER=<azure-sql-server>.database.windows.net
DB_NAME=eplace2026
DB_USER=<sql-user>
DB_PASSWORD=<geslo>
REDIS_URL=<redis-connection-string>
JWT_SECRET=<dolg-naključen-string>
JWT_EXPIRES_IN=8h
CORS_ORIGIN=https://<tvoja-vercel-domena>.vercel.app
NODE_ENV=production
PORT=3000
```

### Frontend → Vercel

```bash
# vercel.json je že konfiguriran
# Nastavi v Vercel dashboardu:
# (Angular production build bere environment.production.ts)
# apiUrl je hardcoded v environment.production.ts — posodobi pred deployem
```

`frontend/src/environments/environment.production.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://<tvoj-railway-backend>.up.railway.app/api/v1',
};
```

---

## Baza podatkov

### Shema (ključne tabele)

```
tenants          — podjetja (multi-tenant root)
users            — administratorji podjetij (bcrypt geslo)
job_positions    — delovna mesta s tarifnim razredom (temporal)
employees        — zaposleni z vsemi davčnimi podatki (temporal)
monthly_hours    — vnešene ure po mesecih
payroll_runs     — en obračun = en mesec (status, napredek)
payroll_lines    — izračunana plača za vsakega delavca
payroll_params   — stopnje prispevkov in parametri (s časovno veljavnostjo)
audit_logs       — revizijska sled vseh akcij
```

### Row-Level Security

Vse tenant-scoped tabele so zaščitene z RLS. Vsaka seja mora nastaviti
`SESSION_CONTEXT` preden bere ali piše:

```sql
EXEC sp_set_session_context N'tenant_id', '<uuid>';
```

Za podrobno razlago glej [RLS_RAZLAGA.md](RLS_RAZLAGA.md).

### Ogled podatkov v Azure Query Editorju

```sql
DECLARE @tid NVARCHAR(36);
SELECT TOP 1 @tid = CAST(id AS NVARCHAR(36)) FROM dbo.tenants;
EXEC sp_set_session_context N'tenant_id', @tid;

SELECT * FROM dbo.payroll_runs ORDER BY leto, mesec;
SELECT * FROM dbo.employees WHERE aktivno = 1;
```

---

## Varnost

| Mehanizem | Implementacija |
|---|---|
| Avtentikacija | JWT podpisan s `JWT_SECRET`, expires v 8h |
| Avtorizacija | RBAC: `SistemskiAdmin`, `Skrbnik`, `Uporabnik` |
| SQL Injection | Parametrizirani queriji (`mssql` `.input()`) za vse SQL |
| Multi-tenant izolacija | RLS na nivoju baze + `SESSION_CONTEXT` |
| Gesla | bcrypt hash (salt rounds 10) |
| CORS | Eksplicitna `CORS_ORIGIN` env var |
| Input validacija | Zod sheme na vseh POST/PUT endpointih |

---

## API referenca

Vsi zaščiteni endpointi zahtevajo `Authorization: Bearer <JWT>`.

### Avtentikacija

```
POST   /api/v1/auth/login          Prijava, vrne JWT token
GET    /api/v1/auth/me             Podatki prijavljenega uporabnika
```

### Delavci

```
GET    /api/v1/employees           Seznam (paginacija: ?page=1&limit=20)
POST   /api/v1/employees           Dodaj delavca
GET    /api/v1/employees/:id       Posamezni delavec
PUT    /api/v1/employees/:id       Uredi delavca
DELETE /api/v1/employees/:id       Deaktiviraj delavca
```

### Mesečne ure

```
GET    /api/v1/hours               Ure za mesec (?leto=2026&mesec=3)
POST   /api/v1/hours               Vnesi/posodobi ure
```

### Obračun plač

```
POST   /api/v1/payroll/runs        Sproži obračun → 202 Accepted
GET    /api/v1/payroll/runs        Seznam vseh obračunov
GET    /api/v1/payroll/runs/:id    Posamezni obračun (status, napredek)
GET    /api/v1/payroll/runs/:id/lines   Plačilne liste za obračun
```

### Izvoz

```
GET    /api/v1/export/sepa/:runId  SEPA XML nakazilni nalog
GET    /api/v1/export/vod/:runId   VOD XML za FURS
GET    /api/v1/export/rek/:runId   REK-O XML za FURS
```

### Delovna mesta

```
GET    /api/v1/job-positions       Seznam delovnih mest
POST   /api/v1/job-positions       Dodaj delovno mesto
PUT    /api/v1/job-positions/:id   Uredi
DELETE /api/v1/job-positions/:id   Deaktiviraj
```

### Parametri obračuna

```
GET    /api/v1/payroll-params      Vsi aktivni parametri
```

---

## Izvozni formati

### SEPA XML (pain.001.001.03)
Nakazilni nalog za banko. Vsebuje nakazila za vse delavce tega obračuna —
eden `CreditTransferTransaction` na delavca z IBAN, zneskom in referenco.

### VOD XML
Obrazec za FURS: vrstični obračun dohodkov iz delovnega razmerja.
Eden `Delojemalec` element na delavca z vsemi prispevki in dohodnino.

### REK-O XML
Rekapitulacijski obrazec za FURS: seštevki po obračunu (skupni bruto,
skupna dohodnina, skupni prispevki delodajalca in delojemalca).

---

*ePlače 2026 — diplomski projekt*
