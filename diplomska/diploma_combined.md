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


---

---

# Razvoj celovite platforme v spletu za obračun plač

---

**Diplomska naloga**

**Avtor:** Miha Bratina  
**Vpisna številka:** 12194600027  
**Mentor:** *(ime in priimek mentorja)*  
**Študijski program:** Višješolski strokovni program Računalništvo in Informatika  
**Ustanova:** Šolski center Nova Gorica, Višja strokovna šola  
**Leto:** 2025/2026

---

## Izjava o avtorstvu

Spodaj podpisani Miha Bratina izjavljam, da sem diplomsko nalogo z naslovom *Razvoj celovite platforme v spletu za obračun plač* napisal samostojno pod mentorstvom *(ime mentorja)* in v skladu s pravilnikom o diplomski nalogi ŠC Nova Gorica.

## Izjava o uporabi umetne inteligence

Pri izdelavi diplomskega dela *Razvoj celovite platforme v spletu za obračun plač* sem kot pomožno orodje uporabljal generativno umetno inteligenco. Orodje mi je pomagalo pri iskanju in strukturiranju pravnih in tehničnih virov, oblikovanju opisov arhitekture in specifikacij podatkovne baze, generiranju in dopolnjevanju programske kode po mojih natančnih navodilih (SQL DDL, TypeScript vmesniki in psevdokoda, HTML prototip), odpravljanju napak v prototipu, oblikovanju osnutkov diplomskih poglavij in pripravi predstavitve za zagovor. Vse vsebinske, arhitekturne in metodološke odločitve sem sprejel sam. Vse generirane vsebine sem pregledal, primerjal z veljavno zakonodajo in s svojim poznavanjem obstoječega sistema, popravil in dopolnil. Umetna inteligenca ni avtorica diplomskega dela, temveč razvojno orodje, ki sem ga uporabljal pod lastnim nadzorom v vseh fazah projekta.

---
## Zahvala

> **✏️ ZAPIŠI:** Komu se zahvaljuješ? (mentor, podjetje Hisoft, starši, sošolci — v 3–5 stavkih v lastnih besedah)
>
> *Nasveti: Zahvala naj bo pristna in osebna. Omeni, kdo ti je dal dostop do sistema Hisoft ali kdo ti je pomagal razumeti zakonodajo.*

<!-- TVOJA ZAHVALA: -->
Zahvaljujem se očetu Primožu, soustanovitelju Hisofta. Zahvaljujem se sodelavcem na Hisoftu. Zahvaljujem se šoli za vso znanje in spodbude.

---

## Izvleček

Diplomsko delo bo obravnavalo načrtovanje in razvoj sodobne spletne platforme **ePlače 2026**, namenjene digitalizaciji procesa obračuna osebnih prejemkov v slovenskem poslovnem okolju. Obstoječi namizni sistem podjetja Hisoft IT d.o.o. iz leta 2020, razvit v okolju Visual Basic, trpi za arhitekturnimi pomanjkljivostmi: razpršenostjo podatkov v 148 slabo organiziranih tabelah, odsotnostjo referenčne celovitosti in sinhronskim blokiranjem strežnika pri masovnih izračunih plač.

Nova platforma bo zgrajena na tristopenjski oblačni arhitekturi: sprednji del v ogrodju Angular 18+, zaledni del v okolju Node.js s TypeScriptom, ter podatkovna baza Microsoft SQL Server z vgrajenim mehanizmom Row-Level Security. Za asinhrono obdelavo masovnih izračunov bo integrirana vrsta opravil BullMQ skupaj s predpomnilnikom Redis.

> **✏️ ZAPIŠI:** Zapiši lastno povzetje v 3–4 stavkih: kaj je osrednji problem, katera rešitev bo razvita, in kaj so tri ključne inovacije tvoje platforme. Piši v prihodnjiku ("bo razvito", "bo zagotovljeno").
>
> *Nasveti: Izvleček je zadnji, kar napišeš — ko dokončaš celo nalogo, se vrni in ga izpolni.*

<!-- TVOJ DODATEN ODSTAVEK ZA IZVLEČEK: -->


**Ključne besede:** obračun plač, SaaS, Angular, Node.js, MS SQL Server, Row-Level Security, BullMQ, TypeScript, ZDR-1, ZDoh-2

---

## Abstract *(English)*

This thesis will address the design and development of a modern web platform **ePlače 2026**, intended to digitalize payroll processing in the Slovenian business environment.

> **✏️ ZAPIŠI:** Prevedi lasten odstavek iz slovenskega izvlečka v angleščino. Ni treba biti popoln — povej bistvo v 3–4 stavkih.

<!-- TVOJ ABSTRACT: -->


**Keywords:** payroll, SaaS, Angular, Node.js, MS SQL Server, Row-Level Security, BullMQ, TypeScript

---

## Seznam kratic in akronimov

| Kratica | Polni naziv |
|---------|-------------|
| SaaS | Software as a Service (Programska oprema kot storitev) |
| SPA | Single Page Application (Enostranska spletna aplikacija) |
| REST | Representational State Transfer |
| API | Application Programming Interface (Programski vmesnik) |
| JWT | JSON Web Token |
| RBAC | Role-Based Access Control (Nadzor dostopa na podlagi vlog) |
| RLS | Row-Level Security (Varnost na nivoju vrstic) |
| OZP | Obvezni zdravstveni prispevek |
| GDPR | General Data Protection Regulation |
| SEPA | Single Euro Payments Area |
| VOD | Vknjižba obračuna dohodkov |
| eBOL | Elektronski bolniški list |
| FURS | Finančna uprava Republike Slovenije |
| ZZZS | Zavod za zdravstveno zavarovanje Slovenije |
| EMŠO | Enotna matična številka občana |
| IBAN | International Bank Account Number |
| ZDR-1 | Zakon o delovnih razmerjih |
| ZDoh-2 | Zakon o dohodnini |
| ZZVZZ | Zakon o zdravstvenem varstvu in zdravstvenem zavarovanju |
| ZDOsk-1 | Zakon o dolgotrajni oskrbi |
| ZMinP | Zakon o minimalni plači |

> **✏️ ZAPIŠI:** Dodaj kratico, ki si jo sam odkril med delom — morda iz zakonodajnih dokumentov v HISOFT26 arhivu.

<!-- TVOJE DODANE KRATICE: -->


---

## Kazalo vsebine

1. [Uvod](#1-uvod)
2. [Tehnična arhitektura sistema](#2-tehnična-arhitektura-sistema)
3. [Analiza obstoječega sistema](#3-analiza-obstoječega-sistema-2020)
4. [Načrtovanje nove rešitve](#4-načrtovanje-nove-rešitve-eplače-2026)
5. [Implementacija ključnih modulov](#5-implementacija-ključnih-modulov)
6. [Migracija in testiranje](#6-migracija-in-testiranje)
7. [Analiza rezultatov in preverjanje hipotez](#7-analiza-rezultatov-in-preverjanje-hipotez)
8. [Zaključek](#8-zaključek)

---

## 1. Uvod

### 1.1 Motivacija in ozadje problema

Obračun osebnih prejemkov v Republiki Sloveniji sodi med zahtevnejše in zakonodajno najobsežnejše procese v poslovni informatiki. Na ta proces neposredno vplivajo številni zakonski akti, ki se redno dopolnjujejo: Zakon o delovnih razmerjih (ZDR-1), Zakon o dohodnini (ZDoh-2), Zakon o zdravstvenem varstvu in zdravstvenem zavarovanju (ZZVZZ) ter Zakon o dolgotrajni oskrbi (ZDOsk-1), ki je z letom 2025 uvedel nov prispevek v višini 1,00 % bruto plače. Zakon o minimalni plači (ZMinP) je za leto 2026 določil minimalno mesečno plačo v višini 1.481,88 €, z letom 2024 pa je stopil v veljavo Obvezni zdravstveni prispevek (OZP) v fiksni mesečni višini 35,00 €.

> **✏️ ZAPIŠI:** Zakaj si se osebno odločil za ta projekt? Kaj je bil tvoj prvi stik s sistemom Hisoft ali s problemom obračuna plač? (2–3 stavki v lastnih besedah — to je del, ki naredi nalogo pristno)
>
> *Nasveti: Ne piši splošno. "Med prakso sem opazil..." ali "Ko sem pogledal strukturo baze podatkov..." sta dobra začetka.*

<!-- TVOJA OSEBNA MOTIVACIJA: -->


Sodobni trg poslovne programske opreme jasno kaže smer razvoja. Vodilni konkurenti na slovenskem trgu — **Minimax** (Seyfor), **PANTHEON** (Datalab), **e-računi** in **Vasco** (Seyfor) — so že bodisi v celoti oblačne SaaS rešitve bodisi aktivno migrirajo v to smer. Skupna lastnost vseh sodobnih platform je centralizirana posodobitev zakonodajnih parametrov na enem mestu, ki jo vsi najemniki prejmejo sočasno in samodejno, brez posredovanja tehničnega kadra.
Če izberem en sam ključni cilj pri izplačilu plač, je to maksimizacija učinkovitosti: drastično skrajšati čas in zmanjšati napor, potreben za celoten obračun.

Pristop:
Pregledati i npredstaviti katere resitve konkretno, produkte in storitve, hisoft kot pojetje samo ponuja. Kako sluzimo nasim uporabnikom v kakovosti, hitrosti, prilagodljivosti, zanelsjivosti. Kje smo v prednosti v primerjavi z drugimi podjetji, zakaj stranke ostajajo z nami...

Novosti začenjajoč z eračuni in eplačami bo fuzija svežih idej in ambicij, sodobnih pristopv osnovanih na preverjenih praksah - realizacija osebnih ciljev posameznikov v podjetju in realizacija drznih eksperimentov mladih programerjev v  sodelovanju z ekspertnim znanjem seniorjev in ustanoviteljev firme.
Poleg znanja in svetovanja imamo mladi programerji neposredni dostopom do baze podatkov, arhivov, poteka dela, dokumentacije, shem, kode, nacinov dela, dela s programi in se veda na voljo izusene seniorje ki so na voljo da odgovorijo na vsa nasa vprasanja.

Nasloviti obstojece tezave tako interne in tehnicne narave, izvedbe, stroskov vzrdzevanja in distribucije programskih resitev same interne ekipe, kot pa tudi nasloviti tezave in vprasasnju uporaniko nasih programov - kako obracunom placo, kako navigiram uporabinski vmesniki, ali sem prav obracunal placo, izbrisal se nam je streznik s placami ali imate backup, ali obracun place za veliko zaposlenih lahko poenostavljen...

What works vs what doesnt work:
nadgradnja obstojecih resitev in odrpava starih bottlenech in stroskov...


Kako? S premišljenim načrtovanjem celotne podatkovne verige od začetka do konca. To pomeni avtomatizacijo in optimizacijo vsakega koraka — od vnosa, obdelave in varno shranjenih podatkov do njihovega neposrednega prenosa na FURS ter v obračunski sistem. Končni cilj je brezhiben proces, ki zagotavlja točna izplačila zaposlenim in dosledno urejenost vseh ostalih pravic (prehrana, prevoz, dopusti, bolniške ter pokojninska in socialna zavarovanja).

2 - Ljudem skusati priblizati informacije in osvescenost o davkih na delo v Sloveniji. Zakaj delavci stanejo toliko kot stanejo
Kako je sestavljena plača
Ali so plače višje v privatnih sektorjih ali javnih sektorjih 
Koliko me stane če želim zaposliti človeka na minimalcu oz koliko mmu pripada če ima doktorat.
Kako ljudje porabijo mesečna plače.
Lestvica plač po podjetjih in sektorjih v sloveniji

3 - Kaj smo se na Hisoft It doo naučili po 25 letih dela v eni izmed najbolj nasičenih panog  - denar (računivodstvo, bilance, računi, blagajne, programi, UI, POSLOVODENJE, ZAUPANJE, vzdrževanje, marketing, zaposlovanje, znanje, uporaba jezikov in okolij, razvoj opreme in programskega jezika VB - od uporabe MS Access do MS SQL in vibecoding codexa.

Razvoj mobilne aplikacije - katere potrebe uporabnikov lahko resimo z mobilnimi aplikacijami - webapp vs android (potni nalogi)
Uporabnost umetne inteligence znotraj podjetja - programiranje, načrtovanje AI ready infrsatrukture (vector db, RAG, MCP)


Ker razvoj i nnacrt povzame tudi osvojea znanja is se prekriva  zvsebinami iz solskih klopi in namrec iz vseh predmetov:
Pridobljena znanja · MD
Pridobljena znanja pri študiju
Predmet: Elektronsko in mobilno poslovanje
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Elektronsko poslovanje (e-poslovanje) – pojem, oblike, področja uporabe
Internet, intranet, ekstranet
E-dokumenti in računalniška izmenjava podatkov (EDI)
Standardi in označevalni jeziki za izmenjavo podatkov (XML ipd.)
Informacijski sistemi v podjetju in nadgradnja v e-poslovanje
Varnost pri e-poslovanju (grožnje, zlorabe, ukrepi)
Kriptografija in šifriranje podatkov
Digitalna potrdila in elektronski podpis
Elektronsko bančništvo – oblike, standardi, varnost
Mobilno poslovanje (m-poslovanje) – značilnosti, tehnologije, razlike do e-poslovanja
Mobilne aplikacije in internet stvari (IoT)
Izbira ustrezne platforme za mobilno poslovanje
Predmet: Strežniški sistemi
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Sistemski inženiring in sistemska administracija
Konfiguriranje in vzdrževanje strežniških sistemov in omrežij
Varnostna politika strežniških sistemov
Strežniške vloge (DNS, DHCP, AD, spletni strežnik, datotečni strežnik, strežnik za varnostne kopije)
Upravljanje uporabnikov, skupin in organizacijskih enot
Arhitektura odjemalec–strežnik in »vsak z vsakim«
Redundantna diskovna polja in visoka razpoložljivost
Virtualizacija in hipervizorji
Kontejnerji
Orodja za spremljanje in nadzor sistema
Centralizirana namestitev in upravljanje programske opreme (patch management)
Sistemi za upravljanje vsebin (CMS, DMS, LMS, ERP)
Storitve v oblaku – modeli (IaaS, PaaS, SaaS)
Primerjava lokalne namestitve in gostovanja v oblaku
Varnost in predpisi pri upravljanju podatkov v oblaku
Predmet: Računalništvo v oblaku (RVO)
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Arhitektura oblaka za IoT
Virtualizacija
Kontejnerizacija
Orkestracija
Omrežje in shranjevanje podatkov
Podatkovni tokovi
Predmet: Načrtovanje in razvoj produktov IT (NRP)
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Opredelitev osnovnih pojmov (načrtovanje in razvoj IT produktov)
Metodologije načrtovanja in gradnje informacijskih sistemov
Modeliranje informacijskih sistemov
Tehnološka in organizacijska izhodišča
Poslovni vidik razvoja IT produktov
Opredelitev problema, deležnikov in poslovnih ciljev
Analiza želja, potreb in pričakovanj naročnika (intervju)
Priprava strokovnega priporočila na podlagi zahtev naročnika
Svetovalni sestanek z naročnikom
Projektno vodenje pri uvedbi IT produkta
Osnutek projektnega načrta
Stroškovna analiza razvoja in implementacije IT produkta
Predmet: Računalniška in podatkovna varnost (RIN-KVEH)
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Identifikacija in analiza virusov (klasični virusi, makro virusi)
Zaznavanje vohunske programske opreme (spyware)
Buffer overflow napadi
Napadi tipa Man-in-the-Middle (MitM)
Prevzem seje (session hijacking)
Google hacking
Izvidništvo (reconnaissance)
Social Engineering Toolkit (SET)
Uporaba orodij netcat in nmap
Detekcija odprtih vrat na tarči (skeniranje portov)
Ranljivosti spletnih aplikacij (WebGoat, DVWA)
Klasična kriptografija
Vernamova šifra
XOR šifriranje
Simetrično šifriranje DES in AES
Asimetrično šifriranje RSA
Uporaba GnuPG za šifriranje in digitalne podpise
Predmet: From idea to product: Creative entrepreneurship — Where intuition meets AI
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Povezava med intuicijo in kreativnostjo
Vloga intuicije v podjetništvu in poslovanju
Umetna inteligenca proti naravni inteligenci
Vpliv umetne inteligence na produktivnost, inovativnost in podjetništvo
Ključni dejavniki uspeha zagonskega podjetja (start-up)
Pristopi za generiranje poslovne ideje
Poslovni model (Business Model)
Digitalni marketing in AI marketing
Delo v timih in virtualnih timih
Minimalni sprejemljivi produkt (MVP)
Predmet: Ekonomika podjetja (in podjetništvo)
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Poslovna ideja
Opis produkta
Analiza panoge
Analiza konkurence
SWOT analiza
Načrtovanje stroškov
Načrtovanje prihodkov
Marketing
Človeški viri
Finančni načrt
Terminski načrt
Kritična tveganja
Predstavitev poslovne ideje (pitching)
Poslovni načrt
Predmet: Napredna računalniška omrežja (NRO)
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Požarni zid (firewall)
Navidezna privatna omrežja (VPN)
Usklajevanje fizične ure (NTP)
Nameščanje in konfiguriranje strežniške programske opreme
Industrijske mreže za prenos podatkov
Predmet: Tehnologije in trendi veriženja blokov (RIN-TTVB)
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Osnove verige blokov (blockchain)
Implementacija veriženja blokov v Pythonu
Kriptovalute
Pametne pogodbe (smart contracts) na Ethereumu
Predmet: Praktično izobraževanje (RIN – Računalništvo in informatika)
Predavatelj: (dopolni)

Vsebine (ključni pojmi):

Praktično usposabljanje pri delodajalcu
Instrument za merjenje doseženih kompetenc
Dnevnik praktičnega izobraževanja (PRI)



> **✏️ ZAPIŠI:** Kateri od navedenih konkurentov te je najbolj presenetil ali navdušil in zakaj? Opiši eno konkretno lastnost konkurenčne platforme, ki je manjka staremu Hisoft sistemu. (2–3 stavki)

<!-- TVOJA ANALIZA KONKURENCE: -->


Obstoječi namizni sistem Hisoft verzija 2020 prinaša konkretne operativne izzive: ročno nameščanje posodobitev pri vsaki stranki posebej, odsotnost spletnega dostopa, pomanjkanje REST API vmesnikov za integracijo z zunanjimi sistemi ter preobremenjeno tehnično podporo zaradi napak pri ročnem vnosu podatkov.

Seyfor, pantheon

> **✏️ ZAPIŠI:** Kateri od teh izzivov se ti zdi največji? Opiši realen scenarij — kaj se zgodi pri stranki, ko pride do zakonodajne spremembe in sistem še ni posodobljen? (3–5 stavkov)

<!-- TVOJ OPIS REALNEGA SCENARIJA: -->

Treba je rocno posodabljati parametre v bazi in testirati nove obracune

### 1.2 Namen in cilji diplomskega dela

Namen diplomskega dela je skozi pilotni projekt ePlače 2026 načrtovati in opisati razvoj sodobnega sistema za obračun plač na tehnološkem skladu Node.js, TypeScript in Angular. Metodološki pristop bo temeljil na obratnem inženirstvu: izhajali bomo iz obstoječega sistema, ga analizirali in na podlagi ugotovitev zasnovali novo, izboljšano rešitev.

Za dosego tega namena si zastavljamo naslednje specifične cilje:

- **Tehnološka posodobitev:** Zasnova skalabilnega Node.js API-ja in odzivnega Angular spletnega vmesnika
- **Optimizacija podatkovnega modela:** Normalizacija iz 148 tabel v kompakten model z osmimi osrednjimi tabelami
- **Varnost na nivoju baze:** Implementacija Row-Level Security in Temporalnih tabel v MS SQL Server
- **Točnost izračunov:** Zagotovitev točnosti izračunov v skladu z ZDR-1 in dohodninsko lestvico 2026

> **✏️ ZAPIŠI:** Dodaj en cilj, ki je tvoj — morda kaj, kar si ugotovil med analizo starega sistema, da manjka, ali kaj, kar bi ti osebno olajšalo delo. (1–2 stavka)

<!-- TVOJ DODATEN CILJ: -->

Enostavna uproaba za uporabnike, izgradnja ekosistema za deljenje znanja, novic, podpora z APIji za izvoz , prenos, uvoz opdatkov in osnova za AI agentic okolja v prihodnosti ki bodo samostojno objavljala, preverjala, ustvarjala informacije.

### 1.3 Raziskovalne hipoteze

V sklopu načrtovanja razvoja spletne platforme ePlače 2026 bomo preverjali naslednje tri hipoteze:

**Hipoteza 1 (H1):** Uporaba asinhronih procesov z Redis vrsto opravil in BullMQ delavci bo zagotovila, da bo odzivni čas Express strežnika ob zagonu masovnega izračuna ostal pod 10 ms, ne glede na število zaposlenih v obračunu.

**Hipoteza 2 (H2):** Angular reaktivni obrazci s sprotnimi validacijami na strani odjemalca bodo zmanjšali število vnosnih napak v kritičnih poljih (EMŠO, davčna številka, IBAN) na nič, saj bodo napačno oblikovani vnosi fizično onemogočeni pred oddajo.

**Hipoteza 3 (H3):** Implementacija Row-Level Security neposredno v podatkovni sloj MS SQL Server bo zagotovila, da bodo podatki posameznega najemnika nedostopni za ostale najemnike tudi v primeru nepravilnosti v aplikacijskem sloju.

> **✏️ ZAPIŠI:** Katera hipoteza se ti zdi tehnično najzahtevnejša za dokazovanje in zakaj? (2–3 stavki — to pokaže, da razumeš omejitve svojega dela)

<!-- TVOJA REFLEKSIJA O HIPOTEZAH: -->

Vsaka hipoteza predstavlja nek izziv na nekem delu saasa - backend, baza ali frontend. Moj cilj je razsiriti znanje in najbolje je tako da naslovim probleme in posicem resitve z tehnicno izobljsavo z nagnjenjnu k popolnosti.

---

## 2. Tehnična arhitektura sistema

Sodobne spletne poslovne aplikacije zahtevajo visoko skalabilnost, odzivnost in varnost. Arhitektura ePlače 2026 bo zasnovana po načelu tristopenjske ločitve (Three-Tier Architecture): predstavitveni sloj (Angular SPA), poslovni sloj (Node.js zaledni del) in podatkovni sloj (MS SQL Server z Redisom).

> **✏️ ZAPIŠI:** Z lastnimi besedami razloži, zakaj je ločitev na tri sloje koristna pri razvoju. Kaj se zgodi, ko so vsi trije sloji premešani v eno datoteko? (2–3 stavki)
>
> *Nasveti: Fowler [15] opisuje to ločitev — preberi kratek povzetek in ga povej z lastnimi besedami.*

<!-- TVOJA RAZLAGA TRISTOPENJSKE ARHITEKTURE: -->
Trije sloji ločijo skrbi: Angular skrbi le za prikaz in interakcijo z uporabnikom (računovodjo), Node.js zaledje izvaja poslovno logiko (npr. obračun plač, RBAC), podatkovni sloj pa hrani in ščiti podatke (RLS v MS SQL, Redis za predpomnjenje). Če bi vso to logiko strpal v eno datoteko, bi bila koda težko berljiva in nemogoča za vzdrževanje — sprememba v enem delu (npr. spremenjena dohodninska lestvica) bi tvegala, da nehote pokvariš prikaz ali dostop do podatkov. Prav tako ne bi mogel neodvisno testirati ali skalirati posameznih delov (npr. samo backend ob večji obremenitvi obračuna).

### 2.1 Sprednji del (Angular SPA)

Sprednji del ePlač 2026 bo razvit kot enostranska spletna aplikacija v ogrodju **Angular 18+**. Platforma bo uveljavljala pristop s samostojnimi komponentami (*Standalone Components*), ki odpravlja potrebo po kompleksnih NgModule strukturah in omogoča hitrejše nalaganje. Za stiliziranje bo integrirana knjižnica **Tailwind CSS** — utilitarni CSS okvir, ki omogoča hitro vizualno oblikovanje neposredno v HTML predlogah.

Reaktivno upravljanje stanja bo temeljilo na **Angular Signals**, ki brskalniku omogočajo neposredno sledenje le tistim podatkom, ki se dejansko spremenijo — brez osveževanja celotnega DOM drevesa. Za sprotno preverjanje vnosov bodo implementirani **Angular Reactive Forms** s strogimi regularnimi izrazi.

> **✏️ ZAPIŠI:** Zakaj si izbral Angular in ne React ali Vue? Navedi 2 konkretna razloga, ki sta bila zate odločilna. (2–4 stavki)
>
> *Nasveti: Ni nujno, da je Angular "najboljši" — je pa morda znan, dobro dokumentiran, ali primeren za kompleksne obrazce.*

<!-- TVOJA UTEMELJITEV ANGULAR: -->

Angular sem izbral, ker se ga v podjetju Hisoft trenutno uvaja kot standardno rešitev za frontend, kar zagotavlja dolgoročno podporo in konsistentnost z ostalimi projekti. Poleg tega Angular uporablja TypeScript, kar pomeni, da lahko z zalednim delom (Node.js/TypeScript) delim tipe podatkov in zmanjšam napake pri komunikaciji med sloji.

For the second reason, a few options that fit your project (pick whichever is actually true for you, or tell me and I'll fold it in):

Reactive Forms v Angularju ima vgrajen sistem za kompleksne obrazce z vgrajeno validacijo, kar je pomembno za obrazce pri obračunu plač (veliko polj, stroga validacija podatkov).
Struktura/ogrodje "vse v enem", torej ker Angular vsiljuje strožjo strukturo projekta (moduli, servisi, dependency injection), kar olajša delo v ekipi in dolgoročno vzdrževanje v primerjavi z bolj svobodnim Reactom.
Angular zacenjamo na podjetju spoznavati ker je prva resitev za typescipt node js backend osnovo.

> **✏️ ZAPIŠI:** Razloži z analogijo iz resničnega življenja, kaj pomeni "lazy loading" za spletno aplikacijo. (2 stavka — analogija naredi besedilo živo)

<!-- TVOJA ANALOGIJA ZA LAZY LOADING: -->
Lazy loading je kot restavracija, ki ne pripravi vseh jedi na meniju vnaprej, temveč skuha vsako jed šele, ko jo gost dejansko naroči — tako se čas in viri porabijo le za tisto, kar je res potrebno. Podobno spletna aplikacija ob prvem zagonu naloži le tisto, kar uporabnik takoj vidi (npr. prijavni obrazec), ostale module (npr. poročila ali nastavitve) pa prenese šele, ko uporabnik dejansko klikne nanje.

### 2.2 Zaledni del (Node.js in TypeScript)

Zaledni del bo implementiran v okolju **Node.js** z jezikom **TypeScript** in spletnim ogrodjem **Express**. Arhitektura zalednega dela bo sledila vzorcu Controller–Service–Repository:

- **Controller** sprejme HTTP zahtevek in ga posreduje servisu
- **Service** izvede poslovno logiko (izračun, validacija)
- **Repository** komunicira z bazo podatkov

Za izolacijo konteksta najemnika med obdelavo zahtevkov bo implementiran **AsyncLocalStorage** — mehanizem Node.js, ki brez eksplicitnega podajanja parametrov vzdržuje kontekst skozi celotno verigo klicev znotraj enega zahtevka.

> **✏️ ZAPIŠI:** Z analogijo razloži, zakaj sinhron izračun plač za 500 zaposlenih v eni sami Express funkciji povzroči problem. Kaj se zgodi z ostalimi zahtevki medtem? (3–4 stavki — primer: restavracija z enim natakarjem)

<!-- TVOJA ANALOGIJA ZA EVENT LOOP BLOKADO: -->

Node.js deluje kot restavracija z enim samim natakarjem, ki streže vsem mizam hkrati — dokler je zaposlen z eno nalogo, ne more sprejeti nobene druge. Če ta natakar (Express funkcija) sinhrono izračuna plače za 500 zaposlenih v eni sami zahtevi, "blokira" celotno strežbo, dokler izračun ne konča — noben drug gost (uporabnik) v tem času ne more niti oddati naročila niti dobiti odgovora, čeprav njegova zahteva morda sploh ni povezana z obračunom plač. To pomeni, da bi en dolg izračun začasno "zamrznil" celotno aplikacijo za vse uporabnike, ne le za tistega, ki je obračun sprožil. Rešitev je asinhrono procesiranje (npr. vrsta opravil), kjer natakar nalogo odda v kuhinjo in medtem streže naprej, obračun pa se izvede v ozadju.

> **✏️ ZAPIŠI:** Zakaj je AsyncLocalStorage boljši pristop od tega, da bi tenant_id pri vsakem klicu funkcije ročno podajal kot parameter? (2–3 stavki)

<!-- TVOJA RAZLAGA ASYNCLOCALSTORAGE: -->
Če bi tenant_id ročno podajal kot parameter, bi ga moral dodati v vsako funkcijo v celotni klicni verigi — od kontrolerja do repozitorija — tudi v funkcije, ki ga sicer sploh ne potrebujejo za svojo logiko, ampak ga le "prenašajo naprej". To poveča tveganje za napako (nekdo pozabi parameter podati ali ga po pomoti zamenja z drugim tenant_id), kar je pri finančnih podatkih nesprejemljivo. AsyncLocalStorage namesto tega vzdržuje kontekst avtomatično skozi celoten asinhroni tok zahtevka, tako da je tenant_id vedno na voljo brez eksplicitnega podajanja, hkrati pa je vsak zahtevek izoliran od drugih.

### 2.3 Podatkovna baza (MS SQL Server)

Podatkovna baza bo implementirana na platformi **Microsoft SQL Server** z dvema naprednim varnostnima mehanizmoma:

**Row-Level Security (RLS):** Varnostni mehanizem, ki na nivoju baze podatkov samodejno filtrira vrstice glede na sejni kontekst. Ko aplikacija nastavi `SESSION_CONTEXT` z identifikatorjem najemnika, bo baza samodejno vrnila le tiste vrstice, ki pripadajo temu najemniku — ne glede na to, kakšno SQL poizvedbo aplikacijska koda pošlje.

**Temporalne tabele (system-versioned):** SQL Server bo samodejno vzdrževal zgodovino vseh sprememb v tabelah zaposlenih in obračunov. Za vsako vrstico bo ohranjal čas veljavnosti (`ValidFrom`, `ValidTo`), kar omogoča popolno revizijsko sled brez dodatne kode.

> **✏️ ZAPIŠI:** Razloži z analogijo, kako RLS ščiti podatke. (Primer: hotel z ključi za sobe — vsak gost vidi le svojo sobo) (3–4 stavki)

<!-- TVOJA ANALOGIJA ZA RLS: -->
RLS deluje kot hotel, kjer ima vsak gost ključno kartico, ki odpre le vrata njegove lastne sobe — ne glede na to, po katerem hodniku hodi ali katera vrata poskuša odpreti, kartica preprosto ne bo delovala na sobah drugih gostov. Podobno RLS na nivoju baze samodejno "prilagodi ključ" vsaki poizvedbi glede na SESSION_CONTEXT (identifikator najemnika), tako da tudi če aplikacijska koda po nesreči pošlje poizvedbo brez filtra po podjetju, baza sama vrne le vrstice, ki pripadajo temu najemniku. Gost tako sploh ne ve, da druge sobe (podatki drugih podjetij) obstajajo — zanj je, kot da je v hotelu sam.

> **✏️ ZAPIŠI:** Zakaj je revizijska sled (kdo je spremenil plačo, kdaj, kaj je bila vrednost pred spremembo) zakonsko ali poslovno nujna za obračun plač? (2–3 stavki)

<!-- TVOJA UTEMELJITEV TEMPORALNIH TABEL: -->
Revizijska sled je pri obračunu plač zakonsko nujna, saj mora biti ob morebitnem inšpekcijskem nadzoru ali sporu z zaposlenim mogoče dokazati, kakšna je bila plača na določen datum in kdo jo je spremenil. Poslovno je koristna tudi zato, ker omogoča odkrivanje napak ali zlorab (npr. nepooblaščena sprememba zneska) in njihovo popravljanje brez izgube podatka o prvotnem stanju.

### 2.4 Predpomnilnik in asinhrona vrsta (Redis in BullMQ)

Za asinhrono obdelavo masovnih izračunov bo integriran **Redis** kot hitri pomnilnik v pomnilniku in **BullMQ** kot upravljavec vrst opravil. Ko računovodja sproži obračun za celotno podjetje, bo Express takoj vrnil odgovor HTTP 202 Accepted; dejansko računanje se bo izvajalo v ozadju prek ločenih BullMQ delavcev.

> **✏️ ZAPIŠI:** Razloži potek asinhrona obračuna v korakih — kaj naredi Angular, kaj Express, kaj BullMQ, kaj delavec (worker). (4–6 stavkov v obliki "najprej ... nato ... na koncu ...")

<!-- TVOJ OPIS ASINHRONEGA POTEKA: -->
Najprej računovodja v Angular vmesniku klikne gumb "Izvedi obračun" za celotno podjetje, kar sproži HTTP zahtevo proti zalednemu delu. Nato Express controller sprejme zahtevo, jo validira in namesto da bi obračun izvedel takoj, opravilo doda v BullMQ vrsto (shranjeno v Redisu) ter uporabniku takoj vrne odgovor HTTP 202 Accepted, skupaj z identifikatorjem opravila. Medtem Angular uporabniku prikaže sporočilo tipa "Obračun se izvaja" oz. indikator napredka, ne da bi vmesnik "obvisel". Vzporedno ločen BullMQ delavec (worker), ki teče neodvisno od Express strežnika, prevzame opravilo iz vrste in izvede dejanski izračun plač za vse zaposlene. Ko delavec zaključi obračun, rezultat zapiše v bazo, status opravila pa posodobi na "končano". Na koncu Angular vmesnik (npr. s periodičnim preverjanjem statusa ali WebSocket obvestilom) zazna, da je opravilo končano, in računovodji prikaže rezultat oz. možnost prenosa poročila.

---

## 3. Analiza obstoječega sistema (2020)

Preden bo mogoče zasniti novo rešitev, je treba poglobljeno razumeti obstoječe stanje. Analiza obstoječega sistema Hisoft 2020 je razkrila tri ključna področja pomanjkljivosti, ki so neposredna motivacija za razvoj ePlač 2026.

> **✏️ ZAPIŠI:** Zakaj je analiza obstoječega sistema nujni korak pred razvojem novega? Kaj se zgodi, če preskočiš to fazo? (2 stavka — pokaži, da razumeš vrednost reverse engineeringa)

<!-- TVOJA UTEMELJITEV ANALIZE: -->
Analiza obstoječega sistema je nujna, ker razkrije, katera poslovna logika, pravila in posebni primeri (npr. specifični izračuni dodatkov) so v starem sistemu implicitno vgrajeni, pa nikjer dokumentirani — brez tega razumevanja bi nov sistem lahko izgubil funkcionalnost, ki jo uporabniki dejansko potrebujejo. Če to fazo preskočiš, tvegaš, da boš v novi rešitvi ponovil iste arhitekturne napake ali pa v produkciji odkril manjkajočo funkcionalnost šele, ko bo prepozno in drago za popravek.

### 3.1 Podatkovni kaos in tehnični dolg

Podatkovna baza obstoječega sistema Hisoft 2020 obsega **148 dokumentiranih tabel**. Pregled struktur v arhivu `IZPISPODSTRTABEL/Tabele_Za_Ucenje/` razkrije značilnosti, ki so po standardih relacijske teorije neposredni vzrok za sistematične napake in visoke stroške vzdrževanja [9].

Tabela `GLAVAIZPPLLISTE` z **86 stolpci** hrani vse finančne zneske — bruto plačo, prispevke, dohodnino in neto izplačilo — kot podatkovni tip `nvarchar` (besedilo). Posledica tega je, da sistem ne more nad temi vrednostmi izvajati neposrednih matematičnih operacij, temveč jih mora sproti pretvarjati v število; vsakič ko prihaja do zaokroževanja pri pretvorbi, se kopiči napaka.

Tabela `DELAVCI` z **93 stolpci** vsebuje podvojene bančne podatke: polja `sifban`, `trr` in `sklic` so podvojena kot `sifban1`, `trr1` in `sklic1`. Polji `trr` in `davcnast` sta shranjeni kot `nvarchar`, namesto da bi bili ustrezno tipizirani. Sistem prav tako ne uvaja tujih ključev (*foreign keys*) ali omejitev (*CHECK constraints*) — kar pomeni, da baza ni sposobna sama preveriti referenčne celovitosti med tabelami.

> **✏️ ZAPIŠI:** Ko si sam pogledal datoteko `DELAVCI.txt` v mapi `HISOFT26/IZPISPODSTRTABEL/Tabele_Za_Ucenje/` — katera stvar te je najbolj presenetila? Zakaj je to arhitekturna napaka, ne le estetska pomanjkljivost? (3–4 stavki v lastnih besedah)
>
> *Nasveti: Odgovori glede na to, kar si dejansko videl v datoteki. Mentorje prepriča konkretnost.*

<!-- TVOJA OPAZKA O DELAVCI.TXT: -->


> **✏️ ZAPIŠI:** Razloži z lastnimi besedami, zakaj je shranjevanje bančnega računa kot besedilo namesto kot strukturiran tip problem. Navedi primer, kaj se zgodi pri validaciji IBAN. (2–3 stavki)

<!-- TVOJA RAZLAGA O NVARCHAR ZA TRR: -->


Obseg izvorne kode starega sistema sega do **1,3 MB** Visual Basic kode v eni sami datoteki `Place.vb`. Za primerjavo: to je ekvivalent več sto strani besedila, stisnjenih v en sam modul brez jasne modularne ločitve. Takšna struktura otežuje vzdrževanje, saj kakršna koli sprememba zahteva razumevanje celotnega konteksta kode pred posegom.

> **✏️ ZAPIŠI:** Kaj pomeni za razvijalca, ki prihaja na projekt, da mora razumeti 1,3 MB ene same datoteke? Kako to vpliva na čas onboardinga in na tveganje napak pri posegih? (2–3 stavki)

<!-- TVOJA REFLEKSIJA O VZDRŽEVALNOSTI PLACE.VB: -->


### 3.2 Varnostna tveganja in pomanjkanje izolacije najemnikov

Obstoječi namizni sistem je bil zasnovan za eno podjetje naenkrat — koncepta "najemnik" (*tenant*) v njegovi arhitekturi preprosto ni. Ker gre za namizno aplikacijo, se vsaka stranka namesti pri sebi, s svojo bazo podatkov. V SaaS modelu, kjer eno instanco sistema hkrati uporablja več podjetij, ta pristop odpove.

> **✏️ ZAPIŠI:** Kaj se zgodi v SaaS sistemu brez izolacije najemnikov, če razvijalec pri pisanju poizvedbe pozabi dodati pogoj `WHERE tenant_id = ?`? Opiši najslabši možni scenarij. (3–4 stavki)

<!-- TVOJ OPIS VARNOSTNEGA TVEGANJA: -->


> **✏️ ZAPIŠI:** Zakaj izolacija na ravni aplikacijske kode (torej, da razvijalec vedno ročno doda filter) ni dovolj zanesljiva? Kaj jo naredi ranljivo? (2–3 stavki)

<!-- TVOJA RAZLAGA OMEJITEV APLIKACIJSKE IZOLACIJE: -->
Osnutek najslabšega scenarija:

Če razvijalec pozabi dodati WHERE tenant_id = ?, poizvedba vrne podatke vseh podjetij v sistemu, ne le tistega, ki je zahtevo poslalo. V praksi to pomeni, da bi lahko računovodja podjetja A ob prijavi v sistem zagledal plače, osebne podatke in davčne številke zaposlenih podjetja B, C in vseh ostalih strank na isti instanci. To je najhujši možni scenarij za SaaS ponudnika občutljivih finančnih podatkov — pomeni kršitev GDPR, izgubo zaupanja strank in potencialno pravne posledice ali izgubo poslovnega dovoljenja.

Osnutek razlage omejitev aplikacijske izolacije:

Izolacija zgolj na ravni aplikacijske kode ni zanesljiva, ker je odvisna od discipline vsakega posameznega razvijalca pri vsaki posamezni poizvedbi — dovolj je ena pozabljena vrstica ali en nov razvijalec, ki tega vzorca ne pozna, pa je varnost prebita. Poleg tega taka napaka pogosto ni vidna med testiranjem, saj se testira z enim samim najemnikom, zato jo lahko odkrijemo šele, ko je podatek že uhajal v produkciji.

### 3.3 Sinhrona blokada niti in neodzivnost vmesnika

Okolje Node.js deluje na enonitnem (*single-threaded*) modelu izvajanja, ki temelji na Event Loopu. Za razliko od tradicionalnih strežniških platform (Java, .NET), ki vsakemu zahtevku dodelijo svojo nit, Node.js obravnava vse zahtevke v eni niti, ki jih izmenjuje z asinhronim I/O modelom.

> **✏️ ZAPIŠI:** Z lastno analogijo razloži Event Loop. (Primeri analogij: blagajna v trgovini, natakar v restavraciji, dirigent orkestra.) Kaj se zgodi z analogijo, ko pride "dolg zahtevek" — kot je masovni izračun plač za 300 zaposlenih? (4–5 stavkov)

<!-- TVOJA ANALOGIJA ZA EVENT LOOP: -->


> **✏️ ZAPIŠI:** V starih namiznih sistemih (Hisoft 2020) ta problem ne obstaja — zakaj? In zakaj postane problem takoj, ko prestopiš v spletni SaaS model? (2–3 stavki)

<!-- TVOJA RAZLAGA RAZLIKE DESKTOP VS SAAS: -->
Osnutek analogije za Event Loop:

Event Loop v Node.js si lahko predstavljaš kot enega samega natakarja v restavraciji, ki ne čaka pri eni mizi, dokler gost ne poje celotne večerje, temveč nenehno kroži med mizami — sprejme naročilo, ga odnese v kuhinjo, medtem pa že streže naslednji mizi, in ko je jed pripravljena, jo prinese nazaj. Tako en sam natakar navidezno "hkrati" streže veliko miz, ker nikoli ne stoji pri eni mizi in čaka v prazno. Težava nastane, če en gost naroči jed, ki jo mora natakar sam, ročno pripraviti za mizo (dolg sinhron izračun) — v tem primeru natakar fizično ne more oditi od te mize, dokler ne konča, zato vse ostale mize v restavraciji čakajo, čeprav njihova naročila sploh niso povezana z zamudno jedjo. Natančno to se zgodi pri sinhronem izračunu plač za 300 zaposlenih: Event Loop je "zaseden" z izračunom in ne more obdelati nobenega drugega zahtevka, dokler izračun ne konča, zato cela aplikacija za vse uporabnike začasno obvisi.

Osnutek razlage desktop vs SaaS:

V namiznem sistemu Hisoft 2020 ta problem ne obstaja, ker vsako podjetje uporablja svojo lastno inštanco aplikacije na svojem računalniku — tudi če se program med izračunom "zamrzne", to prizadene le enega uporabnika, ne pa nikogar drugega. V spletnem SaaS modelu pa vsi uporabniki delijo isto zaledno instanco, zato blokada niti pri enem podjetju (npr. med obračunom) neposredno vpliva na odzivnost aplikacije za vsa ostala podjetja hkrati.

---

## 4. Načrtovanje nove rešitve (ePlače 2026)

Na podlagi analize ugotovljenih pomanjkljivosti bo zasnova nove rešitve temeljila na naslednjih arhitekturnih principih: normalizacija podatkovnega modela do tretje normalne oblike [9], varnost po načrtu (*Security by Design*) [18] ter ločitev odgovornosti na ravni modulov [10].

> **✏️ ZAPIŠI:** Z lastnimi besedami povzemi: kateri trije problemi iz poglavja 3 so ti pri zasnovi nove rešitve bili vodilni? Kako si jih naslovil? (3–5 stavkov — pokaži rdečo nit med analizo in zasnovo)

<!-- TVOJA RDEČA NIT MED ANALIZO IN ZASNOVO: -->
Pri zasnovi nove rešitve so me vodili trije problemi, ki sem jih identificiral pri analizi obstoječega sistema: podatkovni kaos v razpršenih tabelah brez konsistentnih relacij, popolna odsotnost izolacije med najemniki ter sinhrona blokada niti pri masovnih izračunih. Prvi problem sem naslovil z normalizacijo podatkovnega modela do tretje normalne oblike, kar odpravlja podvajanje in nekonsistentnost podatkov. Drugega sem rešil z uvedbo Row-Level Security neposredno na nivoju baze podatkov, tako da izolacija ni odvisna od discipline razvijalca, temveč je zagotovljena sistemsko. Tretjega sem naslovil z asinhrono arhitekturo (BullMQ delavci), ki dolge izračune premakne izven glavne niti Express strežnika, tako da ostane aplikacija odzivna za vse uporabnike. Te tri odločitve tako neposredno izhajajo iz konkretnih pomanjkljivosti, ugotovljenih v poglavju 3, kar zagotavlja, da zasnova ni le teoretična, temveč ciljno rešuje realne probleme starega sistema.

### 4.1 Modeliranje normalizirane baze podatkov

Nova podatkovna baza bo zamenjala 148 starih tabel z osmimi osrednjimi tabelami, ki sledijo tretji normalni obliki (3NF) [9]. Vsaka tabela bo imela natanko eno odgovornost; finančni zneski bodo shranjeni kot `decimal(10,2)` namesto besedila; tuje ključe bodo uveljavljali na nivoju sheme.

| Tabela | Namen | Ključni stolpci |
|--------|-------|----------------|
| `tenants` | Registracija podjetij (najemnikov) | `tenant_id`, `name`, `tax_number` |
| `employees` | Kadrovska evidenca | `employee_id`, `tenant_id`, `emso`, `tax_id`, `iban` |
| `payroll_runs` | Glava obračuna | `run_id`, `tenant_id`, `period`, `status` |
| `payroll_lines` | Vrstice obračuna (po zaposlenem) | `line_id`, `run_id`, `employee_id`, `gross`, `net` |
| `payroll_params` | Zakonodajni parametri | `param_id`, `key`, `value`, `valid_from`, `valid_to` |
| `work_hours` | Evidence ur | `hours_id`, `employee_id`, `date`, `hours` |
| `deductions` | Odtegljaji (krediti, izvršbe) | `deduction_id`, `employee_id`, `amount`, `reason` |
| `audit_log` | Revizijska sled | `log_id`, `table_name`, `changed_by`, `changed_at` |

> **✏️ ZAPIŠI:** Zakaj je tabela `payroll_params` s stolpci `valid_from` in `valid_to` pametna rešitev za upravljanje zakonodajnih sprememb? Opiši, kaj se zgodi, ko se minimalna plača 1. januarja 2027 spremeni. (3–4 stavki)

<!-- TVOJA RAZLAGA PAYROLL_PARAMS: -->

Osnutek razlage payroll_params:

Tabela payroll_params s stolpcema valid_from in valid_to omogoča, da sistem hrani več različnih vrednosti istega parametra (npr. minimalne plače) hkrati, vsako z lastnim obdobjem veljavnosti. Ko se 1. januarja 2027 spremeni minimalna plača, se v tabelo preprosto doda nova vrstica z novo vrednostjo in valid_from = 2027-01-01, medtem ko se stari vrstici nastavi valid_to = 2026-12-31 — obstoječe vrstice se torej nikoli ne prepišejo. To pomeni, da lahko sistem kadarkoli pravilno obračuna plačo za pretekli mesec po takrat veljavnih parametrih, tudi če obračun izvajaš z zamikom (npr. popravek plače za oktober, izračunan šele decembra).

> **✏️ ZAPIŠI:** Kateri stolpci v tabeli `employees` so v stari bazi bili shranjeni kot `nvarchar`? Zakaj je sprememba v pravilne podatkovne tipe (npr. `decimal` za zneske) več kot le estetska? (2–3 stavki)

<!-- TVOJA UTEMELJITEV PRAVILNIH PODATKOVNIH TIPOV: -->
Osnutek utemeljitve pravilnih podatkovnih tipov:

Glede na to, kateri stolpci so bili natančno nvarchar v stari bazi Hisoft 2020 — tega nimam podatka iz gradiva, ki ga vidim (verjetno so bili finančni zneski, kot bruto/neto plača, shranjeni kot besedilo). Preveri v svoji analizi stare sheme in dopolni ta del s konkretnimi imeni stolpcev.

Kar zadeva utemeljitev same spremembe: shranjevanje zneskov kot besedilo (nvarchar) ni le estetska napaka, saj baza ne more zagotoviti pravilnega numeričnega primerjanja, seštevanja ali zaokroževanja — "100.5" in "100.50" bi bila kot niza različna, poizvedbe tipa "vsi zneski nad 1000 €" pa bi delovale nepravilno (leksikografsko namesto številsko). Uporaba decimal(10,2) namesto tega zagotavlja natančno finančno aritmetiko brez zaokrožitvenih napak, ki so pri obračunu plač zakonsko nedopustne.

### 4.2 Večnajemniška izolacija s pomočjo Row-Level Security

Vsaka tabela z najemniškimi podatki bo vsebovala stolpec `tenant_id`. Na nivoju baze podatkov bo definirana varnostna politika (*security policy*), ki bo za vsak `SELECT`, `UPDATE`, `INSERT` in `DELETE` samodejno dodala pogoj, ki preveri, ali `tenant_id` v vrstici ustreza vrednosti, nastavljeni z `SESSION_CONTEXT(N'tenant_id')`.

> **✏️ ZAPIŠI:** Kaj nastavi `SESSION_CONTEXT` in kdaj? (Namig: ob vsakem HTTP zahtevku v zalednem delu, preden se karkoli poizveduje) Zakaj je to ključnega pomena za varnost v večnajemniškem modelu? (3–4 stavki)

<!-- TVOJA RAZLAGA SESSION_CONTEXT: -->

Osnutek razlage SESSION_CONTEXT:

SESSION_CONTEXT nastavi zaledna Node.js aplikacija ob vsakem HTTP zahtevku, takoj po avtentikaciji uporabnika in preden se izvede katerakoli poizvedba nad bazo — iz JWT žetona prebere tenant_id uporabnika in ga zapiše v sejni kontekst SQL povezave. To je ključnega pomena, ker varnostna politika RLS deluje šele takrat, ko baza ve, "kdo sprašuje" — brez tega koraka bi baza nimela referenčne vrednosti, s katero bi primerjala tenant_id v vrsticah, in filter sploh ne bi mogel delovati. Ker se to nastavi na začetku vsakega zahtevka, je izolacija zagotovljena dosledno in avtomatsko, ne glede na to, katera poizvedba se kasneje izvede.

> **✏️ ZAPIŠI:** Opiši scenarij, v katerem RLS zaščiti podatke kljub napaki razvijalca. Kaj bi baza vrnila, če bi razvijalec pozabil filtrirati po tenant_id, a bi bil SESSION_CONTEXT pravilno nastavljen? (3 stavki)

<!-- TVOJ VARNOSTNI SCENARIJ: -->
tek varnostnega scenarija:

Recimo, da razvijalec napiše poizvedbo SELECT * FROM employees brez pogoja WHERE tenant_id = ?, ker je pozabil ali je to preprosto spregledal pri hitrem popravku kode. Ker je SESSION_CONTEXT pravilno nastavljen na tenant_id prijavljenega uporabnika, RLS politika na nivoju baze samodejno doda skrit filter in vrne le vrstice, ki pripadajo temu najemniku — kljub temu, da jih poizvedba eksplicitno ni zahtevala. Baza torej deluje kot varnostna mreža, ki ujame napako razvijalca, še preden ta pripelje do uhajanja podatkov med podjetji.

### 4.3 Zgodovinska sledljivost s Temporalnimi tabelami

Tabele `employees` in `payroll_lines` bodo definirane kot sistemsko verzionirajoče temporalne tabele (*system-versioned temporal tables*). MS SQL Server bo samodejno vzdrževal vzporedno zgodovinsko tabelo, v kateri bo za vsako spremembo vrstice shranil prejšnjo vrednost skupaj s časovnim žigom `ValidFrom` in `ValidTo`.

> **✏️ ZAPIŠI:** Navedi konkreten primer, zakaj je revizijska sled nujna pri plačah. Kaj se zgodi, ko zaposleni trdi, da je bila njegova plača marca 2025 višja, kot kaže izpisek? Kako temporalna tabela pomaga pri reševanju tega spora? (3–4 stavki)

<!-- TVOJ PRIMER REVIZIJSKE SLEDI: -->

Osnutek primera revizijske sledi:

Predpostavimo, da zaposleni marca 2025 trdi, da je bila njegova plača takrat višja, kot kaže trenutni izpisek, morda zaradi napake pri kasnejšem popravku ali suma na nepooblaščeno spremembo. Ker je tabela payroll_lines sistemsko verzionirana, lahko poizvedujemo neposredno po stanju, kakršno je veljalo na določen datum (FOR SYSTEM_TIME AS OF '2025-03-15'), in dobimo natančno tisto vrstico, ki je bila takrat aktivna — brez potrebe po ročnih varnostnih kopijah ali dodatni logiki v aplikaciji. Temporalna tabela poleg tega hrani tudi natančen čas vsake spremembe, kar omogoča, da spor rešimo z dejanskim podatkom namesto z besedo proti besedi. To bistveno pospeši reševanje pritožb zaposlenih in ščiti podjetje pred neupravičenimi zahtevki, hkrati pa dokazuje skladnost ob morebitnem inšpekcijskem nadzoru.

### 4.4 Zasnova REST API vmesnikov

Zaledni del bo izpostavljal RESTful API, organiziran v smiselne module. Vsaka akcija bo mapirana na HTTP metodo in pot.

| Modul | Primer poti | Metoda | Opis |
|-------|-------------|--------|------|
| Obračun | `/api/v1/payroll/runs` | POST | Zaženi nov obračun |
| Obračun | `/api/v1/payroll/runs/:id` | GET | Vrni status obračuna |
| Zaposleni | `/api/v1/employees` | GET | Seznam zaposlenih |
| Zaposleni | `/api/v1/employees/:id` | PUT | Posodobi podatke zaposlenega |
| Parametri | `/api/v1/params` | GET | Zakonodajni parametri |
| Izvoz | `/api/v1/payroll/runs/:id/rek-o` | GET | REK-O XML izvoz |
| Izvoz | `/api/v1/payroll/runs/:id/sepa` | GET | SEPA pain.001 XML |

> **✏️ ZAPIŠI:** Zakaj je versioniranje API-ja (prefiks `/v1/`) dobra praksa že od začetka? Kaj se zgodi, ko moraš API spremeniti za spremembo zakonodaje, a so stranke navajene na stari format? (2–3 stavki)

<!-- TVOJA RAZLAGA API VERSIONIRANJA: -->


> **✏️ ZAPIŠI:** Razloži razliko med `POST /payroll/runs` (zaženi obračun) in `GET /payroll/runs/:id` (preveri status) v kontekstu asinhronega modela — zakaj sta dve ločeni poti in ne ena? (2–3 stavki)

<!-- TVOJA RAZLAGA ASINHRONEGA API VZORCA: -->

Osnutek razlage API versioniranja:

Versioniranje API-ja s prefiksom /v1/ je dobra praksa, ker omogoča uvedbo novih, nezdružljivih sprememb (npr. spremenjena struktura odgovora zaradi nove zakonodaje) brez podiranja obstoječih odjemalcev, ki še vedno pričakujejo stari format. Ko se zakonodaja spremeni tako, da zahteva drugačno strukturo API odgovora, lahko preprosto uvedeš /v2/, medtem ko /v1/ še naprej deluje nespremenjeno za stranke, ki se še niso preklopile — s tem se izogneš temu, da bi morali vse odjemalce (npr. integracije s SPOT portalom) posodobiti hkrati.

Osnutek razlage asinhronega API vzorca:

Ločeni poti obstajata, ker gre za dve konceptualno različni operaciji: POST /payroll/runs le sproži dolgotrajen proces v ozadju in takoj vrne potrditev (HTTP 202) skupaj z identifikatorjem opravila, medtem ko GET /payroll/runs/:id omogoča, da odjemalec kadarkoli po lastni presoji preveri, kako daleč je obračun prišel. Če bi imeli eno samo pot, bi morala zahteva ostati odprta, dokler se cel obračun ne konča, kar bi pri 500 zaposlenih pomenilo dolgo čakanje in tveganje za časovno prekoračitev (timeout) povezave.
---

## 5. Implementacija ključnih modulov

### 5.1 Obračunski motor in matematični model izračuna

Obračunski motor bo izvedel izračun neto plače v osmih zaporednih korakih. Vsak korak je zakonsko predpisan; vrstni red ni arbitraren.

**Korak 1 — Bruto plača:**

$$B = \text{osnovna plača} + \text{dodatki} + \text{nadomestila}$$

**Korak 2 — Prispevki delavca** (skupaj 22,10 % bruto):

$$P_d = B \times 0{,}2210$$

Sestava: PIZ 15,50 % + ZZ 6,36 % + DO 0,14 % + ZZ poškodbe 0,10 % + brezposelnost 0,14 %

**Korak 3 — Davčna osnova:**

$$DO = B - P_d - \text{splošna olajšava (3.500,54 €/leto)}$$

**Korak 4 — Dohodnina** (progresivna, 5 razredov za 2026):

| Razred | Dohodek (€/leto) | Stopnja |
|--------|-----------------|---------|
| 1. | do 8.755,00 | 16 % |
| 2. | 8.755,01 – 25.922,00 | 26 % |
| 3. | 25.922,01 – 51.844,00 | 33 % |
| 4. | 51.844,01 – 74.160,00 | 39 % |
| 5. | nad 74.160,00 | 50 % |

**Korak 5 — Neto pred OZP:**

$$N_1 = B - P_d - D$$

**Korak 6 — OZP odtegljaj** (od 01.01.2024 fiksnih 35,00 €/mesec):

$$N_2 = N_1 - 35{,}00$$

**Korak 7 — Povračila stroškov:**

$$P = (\text{delovni dnevi} \times 7{,}96) + (\text{km} \times 2 \times 0{,}21)$$

*Dnevnica za prehrano: 7,96 €/delovni dan; Prevoz: 0,21 €/km, obračunano za obe smeri*

**Korak 8 — Skupaj na TRR:**

$$TRR = N_2 + P - \text{odtegljaji}$$

> **✏️ ZAPIŠI:** Ročno izračunaj plačo za zaposlenega z bruto 1.800,00 € in 22 delovnimi dnevi ter 12 km razdaljo do dela. Zapiši vsak korak posebej z vmesnimi vrednostmi. Ko si naredil, pojasni: kje si naredil napako prvič? Zakaj je zaokroževanje kritično? (8–12 stavkov)
>
> *Nasveti: Napaka pri zaokroževanju po korakih se sešteje. Pri 300 zaposlenih je razlika centov na zaposlenega lahko skupno 10 €+ napake v mesečnem obračunu.*

<!-- TVOJ ROČNI IZRAČUN IN REFLEKSIJA: -->


> **✏️ ZAPIŠI:** Zakaj smo se odločili za knjižnico `bignumber.js` namesto navadnih JavaScript float operacij? Preizkusi v brskalniku (F12 → konzola): `0.1 + 0.2`. Kaj dobiš? Zakaj je to problem pri finančnih izračunih? (3–4 stavki)

<!-- TVOJA RAZLAGA FLOATING POINT PROBLEMA: -->
**Osnutek razlage floating point problema:**

Ko v konzoli brskalnika preizkusim `0.1 + 0.2`, JavaScript ne vrne pričakovanih `0.3`, temveč `0.30000000000000004`. Do tega prihaja, ker JavaScript (kot večina jezikov) števila s plavajočo vejico shranjuje v binarnem zapisu, v katerem nekaterih decimalnih ulomkov (kot je 0.1) ni mogoče natančno predstaviti — podobno kot 1/3 ne moremo natančno zapisati v desetiškem sistemu. Pri finančnih izračunih je to nesprejemljivo, saj bi se take mikroskopske napake pri obračunu plač za na tisoče zaposlenih in vrstic sčasoma seštele v vidno, neujemajočo se vsoto, kar je pri denarnih zneskih nedopustno. Knjižnica `bignumber.js` namesto tega izvaja aritmetiko na decimalnih vrednostih natančno, brez binarnih zaokrožitvenih napak, kar zagotavlja, da se izračunani zneski vedno ujemajo do centa natančno.

### 5.2 Upravljanje s kadrovskimi podatki v Angularju

Modul za upravljanje kadrovskih podatkov bo implementiran kot večkoračni čarovnik (*wizard*), ki bo vodil računovodjo skozi vnos podatkov novega zaposlenega. Obrazci bodo implementirani z Angular Reactive Forms in strogimi regularnimi izrazi za sprotno validacijo kritičnih polj.

| Polje | Validacijsko pravilo | Napaka |
|-------|---------------------|--------|
| EMŠO | natanko 13 znakov, le cifre | "EMŠO mora imeti 13 znakov" |
| Davčna številka | natanko 8 znakov, le cifre | "Davčna številka mora imeti 8 znakov" |
| IBAN | SI56 + natanko 15 znakov | "Neveljaven format slovenskega IBAN" |
| E-pošta | standardni email format | "Neveljaven email naslov" |

> **✏️ ZAPIŠI:** Zakaj je validacija na strani odjemalca (v brskalniku) in ne samo na strani strežnika (v API-ju) boljša izkušnja za uporabnika? Navedi konkreten primer z napačnim IBAN-om. (3–4 stavki)

<!-- TVOJA RAZLAGA CLIENT-SIDE VALIDACIJE: -->

Osnutek razlage client-side validacije:

Validacija na strani odjemalca da uporabniku takojšnjo povratno informacijo, še preden pošlje kar koli na strežnik — če računovodja vnese IBAN, ki nima 15 znakov po "SI56" ali vsebuje črko namesto številke, Angular obrazec takoj (ob izgubi fokusa polja) izpiše "Neveljaven format slovenskega IBAN", brez čakanja na omrežni klic. To pomeni, da uporabnik napako opazi in popravi v realnem času, medtem ko pri validaciji samo na strežniku ne bi vedel, da je nekaj narobe, dokler ne bi kliknil "Shrani", počakal na odgovor API-ja in šele nato dobil sporočilo o napaki — kar je počasnejše in bolj frustrirajoče, sploh pri obrazcu z več polji. Pomembno pa je omeniti, da client-side validacija ne nadomesti, temveč dopolnjuje server-side validacijo — slednja ostaje nujna, saj se lahko client-side preverjanje zaobide (npr. neposreden klic API-ja mimo brskalnika).

> **✏️ ZAPIŠI:** Opiši, kako si si vizualiziral čarovnik za vnos zaposlenega. Kateri koraki so nujni in v kakšnem vrstnem redu? Zakaj prav ta vrstni red? (5–7 stavkov)

<!-- TVOJ OPIS ČAROVNIKA ZA ZAPOSLENEGA: -->
**Osnutek opisa čarovnika (prilagodi glede na svojo dejansko zasnovo):**

Čarovnik za vnos zaposlenega sem zasnoval v štirih korakih, ki si sledijo od splošnih osebnih podatkov proti vedno bolj specifičnim in finančno občutljivim informacijam. Prvi korak zajema osnovne osebne podatke (ime, priimek, EMŠO, davčna številka), saj ti identificirajo osebo in so pogoj za vse nadaljnje korake — brez veljavnega EMŠO in davčne številke sistem sploh ne dovoli nadaljevanja, ker sta ti dve polji ključni za kasnejše zakonsko poročanje. Drugi korak zajema kontaktne in bančne podatke (e-pošta, IBAN), ki so potrebni za komunikacijo in izplačilo plače, a niso nujni za samo identifikacijo osebe, zato pridejo za osnovnimi podatki. Tretji korak se osredotoča na pogodbene podatke (tip zaposlitve, delovni čas, datum zaposlitve), ki določajo, kako se bo zaposlenega kasneje obračunavalo. Zadnji korak je pregled vseh vnesenih podatkov pred dokončno potrditvijo, kjer računovodja lahko še enkrat preveri vse skupaj na enem mestu, preden se zapiše v bazo — s tem zmanjšam možnost, da bi napačen vnos ostal neopažen do prvega obračuna plače. Tak vrstni red sledi logiki "od splošnega k specifičnemu" in hkrati zagotavlja, da uporabnik ne izgubi vnesenih podatkov zaradi napake v poznejšem koraku, saj je vsak korak validiran samostojno, preden lahko nadaljuje naprej.

Prilagodi glede na to, koliko korakov si dejansko načrtoval — če jih je manj ali več, popravi tudi utemeljitev vrstnega reda.

### 5.3 Varnostni mehanizmi (JWT, RBAC)

Sistem bo implementiral trinivojski model pristojnosti:

| Vloga | Pristojnosti |
|-------|-------------|
| `SistemskiAdmin` | Upravljanje najemnikov, sistemski pregled |
| `Skrbnik` | Upravljanje zaposlenih, zagon obračuna, izvoz |
| `Uporabnik` | Samo branje lastnih plačilnih list |

Avtentikacija bo temeljila na **JWT** žetonih z 8-urno veljavnostjo. Gesla bodo shranjena z **bcrypt** zgoščevanjem z faktorjem `10`.

> **✏️ ZAPIŠI:** Zakaj ima JWT žeton veljavnost 8 ur in ne npr. 30 dni? Kaj se zgodi, če žeton poteče med delom? Kateri kompromis si sprejel med varnostjo in uporabniško izkušnjo? (3–4 stavki)

<!-- TVOJA RAZLAGA JWT VELJAVNOSTI: -->

Osnutek razlage JWT veljavnosti:

JWT žeton ima veljavnost 8 ur, ker to približno ustreza enemu delovnemu dnevu — dovolj dolgo, da se računovodja ne prijavlja v sistem vsakih nekaj minut, hkrati pa dovolj kratko, da ukraden ali uhajan žeton ne ostane uporaben za napadalca v nedogled (kot bi se zgodilo pri 30-dnevni veljavnosti). Če žeton poteče med delom, uporabnika sistem preusmeri nazaj na prijavo, kar sicer prekine delovni tok, a to je zavesten kompromis: raje sprejmemo manjšo nevšečnost občasne ponovne prijave kot pa tveganje, da bi ukraden žeton omogočal dostop do plačilnih podatkov cel mesec. Za daljše seje bi lahko dodatno uvedli refresh token mehanizem, ki bi uporabniku omogočil podaljšanje seje brez ponovnega vnosa gesla, a ohranil kratko veljavnost dostopnega žetona.


<!-- TVOJA RAZLAGA BCRYPT: -->

Osnutek razlage bcrypt:

Bcrypt je namerno počasen algoritem, ker je njegov namen otežiti napadalcu, da bi z brute-force napadom (preizkušanjem milijonov gesel na sekundo) v razumnem času uganil geslo iz ukradene zgoščene vrednosti. Če bi zgoščevanje trajalo le mikrosekunde (kot npr. navadni MD5 ali SHA1), bi napadalec lahko preizkusil ogromno število gesel na sekundo, medtem ko bcryptova namerna počasnost (nastavljiva s faktorjem, npr. 10) to število drastično zmanjša, kar napad naredi praktično neizvedljiv v razumnem času.
> **✏️ ZAPIŠI:** Zakaj je bcrypt namerno počasen algoritem? Zakaj je ta "počasnost" prednost, ne napaka? (2–3 stavki)

### 5.4 Izvozi in zunanji vmesniki

Platforma bo zagotavljala naslednje standardizirane izvoze:

**REK-O XML (FURS eDavki):** Mesečni obračun prispevkov in dohodnine za FURS. Format temelji na XML shemi, ki jo predpisuje FURS; vsaka sprememba zakonodaje zahteva posodobitev sheme.

**SEPA pain.001.001.03 XML:** ISO 20022 format za množičen bančni prenos nakazil. Ta format sprejemajo vse slovenske banke za serijsko procesiranje plačilnih nalogov.

**VOD XML:** Format za uvoz plačilnih list v računovodske sisteme Minimax, Vasco in Opal.

**eBOL integracija:** Elektronski prenos bolniških listov prek SPOT portala ZZZS z digitalnim podpisom (SIGOV-CA certifikat).

> **✏️ ZAPIŠI:** Zakaj FURS in ZZZS zahtevata XML format in ne npr. Excel ali PDF? Kaj zagotavlja standardiziran XML format pri izmenjavi podatkov med sistemi? (2–3 stavki)

<!-- TVOJA RAZLAGA XML STANDARDOV: -->

**Osnutek razlage XML standardov:**

FURS in ZZZS zahtevata XML, ker gre za strojno berljiv, strogo strukturiran format, ki ga lahko njihovi sistemi avtomatsko preberejo, validirajo proti predpisani shemi (XSD) in obdelajo brez človeškega posredovanja — za razliko od Excela ali PDF-ja, ki sta zasnovana predvsem za človeka, ne za strojno obdelavo, in nimata enotne, strogo preverljive strukture. Standardiziran XML format zagotavlja, da vsi pošiljatelji (na tisoče različnih podjetij in sistemov) oddajo podatke v natanko isti obliki, kar FURS-u in ZZZS-ju omogoča avtomatizirano, zanesljivo in poceni obdelavo velikih količin podatkov brez ročnega usklajevanja formatov med različnimi ponudniki programske opreme.

> **✏️ ZAPIŠI:** eBOL integracija zahteva digitalni podpis s certifikatom SIGOV-CA. Zakaj je digitalni podpis nujen pri elektronski izmenjavi zdravstvenih podatkov? (2–3 stavki)

<!-- TVOJA RAZLAGA DIGITALNEGA PODPISA: -->

**Osnutek razlage digitalnega podpisa:**

Digitalni podpis pri elektronski izmenjavi zdravstvenih podatkov (bolniški listi) zagotavlja avtentičnost — potrjuje, da dokument dejansko prihaja od pooblaščenega pošiljatelja (npr. ZZZS ali zdravnika) in ne od nekoga, ki se zanj le izdaja. Hkrati zagotavlja celovitost podatkov, saj že najmanjša sprememba dokumenta po podpisu naredi podpis neveljaven, kar prepreči nezaznano ponarejanje občutljivih zdravstvenih informacij med prenosom. Ker gre za posebno kategorijo osebnih podatkov po GDPR (zdravstveni podatki), je tak nivo zaupanja in sledljivosti zakonsko nujen, ne le priporočljiv.
---

## 6. Migracija in testiranje

### 6.1 Postopek migracije podatkov

Prenos podatkov iz obstoječe Hisoft baze v novo ePlače shemo bo potekal v treh fazah, po metodologiji ETL (Extract, Transform, Load) [9]:

**Faza 1 — Ekstrakcija (Extract):** Branje surovih podatkov iz obstoječe MS SQL baze Hisoft 2020. Podatki bodo izvoženi v vmesni format (CSV ali JSON) brez kakršne koli transformacije, da ohranimo natančen zapis izvornega stanja.

**Faza 2 — Transformacija (Transform):** Čiščenje in pretvorba surovih podatkov. Besedilni finančni zneski bodo pretvorjeni v `decimal(10,2)`; podvojene bančne podatke bo treba združiti z logiko prioritete; neveljavni EMŠO-ji in IBAN-i bodo označeni za ročni pregled.

**Faza 3 — Nalaganje (Load):** Uvoz transformiranih podatkov v novo shemo z aktivno referenčno celovitostjo. Vsaka vrstica bo preverjena z bazo omejitev (*constraints*) pred potrditvijo transakcije.

> **✏️ ZAPIŠI:** Kateri podatki iz stare Hisoft baze bodo po tvojem mnenju "umazani" in bodo zahtevali ročno čiščenje? Navedi vsaj 3 konkretne primere (npr. TRR v napačnem formatu, prazni EMŠO, finančni znesek z vejico namesto pike). (4–5 stavkov)
>
> *Nasveti: Poglej DELAVCI.txt in si zamisli, katere vrednosti bi bile najverjetneje napačne v resničnih podatkih.*

<!-- TVOJI PRIMERI UMAZANIH PODATKOV: -->
**Napotek:** Nimam dostopa do `DELAVCI.txt`, ki ga navodila omenjajo, zato spodaj podajam tipične primere umazanih podatkov, značilne za stare namizne sisteme — preveri jih ob dejanski datoteki in po potrebi zamenjaj s konkretnimi primeri, ki jih dejansko najdeš.

**Osnutek primerov umazanih podatkov:**

Pri stari Hisoft bazi bi verjetno naletel na TRR/IBAN številke, vnesene v starem, predSEPA formatu (npr. brez "SI56" predpone) ali z vmesnimi presledki, ki jih bo treba normalizirati. Prav tako pričakujem prazna ali nepopolna polja EMŠO pri starejših vnosih zaposlenih, kjer je bil vnos morda obvezen šele kasneje ali pa je bil enostavno preskočen. Finančni zneski so bili verjetno shranjeni kot besedilo z vejico namesto piko kot decimalnim ločilom (npr. "1200,50" namesto "1200.50"), kar zahteva pretvorbo pred vnosom v `decimal(10,2)`. Možno je tudi podvajanje zaposlenih (isti EMŠO vnesen dvakrat z rahlo drugačnimi podatki, npr. zaradi popravka priimka po poroki), kar zahteva ročno odločitev, katera vrstica je pravilna. Nazadnje bi lahko obstajale nekonsistentne vrednosti pri statusnih poljih (npr. "AKTIVEN", "aktiven", "1", "DA" za isto stanje), ki jih je treba pred nalaganjem poenotiti.


> **✏️ ZAPIŠI:** Zakaj je faza transformacije neodvisna od faze nalaganja? Kaj se zgodi, če transformiraš in naladuješ hkrati in pride do napake v sredini? (2–3 stavki — pojasni vrednost transakcijskega pristopa)

<!-- TVOJA RAZLAGA LOČENIH FAZE ETL: -->

**Osnutek razlage ločenih faz ETL:**

Faza transformacije je neodvisna od faze nalaganja, ker omogoča, da napake pri čiščenju podatkov odkrijemo in popravimo v vmesnem, "varnem" formatu, še preden karkoli zapišemo v produkcijsko bazo. Če bi transformacijo in nalaganje izvajala hkrati kot en sam korak, bi napaka na sredini procesa (npr. neveljaven IBAN pri zaposlenem št. 300 od 500) lahko pustila bazo v nekonsistentnem, delno napolnjenem stanju — nekateri zaposleni bi bili uvoženi, drugi ne, brez jasne sledi, kje je proces odpovedal. Ločen, transakcijski pristop pri nalaganju (vse ali nič) zagotavlja, da se v primeru napake celotna faza nalaganja razveljavi, kar prepreči delno in nekonsistentno stanje podatkov.

### 6.2 Integracije in izvozi

Testiranje integracij bo potekalo na testnih okoljih pristojnih institucij:

- **eDavki FURS:** Testno okolje za validacijo REK-O XML sheme
- **ZZZS eBOL:** Testni strežnik SPOT portala za eBOL zahtevke
- **Banka (SEPA):** Validacija pain.001 XML pred pošiljanjem v produkcijo

> **✏️ ZAPIŠI:** Zakaj ne testiramo direktno na produkcijskem okolju FURS ali ZZZS? Kaj je tveganje in kakšne so posledice, če pošljemo napačen REK-O XML direktno FURS-u? (2–3 stavki)

<!-- TVOJA RAZLAGA TESTNIH OKOLIJ: -->

Osnutek razlage testnih okolij:

Na produkcijskem okolju FURS ali ZZZS ne testiramo, ker bi napačno oddan dokument tam veljal za uraden, pravno zavezujoč vnos, ne za preizkus — sistem bi ga obravnaval enako, kot da je podjetje dejansko oddalo svoj mesečni obračun. Če bi FURS-u pomotoma poslali napačen REK-O XML (npr. z napačnimi zneski prispevkov), bi to lahko sprožilo napačen obračun davčnih obveznosti podjetja, potencialni inšpekcijski nadzor ali potrebo po naknadnem popravku uradne dokumentacije, kar je časovno in birokratsko zamudno. Testno okolje zato omogoča preverjanje pravilnosti XML sheme in logike brez teh realnih pravnih in finančnih posledic.

### 6.3 Testiranje pravilnosti izračunov

Pravilnost obračunskega motorja bo preverjena na podlagi testnih podatkov iz arhiva `HISOFT26/VSIOD_1000BRUTO.xlsx`, ki vsebuje 1.000 referenčnih bruto vrednosti z ročno izračunanimi neto zneski.

> **✏️ ZAPIŠI:** Opiši strategijo testiranja. Kateri izračun boš preveril najprej (t.i. "smoke test")? Kako boš preveril, da je tvoj motor dal iste rezultate kot stari Hisoft za iste vhodne podatke? Kaj si misliš, da bo razlika in zakaj? (4–6 stavkov)

<!-- TVOJA STRATEGIJA TESTIRANJA: -->

**Osnutek strategije testiranja:**

Kot "smoke test" bi najprej preveril en sam, tipičen primer — npr. povprečno bruto plačo brez posebnosti (brez dodatkov, kreditov ali bolniške) — da hitro potrdim, ali osnovna logika obračunskega motorja sploh deluje, preden se lotim celotnega nabora. Nato bi vse 1.000 referenčnih bruto vrednosti iz `VSIOD_1000BRUTO.xlsx` pognal skozi nov obračunski motor in rezultate (neto zneske) avtomatizirano primerjal z ročno izračunanimi vrednostmi iz iste datoteke, verjetno s preprostim skriptom, ki izpiše vse vrstice z odstopanjem. Pričakujem, da bo večina vrednosti popolnoma skladna, morebitne razlike pa bodo najverjetneje posledica zaokroževanja (stari sistem je morda zaokroževal drugače ali na drugem koraku izračuna) ali robnih primerov, kot so zaposleni z zelo nizko oz. zelo visoko plačo, kjer pridejo v poštev posebni davčni razredi. Vsako odstopanje bi ročno preveril po veljavni zakonodaji (ZDR-1, dohodninska lestvica), da ugotovim, ali je pravilen nov ali star izračun, saj obstaja možnost, da je star sistem vseboval napako, ki jo šele zdaj odkrivamo.

**Osnutek razlage statističnega pokritja testov:**

> **✏️ ZAPIŠI:** Zakaj je testiranje na 1.000 realnih bruto vrednostih bolj prepričljivo kot testiranje na 5 izmišljenih vrednostih? Kaj zajame večji nabor testnih primerov? (2–3 stavki)

<!-- TVOJA RAZLAGA STATISTIČNEGA POKRITJA TESTOV: -->

Testiranje na 1.000 realnih bruto vrednostih je bolj prepričljivo, ker realni podatki zajamejo širok razpon robnih primerov (zelo nizke plače, zelo visoke plače, vrednosti tik ob mejah davčnih razredov), ki jih pri ročnem izmišljanju petih primerov zlahka spregledamo. Večji nabor testnih primerov tako poveča verjetnost, da bomo odkrili redke, a resnične napake v logiki obračuna, še preden pridejo v produkcijo in vplivajo na dejanske plače zaposlenih.

---

## 7. Analiza rezultatov in preverjanje hipotez

### 7.1 Pričakovana odzivnost in hitrost (H1)

**Hipoteza H1** trdi, da bo asinhroni model z BullMQ zagotovil odzivni čas Express strežnika pod 10 ms ob zagonu masovnega obračuna.

Sinhron model brez BullMQ bi pomenil, da Express nit za vsak sprožen obračun za 500 zaposlenih opravi celoten izračun neposredno. Pri povprečni hitrosti procesiranja 20 ms na zaposlenega bi to znašalo 10 sekund blokade strežnika, med katero noben drug zahtevek ne bi bil obravnavan.

Z asinhronim modelom BullMQ bo Express takoj vrnil HTTP 202 Accepted (meritev bo pokazala vrednosti pod 10 ms), ves izračun pa bo delegiran na enega ali več neodvisnih delavnih procesov (*workers*).

> **✏️ ZAPIŠI:** Razloži v lastnih besedah, kako bo dokazan H1 brez dejansko zagnanega sistema. Kateri argument je po tvojem mnenju najprepričljivejši za mentorja: teoretični model, primerjava med sinhronim in asinhronim načinom, ali opis arhitekture? (3–4 stavki)

<!-- TVOJA UTEMELJITEV H1: -->
**Osnutek utemeljitve H1:**

H1 lahko dokažem brez dejansko zagnanega sistema z argumentiranim teoretičnim izračunom: če vem, da povprečno procesiranje enega zaposlenega traja približno 20 ms, lahko za sinhroni model matematično izpeljem skupni čas blokade (500 × 20 ms = 10 sekund), medtem ko pri asinhronem modelu Express opravi le vpis opravila v vrsto, kar je operacija reda milisekund, neodvisno od števila zaposlenih. Za mentorja je po mojem mnenju najprepričljivejša neposredna primerjava med sinhronim in asinhronim pristopom na istem konkretnem primeru (500 zaposlenih, 20 ms/zaposlenega), ker jasno pokaže vzročno zvezo med arhitekturno odločitvijo in izmerljivim rezultatom, ne le abstrakten opis arhitekture. Opis arhitekture sam po sebi namreč razloži *kako* sistem deluje, ne dokazuje pa še, *zakaj* je odzivni čas neodvisen od velikosti obračuna — to šele pokaže primerjava obeh scenarijev druga ob drugi.

> **✏️ ZAPIŠI:** Katera meritev bi dokazovala H1 v praksi, ko bo sistem dejansko zagnan? Kaj bi meril in s čim? (2–3 stavki — pokaži, da razumeš, kako bi šlo dokazovanje v produkciji)

<!-- TVOJA MERITEV ZA H1: -->
**Osnutek meritve za H1:**

V praksi bi H1 dokazal z merjenjem dejanskega odzivnega časa endpointa `POST /api/v1/payroll/runs` — torej časa od trenutka, ko strežnik prejme zahtevo, do trenutka, ko vrne HTTP 202 Accepted — ne glede na to, ali obračun teče za 10 ali 500 zaposlenih. To bi meril z orodjem za obremenitveno testiranje (npr. Apache JMeter ali k6), ki bi zabeležilo povprečen in maksimalen odzivni čas ob več zaporednih zagonih obračuna. Če bi H1 držala, bi meritve pokazale odzivni čas pod 10 ms ne glede na velikost obračuna, medtem ko bi se dejanski čas izračuna (viden preko statusa opravila v BullMQ) daljšal sorazmerno s številom zaposlenih.

### 7.2 Pričakovano zmanjšanje vnosnih napak (H2)

**Hipoteza H2** trdi, da bodo Angular Reactive Forms zmanjšali napake pri kritičnih vnosnih poljih na nič.

Trditev je utemeljena z dejstvom, da Angular Reactive Forms fizično onemogočijo oddajo obrazca z neveljanjem vnosom: gumb za oddajo bo onemogočen (*disabled*), dokler vsa polja ne prestanejo validacij. Naslednji tipi napak bodo s tem pristopom arhitekturno onemogočeni:

- EMŠO z napačnim številom znakov (ne 13)
- Davčna številka z napačnim številom znakov (ne 8)
- IBAN brez predpone SI56 ali z napačno dolžino
- Prazna obvezna polja

> **✏️ ZAPIŠI:** Katere napake pa Angular obrazec NE more preprečiti? (Primer: IBAN je sicer pravilne oblike SI56+15, a je napačna IBAN številka zaposlenega — banka zavrne nakazilo.) Kakšna je meja med validacijo na odjemalcu in poslovno validacijo? (3–4 stavki — to pokaže zrelost razmišljanja)

<!-- TVOJA REFLEKSIJA O MEJAH VALIDACIJE: -->

Osnutek refleksije o mejah validacije:

Angular obrazec preveri le obliko podatka, ne pa njegove vsebinske pravilnosti — IBAN je lahko po strukturi popolnoma pravilen (SI56 + 15 znakov, celo s pravilno kontrolno vsoto), a se kljub temu ne ujema z dejanskim računom zaposlenega, ker je bil vnesen napačen podatek (npr. zamenjana številka pri prepisovanju iz pogodbe). Podobno je lahko EMŠO oblikovno pravilen (13 cifer), a pripada napačni osebi, ali pa je davčna številka sintaktično veljavna, a v resnici ne obstaja pri FURS. Meja med validacijo na odjemalcu in poslovno validacijo je torej: client-side validacija preverja format (regularni izraz, dolžina, kontrolne vsote), medtem ko poslovna validacija preverja resničnost in ujemanje z realnim svetom — slednje lahko preveri le zunanji vir (banka ob nakazilu, FURS registri, ročna primerjava s pogodbo), ne pa obrazec sam. Prava trditev H2 bi zato morala biti natančnejša: obrazec lahko na nič zmanjša oblikovne napake, ne more pa preprečiti vsebinskih napak pri sicer oblikovno pravilnem vnosu.
### 7.3 Pričakovana varnostna izolacija (H3)

**Hipoteza H3** trdi, da bo RLS zagotovil izolacijo podatkov med najemniki celo v primeru napake v aplikacijski kodi.

Mehanizem RLS deluje neodvisno od aplikacijske logike. Ko MS SQL Server prejme SQL poizvedbo, varnostna politika preveri vrednost `SESSION_CONTEXT(N'tenant_id')` in samodejno doda pogoj v poizvedbo. Če SESSION_CONTEXT ni nastavljen ali je napačen, baza vrne prazno množico vrstic — ne napako, ne podatke drugega podjetja.

> **✏️ ZAPIŠI:** Kako bi demonstriral H3 brez polnega produkcijskega sistema? Opiši testni scenarij: kaj bi nastavil, katera poizvedba bi šla v bazo, kaj bi pričakoval kot rezultat. (4–5 stavkov)

<!-- TVOJ TESTNI SCENARIJ ZA H3: -->

**Osnutek testnega scenarija za H3:**

Za demonstracijo H3 bi pripravil testno bazo z vsaj dvema najemnikoma (npr. `tenant_id = 1` in `tenant_id = 2`), pri čemer bi za vsakega vstavil nekaj testnih zaposlenih z jasno razločljivimi imeni (npr. "Podjetje A - Zaposleni 1" in "Podjetje B - Zaposleni 1"), da bi morebitno uhajanje takoj vizualno opazil. Nato bi v SQL Server Management Studiu ročno nastavil `SESSION_CONTEXT(N'tenant_id', 1)` in izvedel poizvedbo `SELECT * FROM employees` **brez** kakršnegakoli `WHERE` pogoja po tenant_id, kar simulira napako razvijalca. Pričakoval bi, da baza kljub odsotnosti eksplicitnega filtra vrne le zaposlene, ki pripadajo `tenant_id = 1`, ne pa tudi tistih od `tenant_id = 2`. Kot dodaten test bi poizvedbo pognal še brez nastavljenega `SESSION_CONTEXT` (ali z napačno vrednostjo, npr. 999) in pričakoval prazno množico vrstic namesto napake ali vseh podatkov. Ta dva testa skupaj bi neposredno dokazala, da izolacija deluje na nivoju baze, neodvisno od tega, ali aplikacijska koda filter doda ali ne.
> **✏️ ZAPIŠI:** Kaj je slabost RLS-a? Ali obstajajo scenariji, kjer RLS sam po sebi ni dovolj? (2–3 stavki — mentorji cenijo, da razumeš omejitve svojih rešitev)

<!-- TVOJA REFLEKSIJA O MEJAH RLS: -->

**Osnutek refleksije o mejah RLS:**

RLS ščiti pred napačnimi ali manjkajočimi filtri v poizvedbah, ne ščiti pa pred napačno nastavljenim `SESSION_CONTEXT` samim — če bi aplikacijska koda pomotoma nastavila napačen `tenant_id` (npr. zaradi napake pri branju JWT žetona), bi RLS "pravilno" filtriral, a po napačnem najemniku, kar bi uporabniku enega podjetja lahko prikazalo podatke drugega. Prav tako RLS ne ščiti pred uporabniki z visokimi privilegiji na nivoju baze (npr. `db_owner` ali sistemski administrator), ki lahko varnostno politiko preprosto obidejo ali izklopijo, zato mora ostati dostop do same baze strogo omejen in ločen od aplikacijskih poverilnic. RLS je torej pomembna dodatna varnostna plast, ne pa edini mehanizem — mora ga dopolnjevati skrbno upravljanje dostopov in temeljito testiranje avtentikacijske logike, ki nastavlja `SESSION_CONTEXT`.
---

## 8. Zaključek

### 8.1 Povzetek načrtovanega dela

Diplomsko delo bo obravnavalo načrtovanje in opis razvoja sodobne spletne platforme ePlače 2026, ki bo nadomestila obstoječi namizni sistem Hisoft 2020. Analiza obstoječega sistema je razkrila sistemske pomanjkljivosti: 148 tabel brez referenčne celovitosti, finančne zneske shranjene kot besedilo in 1,3 MB Visual Basic kode v enem modulu.

Zasnovana nova rešitev bo temeljila na tristopenjski arhitekturi z normaliziranim podatkovnim modelom osmih tabel, varnostjo na nivoju baze s Row-Level Security in asinhronim procesiranjem s BullMQ. Tri hipoteze — odzivnost pod 10 ms (H1), nič vnosnih napak (H2) in popolna podatkovna izolacija (H3) — bodo definirale merljive kriterije uspešnosti.

> **✏️ ZAPIŠI:** Napiši lasten povzetek v 3–5 stavkih: kaj si v okviru te diplomske naloge naredil, kakšna je bila tvoja vloga in katera odločitev je bila po tvojem mnenju ključna za usmeritev projekta. Piši v prihodnjiku ali opisno. (3–5 stavkov)

<!-- TVOJ LASTEN POVZETEK: -->


### 8.2 Smernice za prihodnji razvoj

Platforma ePlače 2026 bo v svojem prvem izdajanju pokrivala osnovno funkcionalno pokritje: register zaposlenih, obračun plač, standardizirane izvoze in večnajemniško izolacijo. Nadaljnji razvoj bo odprl naslednje smernice:

> **✏️ ZAPIŠI:** Kateri trije moduli ali integracije bi bili po tvojem mnenju naslednji na vrsti za razvoj? Zakaj prav te in v tem vrstnem redu? (Primer: eVem kadrovske prijave, integracija z ERP sistemi, mobilna aplikacija...) (4–6 stavkov)

<!-- TVOJE SMERNICE ZA RAZVOJ: -->


> **✏️ ZAPIŠI:** Kaj si se osebno naučil med tem projektom, česar ti noben učbenik ne bi dal? Katera ugotovitev ali izkušnja te je najbolj presenetila? (3–5 stavkov — ta del je tvoj glas, bodi iskren)

<!-- TVOJA OSEBNA REFLEKSIJA: -->


> **✏️ ZAPIŠI:** Katera arhitekturna odločitev bi bila danes drugačna, ko veš to, kar veš? (2–3 stavki — pokaže kritično razmišljanje)

<!-- TVOJA KRITIČNA REFLEKSIJA: -->


---

## Literatura in viri

[1] Angular. *Angular Documentation: Standalone Components*. Dostopno: https://angular.dev (2024).

[2] BullMQ. *BullMQ Documentation: Queue and Worker patterns*. Dostopno: https://docs.bullmq.io (2024).

[3] Microsoft. *MS SQL Server: Row-Level Security*. Dostopno: https://learn.microsoft.com (2024).

[4] Microsoft. *MS SQL Server: Temporal Tables*. Dostopno: https://learn.microsoft.com (2024).

[5] Node.js Foundation. *Node.js Documentation: Event Loop, Timers, and process.nextTick()*. Dostopno: https://nodejs.org/en/docs (2024).

[6] Redis. *Redis Documentation: Data Types*. Dostopno: https://redis.io/docs (2024).

[7] TypeScript. *TypeScript Handbook*. Dostopno: https://www.typescriptlang.org/docs (2024).

[8] Evans, E. *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley, 2003.

[9] Hernandez, M. J. *Database Design for Mere Mortals: A Hands-On Guide to Relational Database Design*, 3rd ed. Addison-Wesley, 2013.

[10] Martin, R. C. *Clean Code: A Handbook of Agile Software Craftsmanship*. Prentice Hall, 2008.

[11] Martin, R. C. *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall, 2017.

[12] Fowler, M. *Refactoring: Improving the Design of Existing Code*, 2nd ed. Addison-Wesley, 2018.

[13] Ousterhout, J. *A Philosophy of Software Design*. Yaknyam Press, 2018.

[14] Zakon o delovnih razmerjih — ZDR-1. *Uradni list RS, št. 21/13 s spremembami.*

[15] Fowler, M. *Patterns of Enterprise Application Architecture*. Addison-Wesley, 2002.

[16] Krug, S. *Don't Make Me Think, Revisited: A Common Sense Approach to Web Usability*, 3rd ed. New Riders, 2014.

[17] Zakon o dohodnini — ZDoh-2. *Uradni list RS, s spremembami do 2026.*

[18] Wong, H. W., et al. *Network Security with OpenSSL: Cryptography for Secure Communications*. O'Reilly, 2002.

[19] Kleppmann, M. *Designing Data-Intensive Applications*. O'Reilly, 2017.

[20] Zakon o zdravstvenem varstvu in zdravstvenem zavarovanju — ZZVZZ. *Uradni list RS.*

[21] Zakon o dolgotrajni oskrbi — ZDOsk-1. *Uradni list RS, 2023.*

[22] Zakon o minimalni plači — ZMinP. *Uradni list RS, 2026 (minimalna plača 1.481,88 €).*

---

## Priloge

### Priloga A — Struktura starih tabel (vzorec)

> **✏️ ZAPIŠI:** Iz datoteke `HISOFT26/IZPISPODSTRTABEL/Tabele_Za_Ucenje/DELAVCI.txt` izberi 10 po tvojem mnenju najbolj problematičnih stolpcev in jih zapiši v tabelo skupaj s podatkovnim tipom in obrazložitvijo, zakaj je to problematično.

| Stolpec | Tip v stari bazi | Problem |
|---------|-----------------|---------|
| *(izpolni)* | *(izpolni)* | *(izpolni)* |

<!-- TVOJA TABELA PROBLEMATIČNIH STOLPCEV: -->


### Priloga B — Primer izračuna plačilne liste

> **✏️ ZAPIŠI:** Napiši celoten izračun plačilne liste za izmišljenega zaposlenega (npr. Janez Novak, 2.000 € bruto, 22 delovnih dni, 15 km do dela). Vsak korak posebej, s formulo in izračunanim rezultatom. Na koncu zapiši skupen znesek na TRR.

<!-- TVOJ PRIMER IZRAČUNA: -->


### Priloga C — Arhitekturni diagram (opis)

> **✏️ ZAPIŠI:** Z besedami opiši arhitekturni diagram sistema (Angular ↔ Express ↔ MS SQL + Redis). Zapiši, katere komponente komunicirajo med seboj in prek katerih protokolov (HTTP, TCP, SQL). To bo osnova za diagram v Word dokumentu.

<!-- TVOJ OPIS ARHITEKTURE ZA DIAGRAM: -->

