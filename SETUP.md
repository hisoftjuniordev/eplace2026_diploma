# ePlače 2026 — Setup navodila

## Predpogoji
- Docker Desktop
- Node.js 20+
- Angular CLI: `npm install -g @angular/cli`
- MS SQL Server Management Studio (SSMS) ali sqlcmd

---

## Korak 1 — Zaženi Docker (MS SQL + Redis)

```powershell
# V mapi eplace2026/
$env:DB_PASSWORD="YourStrong@Passw0rd"
docker compose up -d
# Počakaj ~30 sekund da se MS SQL SQL inicializira
docker compose ps   # mssql in redis morata biti healthy
```

---

## Korak 2 — Inicializiraj bazo podatkov

```powershell
# Povezi se na SSMS: localhost, sa, YourStrong@Passw0rd
# Poženi te skripte v vrstnem redu:
sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -i database\01_schema.sql
sqlcmd -S localhost -U sa -P "YourStrong@Passw0rd" -i database\02_rls.sql
```

---

## Korak 3 — Backend setup in seed

```powershell
cd backend
npm install
npm run seed    # Ustvari testne podatke (bcrypt hash gesla)
```

---

## Korak 4 — Zaženi backend

**Terminal 1 — Express server:**
```powershell
cd backend
npm run dev
# http://localhost:3000/health
```

**Terminal 2 — BullMQ worker:**
```powershell
cd backend
npm run worker
```

---

## Korak 5 — Angular frontend

```powershell
cd eplace2026/
# Ustvari Angular projekt (samo prvič):
ng new frontend --standalone --routing --style=css --skip-tests
# Ko konča, ZAMENJAJ generirane datoteke z našimi:
# - frontend/src/app/ (vse .ts datoteke)
# - frontend/src/main.ts
# - frontend/src/styles.css
# - frontend/tailwind.config.js
# - frontend/package.json (doda tailwind)

cd frontend
npm install
ng serve
# http://localhost:4200
```

---

## Testiranje hipotez

### H1 — Asinhroni obračun (<20ms)
1. Login: `admin@a.si` / `Test1234!`
2. Pojdi na Obračun plač → izpolni obrazec → Sproži
3. Odpri Network DevTools — POST /api/v1/payroll/runs → **202 Accepted, <10ms**
4. Progress bar se polni v ozadju

### H2 — Validacija obrazca
1. Nov delavec → vpiši "123" v polje EMŠO
2. Polje postane rdeče, sporočilo "EMŠO mora imeti natanko 13 številk"
3. Gumb Shrani ostane **disabled** dokler niso vsa polja pravilna

### H3 — RLS izolacija (v SSMS)
```sql
USE eplace2026;
SELECT COUNT(*) FROM dbo.employees;  -- 0 (brez konteksta)

EXEC sp_set_session_context @key=N'tenant_id',
  @value=CAST('11111111-1111-1111-1111-111111111111' AS UNIQUEIDENTIFIER), @readonly=0;
SELECT COUNT(*) FROM dbo.employees;  -- 2 (Janez + Ana)

EXEC sp_set_session_context @key=N'tenant_id',
  @value=CAST('22222222-2222-2222-2222-222222222222' AS UNIQUEIDENTIFIER), @readonly=0;
SELECT COUNT(*) FROM dbo.employees;  -- 1 (Peter)
```
Pričakovano: 0 / 2 / 1

---

## Testni podatki
| Email | Geslo | Tenant | Delavci |
|-------|-------|--------|---------|
| admin@a.si | Test1234! | Podjetje A | Janez Novak (2000€), Ana Kovač (1500€) |
| admin@b.si | Test1234! | Podjetje B | Peter Hočevar (3000€) |
