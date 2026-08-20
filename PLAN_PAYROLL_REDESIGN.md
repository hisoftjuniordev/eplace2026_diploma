# Plan: Dual-Mode Payroll Input — Parametric vs Fixed Bruto

**Vir zakonodaje:** `04_slovenske_eplace_zakonodajni_viri.md`  
**Zadnja posodobitev:** 2026-08-19 — popravek minimalne plače (1.481,88 €)

---

## Zakaj `bruto_osnova` ni dovolj

Trenutno ima vsak zaposleni eno konstantno vrednost — `bruto_osnova` — ki jo motor sorazmerno zmanjša za krajše mesece. To deluje pri preprostih fiksnih plačah, a odpove v štirih realnih scenarijih:

| Scenarij | Problem |
|---|---|
| Bolniška odsotnost | Delodajalec plača 80 % urne postavke za prvih 30 delovnih dni (ZDR-1, 137. člen/3). Pro-racija `bruto_osnova` tega ne loči od rednega dela. |
| Letni dopust | ZDR-1 (137. člen/9) zahteva izplačilo nadomestila po polni osnovi — iz fiksne bruto vrednosti tega ni mogoče pravilno izpeljati. |
| Urni delavec | Mesečna bruto plača se spreminja glede na dejansko opravljene ure — shranjena fiksna vrednost ni smiselna. |
| Nadure | Trenutno `urna_postavka = bruto_osnova / POLNI_MESEC_URE` — napaka, če so v mesec vključene bolniške/dopustne ure. |

---

## Dva načina (soobstajata po zaposlenem)

### Način A — `FIKSNI_BRUTO` (obstoječ, nespremenjen)
Delodajalec vnese fiksno mesečno bruto vrednost. Motor jo sorazmerno zmanjša z `m01_ure / POLNI_MESEC_URE`. Vsi obstoječi zaposleni delujejo enako kot prej.

**Kdaj uporabiti:** Preprosti plačani zaposleni, kjer delodajalec ve le »plačujem tej osebi 2000 € bruto«.

### Način B — `PARAMETRICNI` (nov)
Delodajalec vnese **urno postavko** (`urna_postavka`). Mesečni list ur dobi stolpca za bolniške in dopustne ure. Motor zgradi bruto iz komponent.

**Kdaj uporabiti:** Urni delavci, zaposleni s spremenljivo prisotnostjo ali kadar je potrebna revizijsko pravilna razčlenitev listka.

**Način se zazna samodejno:**
```
employee.urna_postavka IS NOT NULL AND > 0  →  PARAMETRICNI
employee.urna_postavka IS NULL              →  FIKSNI_BRUTO
```
Brez novega stolpca za zastavico. Združljivo za nazaj.

---

## Parametrična formula za bruto

Zakonska podlaga: ZDR-1 čl. 127, 128, 137/3, 137/9, 144.

```
redno       = urna_postavka × DOPUST_FAKTOR × m01_redno_ure           (100 %)
dopust      = urna_postavka × DOPUST_FAKTOR × m04_dopust_ure           (100 %, ZDR-1 137/9)
bolniska    = urna_postavka × BOLNISKA_FAKTOR_DEL × m05_bolniske_ure   (80 %, ZDR-1 137/3)
nadure      = urna_postavka × NADURE_FAKTOR × m03_nadure_ure            (130 %, ZDR-1 144)
────────────────────────────────────────────────────────────────────────
BRUTO 1     = redno + dopust + bolniska + nadure + boniteta
```

**Kontrola minimalne plače** (motor vrže napako ob kršitvi):
```
bruto >= MINIMALNA_PLACA × (ure_skupaj / POLNI_MESEC_URE)
```

---

## Zahtevani podatki v bazi (MVP)

### 1. Spremembe sheme — nova datoteka `database/07_alter2.sql`

```sql
-- employees: urna postavka (NULL = način A / fiksni bruto)
ALTER TABLE dbo.employees
  ADD urna_postavka DECIMAL(10,4) NULL;

-- monthly_hours: dopustne in bolniške ure
ALTER TABLE dbo.monthly_hours
  ADD m04_dopust_ure   INT NOT NULL DEFAULT 0,
      m05_bolniske_ure INT NOT NULL DEFAULT 0;

-- payroll_lines: razčlenitev za listek (le način B)
ALTER TABLE dbo.payroll_lines
  ADD m01_redno_znesek   DECIMAL(10,2) NULL,
      m04_dopust_znesek  DECIMAL(10,2) NULL,
      m05_bolniska_znesek DECIMAL(10,2) NULL;
```

### 2. Novi zapisi v `payroll_params` — dodaj v `database/06_payroll_params.sql`

Vsi zapisi z `veljavno_od = '2026-01-01'`, `veljavno_do = NULL`.

```sql
INSERT INTO dbo.payroll_params (id, kljuc, vrednost, opis, veljavno_od) VALUES
  (NEWID(), 'MINIMALNA_PLACA',         '1481.88', 'Minimalna mesečna bruto plača 2026 (ZMinP, Ur. l. RS 6/2026)',          '2026-01-01'),
  (NEWID(), 'MINIMALNA_URNA_POSTAVKA', '8.56',    'Minimalna bruto urna postavka 2026 (ZMinP, izpeljano)',                  '2026-01-01'),
  (NEWID(), 'BOLNISKA_FAKTOR_DEL',     '0.80',    'Stopnja nadomestila bolniške — delodajalec, dnevi 1–30 (ZDR-1 137/3)', '2026-01-01'),
  (NEWID(), 'NADURE_FAKTOR',           '1.30',    'Množitelj nadurnega dela — min. zakonski (ZDR-1 127–128, 144)',         '2026-01-01'),
  (NEWID(), 'DOPUST_FAKTOR',           '1.00',    'Faktor nadomestila za dopust — polna osnova (ZDR-1 137/9)',             '2026-01-01');
```

> **Opomba:** Vrednosti BOLNISKA_FAKTOR_DEL, NADURE_FAKTOR in DOPUST_FAKTOR so bile prej kodirane trdo (0.80, 1.30). Prenos v bazo omogoča spremembo z zakonodajno posodobitvijo brez posega v kodo in ohranja revizijsko sled prek `veljavno_od`/`veljavno_do`.

**Skupaj parametrov po MVP: 22** (17 obstoječih + 5 novih)

### Celoten seznam parametrov po MVP

| kljuc | vrednost | Opis |
|---|---|---|
| STOPNJA_PIZ_DEL | 0.1550 | Prispevek PIZ — delavec (15,50 %) |
| STOPNJA_ZZ_DEL | 0.0636 | Prispevek ZZ — delavec (6,36 %) |
| STOPNJA_ZAP_DEL | 0.0014 | Prispevek ZAP — delavec (0,14 %) |
| STOPNJA_STAR_DEL | 0.0010 | Prispevek STAR — delavec (0,10 %) |
| STOPNJA_DO_DEL | 0.0100 | Prispevek DO — delavec (1,00 %) |
| STOPNJA_PIZ_ADR | 0.0885 | Prispevek PIZ — delodajalec (8,85 %) |
| STOPNJA_ZZ_ADR | 0.0656 | Prispevek ZZ — delodajalec (6,56 %) |
| STOPNJA_ZAP_ADR | 0.0006 | Prispevek ZAP — delodajalec (0,06 %) |
| STOPNJA_STAR_ADR | 0.0010 | Prispevek STAR — delodajalec (0,10 %) |
| STOPNJA_POSK_ADR | 0.0053 | Prispevek poškodbe — delodajalec (0,53 %) |
| STOPNJA_DO_ADR | 0.0100 | Prispevek DO — delodajalec (1,00 %) |
| OZP_MESECNI | 35.00 | Mesečni odtegljaj OZP (€) |
| SPLOSNA_OLAJSAVA | 416.67 | Splošna davčna olajšava mesečno (€) |
| PREHRANA_DNEVNA_MEJA | 7.96 | Neobdavčena malica na dan (€, Uredba FURS) |
| PREVOZ_KM_MEJA | 0.21 | Neobdavčeno povračilo prevoza na km (€, Uredba FURS) |
| POLNI_MESEC_URE | 168 | Normativ ur za pro-rato |
| DOHODNINSKA_LESTVICA | [JSON] | 5-stopenjska progresivna lestvica 2026 |
| **MINIMALNA_PLACA** | **1481.88** | **Minimalna bruto plača 2026 (ZMinP, Ur. l. 6/2026) ⚠️ POPRAVLJENO** |
| **MINIMALNA_URNA_POSTAVKA** | **8.56** | **Minimalna urna postavka 2026 (€/h)** |
| **BOLNISKA_FAKTOR_DEL** | **0.80** | **Stopnja bolniške — delodajalec (ZDR-1 137/3)** |
| **NADURE_FAKTOR** | **1.30** | **Množitelj nadur (ZDR-1 144)** |
| **DOPUST_FAKTOR** | **1.00** | **Faktor nadomestila za dopust (ZDR-1 137/9)** |

---

## Spremembe potrebne v kodi

### Backend — `src/types/interfaces.ts`
- `IEmployee` → dodaj `urna_postavka: number | null`
- `IPayrollInput` → dodaj `urnaPostavka?: number | null`, `m04DopustUre?: number`, `m05BolniskeUre?: number`
- `IPayrollParams` → dodaj `MINIMALNA_PLACA`, `MINIMALNA_URNA_POSTAVKA`, `BOLNISKA_FAKTOR_DEL`, `NADURE_FAKTOR`, `DOPUST_FAKTOR`
- `IPayrollResult` → dodaj `m01RednoZnesek`, `m04DopustZnesek`, `m05BolniskaZnesek`

### Backend — `src/engine/slovenian-payroll-engine.ts`
Zamenjaj obstoječi blok pro-rata + nadure z vejitvijo po načinu:

```typescript
if (input.urnaPostavka) {
  // NAČIN B — Parametrični
  const up        = new BigNumber(input.urnaPostavka);
  const bolFaktor = new BigNumber(params.BOLNISKA_FAKTOR_DEL); // iz baze, ne trdo
  const dopFaktor = new BigNumber(params.DOPUST_FAKTOR);       // iz baze, ne trdo
  const nadFaktor = new BigNumber(params.NADURE_FAKTOR);       // iz baze, ne trdo

  m01RednoZnesek    = R(up.multipliedBy(dopFaktor).multipliedBy(m01Ure));
  m04DopustZnesek   = R(up.multipliedBy(dopFaktor).multipliedBy(m04DopustUre));
  m05BolniskaZnesek = R(up.multipliedBy(bolFaktor).multipliedBy(m05BolniskeUre));
  nadureZnesek      = R(up.multipliedBy(nadFaktor).multipliedBy(m03NadureUre));
  brutoOsnova       = R(m01RednoZnesek.plus(m04DopustZnesek).plus(m05BolniskaZnesek));

  const ureSkupaj = m01Ure + m04DopustUre + m05BolniskeUre + m03NadureUre;
  const minWage   = new BigNumber(params.MINIMALNA_PLACA)
    .multipliedBy(ureSkupaj).dividedBy(params.POLNI_MESEC_URE);
  if (new BigNumber(brutoOsnova).plus(nadureZnesek).lt(minWage)) {
    throw new PayrollValidationError(`Bruto pod minimalno plačo: ${minWage.toFixed(2)} €`);
  }
} else {
  // NAČIN A — Fiksni bruto (nespremenjen)
  brutoOsnova  = R(brutoOsnovaFull.multipliedBy(proRata));
  nadureZnesek = R(brutoOsnovaFull.dividedBy(POLNI_MESEC_URE)
    .multipliedBy(m03NadureUre).multipliedBy(params.NADURE_FAKTOR));
}
const bruto1 = R(brutoOsnova.plus(nadureZnesek).plus(boniteta));
```

### Backend — `src/workers/payroll.worker.ts`
Dodaj tri nova polja pri gradnji `IPayrollInput`:
```typescript
urnaPostavka:   emp.urna_postavka ?? null,
m04DopustUre:   hours?.m04_dopust_ure ?? 0,
m05BolniskeUre: hours?.m05_bolniske_ure ?? 0,
```

### Backend — `src/repositories/payroll-params.repo.ts`
Dodaj 5 novih ključev v `REQUIRED_KEYS` in jih pretvori v ustrezne tipe (float) v `getActivePayrollParams()`.

### Backend — `src/repositories/payroll.repo.ts`
`insertPayrollLine` dobi 3 nove razčlenitvene stolpce: `m01_redno_znesek`, `m04_dopust_znesek`, `m05_bolniska_znesek`.

### Frontend — `features/employees/form.component.ts`
Dodaj preklop **"Način obračuna"**:
- `Fiksni bruto` → prikaži polje `bruto_osnova`, skrij `urna_postavka`
- `Urna postavka` → prikaži polje `urna_postavka` (min 8,56 €), skrij `bruto_osnova`

Medsebojni validator: natanko eno mora biti > 0.

### Frontend — `features/hours/hours.component.ts`
Dodaj dva stolpca v tabelo vnosa ur:
- **Ure dopusta** (`m04_dopust_ure`) — celo število, privzeto 0
- **Ure bolniške** (`m05_bolniske_ure`) — celo število, privzeto 0

### Frontend — `features/payroll/payslip.component.ts`
Ko je `urna_postavka` prisotna, prikaži razčlenitev komponent nad BRUTO 1:
```
Redno     (160 ur × 10,00 €)             1.600,00 €
Dopust    (8 ur × 10,00 €)                  80,00 €
Bolniška  del. (8 ur × 8,00 €)              64,00 €
Nadure    (4 ur × 13,00 €)                  52,00 €
──────────────────────────────────────────────────
BRUTO 1                                   1.796,00 €
```

---

## Pregled datotek

| Datoteka | Sprememba |
|---|---|
| `database/07_alter2.sql` | NOVO — 3 ALTER TABLE + 5 INSERT payroll_params |
| `src/types/interfaces.ts` | 4 vmesniki razširjeni |
| `src/engine/slovenian-payroll-engine.ts` | Vejitev po načinu; trdo kodirani faktorji → parametri |
| `src/workers/payroll.worker.ts` | 3 nova polja v gradnji IPayrollInput |
| `src/repositories/payroll-params.repo.ts` | 5 novih REQUIRED_KEYS + pretvorba tipov |
| `src/repositories/payroll.repo.ts` | 3 novi razčlenitveni stolpci v insertPayrollLine |
| `frontend/.../employees/form.component.ts` | Preklop načina + medsebojni validator |
| `frontend/.../hours/hours.component.ts` | Stolpca m04 + m05 |
| `frontend/.../payroll/payslip.component.ts` | Razdelek parametrične razčlenitve |

---

## Preveritveni primeri

### Zaposleni z urno postavko (Način B)
```
urna_postavka = 10,00 €
redno=160h, dopust=8h, bolniske=8h, nadure=4h

redno    = 10,00 × 1,00 × 160 = 1.600,00
dopust   = 10,00 × 1,00 × 8   =    80,00
bolniska = 10,00 × 0,80 × 8   =    64,00
nadure   = 10,00 × 1,30 × 4   =    52,00
BRUTO 1  = 1.796,00 €

Min. plača: 1.481,88 × (180/168) = 1.587,37 € → 1.796 > 1.587 ✅
```

### Obstoječi fiksni zaposleni (Način A — regresija)
```
urna_postavka = NULL, bruto_osnova = 2.000 €, redno = 160h
bruto = 2.000 × (160/168) = 1.904,76 € (nespremenjen ✅)
```

### Test minimalne plače (pričakovana napaka)
```
urna_postavka = 5,00 €, redno = 168h → bruto = 840 €
Min. plača: 1.481,88 × (168/168) = 1.481,88 € → 840 < 1.481,88 ❌ napaka ✅
```

---

## Opomba o popravku

Stari načrt je navajal `MINIMALNA_PLACA = 1.253,90 €` — ta vrednost je napačna.  
**Uradna minimalna bruto plača za 2026 je 1.481,88 €** (Sklep, Ur. l. RS št. 6, 30. 1. 2026, ZMinP).  
Vir: `04_slovenske_eplace_zakonodajni_viri.md`, razdelek 1.
