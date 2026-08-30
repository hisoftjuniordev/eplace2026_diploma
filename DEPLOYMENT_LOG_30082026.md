# ePlače 2026 — Deployment 30. 8. 2026

## Kaj smo naredili

Danes smo celovito SaaS aplikacijo ePlače 2026 (Angular frontend + Node.js backend + MS SQL Server) preselili iz lokalnega Docker okolja v produkcijsko oblačno arhitekturo — **brezplačno, 0 EUR/mesec**.

---

## 1. Azure SQL Database

- Ustvarili SQL Server `eplace2026srv` v Germany West Central z **Serverless free tier** (32 GB, 100K vCore sekund/mes)
- Nastavili Networking: Public endpoint, Allow Azure services, dodali client IP
- V **Query Editor** zagnali 6 SQL skript v točnem vrstnem redu:
  - `01_schema.sql` — vse tabele (tenants, users, employees, payroll_runs, payroll_lines, audit_logs...)
  - `02_rls.sql` — Row-Level Security politika (H3 hipoteza)
  - `05_alter.sql` — nove kolumne; **zahteval DROP + recreate RLS** ker SQL Server ne dovoli ALTER na tabelah pod aktivno RLS politiko
  - `06_payroll_params.sql` — prispevne stopnje, dohodninska lestvica 2026
  - `07_alter2.sql` — dual-mode payroll, urna postavka, bolniške/dopustne ure
  - `04_seed.sql` — testni podatki; **popravili UUID sintakso** za `sp_set_session_context`
- Bcrypt seed za userje zagnali lokalno z `bun` ker `npm`/`nvm` symlink ni delal
- Dodali firewall pravilo `0.0.0.0–255.255.255.255` da Railway doseže bazo

---

## 2. Railway — Backend

- Povezali GitHub repo `hisoftjuniordev/eplace2026_diploma`
- Railway ni zaznal Node.js ker repo vsebuje `backend/`, `frontend/`, `database/` — dodali **`railway.json`** z build/start ukazi
- Nastavili Root Directory na `backend`, dodali `NIXPACKS_NODE_VERSION=22` ker Azure paketi zahtevajo Node 22
- Dodali Redis service, popravili `redis.ts` da bere `REDIS_URL` env var namesto hardkodiranega `localhost`
- Popravili `db.ts`: `encrypt: true` za Azure SSL
- Popravili `backend/.env` (kazal je na `localhost`, ne Azure)
- Na koncu vključili **BullMQ worker v isti proces** (`import './workers/payroll.worker'` v `app.ts`) ker Railway free plan ne podpira dveh ločenih procesov

**Rezultat:** `https://eplace2026diploma-production.up.railway.app/health` → `{"status":"ok"}`

---

## 3. Vercel — Frontend

- Povezali isti GitHub repo, Root Directory: `frontend`
- Output directory je bil napačen — iz build loga ugotovili pravo pot: `dist/eplace2026-frontend/browser`
- Dodali **`frontend/vercel.json`** da se nastavitev ne izgubi med deployi
- Ustvarili `environment.production.ts` z Railway API URL in dodali `fileReplacements` v `angular.json` — brez tega je Angular klical `/api/v1` relativno na Vercel (HTTP 405)

**Rezultat:** `https://eplace2026-diploma-3v48.vercel.app` — Angular SPA živ, prijava deluje

---

## Live URLs

| Komponenta | URL |
|---|---|
| **Frontend** | https://eplace2026-diploma-3v48.vercel.app |
| **Backend API** | https://eplace2026diploma-production.up.railway.app |
| **Health check** | https://eplace2026diploma-production.up.railway.app/health |

## Test prijava

```
admin@a.si / Test1234!  →  Podjetje A (Janez Novak, Ana Kovač)
admin@b.si / Test1234!  →  Podjetje B (Peter Hočevar)
```

## Skupni strošek: 0 EUR/mesec

| Storitev | Plan | Cena |
|---|---|---|
| Azure SQL Database | Serverless free tier | 0 USD/mes |
| Railway — backend | Free plan ($1 kredit) | 0 USD/mes |
| Railway — Redis | Vključen v free plan | 0 USD/mes |
| Vercel — frontend | Hobby plan | 0 USD/mes |
| **SKUPAJ** | | **0 USD/mes** |
