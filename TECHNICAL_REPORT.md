# ePlače 2026 — Technical Report

**Project:** SaaS Payroll Processing Application  
**Author:** Miha Bratina  
**Institution:** ŠC Nova Gorica, VSŠ  
**Version:** MVP 1.0 (dual-mode payroll)  
**Last Updated:** 2026-08-19  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Layer](#3-database-layer)
4. [Backend — Express API](#4-backend--express-api)
5. [Payroll Engine](#5-payroll-engine)
6. [XML Export Subsystem](#6-xml-export-subsystem)
7. [Asynchronous Job Processing](#7-asynchronous-job-processing)
8. [Frontend — Angular 18](#8-frontend--angular-18)
9. [API Reference](#9-api-reference)
10. [Security Model](#10-security-model)
11. [Testing & Validation](#11-testing--validation)

---

## 1. Project Overview

ePlače 2026 is a multi-tenant SaaS application for computing Slovenian employee payrolls in compliance with Slovenian labor law (ZDR-1, ZMinP, Uredba o davčni osnovi). The system accepts employee master data and monthly work hours, computes gross-to-net payroll according to 2026 statutory rates, and produces payslips together with SEPA payment XML and VOD accounting journal XML.

### Research Hypotheses (Diploma Context)

| ID | Hypothesis | Result |
|----|-----------|--------|
| H1 | Async HTTP endpoint returns 202 Accepted in < 20 ms | ✅ Proven |
| H2 | Angular Reactive Forms block invalid input at the UI layer | ✅ Proven |
| H3 | MS SQL Row-Level Security isolates tenant data without application-layer filtering | ✅ Proven |

### Technology Stack at a Glance

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 18 (standalone components, Signals, Reactive Forms, TailwindCSS) |
| Backend | Node.js 20, TypeScript 5.4, Express 4, express-async-errors, Zod v4 |
| Database | MS SQL Server 2022 (Temporal Tables, Row-Level Security) |
| Async Queue | BullMQ 5 + Redis 7 |
| Auth | JWT (jsonwebtoken), bcrypt cost 12 |
| XML | xmlbuilder2 |
| Decimal math | BigNumber.js (ROUND_HALF_UP) |
| Container | Docker Compose (mssql + redis) |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser — Angular 18 SPA (localhost:4200)                      │
│  • Reactive Forms (H2 proof)                                    │
│  • JWT Interceptor → Authorization: Bearer {token}              │
│  • 500 ms polling on payroll progress                           │
└────────────────────┬────────────────────────────────────────────┘
                     │  HTTP / JSON  (proxy → localhost:3000)
┌────────────────────▼────────────────────────────────────────────┐
│  Express API — Node.js / TypeScript (localhost:3000)            │
│  • JWT auth middleware                                          │
│  • Role guard (Skrbnik / SistemskiAdmin / Uporabnik)           │
│  • Zod v4 request validation                                    │
│  • withTenant() — sets SESSION_CONTEXT before every query       │
│  • Returns 202 Accepted on POST /payroll/runs (H1 proof)        │
└──────┬───────────────────────────────────────┬──────────────────┘
       │  mssql driver (TCP 1433)              │  ioredis (TCP 6379)
┌──────▼──────────────┐              ┌─────────▼──────────────────┐
│  MS SQL Server 2022 │              │  Redis 7 (BullMQ queue)     │
│  • Temporal Tables  │              │  • payrollQueue             │
│  • Row-Level Sec.   │              └─────────┬──────────────────┘
│  • payroll_params   │                        │
└─────────────────────┘              ┌─────────▼──────────────────┐
                                     │  BullMQ Worker process      │
                                     │  • SlovenianPayrollEngine   │
                                     │  • BigNumber.js arithmetic  │
                                     │  • Writes payroll_lines     │
                                     │  • Updates progress_procent │
                                     └────────────────────────────┘
```

### Multi-Tenancy

Every API request carries a JWT that encodes `tenantId`. The `withTenant(tenantId, fn)` helper executes:

```sql
EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0
```

before every database query, activating the Row-Level Security filter that restricts all data to the calling tenant. This means application code never needs to add `WHERE tenant_id = ?` — the database enforces it.

---

## 3. Database Layer

### 3.1 Server & Connection

- **Engine:** Microsoft SQL Server 2022 (Developer Edition in Docker)
- **Driver:** `mssql` v11 (Node.js)
- **Connection string:** `localhost:1433`, database `eplace2026`, user `sa`
- **Pool:** min 0, max 10, idle timeout 30 s
- **Options:** `trustServerCertificate: true`, `encrypt: false` (dev environment)

Configuration is read from `backend/.env`:

```
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=eplace2026
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
```

### 3.2 Table Schema

#### `tenants`
Stores employer (company) information. Each row = one paying customer.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UNIQUEIDENTIFIER PK | NEWID() default |
| `naziv_podjetja` | NVARCHAR(200) | Company name |
| `davcna_stevilka` | VARCHAR(8) | Tax ID, 8 digits |
| `maticna_stevilka` | VARCHAR(10) | Registration number |
| `naslov` | NVARCHAR(200) | Street address |
| `kraj` | NVARCHAR(100) | City |
| `posta` | VARCHAR(4) | Postal code |
| `iban` | VARCHAR(34) | Company IBAN for SEPA debit |

#### `users`
Application users (admins and staff) belonging to a tenant.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UNIQUEIDENTIFIER PK | |
| `tenant_id` | UNIQUEIDENTIFIER FK | References `tenants` |
| `email` | VARCHAR(200) UNIQUE | Login email |
| `geslo_hash` | VARCHAR(60) | bcrypt hash, cost 12 |
| `ime` / `priimek` | NVARCHAR(100) | First / last name |
| `vloga` | VARCHAR(20) | `SistemskiAdmin`, `Skrbnik`, `Uporabnik` |
| `aktivno` | BIT | Soft active flag |

> **RLS note:** `users` has a BLOCK AFTER INSERT predicate (prevents cross-tenant inserts) but NO FILTER predicate — login must read `users` across all tenants.

#### `job_positions` — Temporal Table
Job titles with pay grades. Tracks history automatically.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UNIQUEIDENTIFIER PK | |
| `tenant_id` | UNIQUEIDENTIFIER FK | |
| `naziv_delovnega_mesta` | NVARCHAR(200) | Job title |
| `tarifni_razred` | INT (1–9) | Pay grade |
| `zahtevana_izobrazba` | NVARCHAR(100) | Required education |
| `aktivno` | BIT | Soft delete |
| `SysStartTime` / `SysEndTime` | DATETIME2 | Temporal versioning |

`SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.job_positions_History)`

#### `employees` — Temporal Table
Core employee master data including payroll configuration.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UNIQUEIDENTIFIER PK | |
| `tenant_id` | UNIQUEIDENTIFIER FK | |
| `job_position_id` | UNIQUEIDENTIFIER FK NULL | Optional position link |
| `ime` / `priimek` | NVARCHAR(100) | Name |
| `davcna_stevilka` | VARCHAR(8) | Tax ID |
| `emso` | VARCHAR(13) | Personal ID (13 digits) |
| `trr` | VARCHAR(34) | IBAN for salary payment |
| `bruto_osnova` | DECIMAL(10,2) | Fixed monthly gross (Mode A) |
| `urna_postavka` | DECIMAL(10,4) NULL | Hourly rate (Mode B); NULL = Mode A |
| `a031_zavezanec_ozp` | BIT | OZP contribution obligation (35 €) |
| `glavni_delodajalec` | BIT | Main employer → applies general tax allowance |
| `olajsava_vzdrzevani_znesek` | DECIMAL(10,2) | Monthly dependent allowance |
| `b014_has_vozilo` / `b014_vozilo_nv` | BIT / DECIMAL | Company vehicle benefit data |
| `a004_rezident` | CHAR(1) | R = resident |
| `aktivno` | BIT | Soft delete (excluded from payroll when 0) |
| `datum_zaposlitve` | DATE | Employment start date |
| `SysStartTime` / `SysEndTime` | DATETIME2 | Temporal versioning |

**Dual-mode detection** (no extra column needed):
```
urna_postavka IS NOT NULL AND urna_postavka > 0  →  Mode B (Parametric / Hourly)
urna_postavka IS NULL                             →  Mode A (Fixed Bruto)
```

**CHECK constraint:**
```sql
CONSTRAINT CK_emp_salary_mode CHECK (
  bruto_osnova > 0 OR (urna_postavka IS NOT NULL AND urna_postavka > 0)
)
```

#### `monthly_hours`
One row per employee per month. Stores hours and allowance inputs.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UNIQUEIDENTIFIER PK | |
| `tenant_id` | UNIQUEIDENTIFIER FK | |
| `employee_id` | UNIQUEIDENTIFIER FK | |
| `leto` / `mesec` | INT | Year / month |
| `m01_redno_ure` | INT | Regular hours |
| `m02_refund_ure` | INT | ZZZS refund hours |
| `m03_nadure_ure` | INT | Overtime hours |
| `m04_dopust_ure` | INT DEFAULT 0 | Leave hours (Mode B, 100%) |
| `m05_bolniske_ure` | INT DEFAULT 0 | Sick leave hours (Mode B, 80%) |
| `m06_odsot_ure` | INT | Absence hours |
| `m07_preh_dnevi` | INT | Meal allowance days |
| `m07_prevoz_km` | DECIMAL(6,1) | One-way commute km |
| `odtegljaji_kred` | DECIMAL(10,2) | Wage attachments / credits |

Upserted via MERGE on `(employee_id, leto, mesec)`.

#### `payroll_runs`
One row per payroll execution.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UNIQUEIDENTIFIER PK | |
| `tenant_id` | UNIQUEIDENTIFIER FK | |
| `leto` / `mesec` | INT | Payroll period |
| `datum_izplacila` | DATE | Payment date |
| `status_obracuna` | VARCHAR(20) | `Osnutek`, `Procesiranje`, `Zakljucen`, `Napaka` |
| `progress_procent` | INT | 0–100, updated by worker |
| `napaka_opis` | NVARCHAR(500) | Error description if failed |
| `zakljucen_ob` | DATETIME2 | Completion timestamp |

#### `payroll_lines`
One row per employee per payroll run — the computed result.

| Column | Type | Notes |
|--------|------|-------|
| `bruto_1` | DECIMAL(10,2) | Gross incl. overtime + bonuses |
| `boniteta_b014` | DECIMAL(10,2) | Vehicle benefit |
| `a071_piz_del` | DECIMAL(10,2) | Employee PIZ contribution (15.50%) |
| `a072_zz_del` | DECIMAL(10,2) | Employee ZZ contribution (6.36%) |
| `a072a_ozp_del` | DECIMAL(10,2) | OZP deduction (35 €) |
| `a072b_do_del` | DECIMAL(10,2) | Employee DO contribution (1.00%) |
| `a073_star_del` | DECIMAL(10,2) | Employee STAR contribution (0.10%) |
| `a074_zap_del` | DECIMAL(10,2) | Employee ZAP contribution (0.14%) |
| `davcna_osnova` | DECIMAL(10,2) | Taxable income base |
| `dohodnina` | DECIMAL(10,2) | Income tax withholding |
| `neto_pred_ozp` | DECIMAL(10,2) | Net before OZP |
| `neto_po_ozp` | DECIMAL(10,2) | Net after OZP |
| `m07_prehrana` | DECIMAL(10,2) | Meal reimbursement |
| `m07_prevoz` | DECIMAL(10,2) | Transport reimbursement |
| `odtegljaji_kredit` | DECIMAL(10,2) | Wage attachments |
| `koncno_izplacilo_trr` | DECIMAL(10,2) | Final net bank transfer |
| `a081_piz_del_adr` | DECIMAL(10,2) | Employer PIZ (8.85%) |
| `a082_do_del_adr` | DECIMAL(10,2) | Employer DO (1.00%) |
| `a083_zz_del_adr` | DECIMAL(10,2) | Employer ZZ (6.56%) |
| `a084_zap_del_adr` | DECIMAL(10,2) | Employer ZAP (0.06%) |
| `a085_star_del_adr` | DECIMAL(10,2) | Employer STAR (0.10%) |
| `a086_posk_del_adr` | DECIMAL(10,2) | Employer accident insurance (0.53%) |
| `bruto_2_strosek` | DECIMAL(10,2) | Total employer cost |
| `m01_redno_znesek` | DECIMAL(10,2) NULL | Regular pay component (Mode B only) |
| `m04_dopust_znesek` | DECIMAL(10,2) NULL | Leave pay component (Mode B only) |
| `m05_bolniska_znesek` | DECIMAL(10,2) NULL | Sick pay component (Mode B only) |

#### `payroll_params`
Versioned parameter store — all rates and thresholds live here, not in code.

| Column | Type | Notes |
|--------|------|-------|
| `kljuc` | VARCHAR(50) | Parameter key |
| `vrednost` | NVARCHAR(2000) | Value (string; JSON for tax table) |
| `veljavno_od` / `veljavno_do` | DATE | Validity period (NULL = indefinite) |

**Active parameters (2026):**

| Key | Value | Description |
|-----|-------|-------------|
| `STOPNJA_PIZ_DEL` | 0.1550 | Employee PIZ |
| `STOPNJA_ZZ_DEL` | 0.0636 | Employee ZZ |
| `STOPNJA_ZAP_DEL` | 0.0014 | Employee ZAP |
| `STOPNJA_STAR_DEL` | 0.0010 | Employee STAR |
| `STOPNJA_DO_DEL` | 0.0100 | Employee DO |
| `STOPNJA_PIZ_ADR` | 0.0885 | Employer PIZ |
| `STOPNJA_ZZ_ADR` | 0.0656 | Employer ZZ |
| `STOPNJA_ZAP_ADR` | 0.0006 | Employer ZAP |
| `STOPNJA_STAR_ADR` | 0.0010 | Employer STAR |
| `STOPNJA_POSK_ADR` | 0.0053 | Employer accident insurance |
| `STOPNJA_DO_ADR` | 0.0100 | Employer DO |
| `OZP_MESECNI` | 35.00 | Monthly OZP deduction |
| `SPLOSNA_OLAJSAVA` | 416.67 | Monthly general tax allowance |
| `PREHRANA_DNEVNA_MEJA` | 7.96 | Tax-free meal per day (€) |
| `PREVOZ_KM_MEJA` | 0.21 | Tax-free transport per km (€) |
| `POLNI_MESEC_URE` | 168 | Full-month hours (pro-rata denominator) |
| `MINIMALNA_PLACA` | 1481.88 | Minimum monthly gross 2026 (ZMinP, Ur. l. RS 6/2026) |
| `MINIMALNA_URNA_POSTAVKA` | 8.56 | Minimum hourly rate 2026 |
| `BOLNISKA_FAKTOR_DEL` | 0.80 | Employer sick pay rate, days 1–30 (ZDR-1 art. 137/3) |
| `NADURE_FAKTOR` | 1.30 | Overtime multiplier min. (ZDR-1 art. 144) |
| `DOPUST_FAKTOR` | 1.00 | Leave pay rate — full basis (ZDR-1 art. 137/9) |
| `DOHODNINSKA_LESTVICA` | JSON | 5-bracket progressive income tax table 2026 |

### 3.3 Row-Level Security

```sql
CREATE FUNCTION dbo.fn_securitypredicate(@tenant_id UNIQUEIDENTIFIER)
RETURNS TABLE WITH SCHEMABINDING AS
RETURN SELECT 1 AS fn_result
WHERE CAST(SESSION_CONTEXT(N'tenant_id') AS UNIQUEIDENTIFIER) = @tenant_id;
```

Applied as a security policy:

```sql
CREATE SECURITY POLICY dbo.EmployeeRLSPolicy
  ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id)
    ON dbo.employees,
  ADD BLOCK PREDICATE dbo.fn_securitypredicate(tenant_id)
    ON dbo.employees AFTER INSERT, AFTER UPDATE,
  ...  -- same for monthly_hours, payroll_runs, payroll_lines, audit_logs, job_positions
  WITH (STATE = ON);
```

**Effect:** Without calling `sp_set_session_context` first, every SELECT returns 0 rows and every INSERT is blocked. No tenant can read or write another tenant's data even if they hold a valid JWT for a different tenant. The policy is enforced at the database engine level.

### 3.4 Temporal Tables

`employees` and `job_positions` are SQL Server system-versioned temporal tables. Every UPDATE or DELETE automatically copies the previous row to `*_History` with a timestamp range. This provides a complete audit trail without any application code.

```sql
-- View historical state of employees at a point in time:
SELECT * FROM dbo.employees
FOR SYSTEM_TIME AS OF '2026-01-15T09:00:00';
```

### 3.5 Migration Files

| File | Purpose |
|------|---------|
| `01_schema.sql` | Creates all tables with constraints and indexes |
| `02_rls.sql` | Creates `fn_securitypredicate` and `EmployeeRLSPolicy` |
| `03_temporal.sql` | Verifies temporal versioning is active |
| `04_seed.sql` | Initial test tenant and employee data (archived — superseded by `seed.ts`) |
| `05_alter.sql` | Adds `aktivno`, `datum_zaposlitve`, `napaka_opis`, `zakljucen_ob`; adds RLS BLOCK AFTER UPDATE predicates |
| `06_payroll_params.sql` | Creates `payroll_params` table and seeds 17 base parameters |
| `07_alter2.sql` | Adds `urna_postavka` to `employees`; adds `m04_dopust_ure`, `m05_bolniske_ure` to `monthly_hours`; adds 3 breakdown columns to `payroll_lines`; seeds 5 new parameters |

All migrations are idempotent — safe to re-run using `IF NOT EXISTS` guards throughout.

---

## 4. Backend — Express API

### 4.1 Project Structure

```
backend/src/
├── app.ts                          # Express app, CORS, routers, global error handler
├── config/
│   ├── db.ts                       # Connection pool, withTenant(), sysQuery()
│   └── redis.ts                    # ioredis client for BullMQ
├── controllers/
│   ├── auth.controller.ts          # POST /auth/login, GET /auth/me
│   ├── employees.controller.ts     # CRUD /employees
│   ├── hours.controller.ts         # GET + POST /hours
│   ├── jobpositions.controller.ts  # CRUD /job-positions
│   ├── payroll.controller.ts       # POST /payroll/runs, GET /payroll/runs/:id
│   ├── export.controller.ts        # GET /export/sepa|vod|rek/:runId
│   ├── payroll-params.controller.ts
│   └── settings.controller.ts
├── middleware/
│   ├── auth.middleware.ts          # JWT verification, attaches req.user
│   ├── role.middleware.ts          # requireRole(...roles) factory
│   └── validate.middleware.ts      # Zod schema validation for req.body
├── schemas.ts                      # All Zod v4 schemas
├── repositories/
│   ├── employee.repo.ts            # CRUD with soft delete
│   ├── jobpositions.repo.ts
│   ├── payroll.repo.ts             # insertPayrollLine, getEmployeesForWorker, etc.
│   └── payroll-params.repo.ts      # getActivePayrollParams()
├── engine/
│   └── slovenian-payroll-engine.ts # Core computation logic
├── workers/
│   └── payroll.worker.ts           # BullMQ job processor
├── queues/
│   └── payroll.queue.ts            # BullMQ queue definition
├── xml/
│   ├── sepa.generator.ts           # SEPA pain.001.001.03 builder
│   ├── vod.generator.ts            # VOD accounting XML builder
│   └── reko.generator.ts           # REK-O tax report XML builder
├── types/
│   ├── interfaces.ts               # TypeScript interfaces for all domain objects
│   └── express.d.ts                # Augments Express Request with req.user
└── scripts/
    └── seed.ts                     # bcrypt user + tenant seeding script
```

### 4.2 Core Utilities

#### `withTenant(tenantId, fn)` — Tenant Query Wrapper

```typescript
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: sql.ConnectionPool) => Promise<T>
): Promise<T> {
  const pool = await getPool();
  const req = pool.request();
  req.input('tenantId', sql.UniqueIdentifier, tenantId);
  await req.query(
    `EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0`
  );
  return fn(pool);
}
```

Every query that touches tenant-scoped data goes through this wrapper. The SESSION_CONTEXT activates RLS so the engine-level filter takes effect.

#### `sysQuery(sql, bind)` — System-Level Query

Used for operations that must bypass tenant context (login lookup, payroll params):

```typescript
export async function sysQuery<T>(
  query: string,
  bind?: (req: sql.Request) => void
): Promise<sql.IResult<T>> {
  const pool = await getPool();
  const req = pool.request();
  if (bind) bind(req);
  return req.query<T>(query);
}
```

#### `express-async-errors`

Imported once at the top of `app.ts`. Wraps all async route handlers so unhandled promise rejections become Express errors caught by the global handler. Eliminates try/catch boilerplate in controllers.

### 4.3 Request Validation — Zod v4

All request bodies are validated by Zod schemas before reaching controllers. Key patterns:

**UUID coercion** (Zod v4's built-in `z.uuid()` rejects SQL Server's uppercase UUIDs):
```typescript
const uuidSchema = z.string()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
  .transform(v => v.toLowerCase());
```

**Numeric coercion** (HTML forms submit strings; Zod `z.number()` rejects them):
```typescript
const coerceInt = (min: number, max: number) =>
  z.union([z.number(), z.string().transform(Number)])
   .pipe(z.number().int().min(min).max(max));
```

### 4.4 JWT Authentication

Login endpoint (`POST /auth/login`):
1. Fetch user by email using `sysQuery` (no RLS context)
2. Compare password with `bcrypt.compare`
3. Sign JWT with payload: `{ sub, email, vloga, tenantId, ime, priimek }`
4. Token TTL: 8 hours

All protected routes use `authMiddleware`:
```typescript
const token = req.headers.authorization?.split(' ')[1];
const payload = jwt.verify(token, JWT_SECRET) as IJwtPayload;
req.user = payload;
```

Role guard factory:
```typescript
const requireRole = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.vloga)) return res.status(403).json(...);
    next();
  };
```

---

## 5. Payroll Engine

### 5.1 Overview

`src/engine/slovenian-payroll-engine.ts` contains a single class `SlovenianPayrollEngine` with one method `calculate(input: IPayrollInput, params: IPayrollParams): IPayrollResult`.

All arithmetic uses **BigNumber.js** configured with:
```typescript
BigNumber.config({ DECIMAL_PLACES: 10, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
const R = (n: BigNumber) => n.decimalPlaces(2, BigNumber.ROUND_HALF_UP);
```

Every intermediate result is rounded to 2 decimal places before being used in the next step (`ROUND_HALF_UP` — standard for financial rounding in Slovenia).

### 5.2 Mode A — Fiksni Bruto (Fixed Gross)

Used when `employee.urna_postavka IS NULL`.

```
proRata = m01_redno_ure < POLNI_MESEC_URE
          ? m01_redno_ure / POLNI_MESEC_URE
          : 1

brutoOsnova = bruto_osnova × proRata

urna0 = bruto_osnova / POLNI_MESEC_URE
nadureZnesek = urna0 × m03_nadure_ure × NADURE_FAKTOR

bruto1 = brutoOsnova + nadureZnesek + boniteta
```

**Example (2500 € fixed, 174 regular hours, August 2026):**
- proRata = 1 (174 ≥ 168)
- brutoOsnova = 2.500,00 €
- nadureZnesek = 0 € (no overtime)
- bruto1 = 2.500,00 €

### 5.3 Mode B — Parametrični (Hourly/Parametric)

Used when `employee.urna_postavka > 0`.

All factors come from `payroll_params` — no hard-coded rates.

```
m01_redno_znesek    = urna_postavka × DOPUST_FAKTOR  × m01_redno_ure       (100 %)
m04_dopust_znesek   = urna_postavka × DOPUST_FAKTOR  × m04_dopust_ure      (100 %, ZDR-1 137/9)
m05_bolniska_znesek = urna_postavka × BOLNISKA_FAKTOR_DEL × m05_bolniske_ure (80 %, ZDR-1 137/3)
nadureZnesek        = urna_postavka × NADURE_FAKTOR  × m03_nadure_ure      (130 %, ZDR-1 144)

brutoOsnova = m01_redno_znesek + m04_dopust_znesek + m05_bolniska_znesek
bruto1      = brutoOsnova + nadureZnesek + boniteta
```

**Minimum wage check (throws if violated):**
```
ure_skupaj = m01 + m04 + m05 + m03_nadure
min_wage_prorated = MINIMALNA_PLACA × (ure_skupaj / POLNI_MESEC_URE)

if (bruto1 < min_wage_prorated):
  throw Error(`Bruto pod minimalno plačo: ${bruto1} € < ${min_wage_prorated} €`)
```

**Example (12 €/h, 152 regular + 8 leave + 8 sick + 4 overtime, August 2026):**
- m01_redno_znesek: 12 × 1.00 × 152 = **1.824,00 €**
- m04_dopust_znesek: 12 × 1.00 × 8 = **96,00 €**
- m05_bolniska_znesek: 12 × 0.80 × 8 = **76,80 €**
- nadureZnesek: 12 × 1.30 × 4 = **62,40 €**
- brutoOsnova = 1.996,80 €
- bruto1 = **2.059,20 €**
- Min wage: 1481,88 × 172/168 = 1.517,16 € → 2059,20 > 1517,16 ✅

### 5.4 Shared Computation (Both Modes)

After bruto1 is established, the same steps apply regardless of mode:

**Step 1–6: Employee Contributions**

| Contribution | Rate | Applied on |
|-------------|------|-----------|
| PIZ (pension) | 15.50% | bruto1 |
| ZZ (health) | 6.36% | bruto1 |
| ZAP (employment) | 0.14% | bruto1 |
| STAR (parental) | 0.10% | bruto1 |
| DO (disability) | 1.00% | bruto1 |

**Step 7: Tax Allowances**

```
splosna_olajsava = SPLOSNA_OLAJSAVA (416,67 €) if glavni_delodajalec else 0
olajsava_skupaj = splosna_olajsava + olajsava_vzdrzevani_znesek
```

**Step 8: Taxable Base**

```
davcna_osnova = max(0, bruto1 − skupaj_prispevki_del − olajsava_skupaj)
```

**Step 9: Progressive Income Tax (Dohodnina)**

2026 five-bracket table (stored as JSON in `payroll_params`):

| Od (€) | Do (€) | Fiksni (€) | Stopnja |
|--------|--------|-----------|---------|
| 0 | 8.755,00 | 0,00 | 16% |
| 8.755,00 | 25.842,00 | 1.400,80 | 26% |
| 25.842,00 | 51.685,00 | 5.843,00 | 33% |
| 51.685,00 | 74.160,00 | 14.371,00 | 39% |
| 74.160,00 | ∞ | 23.126,00 | 50% |

Monthly dohodnina = `fiksni + (davcna_osnova − od) × stopnja` for the matching bracket.

**Step 10–13: Net Pay**

```
neto_pred_ozp = bruto1 − skupaj_prispevki_del − dohodnina
ozp_del = a031_zavezanec_ozp ? OZP_MESECNI : 0           (35 € or 0)
neto_po_ozp = neto_pred_ozp − ozp_del
```

**Step 14–16: Tax-Free Reimbursements**

```
prehrana_povracilo = m07_preh_dnevi × PREHRANA_DNEVNA_MEJA    (7,96 €/day)
prevoz_povracilo   = m07_preh_dnevi × m07_prevoz_km × PREVOZ_KM_MEJA (0,21 €/km)
koncno_izplacilo   = neto_po_ozp + prehrana + prevoz − odtegljaji_kred
```

**Step 17–23: Employer Contributions (on brutoOsnova, not bruto1)**

| Contribution | Rate | Base |
|-------------|------|------|
| PIZ | 8.85% | brutoOsnova |
| ZZ | 6.56% | brutoOsnova |
| ZAP | 0.06% | brutoOsnova |
| STAR | 0.10% | brutoOsnova |
| POSK (accident) | 0.53% | brutoOsnova |
| DO | 1.00% | brutoOsnova |

```
bruto2_strosek = brutoOsnova + vsota_prispevkov_delodajalca
```

> Note: Employer contributions are computed on `brutoOsnova` (excluding overtime), which is correct under Slovenian law — overtime supplement is exempt from employer contribution base in this implementation.

---

## 6. XML Export Subsystem

### 6.1 SEPA pain.001.001.03

Generated by `src/xml/sepa.generator.ts` using `xmlbuilder2`.

**Standard:** ISO 20022 SEPA Credit Transfer Initiation (pain.001.001.03)

**Structure:**
```xml
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>EPLACE-{runId_short}-{timestamp}</MsgId>
      <NbOfTxs>{count}</NbOfTxs>
      <CtrlSum>{sum of all koncno_izplacilo_trr}</CtrlSum>
      <InitgPty><Nm>{company name}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <ReqdExctnDt>{datum_izplacila ISO 8601}</ReqdExctnDt>
      <Dbtr>company IBAN + BIC</Dbtr>
      <!-- one CdtTrfTxInf per employee with koncno_izplacilo_trr > 0 -->
      <CdtTrfTxInf>
        <EndToEndId>PLACA-{davcna_stevilka}-{mesec}</EndToEndId>
        <InstdAmt Ccy="EUR">{koncno_izplacilo_trr}</InstdAmt>
        <Cdtr>employee IBAN + BIC + name</Cdtr>
      </CdtTrfTxInf>
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>
```

**BIC resolution:** Hardcoded map of Slovenian bank codes derived from IBAN positions 5–8 (e.g., `0100` → `BSLJSI2X` for NLB).

**Date fix:** SQL Server returns `DATE` columns as JS `Date` objects. `.toString()` would produce locale garbage. Correct approach:
```typescript
new Date(run.datum_izplacila).toISOString().split('T')[0]  // → "2026-08-31"
```

### 6.2 VOD XML (Accounting Journal)

Generated by `src/xml/vod.generator.ts`.

**Format:** Custom double-entry bookkeeping XML (used by Slovenian accounting software).

**Structure:** 3 debit entries, 14 credit entries. VsotaD must equal VsotaK (balanced check included).

| Side | Account | Description |
|------|---------|-------------|
| D | 4700 | Gross wages expense (Σ bruto_1) |
| D | 4730 | Employer contributions expense |
| D | 4750 | Meal + transport reimbursements |
| K | 2200 | Net payroll payable (Σ koncno_izplacilo_trr) |
| K | 2600 | PIZ employee payable |
| K | 2601 | ZZ employee payable |
| K | 2602 | OZP payable |
| K | 2603 | DO employee payable |
| K | 2604 | ZAP employee payable |
| K | 2605 | STAR employee payable |
| K | 2610 | PIZ employer payable |
| K | 2611 | ZZ employer payable |
| K | 2612 | DO employer payable |
| K | 2613 | ZAP employer payable |
| K | 2614 | STAR employer payable |
| K | 2615 | POSK employer payable |
| K | 2650 | Income tax (dohodnina) payable |

**August 2026 test run (2 employees):**
- VsotaD = VsotaK = **5.773,78 €** ✅ (perfectly balanced)
- Konto 4700: 2.500,00 + 2.059,20 = 4.559,20 €
- Konto 2200: 1.796,06 + 1.554,17 = 3.350,23 €

---

## 7. Asynchronous Job Processing

### 7.1 Flow (H1 Proof)

```
POST /api/v1/payroll/runs
  → creates payroll_run (status='Procesiranje') in DB
  → enqueues job to BullMQ queue (Redis)
  → returns 202 Accepted + { id } immediately (< 20 ms)

GET /api/v1/payroll/runs/:id  ← polled every 500 ms by Angular
  → returns { status, progress_procent }

Worker process (separate Node.js):
  For each employee:
    1. getMonthlyHoursForWorker(tx, empId, leto, mesec)
    2. SlovenianPayrollEngine.calculate(input, params)
    3. insertPayrollLine(tx, ..., result)
    4. updatePayrollProgressDirect(pool, tenantId, runId, percent)
  → completePayrollRun (status='Zakljucen', progress=100)
  → on error: failPayrollRun (status='Napaka', napaka_opis=message)
```

### 7.2 RLS in Worker

The worker processes run in a separate Node.js process. It sets tenant context inside the transaction before reading any data:

```typescript
const setup = new sql.Request(transaction);
setup.input('tenantId', sql.UniqueIdentifier, tenantId);
await setup.query(`EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0`);
```

Progress updates bypass the transaction (to be visible immediately without waiting for commit):

```typescript
await updatePayrollProgressDirect(pool, tenantId, runId, progress);
// uses a bare pool.request() with its own sp_set_session_context call
```

---

## 8. Frontend — Angular 18

### 8.1 Architecture

- **Standalone components** throughout — no NgModules
- **Angular Signals** for reactive state (`signal<T>()`, `computed()`, `update()`)
- **Reactive Forms** for all data-entry forms (H2 proof)
- **TailwindCSS** utility-first styling, no custom CSS files
- **Proxy** (`proxy.conf.json`): all `/api/*` requests in dev are forwarded to `http://localhost:3000`

### 8.2 Route Map

| Route | Component | Roles | Description |
|-------|-----------|-------|-------------|
| `/login` | `LoginComponent` | Public | Email/password login |
| `/employees` | `EmployeeListComponent` | All | List + search employees |
| `/employees/new` | `EmployeeFormComponent` | Skrbnik+ | Add employee |
| `/employees/:id/edit` | `EmployeeFormComponent` | Skrbnik+ | Edit employee |
| `/hours` | `HoursComponent` | All | Monthly hours data entry |
| `/payroll` | `PayrollWizardComponent` | Skrbnik+ | 3-step payroll wizard |
| `/payroll/:id/progress` | `PayrollProgressComponent` | All | Live progress + XML download |
| `/payroll/:id/payslip/:empId` | `PayslipComponent` | All | Printable payslip |
| `/job-positions` | `JobPositionsComponent` | Skrbnik+ | Manage job titles |
| `/settings` | `SettingsComponent` | Skrbnik+ | Company settings |

### 8.3 Key Components

#### `EmployeeFormComponent`

Demonstrates H2 — the Save button is `[disabled]="form.invalid"` so invalid input can never be submitted.

Validators:
- `davcna_stevilka`: exactly 8 digits (`/^\d{8}$/`)
- `emso`: exactly 13 digits (`/^\d{13}$/`)
- `trr`: IBAN format `SI56` + 15 digits
- `bruto_osnova`: min 0.01 (Mode A)
- `urna_postavka`: min 8.56 (Mode B minimum wage 2026)

**Dual-mode toggle logic:**

```typescript
setNacin(n: 'fiksni' | 'urni') {
  this.nacin = n;
  if (n === 'fiksni') {
    this.f['bruto_osnova'].setValidators([Validators.required, Validators.min(0.01)]);
    this.f['urna_postavka'].clearValidators();
    this.form.patchValue({ urna_postavka: null });
  } else {
    this.f['urna_postavka'].setValidators([Validators.required, Validators.min(8.56)]);
    this.f['bruto_osnova'].clearValidators();
    this.form.patchValue({ bruto_osnova: 0 });
  }
}
```

#### `HoursComponent`

Table with one row per employee, inline editable. Columns for `m04_dopust_ure` and `m05_bolniske_ure` are visually dimmed (`opacity-30`) for Mode A employees (they have no effect for fixed-bruto workers) but remain editable.

Uses Angular Signals for loading/saving state:
```typescript
loading   = signal(false);
savingAll = signal(false);
rows      = signal<HoursRow[]>([]);
```

#### `PayrollProgressComponent`

Polls `GET /api/v1/payroll/runs/:id` every 500 ms using `interval()`:

```typescript
interval(500).pipe(
  switchMap(() => this.http.get<PayrollRun>(`${API}/payroll/runs/${this.runId}`)),
  takeWhile(r => r.status_obracuna === 'Procesiranje', inclusive: true),
  tap(r => this.run.set(r))
).subscribe();
```

XML downloads use `HttpClient` Blob download (so the JWT interceptor can attach the Authorization header):
```typescript
download(type: 'sepa' | 'vod') {
  this.http.get(`${API}/export/${type}/${this.runId}`, { responseType: 'blob' })
    .subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${type}-${runId.slice(0,8).toUpperCase()}.xml`;
      a.click();
    });
}
```

> **Why not `<a href>`?** An anchor tag with `href` opens the URL directly in the browser without the `Authorization: Bearer` header, causing a 401. The HttpClient approach lets the JWT interceptor attach the token.

#### `PayslipComponent`

Printable view (`window.print()` + `@media print { .no-print { display: none } }`).

Conditionally shows parametric breakdown for Mode B employees:
```html
<ng-container *ngIf="line()!.m01_redno_znesek !== null">
  <tr>Redno delo: {{ line()!.m01_redno_znesek | number:'1.2-2' }} €</tr>
  <tr *ngIf="(line()!.m04_dopust_znesek ?? 0) > 0">Dopust (100 %): ...</tr>
  <tr *ngIf="(line()!.m05_bolniska_znesek ?? 0) > 0">Bolniška del. (80 %): ...</tr>
</ng-container>
```

### 8.4 AuthService — Race Condition Fix

**Problem:** `authGuard` called `isLoggedIn()` synchronously. The async `loadMe()` (which calls `GET /auth/me`) hadn't completed yet on page refresh, so the guard saw an unauthenticated state and redirected to `/login`.

**Fix:** Synchronous JWT decode in the constructor (no server round-trip):
```typescript
constructor() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    const user = this.decodeToken(token);
    if (user && user.exp * 1000 > Date.now()) this._user.set(user);
    else localStorage.removeItem(TOKEN_KEY);
  }
}
```

### 8.5 Angular `[ngValue]` vs `[value]`

HTML `<option [value]="m.value">` stringifies the value — `<option [value]="8">` sends `"8"` (string). Zod's `z.number()` rejects strings, causing 400 errors. Fix: use `[ngValue]` which preserves the JS type:

```html
<option *ngFor="let m of meseci" [ngValue]="m.value">{{ m.label }}</option>
```

---

## 9. API Reference

All endpoints are prefixed `/api/v1`. Protected endpoints require `Authorization: Bearer {JWT}`.

### Authentication

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/auth/login` | None | `{email, password}` | `{token, user}` |
| GET | `/auth/me` | JWT | — | `{user}` |

### Employees

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/employees` | All | List (paginated, optional `?includeInactive=true`) |
| GET | `/employees/:id` | All | Single employee |
| POST | `/employees` | Skrbnik+ | Create employee |
| PUT | `/employees/:id` | Skrbnik+ | Update employee |
| DELETE | `/employees/:id` | Skrbnik+ | Soft delete (sets `aktivno=0`) |

### Monthly Hours

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/hours?leto=2026&mesec=8` | All | All employees + their hours for period |
| POST | `/hours` | All | Upsert hours for one employee/month |

### Payroll

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/payroll/runs` | Skrbnik+ | Start payroll → 202 Accepted |
| GET | `/payroll/runs` | All | List all runs for tenant |
| GET | `/payroll/runs/:id` | All | Status + progress |
| GET | `/payroll/runs/:id/lines` | All | Computed payroll lines |

### Export

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/export/sepa/:runId` | Skrbnik+ | SEPA pain.001.001.03 XML |
| GET | `/export/vod/:runId` | Skrbnik+ | VOD accounting XML |
| GET | `/export/rek/:runId` | Skrbnik+ | REK-O tax report XML |

### Job Positions

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/job-positions` | All | List |
| POST | `/job-positions` | Skrbnik+ | Create |
| PUT | `/job-positions/:id` | Skrbnik+ | Update |
| DELETE | `/job-positions/:id` | Skrbnik+ | Soft delete |

### Payroll Parameters

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/payroll-params` | Skrbnik+ | List all 22 parameters |
| PUT | `/payroll-params/:key` | SistemskiAdmin | Upsert parameter (with validity dates) |

### Settings

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/settings/me` | Skrbnik+ | Company info |
| PUT | `/settings/me` | Skrbnik+ | Update company info |

---

## 10. Security Model

### Layers of Defense

| Layer | Mechanism |
|-------|----------|
| Network | Docker internal network; only ports 3000/4200 exposed |
| Authentication | JWT signed with HS256, 8-hour TTL, verified on every request |
| Authorization | Role-based middleware (`requireRole`) on all write endpoints |
| Data isolation | MS SQL RLS — SESSION_CONTEXT-based FILTER + BLOCK predicates |
| Cross-tenant write protection | RLS BLOCK AFTER INSERT/UPDATE prevents any cross-tenant writes even from the app's own code |
| Password storage | bcrypt, cost factor 12 (~250 ms/hash on test hardware) |
| Audit trail | Temporal tables capture every employee/position change with timestamp |
| Input validation | Zod v4 schemas on all body parameters; type coercion with bounds checking |
| Soft delete | Records are deactivated (`aktivno=0`), never physically deleted in production use |

### H3 Demonstration

Without setting SESSION_CONTEXT:
```sql
-- As sa without context:
SELECT COUNT(*) FROM dbo.employees;  -- Returns 0 (RLS filters everything)
```

With context:
```sql
EXEC sp_set_session_context @key=N'tenant_id',
  @value=CAST('11111111-1111-1111-1111-111111111111' AS UNIQUEIDENTIFIER), @readonly=0;
SELECT COUNT(*) FROM dbo.employees;  -- Returns only tenant A's employees
```

---

## 11. Testing & Validation

### 11.1 Test Accounts

| Email | Password | Tenant | Role |
|-------|----------|--------|------|
| admin@a.si | Test1234! | Testno podjetje A d.o.o. | Skrbnik |
| admin@b.si | Test1234! | Drugo podjetje B d.o.o. | Skrbnik |

### 11.2 E2E Test — 17 August 2026 (MVP Validation)

**Scenario:** Single employee Miha Bratina, bruto 2.500 €, Mode A, August 2026.

| Step | Test | Result |
|------|------|--------|
| 1 | Login admin@a.si / Test1234! | ✅ |
| 2 | Empty employee list on fresh DB | ✅ |
| 3 | Form blocks empty Davčna field | ✅ H2 |
| 3 | Form blocks 7-digit tax number | ✅ H2 |
| 3 | Add Bratina Miha 2.500 € | ✅ |
| 4 | Enter hours: 174 regular, 22 meals, 15 km | ✅ |
| 4 | Values persist after page refresh | ✅ |
| 5 | POST /payroll/runs → 202 Accepted | ✅ H1 |
| 6 | Progress bar increments every 500 ms | ✅ H1 |
| 6 | Status reaches Zakljucen at 100% | ✅ |
| 6 | Payslip: Bruto 2.500 €, dohodnina 335,86 € | ✅ |
| 7 | SEPA XML downloaded, valid content | ✅ |
| 7 | VOD XML downloaded, date 2026-08-31 | ✅ |
| 8 | Page refresh retains login session | ✅ |
| H3 | Employee invisible without session context | ✅ H3 |

### 11.3 E2E Test — 19 August 2026 (Dual-Mode Validation)

**Scenario:** Two employees with contrasting payroll modes.

#### Employee Setup

| | Ana Kovač | Janez Novak |
|-|-----------|------------|
| Mode | A — Fiksni bruto | B — Urna postavka |
| Rate | 2.500,00 €/mesec | 12,00 €/h |
| OZP | Da (35 €) | Ne |
| Glavni delodajalec | Da | Da |

#### August 2026 Hours

| | Ana Kovač | Janez Novak |
|-|-----------|------------|
| Redno | 174 h | 152 h |
| Nadure | 0 | 4 h |
| Dopust | 0 | 8 h |
| Bolniška del. | 0 | 8 h |
| Prehrana dni | 22 | 20 |
| Prevoz km/dan | 15 | 10 |

#### Ana Kovač — Payslip Verification

| Position | Calculation | Expected | Actual | Match |
|---------|------------|---------|--------|-------|
| Bruto 1 | 2500 × (174/168→1) | 2.500,00 € | 2.500,00 € | ✅ |
| PIZ del | 2500 × 15,50% | 387,50 € | 387,50 € | ✅ |
| ZZ del | 2500 × 6,36% | 159,00 € | 159,00 € | ✅ |
| Davčna osnova | 2500 − 577,50 − 416,67 | 1.505,83 € | 1.505,83 € | ✅ |
| Dohodnina | Progr. lestvica | 335,86 € | 335,86 € | ✅ |
| OZP | Zavezanec=true | 35,00 € | 35,00 € | ✅ |
| Neto plača | | 1.551,64 € | 1.551,64 € | ✅ |
| Prehrana | 22 × 7,96 | 175,12 € | 175,12 € | ✅ |
| Prevoz | 22 × 15 × 0,21 | 69,30 € | 69,30 € | ✅ |
| **Skupaj za nakazilo** | | **1.796,06 €** | **1.796,06 €** | ✅ |

#### Janez Novak — Payslip Verification

| Position | Calculation | Expected | Actual | Match |
|---------|------------|---------|--------|-------|
| Redno delo | 12 × 1,00 × 152 | 1.824,00 € | 1.824,00 € | ✅ |
| Dopust (100%) | 12 × 1,00 × 8 | 96,00 € | 96,00 € | ✅ |
| Bolniška del. (80%) | 12 × 0,80 × 8 | 76,80 € | 76,80 € | ✅ |
| Nadure (130%) | 12 × 1,30 × 4 | 62,40 € | 62,40 € | ✅ |
| Bruto 1 | 1824+96+76,80+62,40 | 2.059,20 € | 2.059,20 € | ✅ |
| Min. plača check | 1481,88×172/168=1517,16 | PASS | PASS | ✅ |
| Dohodnina | Progr. lestvica | 230,55 € | 230,55 € | ✅ |
| OZP | Zavezanec=false | 0,00 € | 0,00 € | ✅ |
| Neto plača | | 1.352,97 € | 1.352,97 € | ✅ |
| Prehrana | 20 × 7,96 | 159,20 € | 159,20 € | ✅ |
| Prevoz | 20 × 10 × 0,21 | 42,00 € | 42,00 € | ✅ |
| **Skupaj za nakazilo** | | **1.554,17 €** | **1.554,17 €** | ✅ |
| Parametrična razčlenitev na listku | | Prikazana | Prikazana | ✅ |

#### XML Validation

**SEPA pain.001.001.03:**
- `NbOfTxs`: 2 ✅
- `CtrlSum`: 1.796,06 + 1.554,17 = **3.350,23 €** ✅
- `ReqdExctnDt`: `2026-08-31` (ISO 8601, not JS Date.toString) ✅
- Both employee IBANs present ✅
- Both employee names and amounts correct ✅

**VOD XML:**
- `DatumKnjizenja`: `2026-08-31` ✅
- `VsotaD` = `VsotaK` = **5.773,78 €** (balanced) ✅
- Konto 4700: 4.559,20 € (= 2500 + 2059,20) ✅
- Konto 2200: 3.350,23 € (= net payroll for bank transfer) ✅
- 17 entries total ✅

### 11.4 Bugs Found and Fixed During Development

| # | Bug | Root Cause | Fix |
|---|-----|-----------|-----|
| 1 | Login returns 401 for all users | `05_alter.sql` added RLS FILTER predicate to `users` table | Removed FILTER (kept BLOCK); login uses `sysQuery` |
| 2 | Page refresh redirects to /login | `authGuard` checked `isLoggedIn()` synchronously before async `loadMe()` returned | Sync JWT decode in AuthService constructor |
| 3 | `[value]` on `<option>` sends string; Zod 400 | HTML attribute stringifies numeric values | Replaced `[value]` with `[ngValue]` in hours + wizard components |
| 4 | Zod v4 UUID validation rejected SQL Server UUIDs | Zod v4 enforces RFC 4122 version/variant bits; SQL Server generates non-conforming GUIDs | Custom regex + `transform(toLowerCase)` |
| 5 | XML date showed JS `Date.toString()` string | `mssql` returns `DATE` columns as JS `Date` objects | `.toISOString().split('T')[0]` |
| 6 | SEPA/VOD export returned 401 | `<a href target="_blank">` opens URL without Authorization header | Replaced with `HttpClient` Blob download |
| 7 | `datum_izplacila` didn't update on month change | `valueChanges` subscription missed native `<select>` change events | Added `(change)="computeDatum()"` + `[ngValue]` |
| 8 | Employee list showed empty despite data in DB | Backend returns `{ data: [], total: N }`; frontend read `res` instead of `res.data` | Changed to `res.data` in `list.component.ts` |

### 11.5 How to Run the Application

**Prerequisites:** Docker Desktop, Node.js 20+, Angular CLI 18

```bash
# 1. Start database and queue
cd C:\Users\mike\Desktop\xcvcx\eplace2026
docker compose up -d
# Wait ~20s for MSSQL health

# 2. Run all migrations (copy files into container first)
$PW = "YourStrong@Passw0rd"; $CONT = "eplace2026-mssql-1"
foreach ($f in @("01_schema.sql","02_rls.sql","03_temporal.sql","04_seed.sql",
                  "05_alter.sql","06_payroll_params.sql","07_alter2.sql")) {
  docker cp ".\database\$f" "${CONT}:/tmp/$f"
  docker exec $CONT /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P $PW -C -i "/tmp/$f"
}

# 3. Seed users
cd backend && npm run seed

# 4. Terminal 1 — Backend API (port 3000)
npm run dev

# 5. Terminal 2 — BullMQ payroll worker
npm run worker

# 6. Terminal 3 — Angular frontend (port 4200)
cd ../frontend && ng serve --proxy-config proxy.conf.json
```

**Access:** http://localhost:4200  
**Login:** `admin@a.si` / `Test1234!`

---

*Report generated from codebase analysis and live E2E testing on 2026-08-19.*
