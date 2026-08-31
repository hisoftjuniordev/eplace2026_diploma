# Row-Level Security (RLS) v ePlače 2026

## Kazalo

1. [Kaj je RLS?](#1-kaj-je-rls)
2. [Kako deluje v tej aplikaciji](#2-kako-deluje-v-tej-aplikaciji)
3. [Zakaj ne vidim podatkov brez konteksta](#3-zakaj-ne-vidim-podatkov-brez-konteksta)
4. [Kako podatke vidim v Azure Query Editorju](#4-kako-podatke-vidim-v-azure-query-editorju)
5. [Zakaj je varno pred SQL Injection](#5-zakaj-je-varno-pred-sql-injection)
6. [Celoten tok od prijave do podatka](#6-celoten-tok-od-prijave-do-podatka)
7. [Pogosta vprašanja](#7-pogosta-vprašanja)

---

## 1. Kaj je RLS?

**Row-Level Security** (varnost na ravni vrstice) je funkcija SQL Serverja (in Azure SQL), ki
omogoča, da **ista tabela samodejno vrne različne vrstice za različne uporabnike** — brez da bi
moral pisati `WHERE tenant_id = ...` v vsak query.

### Analogija

Predstavljaj si biblioteko z enim samim katalogom knjig za vse stranke. Brez RLS bi vsak
bralec videl vse knjige vseh drugih strank. Z RLS biblioteka sama filtriria — vsak bralec
avtomatično vidi samo svoje knjige, četudi sprašuje "pokaži mi vse knjige."

### Zakaj to v SaaS aplikacijah?

ePlače 2026 je **multi-tenant** aplikacija. To pomeni, da ena instanca (en backend, ena baza)
streže več različnim podjetjem (tenantom). Vsako podjetje mora videti **samo svoje podatke**.

Brez RLS bi moral vsak query izgledati tako:

```sql
-- BREZ RLS — developer mora sam paziti na vsak query
SELECT * FROM dbo.employees WHERE tenant_id = '11111111-...' AND aktivno = 1;
SELECT * FROM dbo.payroll_runs WHERE tenant_id = '11111111-...' ORDER BY mesec;
```

Z RLS pa je dovolj:

```sql
-- Z RLS — filter se aplicira samodejno
SELECT * FROM dbo.employees WHERE aktivno = 1;
SELECT * FROM dbo.payroll_runs ORDER BY mesec;
```

SQL Server sam doda `WHERE tenant_id = <kontekst>` v ozadju, nevidno.

---

## 2. Kako deluje v tej aplikaciji

### 2.1 Varnostna funkcija (predicate function)

Vse se začne z eno funkcijo v bazi (`02_rls.sql`):

```sql
CREATE OR ALTER FUNCTION dbo.fn_securitypredicate (@tenant_id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN
  SELECT 1 AS fn_result
  WHERE CAST(SESSION_CONTEXT(N'tenant_id') AS UNIQUEIDENTIFIER) = @tenant_id;
```

**Kaj počne ta funkcija:**

- Prejme `@tenant_id` — to je vrednost iz vrstice tabele (npr. `employees.tenant_id`)
- Pokliče `SESSION_CONTEXT(N'tenant_id')` — to je vrednost, ki jo je nastavil backend za
  to specifično sejo (povezavo)
- Primerja obe vrednosti
- Vrne rezultat: `1` (dovoli) ali nič (zavrni)

Ko SQL Server izvede `SELECT * FROM dbo.employees`, v ozadju za vsako vrstico pokliče to
funkcijo. Vrstice, kjer funkcija vrne `1`, gredo v rezultat. Vrstice, kjer ne vrne ničesar,
so tiho izpuščene.

### 2.2 Varnostna politika (security policy)

Funkcija sama po sebi ne naredi ničesar — prijaviti jo je treba kot **filter** za določene tabele:

```sql
CREATE SECURITY POLICY dbo.EmployeeRLSPolicy
  ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.employees,
  ADD BLOCK  PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.employees AFTER INSERT,
  ADD FILTER PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.payroll_runs,
  ADD BLOCK  PREDICATE dbo.fn_securitypredicate(tenant_id) ON dbo.payroll_runs AFTER INSERT,
  -- ... enako za vse tabele
WITH (STATE = ON);
```

**FILTER PREDICATE** — blokira branje (SELECT): vrstice, ki ne ustrezajo filtru, se ne vrnejo.

**BLOCK PREDICATE AFTER INSERT** — blokira pisanje: ne moreš vstaviti vrstice z napačnim
`tenant_id`. Backend ne more "po nesreči" zapisati podatkov v napačnega tenanta.

### 2.3 SESSION_CONTEXT — ključ do podatkov

`SESSION_CONTEXT` je kot **varnostni hrbtnik za eno sejo** (eno TCP povezavo do baze). Je
majhen slovar ključ → vrednost, ki živi samo toliko časa, kot traja seja.

Backend ga nastavi takoj po vzpostavitvi transakcije:

```typescript
// backend/src/config/db.ts
const setup = new sql.Request(transaction);
setup.input('tenantId', sql.UniqueIdentifier, tenantId);
await setup.query(
  `EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0`
);
```

Od tega trenutka naprej, ves SQL ki teče v tej transakciji, samodejno vidi samo vrstice
tega tenanta.

### 2.4 Diagram toka

```
Uporabnik → HTTP request → Backend (Node.js)
                                ↓
                         Preveri JWT token
                         Iz tokena vzame tenantId
                                ↓
                         Odpre transakcijo (mssql)
                                ↓
                   EXEC sp_set_session_context 'tenant_id', tenantId
                                ↓
                         SELECT * FROM employees
                                ↓
                    SQL Server pokliče fn_securitypredicate
                    za vsako vrstico → filtrira po tenant_id
                                ↓
                         Vrne samo prave vrstice
                                ↓
                         JSON response → Uporabnik
```

---

## 3. Zakaj ne vidim podatkov brez konteksta

Ko odpreš **Azure Query Editor** (ali Azure Data Studio, SSMS), se prijaviš z
uporabniškim računom (`eplace_admin`). Ta račun:

1. **Ima RLS filter** — ker ni `sysadmin` ali `db_owner`
2. **Nima nastavljenega SESSION_CONTEXT** — ker si se pravkar prijavil, nobena aplikacija
   ni nastavila `tenant_id` v tej seji

Ko poženeš:

```sql
SELECT COUNT(*) FROM dbo.payroll_runs;
```

SQL Server v ozadju klice `fn_securitypredicate` za vsako vrstico:

```
fn_securitypredicate(tenant_id vrstice)
→ primerja z SESSION_CONTEXT('tenant_id')
→ SESSION_CONTEXT je NULL (ni nastavljen)
→ NULL ≠ nobena vrednost
→ funkcija ne vrne nič
→ vrstica je filtrirana ven
→ rezultat: 0 vrstic
```

Ni napake. Ni opozorila. Samo tiho `0 rows` — kot da podatkov sploh ni.

To je **namerno in zaželeno vedenje** — SQL Server ne razkrije, da podatki sploh obstajajo.
Napadalec, ki bi prišel do brskanja po bazi brez konteksta, ne bi videl ničesar.

### Zakaj COUNT(*) ne vrže napake?

Ker RLS ne blokira poizvedbe — samo filtrira vrstice. Poizvedba je uspešna, vrne samo
prazen rezultat. Enako, kot da bi tabela bila prazna.

---

## 4. Kako podatke vidim v Azure Query Editorju

### Korak 1: Nastavi tenant kontekst

Vsak query blok mora začeti z nastavitvijo konteksta:

```sql
DECLARE @tid NVARCHAR(36);
SELECT TOP 1 @tid = CAST(id AS NVARCHAR(36)) FROM dbo.tenants;
EXEC sp_set_session_context N'tenant_id', @tid;
```

**Zakaj DECLARE + CAST?**

`sp_set_session_context` ne sprejme subquery direktno kot vrednost — zahteva spremenljivko
ali literal. Zato moramo najprej shraniti vrednost v `@tid`, šele nato jo podati.

### Korak 2: Beri podatke

Po nastavitvi konteksta vidi vse:

```sql
-- Vsi obračuni
SELECT leto, mesec, status_obracuna, progress_procent, ustvarjen_ob
FROM dbo.payroll_runs
ORDER BY leto, mesec;

-- Plačilne liste z imeni
SELECT e.priimek, e.ime,
       pl.bruto_1, pl.neto_po_ozp, pl.koncno_izplacilo_trr,
       pr.leto, pr.mesec
FROM dbo.payroll_lines pl
JOIN dbo.employees e   ON e.id  = pl.employee_id
JOIN dbo.payroll_runs pr ON pr.id = pl.payroll_run_id
ORDER BY pr.leto, pr.mesec, e.priimek;

-- Zaposleni
SELECT ime, priimek, bruto_osnova, aktivno FROM dbo.employees;
```

### Pomembno: kontekst velja samo za to sejo

Vsak nov tab v Azure Query Editorju = nova seja = kontekst se ponastavi na NULL.
Moraš ga nastaviti na vrhu vsakega query bloka.

### Kako videti podatke brez RLS (z admin pravicami)

Če imaš dostop kot `db_owner` ali `sysadmin`, RLS se ne aplicira:

```sql
-- Samo za admin preverjanje — obide RLS popolnoma
SELECT * FROM dbo.payroll_runs WITH (NOLOCK);
SELECT * FROM dbo.employees    WITH (NOLOCK);
```

`WITH (NOLOCK)` ne obide RLS — to dela samo `sysadmin` vloga. Za navadnega
`eplace_admin` je edina pot skozi `SESSION_CONTEXT`.

---

## 5. Zakaj je varno pred SQL Injection

### Kaj je SQL Injection?

SQL Injection je napad, kjer napadalec v vnosno polje vstavi SQL kodo namesto normalnega
podatka. Primer:

```
Vnosno polje Email: admin@a.si' OR '1'='1
```

Če backend sestavi query z string concatenation:

```javascript
// RANLJIVO — nikoli tako!
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Postane:
// SELECT * FROM users WHERE email = 'admin@a.si' OR '1'='1'
// Vrne VSE uporabnike!
```

### Kako ePlače 2026 preprečuje SQL Injection

#### 1. Parametrizirani queriji (parameterized queries)

Ves backend SQL uporablja `mssql` parametre:

```typescript
// backend/src/repositories/payroll.repo.ts
const req = new sql.Request(tx);
req.input('tenantId', sql.UniqueIdentifier, tenantId);
req.input('leto',     sql.Int, leto);
req.input('mesec',    sql.Int, mesec);
req.input('datum',    sql.Date, datumIzplacila);

await req.query(`
  INSERT INTO dbo.payroll_runs (tenant_id, leto, mesec, datum_izplacila, status_obracuna)
  OUTPUT INSERTED.*
  VALUES (@tenantId, @leto, @mesec, @datum, 'Procesiranje')
`);
```

**Zakaj je to varno:**

Ko uporabiš `.input('leto', sql.Int, vrednost)`, SQL Server **loči SQL kodo od podatkov**
na nivoju protokola (TDS — Tabular Data Stream). Vrednost nikoli ne gre skozi SQL parser
— gre direktno kot binarni podatek v prepared statement.

Četudi napadalec pošlje:
```
leto: "2026; DROP TABLE employees; --"
```

SQL Server to vrednost ne bo nikoli interpretiral kot SQL. Ker je parameter tipa `sql.Int`,
bo poskus shranitve stringa vrgel type error še preden pride do baze.

#### 2. Tipi parametrov zagotavljajo validacijo

```typescript
sql.UniqueIdentifier  // mora biti veljaven UUID format
sql.Int               // mora biti celo število
sql.Date              // mora biti veljavni datum
sql.NVarChar(500)     // omejena dolžina stringa
sql.Decimal(10,2)     // mora biti numerična vrednost
```

Vsak parameter ima ekspliciten tip. Napačen tip = napaka, ne SQL injection.

#### 3. RLS kot zadnja obrambna linija

Celo če bi napadalec nekako zaobšel backend in dostopal direktno do baze z veljavnim
računom, bi RLS preprečil dostop do podatkov brez pravilnega `tenant_id` konteksta.

To je **obramba v globino** (defense in depth):

```
Sloj 1: Frontend validacija (Angular Validators)
Sloj 2: Backend validacija (Express middleware)
Sloj 3: Parametrizirani queriji (preprečijo SQL injection)
Sloj 4: JWT avtentikacija (vsak request mora imeti veljaven token)
Sloj 5: RLS v bazi (celo z dostopom do baze vidiš samo svoje podatke)
```

#### 4. SESSION_CONTEXT je readonly po nastavitvi

```typescript
await setup.query(
  `EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0`
);
```

Parameter `@readonly=0` pomeni, da je kontekst mogoče nastaviti samo enkrat na sejo.
Po nastavitvi ga nobena koda v transakciji ne more spremeniti. Napadalec, ki bi vbrizgal
SQL v query znotraj transakcije, ne bi mogel spremeniti `tenant_id` konteksta in dostopati
do podatkov drugega tenanta.

---

## 6. Celoten tok od prijave do podatka

```
1. PRIJAVA
   POST /api/v1/auth/login { email, password }
   → backend preveri geslo (bcrypt hash v bazi)
   → ustvari JWT token s payload: { userId, tenantId, email, vloga }
   → vrne token klientu

2. ZAŠČITEN REQUEST
   GET /api/v1/payroll/runs
   Authorization: Bearer <JWT>
   → authMiddleware preveri JWT podpis
   → iz payloada vzame tenantId
   → nastavi req.user.tenantId

3. CONTROLLER
   payrollRouter.get('/runs', async (req, res) => {
     const runs = await getPayrollRuns(req.user.tenantId);
     res.json(runs);
   })

4. REPOSITORY
   export async function getPayrollRuns(tenantId: string) {
     return withTenant(tenantId, async (tx) => {
       return tx.request().query('SELECT * FROM payroll_runs ORDER BY ustvarjen_ob DESC');
     });
   }

5. withTenant() v db.ts
   - Odpre transakcijo
   - Nastavi SESSION_CONTEXT 'tenant_id' = tenantId
   - Izvede fn(transaction)
   - Committa transakcijo

6. SQL SERVER
   SELECT * FROM payroll_runs ORDER BY ustvarjen_ob DESC
   → Za vsako vrstico: fn_securitypredicate(vrstica.tenant_id)
   → SESSION_CONTEXT('tenant_id') = '11111111-...'
   → Vrne samo vrstice tega tenanta
   → Rezultat: filtriran seznam

7. RESPONSE
   JSON array → klient
```

---

## 7. Pogosta vprašanja

### Ali bi drugi tenant lahko videl moje podatke z pravilnim URL-jem?

Ne. JWT token vsebuje `tenantId` in je podpisan s skrivnostjo (`JWT_SECRET`). Brez
skrivnosti ni mogoče falsificirati tokena z drugim `tenantId`. Celo z veljavnim JWT drugega
tenanta, bi RLS v bazi filtriral vrstice — ker `SESSION_CONTEXT` dobi vrednost direktno
iz preverjenega tokena, ne iz URL parametra ali requestnega body.

### Zakaj tenants tabela nima RLS filtra?

```sql
-- tenants NIMA filter predikata
-- samo BLOCK za INSERT/UPDATE
```

Ker backend za autentikacijo (login) mora prebrati tenant podatke **preden** ima JWT
token — torej preden pozna `tenantId`. Če bi bil filter na `tenants`, se nihče ne bi
mogel prijaviti.

### Kaj se zgodi, če nastavim napačen tenant_id kontekst?

```sql
EXEC sp_set_session_context N'tenant_id', 'napačen-uuid';
SELECT * FROM payroll_runs; -- vrne 0 vrstic
```

Vrne 0 vrstic. Ni napake. RLS tiho filtrira vse, ker nobena vrstica ne ustreza
napačnemu UUID. To je načrtno — sistem ne razkrije, kateri tenant_id-ji obstajajo.

### Zakaj `WITH (NOLOCK)` ne pomaga za eplace_admin?

`WITH (NOLOCK)` (NOLOCK hint) preskakuje **zaklepanja** (locks), ne RLS. RLS deluje na
nivoju varnostne politike, ki se aplicira pred vrnitvijo katerekoli vrstice, ne glede
na locking strategijo. Edini način za obid RLS je `sysadmin`/`db_owner` vloga ali
`ALTER SECURITY POLICY ... WITH (STATE = OFF)` — slednje zahteva DDL pravice.

### Kako preverim ali RLS deluje pravilno?

```sql
-- Z kontekstom (vidim podatke)
DECLARE @tid NVARCHAR(36);
SELECT TOP 1 @tid = CAST(id AS NVARCHAR(36)) FROM dbo.tenants;
EXEC sp_set_session_context N'tenant_id', @tid;
SELECT COUNT(*) AS z_kontekstom FROM dbo.employees; -- npr. 5

-- Brez konteksta (nova seja) → 0
SELECT COUNT(*) AS brez_konteksta FROM dbo.employees; -- 0
```

Razlika med obema rezultatoma potrjuje, da RLS deluje.

---

*Dokumentacija generirana za projekt ePlače 2026 — Azure SQL + Node.js + Angular*
