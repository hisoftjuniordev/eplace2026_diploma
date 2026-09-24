# PLAN: Pisanje končnega Word dokumenta diplomske naloge
## ePlače 2026 — Razvoj celovite platforme v spletu za obračun plač

**Avtor:** Miha Bratina | **Šola:** ŠC Nova Gorica VSŠ | **Leto:** 2024/2025  
**Status:** Osnutek v `DIPLOMSKA_NALOGA_OSNUTEK.md` — ta plan definira, kaj razširi, kaj doda in kako strukturira končni Word dokument.

---

## Kako se ta plan bere

Za vsako poglavje je navedeno:
- **Kar je v osnutku** — kaj je že napisano v `DIPLOMSKA_NALOGA_OSNUTEK.md`
- **Kaj razširi** — vsebina, ki jo je treba dodati/poglobiti
- **Viri za razširitev** — katere md datoteke v repozitoriju vsebujejo to vsebino
- **Posebne zahteve** — format, dolžina, stil

---

## Predstran in formalni elementi (pred Poglavjem 1)

### Naslovnica
- Naslov: **Razvoj celovite platforme v spletu za obračun plač**
- Avtor: Miha Bratina, vpisna številka 12194600027
- Šola: ŠC Nova Gorica, Višja strokovna šola
- Smer: Informatika
- Mentor: [dopolni z imenom mentorja]
- Leto: 2024/2025
- Kraj: Nova Gorica

### Zahvala (opcijsko)
Kratka zahvala mentorju, Hisoft IT d.o.o. in kolegom iz prakse.

### Izjava o avtorstvu
Standardna izjava VSŠ o originalnem delu.

### Izjava o uporabi umetne inteligence
Direktno prevzemi iz `11_koncni_dokument_uporaba_ai.md`, **Poglavje 18 (celotno besedilo izjave)**:
> "Pri izdelavi diplomskega dela... Umetna inteligenca ni avtorica diplomskega dela, temveč razvojno orodje..."

### Izvleček (slovenščina + angleščina)
Iz `DIPLOMSKA_NALOGA_OSNUTEK.md` — poglavje "Izvleček" in "Abstract".  
**Razširi:** Dodaj 1-2 stavka o metodologiji (obratno inženirstvo, eksperimentalna potrditev hipotez).  
**Dolžina:** maks. 250 besed vsak.

### Seznam kratic
Iz `DIPLOMSKA_NALOGA_OSNUTEK.md` — poglavje "Seznam kratic".  
**Dodaj:** BQL → BullMQ, ADR → Architecture Decision Record, OCR → Optical Character Recognition.

### Kazalo vsebine
Word samodejno generira iz slogov Naslov 1/2/3. Struktura je 8 poglavij po spodnji shemi.

---

## POGLAVJE 1 — Uvod

### Ciljna dolžina: 4–6 strani

### 1.1 Motivacija in kontekst
**Kar je v osnutku:** Kratek opis Hisoft sistema, 4 pomanjkljivosti (sinhrona arhitektura, varnostne ranljivosti, ročno vnašanje brez validacije, monolitna namizna arhitektura).

**Razširi z:**
- Statistika: 150+ tabel v starem sistemu, OCR analiza 522 zaslonskih okvirjev (`11_koncni_dokument_uporaba_ai.md`, Korak 3/Poglavje 5)
- Praktični kontekst: praksa januar–mars 2026 v Hisoft IT d.o.o., metoda "od plačilne liste nazaj"
- Problem za Slovenijo: zakaj je obračun plač v SLO kompleksen (ZDR-1, ZDoh-2, ZZVZZ, ZDOsk-1, OZP od 1.7.2025)
- Komercialni kontekst: koliko časa je Hisoft IT d.o.o. porabil za odpravljanje napak REK-O (→ motivacija za H2)

**Viri:** `DOKUMENTACIJA.md` (uvodni del), `11_koncni_dokument_uporaba_ai.md` (poglavji 1 in 3)

### 1.2 Cilji naloge
**Kar je v osnutku:** 4 cilji (SaaS platforma, asinhrona arhitektura, Angular validacija, RLS).  
**Razširi:** Dodaj kvantitativne cilje: odzivni čas < 10 ms (H1), stopnja napak 0 % (H2), 0 vrstic pri napačnem tenant (H3).

### 1.3 Tri hipoteze
**Kar je v osnutku:** H1, H2, H3 definirane.  
**Razširi:** Za vsako hipotezo dodaj:
- Milivrednost stanja pred (stari sistem)
- Pričakovan rezultat po (nova platforma)
- Kako bo preizkušena (metodologija meritve)

**Viri:** `EVALVACIJA.md` (evidenca potrjenih hipotez), `TECHNICAL_REPORT.md` (meritve)

### 1.4 Metoda dela
**Novo poglavje — ni v osnutku.** Opiši:
1. Analiza starega sistema (obratno inženirstvo + OCR)
2. Pregled zakonodaje in konkurence
3. Iterativni razvoj (4 razvojne seje, dokumentirane v EVALVACIJA.md)
4. Eksperimentalna potrditev hipotez
5. Produkcijska postavitev in evalvacija

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 2 — Načelo dela), `EVALVACIJA.md` (dnevnik sprememb)

### 1.5 Struktura naloge
Kratek opis vsebine vsakega poglavja (1 stavek na poglavje). Standardni akademski element.

---

## POGLAVJE 2 — Pregled področja in teoretična osnova

### Ciljna dolžina: 6–8 strani

### 2.1 SaaS arhitektura in večnajemniški sistemi
**Novo — ni v osnutku.** Pojasni:
- Kaj je SaaS in zakaj je primeren za obračun plač
- Multi-tenancy modeli: shared DB vs. ločene baze vs. shared DB z RLS
- Zakaj smo izbrali shared DB + RLS (ekonomija, izolacija, enostavnost vzdrževanja)

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 6 — teorija), `DOKUMENTACIJA.md` (arhitekturne odločitve)

### 2.2 Konkurenčna analiza
**Novo — ni v osnutku.** Preglej:
- Obstoječe rešitve: Minimax, Vasco, Birokrat, SAOP iCenter, Pantheon
- Prednosti/slabosti vsake glede na ePlače 2026
- Tabelarična primerjava (vsaj 5 kriterijev: cena, oblak, API, RLS, asinhrono)

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 4 — terciarne reference)

### 2.3 Zakonodajni okvir
**Razširi obstoječe** (trenutno samo omenjeno v osnutku):
- ZDR-1: pravice delavcev, nadure (+30 %), bolniška (80 % do 30 dni)
- ZDoh-2: dohodinska lestvica 2026, olajšave, akontacija
- ZZVZZ + OZP: fiksnih 35 €/mesec od 1.7.2025
- ZDOsk-1: 1,00 % prispevek za dolgotrajno oskrbo
- ZMinP: minimalna plača 1.481,88 € za 2026
- REK-O: struktura obrazca, roki oddaje

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 4), literatura [1]–[5] iz osnutka

### 2.4 Tehnologije
**Preglej izbrane tehnologije z utemeljitvijo:**

| Tehnologija | Verzija | Zakaj |
|------------|---------|-------|
| Angular | 18 | Reactive Forms, Signals, enterprise-grade |
| Node.js | 20 | AsyncLocalStorage, zrela ekosistem |
| TypeScript | 5.x | Tipna varnost pri finančnih izračunih |
| MS SQL Server | 2022 | RLS, Temporal Tables, ACID |
| BullMQ + Redis | latest | Asinhrono procesiranje, razporeditev |
| BigNumber.js | 9.x | Natančna aritmetika brez float napak |

**Vir:** `DOKUMENTACIJA.md` (tehnični sklad), `11_koncni_dokument_uporaba_ai.md` (Poglavje 7)

---

## POGLAVJE 3 — Analiza obstoječega sistema

### Ciljna dolžina: 4–5 strani

### 3.1 Opis starega sistema
**Razširi obstoječe:**
- Starost sistema (15+ let)
- Platforma: Windows Forms / Delphi desktop
- 150+ tabel brez jasnih relacij
- Brez spletnega vmesnika, brez mobilnega dostopa

### 3.2 Metoda analize — obratno inženirstvo
**Novo — ni v osnutku.** Podrobno opiši OCR analizo:
- 522 zaslonskih okvirjev, 442 uspešno prebranih (84,7 % natančnost)
- Metode predprocesiranja: CLAHE, Lanczos x3, ostrenje, PSM 6
- Kaj je bilo pridobljeno: REK-O struktura (A00x, A052-053, A071-075, A081-086, M0x, S0x, B014-017)

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 5)

### 3.3 Identificirane pomanjkljivosti
**Razširi tabelo iz osnutka** z dodatnimi kolumnami: posledica za uporabnika, resnost (1-3):

| Pomanjkljivost | Tehnični vzrok | Posledica | Resnost |
|---------------|---------------|-----------|---------|
| UI zamrzne med obračunom | Sinhrono na glavni niti | Izguba produktivnosti | 3 |
| Brez RLS | Filtriranje samo v aplikaciji | Varnostno tveganje | 3 |
| Brez validacije vnosov | Brez client-side check | 8,4 % napak na REK-O | 2 |
| Namizna arhitektura | Windows-only | Brez WFH, brez mobilnega | 2 |
| Brez histórica | Brez temporalnih tabel | Retroaktivni poračuni nemogoči | 2 |

### 3.4 Obstoječi delovni tok
Diagram obstoječega toka:  
`Kadrovska evidenca → Mesečni parametri → Obračun (sinhrono) → Plačilne liste → REK-O (ročno) → Plačilni nalogi (ročno)`

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 5 — obstoječi delovni tok)

---

## POGLAVJE 4 — Načrtovanje rešitve

### Ciljna dolžina: 8–10 strani

### 4.1 Arhitekturne odločitve (ADR)
**Novo — ni v osnutku.** Za vsako odločitev navedi: Problem → Možnosti → Izbrana rešitev → Zakaj:

**ADR-1: Shared DB z RLS vs. ločene baze**
- Problem: izolacija podatkov pri multi-tenancy
- Možnosti: ločene DB, shared schema, shared DB+RLS
- Izbira: shared DB + MS SQL RLS
- Zakaj: ekonomija (1 instanca), SQL Server nativna podpora, potrjuje H3

**ADR-2: Sinhrono vs. asinhrono procesiranje**
- Problem: obračun za 100+ zaposlenih traja
- Možnosti: thread pool, event loop, message queue
- Izbira: BullMQ + Redis Worker
- Zakaj: Express nit ostane prosta, napredek v živo, potrjuje H1

**ADR-3: Angular vs. React vs. Vue**
- Problem: kompleksni obrazci za računovodje
- Možnosti: React Hook Form, VeeValidate, Angular Reactive Forms
- Izbira: Angular 18 Reactive Forms
- Zakaj: vgrajena validacija, Signals za reaktivnost, enterprise podpora

**ADR-4: BigNumber.js vs. nativni float**
- Problem: zaokrožitvene napake pri finančnih izračunih
- Možnosti: nativni number, Decimal.js, BigNumber.js
- Izbira: BigNumber.js ROUND_HALF_UP
- Zakaj: preprečuje 0.1+0.2≠0.3 tip napak v plačah

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 15 — tri ključne odločitve)

### 4.2 Podatkovna baza — shema
**Kar je v osnutku:** tabela 8 tabel, SQL koda za RLS, Temporalne tabele.  
**Razširi z:**
- ER diagram (narišeš ročno ali uporabiš dbdiagram.io)
- Razlaga normalnih form za vsako tabelo
- Razlaga `payroll_params` — parametrično upravljanje zakonodajnih stopenj

**Vir:** `DOKUMENTACIJA.md` (vse 9 tabel z opisi stolpcev), `RLS_RAZLAGA.md` (celotna razlaga)

### 4.3 Varnostni model
**Razširi obstoječe:**
- JWT lifecycle (izvedba, veljavnost, refresh)
- RBAC vloge: SistemskiAdmin → Skrbnik → Uporabnik (kaj vsaka vloga lahko)
- RLS mehanizem: `fn_securitypredicate` → `SESSION_CONTEXT` → `sp_set_session_context` → `AsyncLocalStorage`
- bcrypt za gesla (cost factor)
- Zod validacija na zaledni strani (dvojna validacija: Angular + Zod)

**Vir:** `RLS_RAZLAGA.md` (celoten dokument), `DOKUMENTACIJA.md` (varnostni sistem)

### 4.4 REST API design
**Kar je v osnutku:** tabela endpointov.  
**Razširi z:**
- Request/Response primeri za ključne endpointe
- Error handling konvencije (HTTP status kode, error format)
- Versioning strategija (/api/v1/)
- Rate limiting za produkcijsko okolje

### 4.5 Dvojni način obračuna — Načrtovanje
**Razširi obstoječe:**
- Način A (fiksna bruto): kdaj se uporablja, pro-rata skaliranje
- Način B (urna postavka): formula, tipi ur (M01–M06), minimalna plača check
- Parametrična tabela `payroll_params`: veljavnost s `veljavno_od` datumom

**Vir:** `PLAN_PAYROLL_REDESIGN.md` (celoten dokument), `DOKUMENTACIJA.md`

---

## POGLAVJE 5 — Implementacija

### Ciljna dolžina: 10–12 strani

### 5.1 Backend arhitektura
**Razširi obstoječe:**
- Slojna arhitektura: Controllers → Services → Repositories → DTOs
- Mapiranje na Express middleware chain
- Error boundary middleware
- Logging in monitoring

**Vir:** `DOKUMENTACIJA.md` (backend plasti), `KAKO_DELUJE.md` (arhitektura)

### 5.2 Obračunski motor — SlovenianPayrollEngine
**Kar je v osnutku:** TypeScript koda motorja (delna).  
**Razširi z:**
- Celoten 23-koračni algoritem (seznam vseh korakov)
- Flowchart diagram obračuna
- Razlaga OZP (35 €/mesec, fiksno od 1.7.2025)
- Razlaga dohodninskelestvice 2026 (5 razredov, mesečni zneski)
- Boniteta vozila B014: formula za izračun
- Primer izračuna za Ano Kovač (2500 €) in Janeza Novaka (2000 €) iz TECHNICAL_REPORT

**Vir:** `TECHNICAL_REPORT.md` (primer izračuna), `KAKO_DELUJE.md` (23-koračni kalkulator)

### 5.3 BullMQ asinhrona arhitektura
**Kar je v osnutku:** osnovna koda Worker in polling.  
**Razširi z:**
- Sequence diagram celotnega asinhronega toka
- Retry logika in error handling v Workerju
- Progress signalizacija prek `payroll_runs.progress_procent`
- Angular Signals polling — kako deluje v komponentah

**Vir:** `KAKO_DELUJE.md` (asinhroni obračunski tok), `DOKUMENTACIJA.md`

### 5.4 Angular sprednji del
**Razširi obstoječe:**
- Struktura Angular aplikacije (lazy loading modulov)
- Standalone Components — zakaj in prednosti
- Signals za upravljanje stanja (primer counter vs. BehaviorSubject)
- Reactive Forms — anatomy forme za delavca (FormGroup, FormControl, Validators)
- HTTP interceptor za JWT

**Vir:** `DOKUMENTACIJA.md` (Angular arhitektura), `KAKO_DELUJE.md`

### 5.5 Čarovnik za dodajanje delavca (3 koraki)
**Novo — ni v osnutku.**  
- Korak 1: Osebni podatki + validacija (davčna, EMŠO, TRR)
- Korak 2: Delovno mesto + bruto osnova
- Korak 3: Pregled in potrditev
- 409 Conflict logika (delavec že obstaja s to davčno)

**Vir:** `KAKO_DELUJE.md` (wizard flow)

### 5.6 Odkrite in odpravljene napake med razvojem
**Razširi obstoječe** (v osnutku samo omenjene):
Tabela vseh 8 napak iz `NAPAKE_IN_POPRAVKI.md` z:
- Šifra napake (N-01 do N-08)
- Opis napake
- Vzrok
- Popravek
- Seia odkritja

**Vir:** `NAPAKE_IN_POPRAVKI.md` (celoten dokument), `TECHNICAL_REPORT.md` (8 bugs section)

---

## POGLAVJE 6 — Integracije

### Ciljna dolžina: 5–6 strani

### 6.1 Strategija integracije
**Novo — ni v osnutku.** Pojasni:
- Katere integracije so polno implementirane (SEPA, VOD, REK-O)
- Katere so arhitekturno načrtovane a ne produkcijsko testirane (eBOL, SPOT, eDavke direktno)
- Zakaj ta razlika (potreba po preizkusnih okoljih državnih portalov)

### 6.2 Migracija podatkov
**Kar je v osnutku:** kratek opis.  
**Razširi z:**
- Konkretni koraki migracije (CSV export → validacija → API import)
- Kako RLS zagotavlja izolacijo med migracijo
- Validacijska pravila za migracijo (davčna, EMŠO, TRR format)

### 6.3 SEPA XML (pain.001.001.03)
**Kar je v osnutku:** XML primer.  
**Razširi z:**
- Pregled ISO 20022 standarda
- Razlaga ključnih elementov (GroupHeader, PaymentInformation, CreditTransferTransactionInfo)
- Primerjava z direktnim bančnim nakazilom (zakaj XML?)

### 6.4 VOD XML
**Kar je v osnutku:** XML primer.  
**Razširi z:**
- Razlaga kontov (470, 220) — dvostavno knjiženje
- Kompatibilnost z Minimax/Vasco

### 6.5 REK-O XML
**Kar je v osnutku:** tabela in koda.  
**Razširi z:**
- Postopek oddaje na eDavke (ročno v tej verziji)
- Razlaga `VrstaDoh: 1001` (plača) vs. drugi tipi dohodkov
- Roki oddaje (do 15. v mesecu za prejšnji mesec)
- Prihodnji korak: direktna oddaja prek FURS Web Service

### 6.6 eBOL in SPOT (arhitekturna zasnova)
**Novo — ni v osnutku.** Opiši:
- eBOL: kako ZZZS pošilja e-bolniške, kakšen API obstaja
- SPOT: SOAP Web Service za podatke o zaposlenih
- Zakaj integracije v tej fazi niso produkcijsko aktivne

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 10)

---

## POGLAVJE 7 — Analiza rezultatov in evalvacija hipotez

### Ciljna dolžina: 6–8 strani

### 7.1 Metodologija merjenja
**Novo — ni v osnutku.** Pojasni:
- Kako so bile meritve izvedene (produkcijsko okolje Railway + Azure SQL)
- Orodja za merjenje (Chrome DevTools, SQL Server Management Studio)
- Kdaj so bile meritve opravljene (datum seje)

### 7.2 Potrditev H1 — Odzivnost asinhronega obračuna
**Kar je v osnutku:** tabela meritev (50/100/500 delavcev) + razlaga.  
**Razširi z:**
- Screenshot ali opis Chrome Network tab (pokazati 202 response time)
- Razlaga zakaj Worker v ločenem procesu ne vpliva na Express
- Primerjava s teoretično mejo (HTTP overhead ~1 ms, JSON serialization ~1 ms, Redis enqueue ~2 ms)

**Vir:** `EVALVACIJA.md` (H1 potrditev), `TECHNICAL_REPORT.md`

### 7.3 Potrditev H2 — Odprava vnosnih napak
**Kar je v osnutku:** tabela primerjave (8,4% → 0,00%).  
**Razširi z:**
- Konkretni primeri napak v starem sistemu (napačna dolžina davčne, napačen TRR)
- Razlaga kako Angular Reactive Forms fizično preprečuje vnos (disabled gumb)
- Prikaz UI stanja: obrazec z napako vs. obrazec brez napake
- Kognitivna razbremenitev (Krug [16] — "Don't Make Me Think" princip)

**Vir:** `EVALVACIJA.md` (H2 potrditev)

### 7.4 Potrditev H3 — Izolacija najemnikov
**Kar je v osnutku:** SQL testni skript + tabela 4 testov.  
**Razširi z:**
- Screenshot rezultatov testne skripta v SSMS ali Azure Query Editor
- Razlaga zakaj RLS je boljši od aplikacijskega filtriranja
- Scenarij napada: kaj bi se zgodilo brez RLS (SQL injection → vsi podatki)
- Sklicevanje na GDPR (Uredba (EU) 2016/679) — varstvo osebnih podatkov

**Vir:** `RLS_RAZLAGA.md` (celoten dokument + FAQ)

### 7.5 Skupna evalvacija in ocena MVP
**Razširi obstoječe:**
- Ocena 8,7/10 iz `EVALVACIJA.md` — utemelji kriterije
- Kaj je bilo načrtovano in realizirano vs. kaj je ostalo za prihodnje
- Stroški: 0 EUR/mesec (Railway free tier, Vercel free, Azure SQL free tier)

**Vir:** `EVALVACIJA.md` (celoten dokument)

---

## POGLAVJE 8 — Zaključek

### Ciljna dolžina: 3–4 strani

### 8.1 Povzetek opravljenega dela
**Kar je v osnutku:** 8 bullet točk dosežkov.  
**Razširi:** Organiziraj v odstavke, ne samo točke. Za vsak dosežek 2-3 stavki s kontekstom.

### 8.2 Potrditev hipotez — povzetek
Kratka tabela vseh treh hipotez z rezultatom:

| Hipoteza | Napoved | Rezultat | Potrjena? |
|---------|---------|----------|-----------|
| H1: odzivni čas | < 10 ms | 4–5 ms | Da ✅ |
| H2: vnosne napake | 0,00 % | 0,00 % | Da ✅ |
| H3: izolacija | 0 vrstic | 0 vrstic | Da ✅ |

### 8.3 Postavitev v produkcijo
**Kar je v osnutku:** tabela infrastrukture.  
**Dodaj:** CD/CI pipeline opis (Railway auto-deploy ob git push, Vercel auto-build)

### 8.4 Smernice za prihodnji razvoj
**Kar je v osnutku:** 6 predlogov.  
**Razširi vsak predlog z:**
- Zakaj je to naslednji logičen korak
- Ocena kompleksnosti implementacije (nizka/srednja/visoka)
- Potencialni vpliv na poslovanje

### 8.5 Osebni prispevek in refleksija
**Novo — ni v osnutku.** Opiši:
- Kaj si se naučil (zakonodaja, TypeScript, arhitektura, BigNumber, RLS)
- Kaj bi naredil drugače (Git od prvega dne, ADR zapisi, zgodnja preveritev parametrov)
- Vrednost prakse v Hisoft IT d.o.o.

**Vir:** `11_koncni_dokument_uporaba_ai.md` (Poglavje 17)

---

## POGLAVJE 9 (posebno poglavje): Uporaba umetne inteligence pri razvoju

### Ciljna dolžina: 4–5 strani  
### ⚠️ OBVEZNO — Šola VSŠ zahteva opis metodologije

### 9.1 Vloga AI pri projektu
Iz `11_koncni_dokument_uporaba_ai.md`, Poglavji 1 in 2 — tri vloge AI (raziskovalec, razvijalec, asistent).

### 9.2 Metodologija dela z AI
Iz `11_koncni_dokument_uporaba_ai.md`, Poglavje 2 — 6 principov (ena stvar naenkrat, kontekst najprej, vse v datoteko, pravne številke z virom, takojšna povratna zanka, brez samodejnega pakiranja).

### 9.3 Koraki izvedbe (kratek pregled)
Povzetek vseh 12 korakov iz `11_koncni_dokument_uporaba_ai.md` (Poglavja 3–14):

| Korak | Opis | Orodje/metoda |
|-------|------|---------------|
| 1 | Uvoz izhodišč | Dispozicija + JSON osnutek |
| 2 | Zbiranje zakonodaje | Splet + strukturiranje |
| 3 | OCR analiza starega sistema | CLAHE + Lanczos + PSM 6 |
| 4 | Teorija in knjižna podlaga | 25 knjig, 5-6 naukov vsaka |
| 5 | Kazalo in struktura | 3 verzije, izbrana hibridna |
| 6 | Načrtovanje baze | 150 → 8 tabel, DDL SQL |
| 7 | Backend + obračunski motor | TypeScript, BullMQ |
| 8 | Integracije | SEPA, VOD, REK-O, eBOL |
| 9 | Angular + HTML prototip | Standalone Components, Signals |
| 10 | Testiranje in meritve | 6 testnih scenarijev, H1-H3 |
| 11 | Pisanje naloge | Poglavje po poglavje |
| 12 | Oblikovanje v Wordu | Slogi Naslov 1/2/3, kazalo |

### 9.4 Delitev dela: jaz vs. AI
Iz `11_koncni_dokument_uporaba_ai.md`, Poglavje 16 — eksplicitna tabela:

| Jaz sem | AI je |
|---------|-------|
| Priskrbel vsa izhodišča (dispozicija, zasloni, izkušnje) | Iskal in strukturiral vire |
| Določal arhitekturo in vsebino | Generiral osnutke kode in besedila |
| Potrjeval vse pravne in finančne vrednosti | Odpravljal sintaktične napake |
| Pregledal vsako vrstico kode | Pripravljal alternativne rešitve |
| Oblikoval Word in bo zagovarjal nalogo | Ni ničesar oddal namesto mene |

### 9.5 Tri ključne odločitve, ki sem jih potrdil sam
Iz `11_koncni_dokument_uporaba_ai.md`, Poglavje 15 — RLS, BullMQ, Angular Reactive Forms.

### 9.6 Izjava o uporabi AI
Uradna izjava iz `11_koncni_dokument_uporaba_ai.md`, Poglavje 18.

---

## Literatura in viri

**Kar je v osnutku:** 25 referenc [1]–[25].  
**Razširi z:**
- Preveri vse URL-je (nekatere so bile zapisane z razmiki iz PDF ekstrakcije — popravi)
- Dodaj formatiranje po IEEE ali APA standardu (glede na zahteve šole)
- Dodaj datume dostopa za spletne vire

---

## Priloge

### Priloga A: SQL skripta za kreiranje baze podatkov
**Kar je v osnutku:** celotna DDL skripta.  
**Razširi z:** komentirane sekcije, razlaga RLS setup na koncu.

### Priloga B: Primer izračuna za Janeza Novaka
**Kar je v osnutku:** tabela izračuna.  
**Dodaj:** Primer za Ano Kovač (2500 € bruto) iz `TECHNICAL_REPORT.md`.

### Priloga C: Testni rezultati (novo)
Tabele iz `TECHNICAL_REPORT.md`:
- E2E test results (8 testov)
- H1 meritve (tabela odzivnih časov)
- H3 SQL testna skripta z rezultati

### Priloga D: Arhitekturni diagrami (novo)
- Sistemski arhitekturni diagram (tiers)
- ER diagram baze (8 tabel)
- Asinhroni tok BullMQ (sequence diagram)
- RLS mehanizem (flow)

---

## Navodila za oblikovanje v Wordu

```
Naslov 1:  Calibri 16pt, krepko, Nova vrstica pred: 18pt, za: 6pt
Naslov 2:  Calibri 13pt, krepko, Nova vrstica pred: 12pt, za: 4pt
Naslov 3:  Calibri 11pt, krepko, poševno
Osnovno:   Calibri 11pt, normalno, razmik 1.15, zamik prve vrstice 1.25 cm
Koda:      Courier New 9pt, okvir sive barve (#f5f5f5), razmik 1.0
Tabela:    Calibri 10pt, glava krepko, menjavajoče sive vrstice
Robovi:    Zgornji 2.5 cm, spodnji 2.5 cm, levo 3.0 cm, desno 2.0 cm
Oštevilčevanje strani: spodaj desno, od strani 1 naprej (naslovnica brez)
```

---

## Vrstni red pisanja (priporočeno)

1. **Najprej** Poglavje 4 (Načrtovanje) — osnova za vse ostalo
2. **Nato** Poglavje 5 (Implementacija) — tehnična jedro naloge
3. **Nato** Poglavje 7 (Analiza rezultatov) — potrjevanje hipotez
4. **Nato** Poglavje 3 (Analiza starega sistema) — kontekst za bralca
5. **Nato** Poglavje 2 (Pregled področja) — teorija in literatura
6. **Nato** Poglavje 6 (Integracije) — dopolnitev implementacije
7. **Nato** Poglavje 8 (Zaključek) — seštevek
8. **Nato** Poglavje 9 (Uporaba AI) — metodološki dodatek
9. **Na koncu** Poglavje 1 (Uvod) — pišeš ga zadnjega, ko veš, kaj je celota
10. **Zadnje** Formalni elementi (izvleček, kazalo, kazalo slik)

---

## Viri v repozitoriju

| Datoteka | Vsebina | Poglavje(a) |
|---------|---------|------------|
| `DIPLOMSKA_NALOGA_OSNUTEK.md` | Celoten osnutek iz PDF | VSA |
| `11_koncni_dokument_uporaba_ai.md` | Opis metodologije + izjava | Uvod, Poglavje 9 |
| `DOKUMENTACIJA.md` | Arhitektura, DB, API, Angular | 4, 5 |
| `TECHNICAL_REPORT.md` | Meritve, primeri, napake, testi | 5, 7, Priloge |
| `EVALVACIJA.md` | Potrditev H1-H3, dnevnik | 7 |
| `RLS_RAZLAGA.md` | Detajli RLS, FAQ | 4.3, 7.4 |
| `KAKO_DELUJE.md` | Arhitektura, flow, kalkulator | 5 |
| `NAPAKE_IN_POPRAVKI.md` | Bug log N-01–N-08 | 5.6 |
| `PLAN_PAYROLL_REDESIGN.md` | Dual-Mode obračun | 4.5, 5.2 |
| `RAZVOJ_IN_TESTIRANJE.md` | Tech stack, migracije, testi | 5, 7 |
| `DEPLOYMENT_LOG_30082026.md` | Produkcijska postavitev | 8.3 |
| `README.md` | Pregled projekta | Uvod |

---

## Ocena obsega

| Poglavje | Strani |
|---------|--------|
| Formalni elementi | 5 |
| 1. Uvod | 5 |
| 2. Pregled področja | 7 |
| 3. Analiza starega sistema | 5 |
| 4. Načrtovanje | 10 |
| 5. Implementacija | 12 |
| 6. Integracije | 6 |
| 7. Analiza rezultatov | 7 |
| 8. Zaključek | 4 |
| 9. Uporaba AI | 5 |
| Literatura | 3 |
| Priloge | 6 |
| **SKUPAJ** | **~75 strani** |

---

*Plan ustvarjen: 10. 9. 2026 | Osnova: `2Diplomska_naloga.pdf` (37 strani, osnutek) + vsi `.md` dokumenti v repozitoriju*
