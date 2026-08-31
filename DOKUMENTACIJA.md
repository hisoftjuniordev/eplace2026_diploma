# ePlače 2026 — Celotna tehnična dokumentacija

Referenčni dokument za vse koncepte, terminologijo, funkcionalnosti in implementacijske odločitve
v aplikaciji ePlače 2026. Organiziran od baze navzgor: baza → backend → frontend.

---

## Kazalo

1. [Splošni koncepti](#1-splošni-koncepti)
2. [Baza podatkov](#2-baza-podatkov)
3. [Varnostni sistem](#3-varnostni-sistem)
4. [Backend — Express API](#4-backend--express-api)
5. [Obračunski mehanizem](#5-obračunski-mehanizem)
6. [Asinhrona obdelava (BullMQ)](#6-asinhrona-obdelava-bullmq)
7. [Izvozni formati](#7-izvozni-formati)
8. [Frontend — Angular](#8-frontend--angular)
9. [Terminološki slovar](#9-terminološki-slovar)

---

## 1. Splošni koncepti

### Multi-tenant arhitektura

Aplikacija je **multi-tenant** — ena instanca programa (en backend, ena baza) strežuje
več ločenim podjetjem hkrati. Vsako podjetje je **tenant**. Podatki vsakega tenanta so
popolnoma izolirani od ostalih, čeprav fizično živijo v istih tabelah.

Izolacija ni dosežena s ločenimi bazami ali shemami, temveč z **Row-Level Security (RLS)**
na nivoju SQL Serverja. Vsaka vrstica v vsaki tabeli vsebuje stolpec `tenant_id`
(UNIQUEIDENTIFIER / UUID), ki jo poveže z lastnikom.

Zakaj tako? Enostavnejše upravljanje infrastrukture, enotna baza kode, enostavne
migracije. Kompromis je kompleksnejši varnostni sloj — a ta je implementiran enkrat in
deluje transparentno za ves ostali kod.

### SaaS (Software as a Service)

Aplikacija je zamišljena kot spletna storitev, ki jo podjetja uporabljajo prek brskalnika.
Ni lokalne namestitve, ni licenčnih ključev. Vsako podjetje se prijavi s svojimi poverilnicami
in dela v svojem izoliranem prostoru znotraj skupne aplikacije.

### UUID kot primarni ključ

Vse tabele uporabljajo `UNIQUEIDENTIFIER` (UUID v4) kot primarni ključ namesto
avto-inkrementnih celih števil. To je standardna praksa za multi-tenant sisteme ker:
- IDs so enolični globalno, ne samo znotraj tabele — ni kolizij pri merge-u podatkov
- Ni potrebe po centraliziranem generatorju ID-jev (SQL Server generira z `NEWID()`)
- IDs v URL-jih ne razkrivajo zaporedja (varnostna prednost)

---

## 2. Baza podatkov

### Platforma: Azure SQL

Baza teče na **Azure SQL** (Microsoft-ova oblačna verzija SQL Serverja). Lokalno
razvoj teče na MS SQL Serverju v Dockerju ali Windows instanci. Sintaksa je identična —
isti SQL skripti delujejo povsod.

Zakaj SQL Server in ne PostgreSQL ali MySQL? Ker ima SQL Server vgrajeno podporo za
**Row-Level Security**, **Temporal Tables** in **UNIQUEIDENTIFIER** tip — vse tri
ključne funkcionalnosti aplikacije.

### Tabele

#### `dbo.tenants` — podjetja

Koren multi-tenant hierarhije. Vsaka vrstica je eno podjetje. Vsebuje:
- `naziv_podjetja` — ime podjetja
- `davcna_stevilka` — 8-mestna davčna številka (UNIQUE, CHECK constraint)
- `maticna_stevilka` — 10-mestna matična številka
- `iban` — bančni račun podjetja (za SEPA nakazila)

Tabela **nima RLS filtra** (razloženo v poglavju 3).

#### `dbo.users` — administratorji

Uporabniški računi za prijavo v aplikacijo. Vsak user je vezan na točno enega tenanta
(`tenant_id` FK). Geslo je shranjeno kot **bcrypt hash** — nikoli v čistem tekstu.

Vloge (`vloga`): `SistemskiAdmin`, `Skrbnik`, `Uporabnik`. Vloga določa katera dejanja
sme uporabnik izvajati (RBAC — Role-Based Access Control).

#### `dbo.employees` — zaposleni

Centralna tabela. Vsak delavec vsebuje vse podatke potrebne za obračun plač:
- **Osebni podatki**: ime, priimek, davčna številka (8 mest), EMŠO (13 mest), naslov
- **Bančni podatki**: TRR (IBAN format) za nakazilo plače
- **Plačni način**: `bruto_osnova` (fiksna mesečna bruto plača) ali `urna_postavka`
  (urna postavka za parametrični obračun)
- **Davčni parametri**: `a004_rezident` (R/N), `a014_invalid_nad_kvoto`,
  `a017_starost_60_let`, `a031_zavezanec_ozp`, `glavni_delodajalec`,
  `olajsava_vzdrzevani_znesek`
- **Boniteta za vozilo**: `b014_has_vozilo`, `b014_vozilo_nv` (nabavna vrednost),
  `b014_vozilo_gorivo`, `b014_vozilo_el`
- **Status**: `aktivno` (mehko brisanje — deaktivacija namesto fizičnega brisanja)

Tabela je **Temporal** (System-Versioned) — vsaka sprememba se samodejno arhivira
v `dbo.employees_History`. Mogoče je videti kakšne podatke je imel delavec kadar koli v
preteklosti.

#### `dbo.job_positions` — delovna mesta

Katalog delovnih mest s tarifnim razredom (1–9) in zahtevano izobrazbo. Vezana na tenanta.
Tudi Temporal tabela — vsaka sprememba se hrani v `dbo.job_positions_History`.

#### `dbo.monthly_hours` — mesečne ure

Za vsakega delavca in vsak mesec (leto + mesec) se vnesejo ure dela:
- `m01_redno_ure` — redne delovne ure
- `m02_refund_ure` — refundirane ure (odsotnost, ki jo krije drug vir)
- `m03_nadure_ure` — nadure (30% dodatek po ZDR-1)
- `m04_dopust_ure` — ure letnega dopusta (100% nadomestilo)
- `m05_bolniske_ure` — bolniške ure (80% nadomestilo, breme delodajalca do 30 dni)
- `m07_preh_dnevi` — dnevi prisotnosti (za izračun povračila prehrane)
- `m07_prevoz_km` — razdalja od doma do dela v km (za izračun prevoza)
- `odtegljaji_kred` — mesečni odtegljaj za kredite/posojila

Unikatni indeks `(employee_id, leto, mesec)` preprečuje dvojni vnos za isti mesec.

Če za delavca in mesec **ni vnesene vrstice**, worker privzame 174 delovnih ur in 0
za vse ostale vrednosti.

#### `dbo.payroll_runs` — obračuni

En obračun = en mesec za enega tenanta. Vsebuje:
- `leto`, `mesec` — obdobje obračuna
- `datum_izplacila` — datum nakazila plač
- `status_obracuna` — `Osnutek` → `Procesiranje` → `Zakljucen` | `Napaka`
- `progress_procent` — 0–100%, posodablja ga worker med izračunom
- `napaka_opis` — opis napake če worker pade

Unikatni indeks `(tenant_id, leto, mesec)` preprečuje dva obračuna za isti mesec.

#### `dbo.payroll_lines` — plačilne liste

Ena vrstica = izračunana plača enega delavca v enem obračunu. To je **rezultat**
`SlovenianPayrollEngine`. Vsebuje vse vmesne izračune:
bruto1, vse prispevke delavca (a071–a074), davčno osnovo, dohodnino, neto, OZP,
povračila, končno izplačilo, ter prispevke delodajalca (a081–a086) in bruto2.

FK na `payroll_runs` ima `ON DELETE CASCADE` — ko izbrišeš obračun, se izbrišejo
vse plačilne liste tega obračuna samodejno.

#### `dbo.payroll_params` — parametri obračuna

Tabela ključ-vrednost za vse zakonsko določene parametre:
stopnje prispevkov, dohodninska lestvica (JSON), minimalna plača, meje za
povračila. Vsak parameter ima `veljavno_od` in `veljavno_do` — ob spremembi
zakonodaje se doda nova vrstica, stara ostane za zgodovinske obračune.

Dohodninska lestvica je shranjena kot JSON string v polju `vrednost`, backend jo
parsira pri vsakem obračunu.

#### `dbo.audit_logs` — revizijska sled

Vsaka operacija (BRANJE, VNOS, POPRAVEK, BRISANJE, IZVOZ) se zabeleži z:
uporabnikovim emailom, vrsto akcije, entiteto, opisom, IP naslovom in časom.
Namenjena je pregledu kdo je kdaj kaj naredil.

### Temporal Tables (System-Versioned)

SQL Server funkcionalnost ki samodejno arhivira staro vrednost vsake vrstice ob
vsaki spremembi. Tabeli `employees` in `job_positions` sta temporal.

Ko spremenišdelavčevo bruto osnovo, SQL Server:
1. Vnese novo vrednost v glavno tabelo
2. Prenese staro vrednost v `_History` tabelo z `SysEndTime` = trenutek spremembe

To je implementirano z:
```sql
SysStartTime DATETIME2 GENERATED ALWAYS AS ROW START NOT NULL,
SysEndTime   DATETIME2 GENERATED ALWAYS AS ROW END   NOT NULL,
PERIOD FOR SYSTEM_TIME (SysStartTime, SysEndTime),
WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.employees_History));
```

Zakaj? Ker plačilni sistem mora vedeti, kakšne podatke je imel delavec v točno
določenem trenutku — ob obračunu za januar. Brez temporal tabel bi bila ta informacija
izgubljena ob naslednji spremembi.

### Mehko brisanje (Soft Delete)

Delavci in delovna mesta se nikoli fizično ne brišejo iz baze. Namesto tega se nastavi
`aktivno = 0`. Vsi queriji filtrirajo `WHERE aktivno = 1`. Podatki ostanejo za
revizijske namene in za zgodovino obračunov.

---

## 3. Varnostni sistem

### JWT (JSON Web Token)

Po uspešni prijavi (email + bcrypt preverjanje gesla) backend ustvari **JWT token**
podpisan s `JWT_SECRET`. Token vsebuje:
- `sub` — userId
- `tenantId` — UUID tenanta
- `email`, `ime`, `priimek`
- `vloga` — `SistemskiAdmin`, `Skrbnik` ali `Uporabnik`
- `iat` — čas izdaje, `exp` — čas poteka (8 ur)

Token se pošlje klientu, ki ga shrani in priloži vsakemu requestu v headeru:
`Authorization: Bearer <token>`.

Backend ne hrani tokenov — avtentikacija je **stateless**. Ob vsakem requestu
`authMiddleware` preveri podpis tokena z `JWT_SECRET`. Če je veljaven, nastavi
`req.user` s payload podatki. Ni poizvedb v bazo za avtentikacijo.

### RBAC (Role-Based Access Control)

Poleg JWT avtentikacije ima vsak endpoint lahko zahtevo po določeni vlogi:

```typescript
payrollRouter.post('/runs', requireRole('Skrbnik', 'SistemskiAdmin'), ...)
```

`Uporabnik` — branje podatkov (delavci, ure)
`Skrbnik` — vse, vključno z obračunom, izvozom, urejanjem
`SistemskiAdmin` — administrativni dostop čez vse

### Parametrizirani SQL queriji

Vse SQL poizvedbe v repozitorijih so parametrizirane z `mssql` knjižnico:

```typescript
req.input('tenantId', sql.UniqueIdentifier, tenantId);
req.input('leto',     sql.Int, leto);
await req.query(`SELECT * FROM payroll_runs WHERE tenant_id = @tenantId AND leto = @leto`);
```

Vrednosti **nikoli** ne gredo skozi SQL parser — gredo kot binarni podatki v
prepared statement. SQL Injection je strukturno nemogoč, ne samo ublažen.

### Row-Level Security (RLS)

Vgrajeni SQL Server mehanizem ki samodejno filtrira vrstice na nivoju baze.
Podrobna razlaga je v `RLS_RAZLAGA.md`. Povzetek:

**Predicate funkcija** za vsako vrstico primerja `tenant_id` vrstice z vrednostjo
v `SESSION_CONTEXT('tenant_id')`. Vrstice kjer se ne ujemata so tiho izpuščene.

**SESSION_CONTEXT** nastavi backend na začetku vsake transakcije z `tenantId`
iz JWT tokena. Baza nikoli ne dobi "golo" poizvedbo brez konteksta iz aplikacije.

**BLOCK predicate** preprečuje vstavljanje vrstic z napačnim `tenant_id` — niti
pisanje v tuji tenant ni mogoče.

**Obramba v globino**: celo z veljavnim JWT tokena drugega tenanta ne moraš videti
njihovih podatkov — RLS v bazi je zadnja obrambna linija.

### bcrypt

Gesla so hashirana z bcrypt (cost factor 10) pred shranjevanjem. bcrypt je
namerno počasen algoritem — brute force napadi na ukradeno bazo so nepraktični.
Ni mogoče "razkodirati" geslа — samo preveriti, ali se ujema s hashom.

### Zod validacija

Vsi POST/PUT endpointi validirajo vhodne podatke z Zod shemami pred obdelavo.
Napačen tip, manjkajoče polje ali prekoračena meja → `400 Bad Request` preden
se podatki dotaknejo baze.

---

## 4. Backend — Express API

### Arhitektura v plasteh

Backend je organiziran v štiri plasti:

**Controllers** (`src/controllers/`) — HTTP sloj. Prejmejo request, ga validirajo,
pokličejo repozitorij, vrnejo response. Ne vsebujejo poslovne logike.

**Repositories** (`src/repositories/`) — SQL sloj. Vsebujejo parametrizirane
SQL poizvedbe. Vedno operirajo znotraj `withTenant()` helperja.

**Engine** (`src/engine/`) — poslovna logika. `SlovenianPayrollEngine` izračuna
plačo brez vednosti o bazi ali HTTP sloju.

**Workers** (`src/workers/`) — asinhrona obdelava. BullMQ worker ki pokliče engine
in shrani rezultate.

### `withTenant()` helper

Srce večinskega dostopa do baze:

```typescript
export async function withTenant<T>(tenantId: string, fn: (tx: sql.Transaction) => Promise<T>): Promise<T> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const setup = new sql.Request(transaction);
    setup.input('tenantId', sql.UniqueIdentifier, tenantId);
    await setup.query(`EXEC sp_set_session_context @key=N'tenant_id', @value=@tenantId, @readonly=0`);
    const result = await fn(transaction);
    await transaction.commit();
    return result;
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}
```

Vsak klic: odpre transakcijo → nastavi RLS kontekst → izvede funkcijo →
committa. Ob napaki rollback. Garancija atomičnosti za vse operacije.

### Connection pool (mssql)

Backend vzdržuje **pool** odprtih TCP povezav do baze (max 10, min 0).
Ko pride request, vzame prosto povezavo iz poola, jo po končani transakciji
vrne nazaj. Ni stroškov vzpostavljanja nove TCP povezave za vsak request.

### `express-async-errors`

Middleware ki "ujame" neobravnavane napake iz async funkcij in jih preda globalnemu
error handlerju. Brez tega bi neobravnavana `Promise` zavrnitev crashala Node.js
proces.

### Health endpoint

```
GET /health → { "status": "ok", "time": "..." }
```

Railway ga uporablja za liveness check — če endpoint ne odgovori, Railway
restarta container.

---

## 5. Obračunski mehanizem

### SlovenianPayrollEngine

Samostojen razred (`src/engine/slovenian-payroll-engine.ts`) brez odvisnosti od
baze ali HTTP sloja. Prejme `IPayrollInput` in `IPayrollParams`, vrne `IPayrollResult`.

Vsi izračuni tečejo z `bignumber.js` knjižnico z 10 decimalnimi mesti in
`ROUND_HALF_UP` zaokroževanjem. Floating point aritmetika v JavaScriptu (`0.1 + 0.2 = 0.30000000000000004`)
je za plačilni sistem nesprejemljiva — `bignumber.js` zagotavlja natančnost.

### Način A — Fiksni bruto

Ko delavec nima `urna_postavka` (vrednost `null`), se obračun izvede z **fiksno
mesečno bruto osnovo** (`bruto_osnova`).

Če delavec dela manj ur od polnega meseca (168 ur), se bruto proporcionalno
zmanjša (pro-rata):
```
bruto = bruto_osnova × (m01_redno_ure / 168)
```

Nadure se izračunajo iz izpeljane urne postavke:
```
urna = bruto_osnova / 168
nadure = urna × nadure_ure × 1.30
```

### Način B — Parametrični (urna postavka)

Ko delavec ima `urna_postavka > 0`, se bruto izračuna iz ur:
```
redno      = urna_postavka × m01_ure × 1.00   (DOP_FAKTOR)
dopust     = urna_postavka × m04_ure × 1.00   (dopust = 100%)
bolniška   = urna_postavka × m05_ure × 0.80   (bolniška = 80%)
nadure     = urna_postavka × m03_ure × 1.30   (nadure = 130%)
bruto1     = redno + dopust + bolniška + nadure
```

Preverba minimalne plače: če `bruto1 < minimalna_plača × (ure/168)`, worker vrže
napako in obračun dobi status `Napaka`.

### Boniteta za vozilo (B014)

Kadar delavec uporablja službeno vozilo za zasebne namene, je to obdavčljiva
boniteta po ZDoh-2 (B014). Izračun:
```
boniteta = nabavna_vrednost × stopnja
stopnja = 1.75% (z gorivom) ali 1.50% (brez goriva)
```
Električna vozila so izvzeta (`b014_vozilo_el = true` → boniteta = 0).

Boniteta se prišteje k bruto1 pred izračunom prispevkov.

### Prispevki delavca

Vsi se izračunajo iz `bruto1` (ki vključuje boniteto in nadure):

| Koda | Opis | Stopnja 2026 |
|---|---|---|
| a071 | PIZ (pokojninsko) | 15,50 % |
| a072 | ZZ (zdravstveno) | 6,36 % |
| a074 | ZAP (brezposelnost) | 0,14 % |
| a073 | STAR (starševsko) | 0,10 % |
| a072b | DO (dolgotrajna oskrba) | 1,00 % |

### Olajšave

**Splošna olajšava** (416,67 € mesečno) se odšteje od davčne osnove samo če je
delavec pri tem delodajalcu `glavni_delodajalec = true`. Pri sekundarnih
zaposlitvah olajšave ni.

**Olajšava za vzdrževane** (`olajsava_vzdrzevani_znesek`) — znesek za vzdrževane
družinske člane, nastavi se ročno na delavcu.

### Davčna osnova in dohodnina

```
davčna_osnova = bruto1 − skupaj_prispevki_delavca − olajšave
```

Dohodnina se izračuna po **progresivni lestvici** (5 razredov, 16%–50%).
Lestvica je shranjena kot JSON v `payroll_params` in se nanese glede na
mesečno davčno osnovo.

```
razred 1:  0–728,31 €      → 16%
razred 2:  728,31–1260,40  → 116,53 € + 26% od presežka
razred 3:  1260,40–2083,33 → 254,87 € + 33% od presežka
razred 4:  2083,33–6416,67 → 526,43 € + 39% od presežka
razred 5:  nad 6416,67     → 2216,43 € + 50% od presežka
```

### OZP (obvezno zdravstveno prispevanje)

Fiksni mesečni odtegljaj 35,00 € ki se odšteje od neta. Nastavljiv v
`payroll_params`. Velja samo za `zavezanec_ozp = true`.

### Povračila (neto dodatki)

Prehrana in prevoz sta **neto dodatka** — ne vstopata v bruto, ne vplivata
na prispevke ali dohodnino.

```
prehrana = preh_dnevi × 7,96 €   (davčna meja)
prevoz   = prevoz_km × 0,21 €    (davčna meja)
```

Znesek nad davčno mejo bi bil obdavčljiv — aplikacija pri tem ne opravlja
posebne validacije, predpostavlja se da so vnosi v mejah.

### Prispevki delodajalca (Bruto 2)

Delodajalec plača dodatne prispevke na bruto1, ki niso vidni v delavčevi plačilni
listi ampak so del stroškov za delodajalca:

| Koda | Opis | Stopnja 2026 |
|---|---|---|
| a081 | PIZ delodajalec | 8,85 % |
| a083 | ZZ delodajalec | 6,56 % |
| a084 | ZAP delodajalec | 0,06 % |
| a085 | STAR delodajalec | 0,10 % |
| a086 | Poškodbe pri delu | 0,53 % |
| a082 | DO delodajalec | 1,00 % |

```
bruto2_strosek = bruto1 + skupaj_prispevki_delodajalca
```

To je **skupni strošek delavca za delodajalca** — prikazano v plačilni listi
kot informativni podatek.

### Parametri obračuna — časovna veljavnost

Vse stopnje prispevkov so v tabeli `payroll_params` z `veljavno_od`. Backend
pri vsakem obračunu prebere **parametre, ki so veljali na dan začetka meseca
obračuna** — ne nujno trenutne. To zagotavlja, da je retrospektivni preračun
julija za januar pravilen, čeprav so se stopnje v medčasu spremenile.

---

## 6. Asinhrona obdelava (BullMQ)

### Zakaj asinhrono?

Obračun plač za 100 delavcev traja sekunde. HTTP request ne sme čakati toliko časa
— browser bi timeout-al, reverse proxy vrnil 504. Rešitev: **asinhrona obdelava**.

Backend takoj vrne `HTTP 202 Accepted` z ID-jem obračuna. Frontend polling vsake
500ms preverja status. Ko je obračun zaključen, prikaže rezultate.

### BullMQ + Redis

**BullMQ** je knjižnica za upravljanje job queues. Jobi (naloge) so shranjeni v
**Redis** (in-memory baza) kot seznam. Worker(ji) jemljejo jobe iz liste in jih
obdelujejo.

Zakaj Redis in ne kar Node.js `setTimeout`? Redis je persistenten — ce se backend
restarta med obdelavo, job ni izgubljen. Prav tako omogoča porazdelitev
workerjev na več procesov/strežnikov.

### Tok obračuna

```
POST /payroll/runs
  → createPayrollRun()     ustvari vrstico status='Procesiranje'
  → payrollQueue.add()     doda job v Redis
  → res.status(202).json() vrne takoj

Worker (async):
  → transaction.begin()
  → sp_set_session_context  nastavi RLS
  → getEmployeesForWorker()  prebere aktivne delavce
  → za vsakega delavca:
      getMonthlyHoursForWorker()
      engine.calculate()
      insertPayrollLine()
      updatePayrollProgressDirect()  posodobi % napredka
  → completePayrollRun()   status='Zakljucen', progress=100
  → transaction.commit()
```

### Job retry

BullMQ je konfiguriran z `attempts: 3` in eksponentnim backoffom (`2s, 4s, 8s`).
Če worker pade, se job poskusi do 3-krat. Po vseh neuspelih poskusih se obračun
označi z `status='Napaka'` in `napaka_opis` z opisom napake.

### Worker teče v istem procesu

Worker je importiran direktno v `app.ts`:
```typescript
import './workers/payroll.worker';
```

To pomeni, da ko Railway zažene `node dist/app.js`, se hkrati zagotavlja API
strežnik IN BullMQ worker. Ni ločenega procesa. Kompromis: CPU-intensivni obračuni
vplivajo na latency API-ja. Za produkcijsko uporabo z veliko tenanti bi worker
tekel ločeno.

---

## 7. Izvozni formati

### SEPA XML (pain.001.001.03)

Standardiziran format za plačilne naloge v evro območju (ISO 20022). Banka
uvozi ta XML in avtomatično izvede vsa nakazila.

Struktura: en `CstmrCdtTrfInitn` (Customer Credit Transfer Initiation) z:
- `GrpHdr` — glava z datumom, skupnim zneskom, številom nakazil
- `PmtInf` — plačilni blok z IBAN delodajalca
- `CdtTrfTxInf` — en element na delavca z njihovim IBAN-om, imenom in zneskom

Skupni znesek je vsota `koncno_izplacilo_trr` za vse delavce obračuna.

### VOD XML

Obrazec za FURS (Finančna uprava RS) — vrstični obračun dohodkov iz delovnega
razmerja. Vloži ga delodajalec za vsak mesec.

Vsebuje za vsakega delavca:
- Davčno številko, EMŠO
- Vrsto dohodka, bruto osnovo
- Vse prispevke delavca in delodajalca
- Akontacijo dohodnine

### REK-O XML

Rekapitulacijski obračun prispevkov za FURS. Seštevek po obračunu:
skupni bruto, skupna dohodnina, skupni prispevki. En dokument za en obračun
(ne po delavcu).

### Generiranje XML

Vse tri XML datoteke generira `xmlbuilder2` knjižnica, ki gradi DOM strukturo
programsko. Rezultat je validiran XML string ki se pošlje klientu kot
`Content-Type: application/xml` z ustreznim imenom datoteke.

---

## 8. Frontend — Angular

### Angular 17 — Standalone Components

Frontend je zgrajen z Angular 17 z **standalone** komponentami — vsaka komponenta
importira svoje odvisnosti direktno, brez NgModulov. To pomeni manjše bundle-e,
jasnejše odvisnosti in lažje lazy loading.

```typescript
@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `...`,
})
```

### Signals

Angular 17 uvaja **signals** — reaktivni primitiv za state management brez RxJS.
Signal je vrednost, ki ob spremembi samodejno obvesti vse, ki jo berejo.

```typescript
loading = signal(true);
employees = signal<Employee[]>([]);

// V template-u:
*ngIf="loading()"          // signal se pokliče kot funkcija
*ngFor="let e of employees()"
```

Aplikacija uporablja signals povsod kjer je mogoče namesto `BehaviorSubject`
ali navadnih property-jev.

### Computed signals

Izpeljane vrednosti, ki se samodejno posodobijo ko se signal od katerega so
odvisne, spremeni:

```typescript
totalBruto = computed(() => this.lines().reduce((s, l) => s + l.bruto_1, 0));
```

Ko se `lines` signal posodobi, se `totalBruto` samodejno izračuna znova.

### Lazy loading

Vsaka stran se naloži šele ko uporabnik navigira na njo:

```typescript
{
  path: 'employees',
  loadComponent: () => import('./features/employees/list.component')
                         .then(m => m.EmployeeListComponent),
}
```

Začetni bundle je majhen, vsaka stran se dotoži po potrebi.

### AuthService

Singleton servis ki hrani JWT token v `localStorage` in izpostavlja:
- `user()` — signal z dekodiranim JWT payload
- `isLoggedIn()` — `true` ce token obstaja in ni potekel
- `isSkrbnik()` — `true` ce vloga >= Skrbnik
- `logout()` — pobriše token, preusmeri na login

### HTTP interceptor

Vsi HTTP klici gredo skozi Angular `HttpClient`. `authMiddleware` na backendu
zahteva `Authorization: Bearer <token>` header — Angular ga avtomatično doda
vsem requestom (interceptor je konfiguriran v `app.config.ts`).

### Reactive Forms

Forme za delavce in obračun uporabljajo `ReactiveFormsModule` z `FormBuilder`.
Validacija (required, email format, min/max vrednosti) je deklarativna:

```typescript
form = this.fb.group({
  email:    ['', [Validators.required, Validators.email]],
  bruto_osnova: [0, [Validators.required, Validators.min(0.01)]],
});
```

Gumbi za submit so onemogočeni dokler forma ni veljavna (`[disabled]="form.invalid"`).

### Polling za napredek obračuna

Ko je obračun sprožen, frontend vsakih 500ms preverja status:

```typescript
interval(500).pipe(
  switchMap(() => this.http.get<PayrollRun>(`${API}/payroll/runs/${this.runId}`)),
  tap((r) => this.run.set(r)),
  takeWhile((r) => r.status_obracuna === 'Procesiranje', true)
).subscribe(r => {
  if (r.status_obracuna === 'Zakljucen') this.loadLines();
});
```

`switchMap` prekliče prejšnji HTTP request preden pošlje novega.
`takeWhile(..., true)` (inclusive) emitira zadnjič ko se status ne ujema in
se odjavi. `tap` posodablja signal za prikaz v template-u.

### Tailwind CSS

Vsi stili so pisani z **Tailwind CSS** utility razredi direktno v template-u.
Ni ločenih CSS datotek za komponente. `bg-blue-600`, `text-sm`, `rounded-md` so
Tailwind razredi ki se prevedejo v minimalni CSS bundle.

---

## 9. Terminološki slovar

| Izraz | Razlaga |
|---|---|
| **Tenant** | Podjetje/organizacija v multi-tenant sistemu |
| **UUID / UNIQUEIDENTIFIER** | 128-bitni globalno enolični identifikator (npr. `11111111-...`) |
| **JWT** | JSON Web Token — podpisan žeton za avtentikacijo brez seje |
| **RBAC** | Role-Based Access Control — dostop glede na vlogo |
| **RLS** | Row-Level Security — filtriranje vrstic na nivoju baze |
| **SESSION_CONTEXT** | Začasni slovar ključ-vrednost za eno SQL sejo |
| **Temporal Table** | SQL Server tabela ki samodejno arhivira zgodovino sprememb |
| **Soft Delete** | Deaktivacija namesto fizičnega brisanja (`aktivno = 0`) |
| **BullMQ** | Job queue knjižnica za Node.js, temelji na Redis |
| **Worker** | Proces ki asinhrono obdeluje jobe iz queue |
| **Connection Pool** | Skupek odprtih DB povezav za recikliranje |
| **Parametrizirani query** | SQL z `@parametri` namesto string concatenation |
| **Bruto 1** | Bruto plača delavca (osnova za prispevke) |
| **Bruto 2** | Skupni strošek delodajalca (Bruto 1 + prispevki delodajalca) |
| **Neto** | Izplačilo po odštetih prispevkih in dohodnini |
| **OZP** | Obvezno zdravstveno prispevanje — fiksni 35 € odtegljaj |
| **PIZ** | Pokojninsko in invalidsko zavarovanje |
| **ZZ** | Zdravstveno zavarovanje |
| **ZAP** | Zavarovanje za primer brezposelnosti |
| **STAR** | Starševsko varstvo |
| **DO** | Dolgotrajna oskrba |
| **B014** | Šifra za boniteto (službeno vozilo) po Zakonu o dohodnini |
| **Pro-rata** | Proporcionalen izračun glede na dejansko število ur |
| **Davčna osnova** | Osnova za dohodnino: Bruto1 − prispevki − olajšave |
| **Progresivna lestvica** | Dohodninsa lestvica z naraščajočimi stopnjami |
| **Splošna olajšava** | 416,67 €/mesec ki zmanjša davčno osnovo |
| **Glavni delodajalec** | Delodajalec kjer delavec uveljavlja olajšave |
| **SEPA XML** | Standard za plačilne naloge v EU (ISO 20022 pain.001.001.03) |
| **VOD** | Vrstični obračun dohodkov — obrazec za FURS |
| **REK-O** | Rekapitulacijski obračun — seštevek za FURS |
| **FURS** | Finančna uprava Republike Slovenije |
| **Signal (Angular)** | Reaktivni primitiv za state management |
| **Computed signal** | Signal ki se izpelje iz drugega signala |
| **Standalone component** | Angular komponenta brez NgModule |
| **Lazy loading** | Nalaganje kode šele ob navigaciji na stran |
| **Polling** | Periodično preverjanje stanja (vsake 500ms) |
| **TDS** | Tabular Data Stream — protokol za SQL Server |
| **bcrypt** | Počasen hash algoritem za gesla |
| **Zod** | TypeScript-first validacijska knjižnica |
| **bignumber.js** | Knjižnica za decimalno aritmetiko brez floating point napak |
| **xmlbuilder2** | Node.js knjižnica za generiranje XML |
| **Railway** | Cloud hosting platforma za backend (temelji na Docker/Nixpacks) |
| **Vercel** | Hosting platforma za Angular frontend (CDN, edge network) |
| **Azure SQL** | Microsoft-ova oblačna SQL Server instanca |

---

*ePlače 2026 — diplomski projekt, generirano 2026-08-31*
