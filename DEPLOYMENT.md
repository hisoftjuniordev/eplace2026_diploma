# ePlače 2026 — Navodila za deployment v oblak

**Datum:** 30. 8. 2026  
**Stack:** MS SQL Server (Azure) + Redis (Railway) + Node.js backend (Railway) + Angular frontend (Vercel)

---

## Pregled arhitekture

```
[Angular SPA]          [Node.js API]          [Azure SQL]
  Vercel       ──────►   Railway      ──────►   Microsoft Azure
vercel.app              railway.app             database.windows.net

                             │
                             ▼
                        [Redis]
                        Railway (interno)
```

---

## 1. Azure SQL Database

### 1.1 Ustvaritev baze

1. Pojdi na **portal.azure.com** in se prijavi z Microsoft računom.
2. Klikni **"Create a resource"** → poišči **"SQL Database"** → klikni **Create**.
3. Nastavi osnovne podatke:
   - **Subscription:** Azure subscription 1
   - **Resource group:** Ustvari novo → ime `eplace2026-rg`
   - **Database name:** `eplace2026`
   - **Server:** Ustvari nov server:
     - Server name: `eplace2026srv`
     - Location: `Germany West Central`
     - Authentication: SQL authentication
     - Admin login: `eplace_admin`
     - Password: (nastavi močno geslo)
4. Na zavihku **Compute + storage** klikni **"Configure database"**:
   - Izberi **Serverless** tier
   - Označi **"Apply free offer"** (32 GB storage + 100K vCore sekund brezplačno)
   - Overage billing: **Disabled** (baza se pauzira ob prekoračitvi, ne zaračuna)

### 1.2 Nastavitev omrežja (Networking)

Na zavihku **Networking** nastavi:
- **Connectivity method:** `Public endpoint`
- **Allow Azure services:** `Yes`
- **Add current client IP:** `Yes` (doda tvoj IP za lokalni dostop)
- **Minimum TLS version:** `1.2`
- **Connection policy:** `Default`

### 1.3 Varnost (Security)

- **Microsoft Defender for SQL:** `Not now` (15 USD/mes — za diplomski projekt ni potrebno)
- **Ledger:** `Not configured`
- **Transparent data encryption:** `Service-managed key` (privzeto, brezplačno)
- **Always Encrypted:** `OFF`

### 1.4 Dodatne nastavitve (Additional settings)

- **Use existing data:** `None`
- **Collation:** `SQL_Latin1_General_CP1_CI_AS`

Klikni **Review + create** → **Create**. Deployment traja ~2 minuti.

---

## 2. Inicializacija baze podatkov

### 2.1 Dostop do Query Editorja

1. V Azure portalu pojdi na **SQL databases → eplace2026**.
2. V levem meniju klikni **Query editor (preview)**.
3. Prijavi se z: Login `eplace_admin`, Password (kar si nastavil).

### 2.2 Zagon SQL skript

Zaženi skripte v **točno tem vrstnem redu**. Pri vsaki skripta preskoči vrstice `USE eplace2026; GO` na vrhu (Query Editor je že v pravi bazi).

#### Skripta 1: `database/01_schema.sql`
Ustvari vse tabele: `tenants`, `users`, `employees`, `job_positions`, `monthly_hours`, `payroll_runs`, `payroll_lines`, `audit_logs`. Temporal tables (`employees`, `job_positions`) imajo SYSTEM_VERSIONING za avtomatsko arhiviranje sprememb.

#### Skripta 2: `database/02_rls.sql`
Ustvari Row-Level Security (RLS) politiko `EmployeeRLSPolicy` z varnostno funkcijo `fn_securitypredicate`. RLS zagotavlja, da vsak najemnik (tenant) vidi samo svoje podatke.

> **Pozor:** Ko dodajaš kolumne temporal tabelam (`05_alter.sql`), moraš RLS politiko najprej zbrisati (`DROP SECURITY POLICY`), narediti spremembe, nato jo recreate. Razlog: SQL Server ne dovoli ALTER TABLE na tabelah, ki jih RLS politika aktivno nadzoruje.

#### Skripta 3: `database/05_alter.sql` (popravljena verzija)
Doda nove kolumne (`aktivno`, `datum_zaposlitve`, `napaka_opis`, `zakljucen_ob`) in razširi RLS politiko na vse tabele z AFTER UPDATE bloki.

Ker RLS blokira ALTER TABLE, zaženi ta popravljen vrstni red:
```sql
DROP SECURITY POLICY dbo.EmployeeRLSPolicy;
-- ... ALTER TABLE ukazi ...
CREATE SECURITY POLICY dbo.EmployeeRLSPolicy ... WITH (STATE = ON);
```

#### Skripta 4: `database/06_payroll_params.sql`
Ustvari tabelo `payroll_params` s seed podatki za leto 2026: prispevne stopnje, OZP, dohodninska lestvica (JSON), minimalna plača, prevoz in prehrana.

#### Skripta 5: `database/07_alter2.sql`
Doda dual-mode payroll podporo: urna postavka (`urna_postavka`), dopustne/bolniške ure, razčlenitev plačilnih vrstic in 5 novih parametrov (minimalna plača, bolniški faktor, nadure faktor).

#### Skripta 6: `database/04_seed.sql` (popravljena verzija)
Vstavi testne podatke: 2 tenanta, 3 zaposlene, delovne ure.

> **Pozor:** `sp_set_session_context` ne sprejme `CAST(uuid AS UNIQUEIDENTIFIER)` inline. Uporabi spremenljivko:
> ```sql
> DECLARE @tid UNIQUEIDENTIFIER = '11111111-...';
> EXEC sp_set_session_context @key=N'tenant_id', @value=@tid, @readonly=0;
> ```

### 2.3 Seed uporabnikov (bcrypt gesla)

Ker bcrypt zahteva Node.js, se uporabniki ustvarijo lokalno s skriptom:

```cmd
cd C:\Users\mike\Desktop\xcvcx\eplace2026\backend
C:\Users\mike\.bun\bin\bun.exe --env-file=.env run src/scripts/seed.ts
```

> **Pozor:** `.env` v `backend/` mapi mora imeti Azure connection podatke (ne localhost). Script nastavi SESSION_CONTEXT pred vsakim INSERT v `users` tabelo (zahteva RLS BLOCK predicate).

Testni uporabniki:
| Email | Geslo | Tenant |
|-------|-------|--------|
| `admin@a.si` | `Test1234!` | Podjetje A (Janez Novak, Ana Kovač) |
| `admin@b.si` | `Test1234!` | Podjetje B (Peter Hočevar) |

### 2.4 Firewall za Railway

Azure SQL privzeto blokira Railway strežnike (niso Azure servisi). Dodaj firewall pravilo:

**portal.azure.com → SQL Server `eplace2026srv` → Networking → Firewall rules:**

| Rule name | Start IP | End IP |
|-----------|----------|--------|
| `AllowAll` | `0.0.0.0` | `255.255.255.255` |

> Za produkcijo bi dodali samo specifične Railway IP naslove.

---

## 3. Railway — Backend (Node.js)

### 3.1 Ustvaritev projekta

1. Pojdi na **railway.app** → prijavi se z GitHub računom.
2. Klikni **"New Project"** → **"Deploy from GitHub repo"**.
3. Avtoriziraj Railway dostop do GitHub in izberi repo `hisoftjuniordev/eplace2026_diploma`.

### 3.2 Konfiguracija build procesa

Railway sam ne zazna Node.js aplikacije ker repo vsebuje `backend/`, `frontend/` in `database/` mape. Doda se `railway.json` v root repota:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install && npm run build"
  },
  "deploy": {
    "startCommand": "node dist/app.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

V Railway: **Settings → Build → Root Directory** nastavi na `backend`.

### 3.3 Environment Variables

V Railway: **service → Variables → RAW Editor**, prilepi:

```
DB_SERVER=eplace2026srv.database.windows.net
DB_PORT=1433
DB_NAME=eplace2026
DB_USER=eplace_admin
DB_PASSWORD=<tvoje_geslo>
JWT_SECRET=eplace2026-super-secret-jwt-key-minimum-32-chars-here
JWT_EXPIRES_IN=8h
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
NIXPACKS_NODE_VERSION=22
```

> `NIXPACKS_NODE_VERSION=22` je obvezen ker `mssql` paket zahteva Node >= 22.

### 3.4 Redis

1. V Railway projektu klikni **"+ New" → "Database" → "Add Redis"**.
2. Railway samodejno doda `REDIS_URL` reference spremenljivko.
3. V backend service → Variables dodaj: `REDIS_URL=${{Redis.REDIS_URL}}`

Koda v `backend/src/config/redis.ts` mora podpirati oba načina:
```typescript
if (process.env.REDIS_URL) {
  _client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
} else {
  _client = new Redis({ host: process.env.REDIS_HOST || 'localhost', ... });
}
```

### 3.5 Javna domena

**service → Settings → Networking → Public Networking → "Generate Domain"**

Dodeljena domena: `https://eplace2026diploma-production.up.railway.app`

Verifikacija:
```
GET https://eplace2026diploma-production.up.railway.app/health
→ { "status": "ok", "time": "2026-08-30T17:34:13.785Z" }
```

---

## 4. Vercel — Frontend (Angular)

### 4.1 Ustvaritev projekta

1. Pojdi na **vercel.com** → prijavi se z GitHub računom.
2. Klikni **"New Project"** → **"Import"** → izberi repo `hisoftjuniordev/eplace2026_diploma`.

### 4.2 Build nastavitve

| Nastavitev | Vrednost |
|-----------|---------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Angular |
| **Build Command** | `npm run build -- --configuration production` |
| **Output Directory** | `dist/eplace2026-frontend/browser` |

> **Pozor:** Output directory je `dist/eplace2026-frontend/browser` (ne `dist/frontend/browser`). Pravo ime najdeš v build logu pod `Output location:`.

### 4.3 Environment Variables

```
API_URL=https://eplace2026diploma-production.up.railway.app
```

### 4.4 Deploy

Klikni **Deploy**. Vercel namesti odvisnosti, zgradi Angular aplikacijo in jo objavi.

Javna domena: `https://eplace2026-diploma-3v48.vercel.app`

---

## 5. Povzetek — Live URL-ji

| Komponenta | URL |
|-----------|-----|
| **Frontend (Angular)** | `https://eplace2026-diploma-3v48.vercel.app` |
| **Backend API** | `https://eplace2026diploma-production.up.railway.app` |
| **Health check** | `https://eplace2026diploma-production.up.railway.app/health` |
| **Baza** | `eplace2026srv.database.windows.net` (Azure SQL, port 1433) |

---

## 6. Stroški

| Storitev | Plan | Cena |
|---------|------|------|
| Azure SQL Database | Serverless free tier (32 GB, 100K vCore s) | 0 USD/mes |
| Railway — backend | Free plan (1 vCPU, 0.5 GB RAM, $1 kredit) | 0 USD/mes |
| Railway — Redis | Vključen v free plan | 0 USD/mes |
| Vercel — frontend | Hobby plan (statične strani) | 0 USD/mes |
| **SKUPAJ** | | **0 USD/mes** |

---

## 7. Lokalni razvoj

Za lokalni razvoj ostane Docker Compose nespremenjen:

```bash
# Zaženi lokalno (MS SQL + Redis v Dockerju)
docker compose up -d

# Backend (development mode)
cd backend
npm run dev:all

# Frontend
cd frontend
ng serve
```

`backend/.env` za lokalni razvoj:
```
DB_SERVER=localhost
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd
REDIS_HOST=localhost
```

`backend/.env` za produkcijo (Azure):
```
DB_SERVER=eplace2026srv.database.windows.net
DB_USER=eplace_admin
DB_PASSWORD=<geslo>
REDIS_URL=<railway_redis_url>
```
