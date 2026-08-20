# ePlače 2026 — Razvojni načrt V2
## Korak-za-korakom vodič za dokončanje aplikacije

**Datum:** 8. 8. 2026  
**Osnova:** MVP je zgrajen in deluje (H1/H2/H3 potrjene). Ta dokument opisuje VSE kar manjka do polno delujočega produkta.  
**Vir:** NACRT_MVP_ARHITEKTURA.md, LMARENA_PREDLOGSEMINARSKE/, HISOFT26/WORD/ (13 dokumentov)  
**Jezik:** Slovenščina (opisno, brez kode)

---

## PREGLED PRIORITET

```
🔴 KRITIČNO    — brez tega UI ne deluje (1–2 dni dela)
🟠 VISOKO      — za realen demo in diplomsko obrambo (3–5 dni)
🟡 SREDNJE     — za produkcijsko uporabo (1–2 tedna)
🟢 PRIHODNOST  — integracije in napredne funkcije (1+ mesec)
```

---

## KORAK 1 — Navigacijska lupina (Shell / Layout) 🔴

**Zakaj najprej:** Brez tega ni mogoče navigirati med ekrani. Aplikacija je neuporabna za demo.

### 1.1 Kaj zgraditi

Osnovna lupina (shell) je Angular komponenta, ki se prikaže po prijavi in obdaja vse ostale ekrane. Vsebuje:

- **Stranski meni (sidebar)** na levi strani z naslednjimi enotami:
  - 🏠 Domov (dashboard)
  - 👥 Delavci (seznam + dodaj novega)
  - 📅 Mesečne ure (vnos ur za izbrani mesec)
  - 💰 Obračun plač (wizard + zgodovina)
  - 📤 Izvoz (SEPA, VOD, REK-O)
  - ⚙️ Nastavitve (podatki podjetja)

- **Zgornja vrstica (header)** z:
  - Logotipom ePlače 2026
  - Imenom prijavljenega uporabnika in podjetjem
  - Gumbom za odjavo

- **Vsebinska površina** (router outlet) kjer se prikazujejo podstrani

### 1.2 Routing (usmerjevanje)

Definirati je treba zaščitene poti, do katerih je dostop možen le z veljavnim JWT žetonom:
- `/` → preusmeri na `/dashboard`
- `/dashboard` → domov
- `/delavci` → seznam delavcev
- `/delavci/nov` → obrazec za novega delavca
- `/delavci/:id` → urejanje obstoječega
- `/ure` → vnos mesečnih ur
- `/obracun` → wizard za obračun
- `/obracun/:id` → pregled rezultatov obračuna
- `/izvoz` → izvozni center
- `/nastavitve` → nastavitve podjetja

### 1.3 Zaščita poti

Auth Guard preveri ali je JWT žeton v localStorage veljaven (ni potekel) in ustrezno vloga. Brez veljavnega žetona preusmeri na `/login`.

---

## KORAK 2 — Parametrična baza (Gov tabele) 🔴

**Zakaj:** Trenutno so vsi zakonski parametri vtrdno kodirani v TypeScript. Za produkcijo in diplomsko demonstracijo je treba prikazati, da aplikacija bere parametre iz baze. To je tudi ključna arhitekturna prednost pred HISOFT-om, ki je imel vse hard-kodirano.

### 2.1 Nove tabele v bazi

#### Tabela: `gov_tax_brackets` (Dohodniška lestvica)
Vsaka vrstica predstavlja en razred dohodniške lestvice z datumom veljavnosti:

| Polje | Tip | Opis |
|-------|-----|------|
| id | INT | Primarni ključ |
| razred | INT | 1–5 |
| spodnja_meja | DECIMAL(10,2) | Spodnja meja osnove (mesečno) |
| zgornja_meja | DECIMAL(10,2) | Zgornja meja (NULL = brez zgornje) |
| stopnja | DECIMAL(5,4) | Davčna stopnja (npr. 0.1600 = 16 %) |
| fiksni_del | DECIMAL(10,2) | Fiksni del akontacije (npr. 116.53 za razred 2) |
| velja_od | DATE | Datum začetka veljavnosti |
| velja_do | DATE | Datum konca (NULL = trenutno veljavno) |

**Začetni podatki 2026:**

| Razred | Spodnja | Zgornja | Stopnja | Fiksni del |
|--------|---------|---------|---------|-----------|
| 1 | 0.00 | 728.31 | 16 % | 0.00 |
| 2 | 728.31 | 1.260,40 | 26 % | 116.53 |
| 3 | 1.260,40 | 2.083,33 | 33 % | 254.87 |
| 4 | 2.083,33 | 6.416,67 | 39 % | 526.43 |
| 5 | 6.416,67 | NULL | 50 % | 2.216,43 |

#### Tabela: `gov_contribution_rates` (Prispevne stopnje)

| Polje | Tip | Opis |
|-------|-----|------|
| id | INT | PK |
| vrsta | VARCHAR(20) | PIZ, ZZ, ZAP, STAR, DO, POSK |
| opis | NVARCHAR(100) | npr. "Pokojninsko in invalidsko zavarovanje" |
| stopnja_del | DECIMAL(5,4) | Stopnja za delojemalca |
| stopnja_adr | DECIMAL(5,4) | Stopnja za delodajalca |
| velja_od | DATE | |
| velja_do | DATE | NULL = aktivno |

**Začetni podatki 2026:**

| Vrsta | Delojemalec | Delodajalec |
|-------|-------------|-------------|
| PIZ | 15,50 % | 8,85 % |
| ZZ | 6,36 % | 6,56 % |
| ZAP | 0,14 % | 0,06 % |
| STAR | 0,10 % | 0,10 % |
| DO | 1,00 % | 1,00 % |
| POSK | — | 0,53 % |

#### Tabela: `gov_parameters` (Splošni parametri)

Shranjuje vse zakonske fiksne vrednosti z datumom veljavnosti:

| Ključ | Vrednost 2026 | Opis |
|-------|--------------|------|
| `splosna_olajsava_mesecna` | 416.67 | Splošna davčna olajšava (mesečno) |
| `ozp_odtegljaj` | 35.00 | OZP obvezni zdravstveni prispevek |
| `prehrana_dan` | 7.96 | Povračilo prehrane na prisotnostni dan |
| `prevoz_km` | 0.21 | Povračilo prevoza na km (dnevno) |
| `minimalna_placa` | 1.253,90 | Minimalna bruto plača 2026 |
| `najnizja_osnova_prisp` | 1.253,90 | Najnižja osnova za prispevke |
| `olajsava_1_otrok` | 224.20 | Mesečna olajšava za 1. otroka |
| `olajsava_2_otrok` | 243.70 | Mesečna olajšava za 2. otroka |
| `olajsava_3_otrok` | 392.30 | Mesečna olajšava za 3. otroka |
| `olajsava_invalid_ozp` | 418.27 | Olajšava za invalidnost (OZP zavezanec) |

#### Tabela: `gov_wage_components` (Šifrant vrst zaslužka)

Vsak tip vrstice v obračunu ima svojo šifro:

| Šifra | Naziv | Tip | REK polje |
|-------|-------|-----|-----------|
| 001 | Redno delo | Bruto | S04 |
| 002 | Nadure | Bruto | S05 |
| 003 | Bolniška (del. breme) | Bruto | S06 |
| 004 | Bolniška (ZZZS refund) | Bruto | S07 |
| 005 | Dopust/prazniki | Bruto | S06 |
| 010 | Prehrana | Povračilo | B04 |
| 011 | Prevoz | Povračilo | B05 |
| 020 | Regres | Posebno | 1103 |
| 021 | Jubilejna nagrada | Posebno | — |
| 030 | Boniteta vozila | Boniteta | B14 |
| 040 | Kredit/odtegljaj | Odtegljaj | — |

#### Tabela: `gov_calendar` (Prazniki in dela prosti dnevi)

Za pravilno štetje prisotnostnih dni:

| Polje | Opis |
|-------|------|
| datum | Datum praznika |
| naziv | Ime praznika |
| je_dela_prost | BIT — ali je dela prost dan |

**Prazniki 2026 (primeri):** 1. 1. Novo leto, 8. 2. Prešernov dan, 27. 4. Dan upora, 1. 5. Praznik dela, 25. 6. Dan državnosti, 15. 8. Marijino vnebovzetje, 31. 10. Dan reformacije, 1. 11. Dan spomina na mrtve, 25. 12. Božič, 26. 12. Dan samostojnosti

### 2.2 Sprememba obračunskega motorja

Ko obstajajo parametrične tabele, obračunski motor ne sme več vsebovati vtrdno kodiranih vrednosti. Motor ob zagonu prebere:
- Aktivne prispevne stopnje iz `gov_contribution_rates`
- Aktivno dohodniško lestvico iz `gov_tax_brackets`
- Splošne parametre iz `gov_parameters`

Prednost za diplomsko nalogo: demonstrira, da se parametri (npr. sprememba OZP) spremenijo z enim SQL vnosom brez posega v kodo.

---

## KORAK 3 — Razširjena kartica delavca (5 zavihkov) 🟠

**Zakaj:** Trenutni obrazec za delavca vsebuje le osnovna polja. Realen sistem potrebuje strukturirane zavihke za vse podatke, ki vplivajo na obračun.

### Zavihek A — Osebni in kontaktni podatki

Že delno implementirano. Dopolniti z:
- Datum rojstva (za preverbo starosti 60 let in a017)
- Spol (za statistična poročila)
- Državljanstvo
- Vrsta rezidentnosti: Rezident (R) / Nerezident (N)
- Kontaktni podatki: mobilna, e-pošta

### Zavihek B — Pogodba o zaposlitvi

Nova polja:
- Vrsta pogodbe: nedoločen čas / določen čas / skrajšan delovni čas
- Datum nastopa dela
- Datum izteka pogodbe (za določen čas; sistem opozori 30 dni pred iztekom)
- Delovno mesto (izbira iz `job_positions`)
- Delovna doba v podjetju (izračun iz datum nastopa — za minulo delo)
- Skupna delovna doba (za olajšave in KP ugodnosti)
- Tedenski urnik (40 ur / 36 ur / po dogovoru)
- Stroškovni center / oddelek

### Zavihek C — Parametri za obračun

Polja, ki vplivajo na mesečni obračun:
- Bruto osnova (trenutno edino polje — ostane)
- Ali uveljavlja splošno olajšavo (glavni delodajalec: DA/NE)
- Ali je OZP zavezanec (DA/NE) — odtegljaj 35 €
- Olajšava za vzdrževane člane (znesek v €, izračunan iz tabele otrok)
- Vzdrževani člani: seznam otrok/članov (ime, leto rojstva, EMŠO)
- Ali je invalid nad kvoto (a014) — oprostitev PIZ delojemalec
- Ali je starejši od 60 let (a017) — znižan PIZ delodajalec
- Oddaljenost od dela v km (za prevoz)
- Ali ima pravico do prehrane (DA/NE)
- Minimalna plača — ali se doplačuje do minimalne (DA/NE)

### Zavihek D — Odsotnosti in dopusti

Evidenca pravic:
- Letni dopust (število dni pravice za tekoče leto)
- Porabljeni dnevi letnega dopusta
- Preostanek letnega dopusta
- Preneseni dopust iz preteklega leta
- Aktivna bolniška (DA/NE, od kdaj, pričakovano do kdaj)
- Vrsta bolniške: delodajalec (0–30 dni) / ZZZS (31+ dni) / porodniška / starševska

### Zavihek E — Digitalni arhiv

Prilaganje dokumentov:
- Pogodba o zaposlitvi (PDF)
- Potrdilo o izobrazbi
- Fotokopija osebnega dokumenta
- Vloga za uveljavljanje olajšav
- Ostali dokumenti

*Opomba za MVP/diplomsko: Zavihki A in C sta najpomembnejša. B, D, E so za kasnejši razvoj.*

---

## KORAK 4 — Ekran za vnos mesečnih ur 🔴

**Zakaj:** Brez tega ekrana ni mogoče vnesti različnih ur za vsak mesec. Trenutno seed vstavi statične ure, kar je neuporabno za realen demo.

### 4.1 Opis ekrana

Ekran je dostopen prek `/ure`. Prikaže obrazec za vnos ur za izbranega delavca in izbrani mesec.

**Glava (filter):**
- Izbira leta (spustni seznam: 2024, 2025, 2026)
- Izbira meseca (januar–december)
- Gumb "Prikaži"

**Tabela delavcev z urami:**
Ko uporabnik izbere mesec, se prikaže tabela z vsemi delavci podjetja. Za vsakega delavca so polja:

| Polje | Opis | Tip |
|-------|------|-----|
| Delavec | Ime in priimek (samo prikaz) | — |
| Redno delo (ure) | m01_redno_ure | Celo število |
| Nadure | m03_nadure_ure | Celo število |
| Bolniška — del. breme (ure) | bolniska_del_ure | Celo število |
| Bolniška — ZZZS (ure) | m02_refundacija_ure | Celo število |
| Dopust/prazniki (ure) | m06_odsotnost_ure | Celo število |
| Prisotnostni dnevi | m07_preh_dnevi | Celo število |
| Razdalja km (dnevno) | m07_prevoz_km | Decimalno |
| Krediti/odtegljaji (€) | odtegljaji_kredit | Decimalno |
| Status | Že vnešeno / Novo | Indikator |

**Gumb "Shrani vse":** shrani vse vrstice v `monthly_hours` z enim klicem API.

**Gumb "Kopiraj pretekli mesec":** predizpolni tabelo z urami iz prejšnjega meseca (za delavce z nespremenjenimi urami).

### 4.2 Validacija

- Redno delo + nadure + bolniška + dopust ne sme preseči teoretičnih ur v mesecu (npr. 184h za januar 2026)
- Prisotnostni dnevi ne smejo preseči delovnih dni v mesecu (izračun iz `gov_calendar`)
- Km ne sme biti negativno število

### 4.3 Povzetek meseca

Pod tabelo prikaži agregatne vrednosti:
- Skupaj redne ure vseh delavcev
- Skupaj bruto strošek (informativni izračun)
- Število delavcev z vnesenimi urami vs. skupno število

---

## KORAK 5 — Napredni obračunski motor 🟠

### 5.1 Nadure

**Pravilo:** Nadure se obračunajo z dodatkom glede na kolektivno pogodbo (KP). Standardni dodatek po ZDR-1 je 30 % nad urno postavko. Urna postavka = `bruto_osnova / mesečne_ure_po_pogodbi`.

**Postopek v motorju:**
1. Izračunaj urno postavko
2. Pomnoži z `m03_nadure_ure`
3. Doda 30 % (ali % iz KP nastavitve)
4. Prišteji k bruto osnovi
5. Na REK-O: prikazano v polju S05

### 5.2 Bolniška odsotnost

Bolniška ima dve fazi z različnim bremenom:

**Faza 1 — Delodajalčevo breme (1.–30. dan):**
- Delavec prejme 80 % urne postavke za dneve bolniške
- Plača delodajalec
- Na REK-O: polje S06
- V obračunu: zmanjša redne ure, prišteji bolniško nadomestilo

**Faza 2 — ZZZS breme (31.+ dan):**
- Delavec prejme 90 % urne postavke
- Plača ZZZS — delodajalec zahteva refundacijo prek eNDM
- Na REK-O: polje S07
- V obračunu: ZZZS del ni strošek delodajalca → odšteti iz bruto 2

**Kako implementirati:**
Mesečne ure imata ločeni polji `bolniska_del_ure` (delodajalec) in `m02_refundacija_ure` (ZZZS). Motor izračuna nadomestilo za vsako fazo ločeno.

### 5.3 Minimalna plača

**Pravilo:** Skupna bruta plača delavca (brez povračil) ne sme biti nižja od minimalne plače. Če je nižja, se doda razlika kot "doplačilo do minimalne plače".

**Postopek:**
1. Izračunaj skupno bruto (osnova + nadure + ostalo, brez prehrane in prevoza)
2. Primerjaj z `gov_parameters.minimalna_placa`
3. Če je skupno < minimalna → dodaj razliko kot ločeno vrstico "DodDoMinPl"
4. Doplačilo se šteje k bruto za namene prispevkov in dohodnine

### 5.4 Minulo delo

**Pravilo:** Po KP ima delavec pravico do dodatka za delovno dobo. Standardno: 0,5 % bruto osnove za vsako leto delovne dobe.

**Postopek:**
1. Iz datuma nastopa dela izračunaj leta delovne dobe
2. Pomnoži bruto osnovo z (leta × 0.005)
3. Prišteji k bruto
4. Na REK-O: del rednega zaslužka (S04)

*Opomba: Nekateri KP določajo 0,7 % ali drugačen koeficient — to bo v kasnejši fazi parametrizacije KP.*

### 5.5 Boniteta vozila

**Pravilo:** Če ima delavec na voljo službeno vozilo za zasebno rabo, se mu obračuna boniteta.

**Izračun (2026):**
- Osnova = nabavna vrednost vozila × 1,5 % mesečno
- Za električna vozila (b014_vozilo_el = TRUE): boniteta je 0 €
- Boniteta se prišteje k dohodniški osnovi (ne k bruto za prispevke)
- Na REK-O: polje B14

**V obrazcu delavca (Zavihek C):**
- Checkbox: "Ima pravico do službenega vozila"
- Polje: Nabavna vrednost vozila (€)
- Checkbox: "Gorivo je vključeno" (poveča osnovo za 0,15 % nabavne vrednosti)
- Checkbox: "Električno vozilo" (boniteta = 0)

### 5.6 Odtegljaji (krediti in izvršbe)

**Pravilo:** Delodajalec je dolžan odtegovati kredite, izvršbe in sindikalne članarine iz neto plače.

**Tipi odtegljajev:**
- Kredit pri banki (fiksni mesečni obrok)
- Sodna izvršba (% neto, ZIZ omejuje na max 1/2 minimalne plače)
- Sindikalna članarina (% bruto, ponavadi 1 %)
- Solidarnostni sklad (% bruto)

**Implementacija:**
Nova tabela `employee_deductions` (delavec, vrsta, znesek/%, veljavnost od-do).
Motor prebere aktivne odtegljaje in jih odšteje po izračunu neta.

### 5.7 Vzdrževani člani (olajšave za otroke)

**Vrednosti 2026:**
- 1. otrok: 224,20 €/mesec
- 2. otrok: 243,70 €/mesec
- 3. otrok in vsak naslednji: 392,30 €/mesec (od 2025)

**Implementacija:**
Nova tabela `employee_dependents` (delavec, ime, EMŠO, leto rojstva, tip: otrok/vzdrževan odrasel).
Motor prešteje otroke in izračuna skupno olajšavo iz parametrične tabele.

---

## KORAK 6 — Pregled plačilnih vrstic (Payslip View) 🟠

**Zakaj:** Trenutno se po obračunu prikaže le progress bar in skupni status. Ni vidno kaj je bilo obračunano za koga.

### 6.1 Opis ekrana

Ko je obračun zaključen (`status_obracuna = 'Zakljucen'`), prikaži seznam delavcev z njihovimi obračunanimi vrednostmi:

**Tabela rezultatov:**

| Delavec | Bruto 1 | Prispevki del. | Dohodnina | Neto | Prehrana | Prevoz | Končno izplačilo |
|---------|---------|----------------|-----------|------|----------|--------|-----------------|
| Novak Janez | 2.000,00 | 462,00 | 253,72 | 1.284,28 | 122,40 | 100,00 | 1.506,48 |
| Kovač Ana | 1.500,00 | 346,50 | 153,75 | 999,75 | 122,40 | 50,40 | 1.192,55 |

**Skupaj vrstica** z agregati.

**Klik na delavca** odpre podrobni pregled vrstice (plačilna lista):
- Bruto osnova
- Vsak prispevek posamezno (PIZ, ZZ, ZAP, STAR, DO, OZP)
- Davčna osnova
- Dohodnina
- Neto pred povračili
- Prehrana in prevoz
- Odtegljaji
- Končni znesek za nakazilo na TRR

### 6.2 Gumbi na ekranu

- **Prenesi SEPA XML** — sproži `/api/v1/export/sepa/:runId`
- **Prenesi VOD XML** — sproži `/api/v1/export/vod/:runId`
- **Prenesi REK-O XML** — sproži `/api/v1/export/rek/:runId` (ko bo implementiran)
- **Tiskaj plačilne liste** — gumb, ki odpre vseh N plačilnih list za tiskanje

---

## KORAK 7 — Plačilna lista (HTML → PDF) 🟡

**Zakaj:** Delodajalec je po ZDR-1 dolžan delavcu izročiti obračun plače. PDF iz sistema je bolj profesionalen kot tiskanje iz brskalnika.

### 7.1 Struktura plačilne liste

Plačilna lista vsebuje:

**Glava:**
- Ime in naslov podjetja (iz `tenants`)
- Davčna številka podjetja
- Mesec in leto obračuna
- Datum izplačila

**Podatki o delavcu:**
- Ime in priimek
- Davčna številka
- EMŠO
- Delovno mesto
- TRR za nakazilo

**Tabela obračuna:**

| Opis | Ure | Znesek |
|------|-----|--------|
| Redno delo | 174 | 2.000,00 |
| Skupaj bruto (Bruto 1) | | 2.000,00 |
| PIZ delojemalec (15,5 %) | | −310,00 |
| ZZ delojemalec (6,36 %) | | −127,20 |
| ZAP delojemalec (0,14 %) | | −2,80 |
| STAR delojemalec (0,10 %) | | −2,00 |
| DO delojemalec (1 %) | | −20,00 |
| OZP odtegljaj | | −35,00 |
| **Davčna osnova** | | **1.503,00** |
| Splošna olajšava | | −416,67 |
| **Osnova za dohodnino** | | **1.086,33** |
| Akontacija dohodnine (26 %) | | −165,49 |
| **Neto plača** | | **1.337,51** |
| Povračilo prehrane (20 dni × 7,96 €) | | +159,20 |
| Povračilo prevoza (15 km × 0,21 €) | | +63,00 |
| **SKUPAJ ZA NAKAZILO** | | **1.559,71** |

**Delodajalčevi prispevki (samo informativno):**
| Opis | Znesek |
|------|--------|
| PIZ delodajalec (8,85 %) | 177,00 |
| ZZ delodajalec (6,56 %) | 131,20 |
| ZAP delodajalec (0,06 %) | 1,20 |
| STAR delodajalec (0,10 %) | 2,00 |
| Poškodbe (0,53 %) | 10,60 |
| DO delodajalec (1 %) | 20,00 |
| **Skupaj Bruto 2 (strošek delodajalca)** | **2.342,00** |

**Podpis in žig.**

### 7.2 Implementacija

Možnosti:
1. **HTML template + CSS print media** — najlažje, brez knjižnic; brskalnik natisne/shrani PDF
2. **Puppeteer** (Node.js) — headless Chrome generira PDF na strežniku; kompleksnejše
3. **PDFKit** (Node.js) — programska generacija PDF; brez Chrome

Za MVP priporoča opcija 1 (HTML print): Angular komponenta z `@media print` CSS stilom, ki skrije navigacijo in prikaže samo plačilno listo. Gumb "Natisni" sproži `window.print()`.

---

## KORAK 8 — REK-O XML generator 🟡

**Zakaj:** REK-O je zakonska obveznost poročanja FURS. Brez tega ni mogoče zakonito obračunati plač v produkciji. Za diplomsko nalogo zadostuje opis, a implementacija ga naredi bolj impresivnega.

### 8.1 Struktura REK-O XML

Format iREK-O (XSD: ODE_PDO_2.xsd):

```
<?xml version="1.0" encoding="UTF-8"?>
<napoved xmlns="...">
  <glava>
    <davcna_stevilka_zavezanca>12345678</davcna_stevilka_zavezanca>
    <vrsta_rek>1001</vrsta_rek>      <!-- 1001 = redna plača -->
    <datum_od>2026-01-01</datum_od>
    <datum_do>2026-01-31</datum_do>
  </glava>
  <iREK>                             <!-- Ponovi za vsakega delavca -->
    <emso>0101990500006</emso>
    <davcna>12345678</davcna>
    <vrsta_dohodka>1101</vrsta_dohodka>
    <S04>174</S04>                   <!-- Redno delo (ure) -->
    <S05>0</S05>                     <!-- Nadure -->
    <A011>2000.00</A011>             <!-- Bruto osnova -->
    <A041>462.00</A041>              <!-- Prispevki delojemalec skupaj -->
    <A043>177.00</A043>              <!-- Prispevki delodajalec skupaj -->
    <A051>165.49</A051>              <!-- Akontacija dohodnine -->
    <B04>159.20</B04>                <!-- Prehrana -->
    <B05>63.00</B05>                 <!-- Prevoz -->
  </iREK>
</napoved>
```

### 8.2 Mapiranje polj

| REK-O polje | Vir v payroll_lines | Opis |
|------------|---------------------|------|
| S04 | m01_redno_ure | Redno delo |
| S05 | m03_nadure_ure | Nadure |
| S06 | m06_odsotnost_ure | Dopust/prazniki/bolniška del. |
| S07 | m02_refundacija_ure | Bolniška ZZZS |
| A011 | bruto_1 | Skupna bruto osnova |
| A071 | a071_piz_del | PIZ delojemalec |
| A072 | a072_zz_del | ZZ delojemalec |
| A041 | vsota del. prispevkov | Skupaj prispevki delojemalec |
| A051 | dohodnina | Akontacija dohodnine |
| A081 | a081_piz_del_adr | PIZ delodajalec |
| A043 | vsota adr. prispevkov | Skupaj prispevki delodajalec |
| B04 | m07_prehrana | Povračilo prehrane |
| B05 | m07_prevoz | Povračilo prevoza |

### 8.3 Validacija pred generiranjem

Pred ustvaritvijo XML preveri:
- Vsak delavec ima veljavno EMŠO (13 cifer)
- Vsak delavec ima veljavno davčno številko (8 cifer)
- Vsota prispevkov delojemalca se ujema s posamičnimi vrednostmi
- Vsota dohodkov je pozitivna

### 8.4 Ločeni REK-O po vrsti (VrstaREK)

| VrstaREK | Tip dohodka |
|---------|-------------|
| 1001 | Redna plača |
| 1103 | Regres |
| 1104 | Jubilejna nagrada |
| 1200 | Avtorski honorar |

Vsaka vrsta se odda kot ločen XML dokument. MVP obravnava le 1001 (redna plača).

---

## KORAK 9 — Izvozni center (UI) 🟠

**Zakaj:** SEPA in VOD generatorja sta že implementirana na backendu. Manjka le Angular ekran z gumbi.

### 9.1 Opis ekrana `/izvoz`

**Filter:**
- Izbira obračuna (spustni seznam z zaključenimi obračuni: "Januar 2026", "Februar 2026", ...)
- Ko izbereš obračun, se prikažejo gumbi za prenos

**Razdelki:**

**💳 Bančna nakazila**
- Gumb: "Prenesi SEPA XML (pain.001.001.03)" — neto plače na TRR delavcev
- Informacija: skupni znesek, število delavcev, datum valute

**📊 Računovodstvo**
- Gumb: "Prenesi VOD XML (temeljnica)" — za uvoz v Minimax/PANTHEON/Vasco
- Kontni okvir: prikaži D-stran (4700 bruto, 4730, 4750) in K-stran (2200, 2600–2650)

**🏛️ Davčna uprava**
- Gumb: "Prenesi REK-O XML (eDavki)" *(ko bo implementiran)*
- Status: "REK-O generator: v razvoju" ali "Pripravljeno za oddajo"

**📑 Plačilne liste**
- Gumb: "Natisni vse plačilne liste" — odpre print dialog s plačilnimi listami vseh delavcev
- Gumb: "Prenesi plačilne liste (ZIP s PDF)" *(prihodnji razvoj)*

---

## KORAK 10 — Regres 🟡

**Zakaj:** Regres je zakonska obveznost (ZDR-1, §131). Delodajalec ga mora izplačati do 1. julija.

### 10.1 Pravila

- Minimalni regres = minimalna plača (1.253,90 € za 2026)
- Kolektivna pogodba lahko določi višji znesek
- Za delavce z delnim delovnim časom: sorazmerni del
- Davčna obravnava: do višine minimalne plače ni dohodnine; nad tem je 25 % dohodnina
- Ni prispevkov (niti delojemalca niti delodajalca) — čista izplačila

### 10.2 Implementacija

- Posebni tip obračuna (`vrsta_obracuna = 'Regres'`) v `payroll_runs`
- Ločeni wizard: izbira leta, znesek regresa, datum izplačila
- Generator SEPA XML za regresna izplačila
- REK-O z VrstaREK = 1103

---

## KORAK 11 — Nastavitve podjetja 🟠

**Opis ekrana `/nastavitve`:**

### 11.1 Podatki podjetja

- Naziv podjetja
- Davčna številka
- Matična številka
- Naslov, kraj, poštna številka
- IBAN podjetja (za SEPA plačnik)
- BIC/SWIFT banke
- Kontaktna e-pošta in telefon

### 11.2 Parametri podjetja

- Dodatek za minulo delo (% na leto) — privzeto 0,5 %, KP lahko drugačno
- Vrsta KP (splošna / panožna) — vpliva na regres, nadure
- Standardni mesečni fond ur (160 / 168 / 174 / 184)
- Zneski regresa (privzeto = minimalna plača ali po KP)

### 11.3 Upravljanje uporabnikov

- Seznam uporabnikov z vlogami (Skrbnik / Uporabnik)
- Dodaj novega uporabnika
- Aktiviraj / deaktiviraj dostop
- Resetiraj geslo

---

## KORAK 12 — Dashboard (Domov) 🟡

**Opis:** Prva stran po prijavi. Prikaže ključne informacije na eni strani.

### 12.1 Widgeti

- **Aktivni delavci** — skupno število, od tega na bolniški, na dopustu
- **Zadnji obračun** — mesec, skupni strošek, status
- **Naslednji obračun** — opomnik: "Vnesi ure za februar do 15. 2. 2026"
- **Opozorila** — delavci s potekajoče pogodbami, delavci brez vnesenih ur
- **Hitri gumbi** — Dodaj delavca, Začni obračun, Prenesi SEPA

---

## KORAK 13 — Statistična in zakonska poročila 🟢

### 13.1 ZAP/M (AJPES — mesečno)

Mesečno poročilo o plačah za AJPES (Agencija RS za javnopravne evidence):
- Število zaposlenih (moški/ženske)
- Skupni bruto za polni delovni čas
- Skupni bruto za krajši delovni čas
- Format: XML za e-oddajo na portalu AJPES

### 13.2 ZAP/L (AJPES — letno)

Letno poročilo o strukturi plač:
- Povprečne plače po delovnih mestih
- Regres
- Jubilejne nagrade

### 13.3 M4 (ZPIZ)

*Opomba: Od 2016 se M4 poroča mesečno prek REK-O. Ločena oddaja M4 ni več potrebna.*

### 13.4 Interni pregled stroškov

- Pregled stroškov dela po mesecih (graf)
- Primerjava Bruto 1 vs. Bruto 2 vs. skupni strošek
- Pregled po delovnih mestih/oddelkih

---

## KORAK 14 — Integracije (prihodnji razvoj) 🟢

### 14.1 eDavki / FURS — oddaja REK-O

- G2G (Government-to-Government) API
- Digitalni certifikat FURS
- Avtomatska oddaja REK-O po zaključku obračuna
- Potrditev o oddaji (arhiviranje)

### 14.2 SPOT portal — e-Bolniški listi (eBOL)

- SOAP web service ZZZS
- Avtomatski uvoz bolniških listov z zdravnikovimi datumi
- Pretvorba v odsotnostne ure za mesečni vnos
- eNDM — elektronska zahteva za refundacijo (bolniška 31+ dni)

### 14.3 Špica All Hours / MojeUre.si

- REST API za uvoz ur iz evidenc delovnega časa
- Avtomatsko predizpolni mesečne ure za vse delavce
- Preveri in označi anomalije (prekoračitev ur, odsotnosti brez statusa)

### 14.4 Računovodski sistemi

- **Minimax**: REST API + VOD XML za samodejni knjig
- **PANTHEON**: VOD XML uvoz
- **Vasco**: VOD XML uvoz
- **e-računi**: REST API

---

## POVZETEK — Vrstni red implementacije

### Faza 1 — Osnovna uporabnost (1–2 dni)
1. Navigacijska lupina z menijem
2. Ekran za vnos mesečnih ur
3. Pregled plačilnih vrstic po obračunu
4. Gumbi za SEPA/VOD prenos v Angular UI

### Faza 2 — Popoln obračun (3–5 dni)
5. Parametrična baza (Gov tabele, sprememba motorja)
6. Zavihki delavca A, B, C (pogodba, vzdrževani, bonitete)
7. Nadure v obračunu
8. Bolniška (delodajalec + ZZZS faza)
9. Minimalna plača waterfall
10. Odtegljaji (krediti, izvršbe)

### Faza 3 — Izvoz in compliance (5–7 dni)
11. Plačilna lista (HTML print)
12. REK-O XML generator
13. Izvozni center (UI za vse XMLe)
14. Nastavitve podjetja
15. Dashboard

### Faza 4 — Napredne funkcije (10+ dni)
16. Regres
17. Boniteta vozila
18. Minulo delo
19. Statistična poročila (ZAP/M)
20. Integracije (eDavki, SPOT, Špica)

---

## OCENA SKUPNEGA DELA

| Faza | Obseg dela | Prioriteta |
|------|-----------|-----------|
| Faza 1 — Osnovna uporabnost | ~10 ur | 🔴 Takoj |
| Faza 2 — Popoln obračun | ~20–30 ur | 🟠 Kmalu |
| Faza 3 — Izvoz in compliance | ~20–30 ur | 🟠 Za diplomo |
| Faza 4 — Napredne funkcije | ~40–60 ur | 🟢 Prihodnost |
| **Skupaj do produkcije** | **~90–130 ur** | |

---

*Dokument temelji na: NACRT_MVP_ARHITEKTURA.md (882 vrstic), LMARENA_PREDLOGSEMINARSKE/ (7+ datotek), HISOFT26/WORD/ (13 datotek, skupaj ~4.000 vrstic dokumentacije).*  
*Generiran: 2026-08-08 z Claude Sonnet 4.6*
