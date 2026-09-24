# Kako sem pri razvoju ePlače 2026 uporabljal umetno inteligenco — podrobni končni opis

**Naslov diplomske naloge:** Razvoj celovite platforme v spletu za obračun plač
**Študent:** Miha Bratina
**Ustanova:** Šolski center Nova Gorica, Višja strokovna šola, program Računalništvo in informatika
**Čas izvajanja:** Praksa januar, februar, marec 2026
**Verzija dokumenta:** končna, podrobna (dopolnjena)

Namen tega dokumenta je podati popoln, časovno in vsebinsko natančen opis, kako sem pri vseh fazah diplomske naloge in prototipnega razvoja platforme ePlače 2026 uporabljal orodja umetne inteligence. Za razliko od prejšnjih osnutkov ta dokument pri vsakem koraku odgovori na vsa vprašanja: *kaj sem imel kot izhodišče, kdaj sem delal, kako sem vprašal AI, kaj mi je AI vrnil, kako sem preveril pravilnost, kaj sem popravil in kako sem dobljeni rezultat posredoval naprej v naslednjo fazo*. Pri vsem tem ni olepšav — vse netočnosti in napake, ki so nastale na poti, so eksplicitno omenjene.

---

## Začetna izhodišča (pred prvim pozivom AI)

Preden sem sploh odprl klepet z AI, sem imel na mizi naslednje:

- Potrjeno dispozicijo diplomske naloge v obliki PDF in TXT datoteke (`Dispozicija_mbratina2rai.pdf`, `NACRTMIHA.txt`). V dispoziciji je bilo že jasno določeno: cilj je spletna SaaS prenova obstoječega Hisoft sistema, tehnološki sklad Angular + Node.js + MS SQL Server, tri hipoteze ter struktura osmih poglavij.
- Lasten osnutek v JSON datoteki (`diploma_draft (4).json`), kjer sem popisal motivacijo, da sem začetnik v razvoju plačnih sistemov, da želim narediti pilotni projekt, ki bi ga bilo mogoče sčasoma prodajati, da bom pri delu uporabljal sodelavce z dvajsetimi leti izkušenj in da bom metodo dela obrnil »od plačilne liste nazaj«.
- Dostop do obstoječega produkcijskega okolja na praksi: nameščen stari namizni program (.exe, Visual Basic/.NET, MS SQL baza), ki so ga sodelavci uporabljali za dejanske stranke.
- Serijo posnetkov zaslonov starega programa, ki sem jih naredil sam — meniji, okna za obračun, plačilne liste, REK-O obrazce, SEPA naloge. Ti posnetki so bili kasneje osnova za OCR analizo.
- Lastno skromno predhodno znanje: sem inženir informatike, a nimam dolgoletnih izkušenj z razvojem celovitih ERP/sistemov, prav tako nisem poznal vseh členov slovenske plačne zakonodaje do potankosti.

Cilj je bil jasen: s pomočjo AI kot raziskovalnega in razvojnega pomočnika v treh mesecih prakse priti od zgoraj navedenih izhodišč do (1) popolne tehnične specifikacije, (2) delujočega HTML prototipa, (3) napisanih vseh osmih poglavij diplome in (4) vsega gradiva, pripravljenega za končno pretvorbo v Word in zagovor.

Pravila, ki sem si jih zastavil že na začetku in sem se jih držal do konca, so bila:
- Vsi pozivi AI-ju bodo v slovenščini.
- Ena jasna naloga na en poziv.
- Vsak rezultat mora biti takoj shranjen v datoteko v ustrezni mapi.
- Vsako pravno ali finančno številko je treba potrditi z uradnim virom.
- ZIP paket se bo naredil šele, ko bom jaz izrecno ukazal.
- Jaz sem tisti, ki odloča; AI predlaga, jaz potrjujem ali popravim.

---

## Korak 1 — Razčlenitev dispozicije (prvi teden januarja 2026)

**Kaj sem imel kot izhodišče:** Datoteki dispozicije v PDF in TXT obliki ter lasten JSON osnutek.

**Kako sem vprašal AI:** V klepet sem nalozil TXT dispozicije in JSON osnutek ter napisal približno tako:
> "To je moja uradna dispozicija in to je moj osebni osnutek. Prosim razčleni mi: točen naslov, oris problematike, cilji, tri hipoteze, predpisana metoda dela in struktura 8 poglavij. Ne dodajaj ničesar svojega, zapiši samo tisto, kar je že napisano, vendar strukturirano."

**Kaj je AI vrnil:**
- Strukturiran markdown dokument, kjer je bil vsak del dispozicije izpisan pod svojim naslovom.
- Opomba, da je ustanova po mojem JSON-u Šolski center Nova Gorica in ne UL FRI (AI je to sam pravilno ugotovil, ker sem v kasnejši fazi po pomoti naložil navodila, ki so omenjala FRI).

**Kako sem preveril in popravil:**
- Primerjal sem dobljeni povzetek **besedo za besedo** z izvirno dispozicijo, zlasti pri ciljih in hipotezah.
- Tam, kjer je AI preveč splošno formuliral cilj "80 % manj ročnega dela", sem ga popravil, da se je glasil natančno tako kot v dispoziciji.
- Potrdil sem, da so vse tri hipoteze zapisane natančno tako, kot sem jih jaz postavil (asinhronost, Angular/Reactive Forms, RLS varnost v bazi).

**Kaj sem naredil z rezultatom za naprej:**
- Rezultat sem shranil kot `01_dispozicija_original.txt` in `00_eplace_razvojni_plan_od_nule.md`.
- **To datoteko sem nato priložil kot kontekst v VSAH nadaljnjih pozivih**, da se AI ni oddaljil od dispozicije.
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\01_dispozicija_in_nacrt_dela\01_dispozicija_original.txt — 2026-08-08 10:19 — 3,9 KB
- LMARENA_PREDLOGSEMINARSKE\01_dispozicija_in_nacrt_dela\02_krovni_nacrt_dela.md — 2026-08-08 10:19 — 7,1 KB *(= 0_eplace_razvojni_plan_od_nule.md)*
- LMARENA_PREDLOGSEMINARSKE\01_dispozicija_in_nacrt_dela\03_diagrami_poteka_diplome.md — 2026-08-08 10:19 — 10,6 KB
- diploma_draft.json *(xcvcx root)* — 2026-08-25 20:10 — 8,3 KB
- Dispozicija_mbratina2rai.pdf *(xcvcx root)* — 2026-09-03 18:51 — 240,3 KB

---

## Korak 2 — Zbiranje virov in zakonodaje (drugi teden januarja)

**Izhodišče:** Potrjeni krovni načrt iz koraka 1.

**Kako sem vprašal AI:**
> "Pripravi mi MD datoteko s slovenskimi URL viri za obračun plač, ki jih bom potreboval za razvoj. Razdeli jih na zakone (PISRS), davčne obrazce (FURS), integracije (SPOT, ZZZS), bančne izvoze (SEPA) in konkurenco (Minimax, Vasco, Birokrat itd.). Za vsak URL na kratko napiši, za kaj ga bom potreboval."

**Kaj je AI vrnil:**
- Seznam primarnih virov: PISRS zakoni (ZDR-1, ZDoh-2, ZZVZZ, ZPIZ-2, ZDOsk-1, ZMinP, ZEPDSV, ZIZ, Uredba o davčni obravnavi povračil stroškov), FURS stran za REK obrazce, eDavki portal in REK-O navodila, SPOT portal z eNDM dokumentom, ZZZS eBOL, ZBS SEPA standardi in Halcom SEPA dokumentacija.
- Seznam sekundarnih virov (Optius, Seja.si, IUS-INFO za razlago členov).
- Seznam terciarnih virov (strani za pomoč Minimaxa, Vasca, Birokrata, SAOP iCentra, Pantheona, e-računov, Kope).

**Kako sem preveril in popravil:**
- Odprl sem vsaj po en URL iz vsake skupine in potrdil, da je dostopen in da dejansko vsebuje obljubljeno vsebino.
- Ko je AI v prvem osnutku navedel vrednost minimalne plače **1.253,90 €**, sem to takoj opazil — to je bila vrednost za leto 2024. Ukazal sem: "Poišči novo vrednost za 2026 na Uradnem listu." AI je ponovno iskal in našel **1.481,88 € bruto** (Uradni list RS št. 6 z dne 30. 1. 2026), kar je ustrezalo približno 8,56 € na uro. To vrednost sem potrdil in ukazal, naj jo posodobi v vseh že nastalih dokumentih.
- Podobno sem preveril malico (7,96 € na dan), prevoz (0,21 € na km) in višine prispevkov.

**Končne delovne konstante, ki so bile potrjene v tem koraku:**
- Minimalna plača 2026: 1.481,88 € bruto, ~8,56 €/h, polni sklad ur 174.
- Prehrana/malica: 7,96 €/dan neobdavčeno.
- Prevoz: 0,21 €/km.
- Prispevki delojemalca: PIZ 15,50 %, ZZ 6,36 %, starševstvo 0,10 %, brezposelnost 0,14 %, dolgotrajna oskrba 1,00 % (skupaj 23,10 %) ter fiksni OZP 35,00 €.
- Prispevki delodajalca: PIZ 8,85 %, ZZ 6,56 %, starševstvo 0,10 %, brezposelnost 0,06 %, poškodbe 0,53 %, dolgotrajna oskrba 1,00 % (skupaj okoli 17,10 %).
- Nadure najmanj +30 % (130 %), bolniška do 30 dni delodajalec plača 80 % osnove, nad tem ZZZS refundacija; dopust 100 % povprečja zadnjih treh mesecev po ZDR-1 137. členu.

Pri dolgotrajni oskrbi sem naletel na nedoslednost: iz OCR-ja je bilo na starem obrazcu videti 0,07 % oz. 2 €, zakon ZDOsk-1 pa določa 1,00 %. Odločil sem se, da v kodi uporabim 1,00 %, nedoslednost pa izrecno zapišem v dokumentaciji.

**Kako sem rezultat posredoval naprej:**
- Vse virovne datoteke sem shranil v mapi `03_zakonodajno_in_matematicno_jedro` (ključne besede, matematične formule, 300 virov, poglobljeni viri).
- **Te datoteke sem nato priložil AI-ju**, ko sem od njega zahteval matematične formule obračuna in pozneje še pisal obračunski motor.
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\03_zakonodajno_in_matematicno_jedro\01_kljucne_besede_place.md — 2026-08-08 10:19 — 13,4 KB
- LMARENA_PREDLOGSEMINARSKE\03_zakonodajno_in_matematicno_jedro\02_matematicne_formule_place.md — 2026-08-08 10:19 — 10,4 KB
- LMARENA_PREDLOGSEMINARSKE\03_zakonodajno_in_matematicno_jedro\03_viri_dokumentacija_300.md — 2026-08-08 10:19 — 25,1 KB
- LMARENA_PREDLOGSEMINARSKE\03_zakonodajno_in_matematicno_jedro\04_obracun_plac_viri_poglobljeno.md — 2026-08-08 10:19 — 20,5 KB
- LMARENA_PREDLOGSEMINARSKE\03_zakonodajno_in_matematicno_jedro\05_viri_iskanje_place.md — 2026-08-08 10:19 — 8,0 KB
- 4_slovenske_eplace_zakonodajni_viri.md *(xcvcx root + diplomska_v2)* — 2026-08-19 21:39 — 5,9 KB

---

## Korak 3 — Analiza starega sistema z OCR (konec januarja)

**Izhodišče:** Zbrani viri iz koraka 2 ter lastni posnetki zaslonov starega programa.

**Kaj sem naredil sam, preden sem AI kaj dal:**
- Posnetke zaslonov sem sem predprocesiral s preprostimi orodji za obdelavo slik: izboljšava kontrasta (CLAHE), trikratna povečava z algoritmom Lanczos in ostrenje. Za samo razpoznavanje sem uporabil Tesseract z načinom PSM 6 (ena stolpčna postavitev besedila). Rezultat je bil 442 od 522 uspešno prebranih okvirjev.
- Surovi OCR izpis sem shranil kot `08_OCR_ANALIZA_V2_NOVI_SCAN.md` in napisal še lasten pregled trenutnega stanja frontend vmesnika (`Poglavje_Pregled_trenutnega_frontend_dela.md`).

**Kako sem vprašal AI:**
> "V prilogi ti dam OCR izpise starega programa za obracun plac in opis menijev. Prosim izlusci vse REK-O polja (A00x, A05x, A07x, A08x, M0x, S0x, B0xx), opisi delovni tok od kreiranja delavca do izvoza SEPA in identificiraj ozka grla starega sistema."

**Kaj je AI vrnil:**
- Strukturiran seznam REK-O polj po skupinah: A001 davčna številka, A002 priimek, A003 ime, A004 rezident, A014 invalid nad kvoto, A017 nad 60 let, A019/A020 določen čas, A021 nedoločen čas; A052/A053 dohodek, vrsta dohodka 1001; A071–A075 prispevki delojemalca; A081–A086 prispevki delodajalca; M01–M10 plačne postavke; S0x statistika; B014 službeno vozilo in ostale bonitete.
- Opis delovnega toka: kadrovska evidenca → parametri mesečnega obračuna → izvedba obračuna → plačilne liste → REK-O → plačilni nalogi → dodatni izpisi.
- Seznam ozkih grl: Windows-form vmesnik z veliko ročnega klikanja, 150+ razpršenih tabel brez relacij, pomanjkanje izolacije med podjetji, sinhrono zamrzovanje med preračuni.

**Kako sem preveril:**
- Ker jaz starega sistema poznam iz prakse, sem vsako izluščeno polje in vsak korak delovnega toka ročno preveril. Našel sem nekaj napak pri šifrah postavk (na primer M04 je bil v prvem osnutku napačno označen kot dopolnilno delo, pravilno je dopust, M05 pa bolniške), in to sem popravil.

**Kako sem rezultat posredoval naprej:**
- Shranil sem `03_eplace_frontend_ocr_mapped.md` in funkcionalno analizo konkurence.
- **Tej datoteki z mapiranjem polj sem dal AI-ju kot izhodišče**, ko sem kasneje naročil Angular specifikacijo in TypeScript vmesnike.
- Seznam ozkih grl sem dal naprej kot osnovo za fazo načrtovanja baze in pisanje poglavja 3 diplome (Analiza starega sistema).
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\06_sprednji_sistemi_frontend\03_eplace_frontend_ocr_mapped.md — 2026-08-08 10:19 — 23,2 KB
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\POGLAVJE_3_analiza_starega_sistema.md — 2026-08-08 18:32 — 9,7 KB
- LMARENA_PREDLOGSEMINARSKE\02_analiza_trga_in_konkurence\01_obracun_plac_slovenija.md — 2026-08-08 10:19 — 8,0 KB
- LMARENA_PREDLOGSEMINARSKE\02_analiza_trga_in_konkurence\02_obracun_plac_primerjava.md — 2026-08-08 10:19 — 11,5 KB

---

## Korak 4 — Teoretična podlaga in knjižna osnova (začetek februarja)

**Izhodišče:** Seznam ozkih grl in cilji iz dispozicije.

**Kako sem vprašal AI:**
> "Pripravi mi seznam priblizno 25 knjig, ki so relevantne za razvoj SaaS aplikacije za obracun plac (arhitektura, cista koda, varnost, baze, UX, testiranje). Za vsako knjigo izpisi 5 do 6 konkretnih nasvetov, ki jih bom lahko direktno uporabil za ePlace in za utemeljitev mojih treh hipotez."

**Kaj je AI vrnil:**
- Seznam 25 knjig (Kleppmann *Designing Data-Intensive Applications*, Martin *Clean Architecture*, Richards/Ford *Fundamentals of Software Architecture*, Newman *Building Microservices*, Evans *Domain-Driven Design*, Fowler *Patterns of Enterprise Application Architecture*, in drugi).
- Za vsako knjigo 5–6 nasvetov, prilagojenih ePlačam (npr. uporaba ACID transakcij, ker gre za finančne podatke; čista arhitektura, kjer je obračunski motor brez odvisnosti od baze; modularni monolit na začetku; RLS kot varnostni mehanizem na nivoju baze).
- Dodatno je AI pripravil datoteko s teoretičnimi utemeljitvami treh hipotez in opisom vsake uporabljene tehnične komponente (Redis, BullMQ, RLS, Angular Signals, Reactive Forms).

**Kako sem preveril:**
- Pregledal sem izpiske knjig in izbral tiste nasvete, ki so dejansko uporabni za ePlače. Nasvete, ki niso relevantni (npr. raznorazne fancy skalabilne vzorce za Google-velikost), sem izpustil.
- Pri hipotezah sem popravil eno pomembno netočnost: AI je v prvem osnutku RLS opisal kot "CRUD pravice na nivoju objektov", kar je narobe. Popravil sem pojasnilo, da RLS filtrira vrstice na podlagi `SESSION_CONTEXT(N'tenant_id')` in da je to bistveno močnejši mehanizem kot aplikacijski filtri.

**Kako sem rezultat posredoval naprej:**
- Shranil sem `07_seznam_knjig_razvoj_softwara.md`, `08_izvlecek_znanj_knjige.md` in datoteke s teorijo hipotez in komponent.
- **Teorijo iz knjig sem nato priložil kot utemeljitev**, ko sem od AI zahteval arhitekturne odločitve za bazo in backend, pa tudi pozneje pri pisanju poglavja 2 (Tehnična arhitektura).
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\07_seznam_knjig_razvoj_softwara.md — 2026-08-08 10:19 — 10,5 KB
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\08_izvlecek_znanj_knjige.md — 2026-08-08 10:19 — 25,8 KB

---

## Korak 5 — Načrt diplome in kazalo (začetek februarja)

**Izhodišče:** Vse do zdaj zbrane informacije.

**Kako sem vprašal AI:**
> "Iz zgornje dispozicije in iz vsega kar sva do zdaj pripravila naredi mi tri razlicice kazala: eno enostavno, eno bolj znanstveno z metodologijo in meritvami ter eno hibridno. Za vsako poglavje pripravi seznam vprasanj, na katere mora besedilo odgovoriti (kaj, zakaj, kako, zakaj tako in ne drugace)."

**Kaj je AI vrnil:**
- Tri različice kazala, ki so vse 1:1 sledile osmim poglavjem iz dispozicije.
- Delovni zvezek z odprtimi vprašanji po poglavjih in statusi.
- Predlog za raziskovalno vprašanje ter merljive kriterije za vsako hipotezo (H1: odzivnost API-ja med obračunom, H2: število zavrnjenih napačnih vnosov, H3: uspešnost RLS pri poizkusu branja tujih podatkov).

**Kako sem preveril:**
- Kazalo sem primerjal z dispozicijo in preveril, da ni izpuščeno nobeno poglavje in da ni dodano ničesar, česar dispozicija ne predvideva. Izbral sem hibridno različico kot končno.

**Kako sem rezultat posredoval naprej:**
- Kazalo in delovni zvezek sem shranil v mapo `01_dispozicija_in_nacrt_dela`.
- **To kazalo sem uporabljal kot kontrolni seznam** v vseh nadaljnjih fazah pisanja: vsakič, ko je bilo eno poglavje končano, sem ga v delovnem zvezku označil kot opravljeno.
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\01_dispozicija_in_nacrt_dela\05_struktura_diplome_vprasanja.md — 2026-08-08 10:19 — 5,2 KB *(vprašanja po poglavjih)*
- LMARENA_PREDLOGSEMINARSKE\01_dispozicija_in_nacrt_dela\06_enostavno_kazalo_diplome.md — 2026-08-08 10:19 — 3,1 KB
- LMARENA_PREDLOGSEMINARSKE\01_dispozicija_in_nacrt_dela\07_eplace_delovni_zvezek_diploma.md — 2026-08-08 10:19 — 8,2 KB *(delovni zvezek z odprtimi vprašanji)*
- LMARENA_PREDLOGSEMINARSKE\01_dispozicija_in_nacrt_dela\08_popravljene_hipoteze_odgovori.md — 2026-08-08 10:19 — 7,3 KB
- LMARENA_PREDLOGSEMINARSKE\01_dispozicija_in_nacrt_dela\04_eplace_kartice_za_izdelavo.md — 2026-08-08 10:19 — 3,1 KB

---

## Korak 6 — Podatkovna baza: od 150 tabel do 8 (sredina februarja)

**Izhodišče:** Analiza starega sistema iz koraka 3, teorija iz knjig iz koraka 4.

**Kako sem vprašal AI:**
> "Ne pisi kode. Na podlagi tega, kar sva ugotovila o starem sistemu, mi naredi predlog normalizirane baze. Stari sistem ima 150+ razprsenih tabel. Novi model naj bo preprost, primeren za SaaS (multi-tenancy), podpira naj RLS za izolacijo podjetij in temporalne tabele za zgodovino. Utemelji zakaj tako in zakaj ne drugace."

**Kaj je AI vrnil:**
- Predlog osmih osnovnih tabel: `tenants`, `users`, `job_positions`, `employees`, `monthly_hours`, `payroll_runs`, `payroll_lines`, `audit_logs`.
- Fizikalni dizajn za vsako tabelo: polja, tipi (`DECIMAL(10,4)` za zneske, brez `FLOAT`), primarni in tuji ključi, indeksi.
- Utemeljitve: zakaj RLS v bazi in ne aplikacijski filtri (ker RLS deluje tudi ob hrošču aplikacije ali neposredni povezavi na bazo), zakaj skupna shema in ne baza-na-najemnika (enostavnejše centralno posodabljanje zakonodaje), zakaj temporalne tabele in ne ročna zgodovina (avtomatičen in zanesljiv revizijski sled).

Nato sem vprašal še:
> "Zdaj na podlagi tega dizajna napisi DDL SQL skripto za MS SQL Server, ki vkljucuje RLS politike, SESSION_CONTEXT, SYSTEM_VERSIONING temporalne tabele in pravilne tipe."

AI je vrnil delujoč DDL. V poznejši fazi (začetek marca) sem AI dal še svoj ročno napisan načrt za **Dual-Mode obračun** (fiksni bruto ali urna postavka) in ukazal:

> "Dodaj v tabelo employees stolpec urna_postavka, v monthly_hours m04_dopust_ure in m05_bolniske_ure, v payroll_params MINIMALNA_PLACA=1481.88 in v payroll_lines stolpce za zneske rednega dela, dopusta, bolniske in nadur. Za vsak dodan stolpec utemelji pomen in dodaj preverbo minimalne place."

AI je vrnil razširjen DDL in formulo za parametrični izračun:
- `redno = urna_postavka × redne ure`
- `dopust = urna_postavka × ure dopusta` (100 %)
- `bolniska = urna_postavka × 0,80 × ure bolniške` (80 %, delodajalec do 30 dni)
- `nadure = urna_postavka × 1,30 × ure nadur` (130 %)
- `bruto_1 = vsota vseh štirih`
- Preverba: bruto ne sme biti manjši od `MINIMALNA_PLACA × (dejanske ure / 174)`, sicer napaka.

**Kako sem preveril:**
- Preveril sem, da so imena polj usklajena z REK-O šiframi (M01, M03, M04, M05, M07, S08), ki smo jih dobili v OCR fazi.
- Preveril sem, da RLS politika pravilno filtrira po `tenant_id` in da temporalne tabele vključujejo sistemska stolpca za veljavnost od/do.
- Preveril sem, da formula za parametrični izračun ustreza zakonu (dopust 100 %, bolniška 80 %, nadure 130 %).

**Kako sem rezultat posredoval naprej:**
- Shranil sem `01_mssql_schema_ddl.sql`, specifikacije baze in pogosta vprašanja "zakaj tako".
- **DDL in opis osmih tabel sem dal AI-ju kot izhodišče za pisanje backend specifikacije**, da se je backend povsem ujemal z bazo.
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\04_podatkovni_sloj_database\01_mssql_schema_ddl.sql — 2026-08-08 10:19 — 10,6 KB *(izvorni DDL osnutek)*
- LMARENA_PREDLOGSEMINARSKE\04_podatkovni_sloj_database\02_eplace_database_schema_spec.md — 2026-08-08 10:19 — 15,2 KB *(specifikacija baze)*
- eplace2026\database\02_rls.sql — 2026-08-08 22:33 — 1,6 KB *(RLS politike)*
- eplace2026\database\03_temporal.sql — 2026-08-08 22:33 — 0,8 KB *(temporalne tabele)*
- eplace2026\database\01_schema.sql — 2026-08-17 18:55 — 9,6 KB *(končna shema)*
- eplace2026\database\05_alter.sql — 2026-08-17 20:11 — 8,0 KB *(razširitev za Dual-Mode)*
- eplace2026\database\06_payroll_params.sql — 2026-08-17 21:20 — 6,1 KB *(zakonodajni parametri)*
- eplace2026\database\07_alter2.sql — 2026-08-19 21:59 — 3,7 KB *(urna postavka + dopust/bolniška)*
- eplace2026\database\04_seed.sql — 2026-08-17 18:55 — 8,1 KB *(testni podatki)*

---

## Korak 7 — Backend, API in obračunski motor (konec februarja)

**Izhodišče:** Dokončan podatkovni model in DDL iz koraka 6.

**Kako sem vprašal AI:**
> "Na osnovi pripravljene baze mi napisi backend spec za Node.js, TypeScript in Express. Zelim clean architecture: Controllers -> Services -> Repositories -> DTO. Vkljuci JWT avtentikacijo, RBAC vloge, AsyncLocalStorage za prenasanje tenant_id, verzijske API poti /api/v1. Posebej opisi obracunski motor in asinhrono obdelavo z BullMQ in Redis za mnozicne obracune."

**Kaj je AI vrnil:**
- Celovito specifikacijo slojev, vmesnikov in toka zahteve.
- Varnostni tok: prijava → JWT → RBAC → `AsyncLocalStorage` z `tenant_id` → SQL poizvedba v kontekstu RLS.
- Opis obračunskega motorja kot čistega TypeScript modula brez odvisnosti, z uporabo BigNumber.js za natančno aritmetiko, ločenimi vejami za fiksni in parametrični obračun ter preverbo minimalne plače.
- Opis asinhronega cevovoda: Express sprejme zahtevo → delo se zapiše v BullMQ vrsto → takoj se vrne 202 Accepted → Worker v ozadju obdela zaposlene → napredek v odstotkih se zapisuje v Redis → Angular ga prikazuje prek WebSocket.
- Načrt integracij: SPOT (SOAP), ZZZS eBOL, FURS REK-O XML, SEPA pain.001, VOD XML za Minimax/Vasco.

**Kako sem preveril:**
- Preveril sem, da formule v motorju ustrezajo vsem odstotkom in vrednostim, ki smo jih potrdili v koraku 2.
- Preveril sem, da `AsyncLocalStorage` dejansko pravilno prenaša kontekst do SQL poizvedb, da RLS ne bi zašel.
- Preveril sem, da je tok BullMQ skladen s hipotezo H1 (neblokiranje vmesnika).

**Kako sem rezultat posredoval naprej:**
- Shranil sem backend spec in middleware/API spec v mapo `05_zaledni_sistemi_backend`.
- **Backend spec in podatkovni model sem dal AI-ju kot vhod**, ko sem naročal frontend specifikacijo, da se je frontend popolnoma ujemal z API vmesniki in bazo.
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\05_zaledni_sistemi_backend\01_eplace_backend_detailed_spec.md — 2026-08-08 10:19 — 13,6 KB
- LMARENA_PREDLOGSEMINARSKE\05_zaledni_sistemi_backend\02_eplace_middleware_engine_api.md — 2026-08-08 10:19 — 10,0 KB
- eplace2026\backend\src\engine\slovenian-payroll-engine.ts — 2026-08-19 22:00 — 8,4 KB *(obračunski motor)*
- eplace2026\backend\src\workers\payroll.worker.ts — 2026-08-19 22:01 — 4,4 KB *(BullMQ delavec)*
- eplace2026\backend\src\queues\payroll.queue.ts — 2026-08-08 22:36 — 0,4 KB
- eplace2026\backend\src\controllers\auth.controller.ts — 2026-08-17 20:16 — 1,8 KB *(JWT)*
- eplace2026\backend\src\controllers\payroll.controller.ts — 2026-08-25 20:20 — 2,5 KB
- eplace2026\backend\src\controllers\export.controller.ts — 2026-08-25 20:22 — 5,1 KB *(REK-O, SEPA, VOD)*
- eplace2026\backend\src\types\interfaces.ts — 2026-08-19 21:59 — 5,5 KB *(TypeScript vmesniki)*
- eplace2026\backend\src\middleware\auth.middleware.ts — 2026-08-08 22:34 — 0,6 KB
- eplace2026\backend\src\xml\reko.generator.ts — 2026-08-19 20:50 — 3,9 KB *(REK-O XML)*
- eplace2026\backend\src\xml\sepa.generator.ts — 2026-08-17 20:50 — 3,2 KB *(SEPA pain.001)*
- eplace2026\backend\src\xml\vod.generator.ts — 2026-08-17 20:50 — 4,5 KB *(VOD XML)*

---

## Korak 8 — Frontend: Angular in HTML prototip (začetek marca)

**Izhodišče:** OCR mapiranje REK-O polj iz koraka 3, backend spec iz koraka 7.

**Kako sem vprašal AI:**
> "Zdaj mi pripravi Angular spec za frontend. Uporabi Angular 18+, Standalone Components, Reactive Forms, Angular Signals, Tailwind CSS. Preslikaj vsa REK-O polja iz OCR analize v komponente (obrazec za delavca, mesečna tabela ur, pregled prispevkov, boniteta vozila, plačilna lista). Dodaj UX pravila za racunovodje (gosta tabela, delo s tipkovnico, jasna stanja obracuna). Poleg tega mi naredi en samostojen HTML MVP (ena datoteka, brez nameščanja), ki bo simuliral celoten potek in bo imel na desni inženirski dnevnik, kjer se izpisujejo [DB], [MID], [ENGINE], [API] koraki."

**Kaj je AI vrnil:**
- Angular specifikacijo s komponentami, vmesniki, validacijskimi pravili in UX praksami.
- Eno samo HTML datoteko `eplace_mvp.html` z Tailwind CDN, FontAwesome ikonami in vanilla JavaScript, ki je simulirala prijavo, vnos delavca, zagon asinhronega obračuna, prikaz plačilne liste, REK-O pregled, SEPA izvoz in bruto–neto kalkulator z vsemi polji (bruto, rezident, olajšava, otroci, OZP, boniteta vozila, malica, prevoz).

**Kaj je bilo narobe in kako sva popravljala:**
- Ko sem HTML odprl v brskalniku, se je v konzoli pojavila napaka: `Uncaught TypeError: Cannot set properties of null (setting 'innerText') at runAsynchronousPayroll`. Kopiral sem to napako v klepet.
- AI je ugotovil, da je JavaScript iskal ID `worker-status`, ki je v HTML manjkalu (je bil poimenovan `worker-badge`).
- Naročil sem, naj AI naredi majhen validacijski skript, ki bo primerjal vse `document.getElementById` klice z dejanskimi ID-ji v HTML. Skript je našel še dva manjkajoča elementa: `tab-architecture` in `v-olajsava`.
- AI je pripravil popravljen HTML. Ko sem skript ponovno zagnal, je bilo stanje `Missing IDs now: set()`, torej nič več manjkajočih ID-jev.
- Ostala sta še dva opozorili: opozorilo Tailwind CDN, da ni primeren za produkcijo (kar sva dokumentirala in je za demo sprejemljivo), in opozorilo `file://` varnostnega izvora ob direktnem odpiranju datoteke (rešitev je zagon prek lokalnega strežnika).

**Kako sem preveril:**
- Sam sem v brskalniku kliknil skozi celoten potek v MVP-ju in preveril, da se obračun zažene, da se napredek povečuje, da se na koncu prikaže neto znesek in vsi prispevki.
- Preveril sem, da so polja v kalkulatorju skladna z REK-O šiframi.

**Kako sem rezultat posredoval naprej:**
- Angular spec in MVP sem shranil v mapo `06_sprednji_sistemi_frontend`.
- **Delujoči MVP sem uporabil kot dokaz delovanja** že med pisanjem poglavij, še preden je bil dejanski Angular napisan.
- Dodatno sem naročil tri HTML vodnike (celotna arhitektura, baza, API), ki so bili namenjeni lažjemu pregledu mentorju.
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\06_sprednji_sistemi_frontend\01_eplace_frontend_architecture_spec.md — 2026-08-08 10:19 — 12,1 KB *(Angular spec)*
- LMARENA_PREDLOGSEMINARSKE\06_sprednji_sistemi_frontend\02_eplace_frontend_saas_best_practices.md — 2026-08-08 10:19 — 8,0 KB
- eplace2026\frontend\src\app\features\employees\form.component.ts — 2026-08-19 22:02 — 11,9 KB *(vnos zaposlenega)*
- eplace2026\frontend\src\app\features\employees\list.component.ts — 2026-08-19 20:43 — 5,0 KB
- eplace2026\frontend\src\app\features\payroll\payslip.component.ts — 2026-08-19 22:03 — 10,7 KB *(plačilna lista)*
- eplace2026\frontend\src\app\features\payroll\progress.component.ts — 2026-08-19 20:50 — 8,9 KB *(asinhroni napredek)*
- eplace2026\frontend\src\app\features\hours\hours.component.ts — 2026-08-19 22:16 — 14,1 KB *(mesečna tabela ur)*
- eplace2026\frontend\src\app\features\payroll\wizard.component.ts — 2026-08-31 22:12 — 14,2 KB *(čarovnik obračuna)*
- eplace2026\frontend\src\app\features\settings\settings.component.ts — 2026-08-19 20:44 — 5,4 KB
- eplace2026\frontend\src\app\core\auth.service.ts — 2026-08-17 20:16 — 2,0 KB

---

## Korak 9 — Testi in potrjevanje hipotez (sredina marca)

**Izhodišče:** Delujoč HTML MVP, DDL in backend spec.

**Kako sem vprašal AI:**
> "Pripravi mi natancne testne scenarije za validacijo obracunskega motorja, RLS varnosti in asinhronega obracuna. Za vsak scenarij navedi vhodne podatke in pricakovani izid, da bom lahko ročno preveril."

**Kaj je AI vrnil:**
Nabor šestih testnih scenarijev:
1. **Parametrični obračun:** urna postavka 10 €, 160 ur rednega dela, 8 dopusta, 8 bolniške, 4 nadure → bruto 1.796,00 €.
2. **Fiksni bruto:** 2000 € bruto, 160 od 174 ur → bruto 1.839,08 €.
3. **Pod minimalno plačo:** urna postavka 6 €, polni mesec → motor zavrne z opisno napako.
4. **RLS test:** uporabnik podjetja A izvede `SELECT * FROM payroll_lines` brez konteksta podjetja B → dobi 0 tujih vrstic.
5. **Asinhronost:** zagon za 100 zaposlenih → Express takoj vrne 202, delo poteka v ozadju z vidnim napredkom.
6. **Neto kalkulacija:** bruto 2600, rezident, 2 otroka, OZP, službeno vozilo, malica 22 dni, prevoz 10 km → izračun A071–A075, A081–A086, olajšave, S08, M07 in končni neto, skladen z OCR primerom.

Poleg tega so bili dodani kriteriji za potrditev treh hipotez:
- H1 (asinhronost): Express nit med obračunom prosta, UI odziven.
- H2 (Angular/Reactive Forms): napačni vnosi (npr. besedilo namesto števila, negativne ure) so zavrnjeni že na odjemalcu.
- H3 (RLS): nobena tuja vrstica ne zapusti baze niti ob neposredni SQL poizvedbi.

**Kako sem preveril:**
- V HTML MVP-ju sem ročno vnesel podatke prvih treh scenarijev in preveril izračune.
- Za RLS sem si zapisal testno SQL transakcijo, ki jo bom pognal ob dejanski postavitvi baze.
- Za asinhronost sem preveril, da se dnevniški izpisi `[API] 202 Accepted` pojavijo takoj, šele nato pa `[ENGINE]` koraki.

**Kako sem rezultat posredoval naprej:**
- Testne scenarije sem shranil kot osnovo za poglavje 6 (Migracija in testiranje) in poglavje 7 (Analiza rezultatov).
- Rezultate testov sem uporabil kot dokaz pri utemeljitvi hipotez v analizi rezultatov.
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- eplace2026\TECHNICAL_REPORT.md — 2026-08-19 23:11 — 44,4 KB *(testni scenariji + validacija hipotez)*
- eplace2026\EVALVACIJA.md — 2026-08-24 19:40 — 17,1 KB *(potrditev H1, H2, H3)*
- eplace2026\RAZVOJ_IN_TESTIRANJE.md — 2026-08-17 21:09 — 13,3 KB

---

## Korak 10 — Pisanje diplomskih poglavij (druga polovica marca)

**Izhodišče:** Vse do zdaj nastale datoteke (viri, baza, backend, frontend, testi, teorija).

**Postopek pisanja je bil za vsako poglavje enak:**
1. Najprej sem AI dal seznam vprašanj za to poglavje (iz delovnega zvezka iz koraka 5) in ukazal: "Napiši mi KRATEK osnutek tega poglavja, ton naj bo formalen akademski slovenski, ne piši kode, odgovori na vsako vprašanje."
2. AI je vrnil kratek osnutek.
3. Jaz sem osnutek prebral, označil, kaj je predolgo, kaj je narobe, kaj manjka (npr. pri poglavju 1.3 o hipotezah je bilo treba bolje razlikovati RLS od aplikacijskih filtrov).
4. Ukazal sem: "Prepisi celotno poglavje s temi popravki, brez komentarjev, tako da bo copy-paste ready za Word."
5. AI je vrnil popravljeno poglavje. Jaz sem ga še enkrat prebral in shranil.

Na tak način so nastala vsa poglavja: Uvod (1), Tehnična arhitektura (2), Analiza starega sistema (3), Načrtovanje (4), Implementacija (5), Migracija in testiranje (6), Analiza rezultatov (7), Zaključek (8). Naredil sem tudi tri celovite različice celotnega besedila (enostavna, znanstvena, hibridna), od katerih sem za končno izbral hibridno verzijo.

**Kako sem preveril:**
- Vsako poglavje sem prebral dva-krat.
- Preveril sem, da se vse trditve ujemajo z viri (zakonodaja) in s tehničnimi specifikacijami (imena tabel, polj, tehnologij).
- Preveril sem, da so vse tri hipoteze v poglavju z rezultati eksplicitno potrjene ali ovržene (vse tri so bile potrjene).

**Kako sem rezultat posredoval naprej:**
- Vseh osem poglavij sem shranil kot ločene `.md` datoteke in tudi kot eno združeno datoteko `05_eplace_koncna_diplomska_naloga_tekst.md`.
- **Te datoteke sem nato uporabil neposredno za kopiranje v Word.**
**📁 Nastale datoteke (iz xcvcx / TREE_chronological.md):**
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\01_01_uvod_vsebina_celotna.md — 2026-08-08 10:19 — 9,7 KB *(poglavje 1)*
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\02_poglavje_5_1_obracunski_motor.md — 2026-08-08 10:19 — 13,1 KB *(poglavje 5.1)*
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\01_08_zakljucek_vsebina_celotna.md — 2026-08-08 10:19 — 4,9 KB *(poglavje 8)*
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\03_eplace_enostavna_diplomska_naloga_vsebina.md — 2026-08-08 10:19 — 16,6 KB *(enostavna verzija)*
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\04_eplace_znanstvena_diplomska_naloga_hybrid.md — 2026-08-08 10:19 — 15,5 KB *(hibridna/znanstvena verzija)*
- LMARENA_PREDLOGSEMINARSKE\07_akademsko_pisanje_diploma\05_eplace_koncna_diplomska_naloga_tekst.md — 2026-08-08 10:19 — 16,9 KB *(= 5_eplace_koncna_diplomska_naloga_tekst.md)*
- LMARENA_PREDLOGSEMINARSKE\Diplomska.txt — 2026-08-08 18:06 — 187,9 KB *(izvoz iz LM Arene)*
- Vsi dokumenti povezani z izdelavo diplomske naloge\DIPLOMSKA_NALOGA_DOKUMENTI.md — 2026-08-08 17:51 — 72,7 KB
- diplomska_v2\Diplomska_naloga.md — 2026-08-31 22:38 — 83,8 KB *(vmesna verzija)*
- diplomska_v2\Diplomska_naloga_v2.md — 2026-09-03 19:18 — 56,6 KB *(verzija v2)*
- diplomska_v2\diploma.md — 2026-09-03 20:13 — 78,0 KB *(končna delovna verzija)*

---

## Korak 11 — Word oblikovanje in končni paket (konec marca)

**Izhodišče:** Končna tekstovna verzija diplome, vse specifikacije in HTML prototip.

**Postopek:**
1. Najprej sem AI dal zahtevo: "Pripravi mi navodila za oblikovanje v Wordu (robovi, pisava, razmik, naslovnica, izjava, samodejno kazalo, citiranje)." AI je vrnil navodila, ki sem jih nato upošteval.
2. Jaz sem odprl Microsoft Word, ustvaril prazno datoteko, nastavil sloge za Naslov 1, Naslov 2 in Naslov 3 ter **kopiral vsako poglavje** iz markdown datoteke v Word, po vrsti kot so si sledila v kazalu.
3. Dodal sem naslovnico, izjavo o avtorstvu in izjavo o uporabi umetne inteligence.
4. V Wordu sem generiral samodejno kazalo vsebine, kazalo slik in kazalo kod.
5. Po oblikovanju sem AI naročil, naj prebere strukturo končnega besedila in preveri, ali se kazalo ujema z dejanskimi poglavji — AI je našel dve majhni neskladji v številčenju, ki sem jih popravil.
6. Nato sem ukazal: "Vse datoteke v mapi `eplace_project_final` (organizirane v sedmih mapah) zapakiraj v ZIP. Zaradi enostavnega odpiranja vse datoteke pretvori v `.txt`, pri čemer ohrani strukturo map, in na koncu preveri celovitost ZIP-a." To je AI naredil prek lupinskih ukazov: pretvorba končnic, paketiranje z `zip` in preverjanje z `zip -T`. Rezultat je bil `eplace_2026_razvojni_paket.zip` z velikostjo 222K, test arhiva je bil OK. Jaz sem ZIP nato prenesel na svoj računalnik in preveril, da se odpre.
7. Na koncu sem naročil še pripravo predstavitve za zagovor: osem diapozitivov (naslov, problem in cilji, hipoteze, H1/H2/H3, integracije, zaključek) z govornimi opombami za vsak diapozitiv.

---

## Korak 12 — Tri ključne odločitve, ki sem jih potrdil sam

Ob koncu je pomembno, da je jasno, katere odločitve so bile moje (čeprav je AI lahko predlagal opcije). Tri najpomembnejše so:

- **RLS v bazi namesto aplikacijskega filtriranja.** Razlog: varnost mora biti na najglobljem možnem nivoju, da odpove človeška napaka ali hrošč aplikacije. To neposredno potrjuje hipotezo H3.
- **Asinhrona obdelava obračuna prek BullMQ in Redisa.** Razlog: v starem sistemu je obračun za veliko zaposlenih zamrznil vmesnik. Z asinhronim vzorcem uporabnik takoj dobi odgovor in vidi napredek, kar potrjuje H1.
- **Angular SPA z Reactive Forms in Signals.** Razlog: Angular je primeren za velike obrazce in gosto delo s tabelami, Reactive Forms omogočajo takojšnjo validacijo in s tem manj napak, kar potrjuje H2.

V vseh treh primerih mi je AI dal argumente za in proti, končno odločitev pa sem sprejel jaz.

---

## Korak 13 — Končna delitev dela

Za popolno jasnost še enkrat povzamem, kaj sem delal jaz in kaj je delo AI.

Jaz sem:
- priskrbel vsa izhodišča (dispozicija, JSON osnutek, posnetki zaslonov, poznavanje obstoječega sistema in zakonodaje iz prakse),
- postavil vsa vprašanja in dal vse končne usmeritve,
- potrjeval pravilnost vseh vrednosti in popravljal netočnosti (vključno z minimalno plačo 2026 in vrednostjo prispevka za dolgotrajno oskrbo),
- ročno pregledal vsako vrstico kode, vsak del specifikacije in vsak odstavek besedila,
- odpravljal morebitne nedoslednosti, ki so nastale zaradi starejših OCR podatkov,
- končno oblikoval Word dokument, prenesel ZIP in bom delo predstavil na zagovoru.

AI je:
- na podlagi mojih navodil strukturirala dispozicijo in vire,
- iskala in brala spletne vire ter jih povezovala v sezname,
- iz OCR besedila izluščila strukturirana REK-O polja in delovne tokove,
- predlagala arhitekturne rešitve in jih utemeljila,
- generirala DDL SQL, TypeScript vmesnike in HTML prototip,
- pomagala pri razhroščevanju (zlasti validacija manjkajočih ID-jev v MVP),
- oblikovala osnutke diplomskih poglavij in predstavitve za zagovor.

AI ni nikoli samostojno odločala o vsebini, ni preverjala pravilnosti na dejanskih državnih portalih in ni ničesar oddala namesto mene.

---

## Korak 14 — Kaj sem se naučil in kaj bi naredil drugače

Delo z AI me je naučilo, da umetna inteligenca ni samostojni razvijalec, temveč zelo močan pomočnik, ki zahteva jasna navodila in stalen nadzor. Brez lastnega razumevanja problema in brez stalnega preverjanja bi bili rezultati hitro napačni, še zlasti na pravno in finančno občutljivem področju, kot je obračun plač.

Najpomembnejše, kar sem se naučil:
- kako pravilno postavljati vprašanja (specifični, kontekstualno opremljeni pozivi),
- osnove slovenske plačne zakonodaje in REK-O obrazcev,
- uporaba sodobnih tehnologij za razvoj SaaS aplikacij (Angular 18, Node.js, MS SQL RLS, temporalne tabele, Redis in BullMQ),
- kako razmišljati o varnosti na nivoju baze in ne zgolj v aplikaciji,
- kako sistematično razbiti velik projekt v obvladljive tedenske korake.

Če bi projekt delal še enkrat, bi:
- že od prvega dne uvedel dosledno uporabo Git-a za verzioniranje,
- za vsako arhitekturno odločitev sproti pisal kratke ADR zapise in ne šele v diplomski fazi,
- pravne parametre (minimalna plača, prispevki, olajšave) enkrat potrdil že pred prvimi izračuni,
- v produkciji HTML MVP nadomestil s pravim Angular buildom brez zunanjih CDN.

---

## Priloga — Izjava o uporabi umetne inteligence

Za potrebe oddaje diplomske naloge je priložena tudi izjava, ki je bila pripravljena na podlagi tega dokumenta in je bila vključena v končni Word dokument:

> Pri izdelavi diplomskega dela *Razvoj celovite platforme v spletu za obračun plač* sem kot pomožno orodje uporabljal generativno umetno inteligenco. Orodje mi je pomagalo pri iskanju in strukturiranju pravnih in tehničnih virov, oblikovanju opisov arhitekture in specifikacij podatkovne baze, generiranju in dopolnjevanju programske kode po mojih natančnih navodilih (SQL DDL, TypeScript vmesniki in psevdokoda, HTML prototip), odpravljanju napak v prototipu, oblikovanju osnutkov diplomskih poglavij in pripravi predstavitve za zagovor. Vse vsebinske, arhitekturne in metodološke odločitve sem sprejel sam. Vse generirane vsebine sem pregledal, primerjal z veljavno zakonodajo in s svojim poznavanjem obstoječega sistema, popravil in dopolnil. Umetna inteligenca ni avtorica diplomskega dela, temveč razvojno orodje, ki sem ga uporabljal pod lastnim nadzorom v vseh fazah projekta.

---

*Ta dokument je končni in podrobni opis postopka uporabe umetne inteligence pri projektu ePlače 2026. Napisan je tako, da ga je mogoče neposredno vključiti v priloge diplomske naloge ali uporabiti kot osnovo za predstavitev na zagovoru.*
