# Kako sem pri razvoju ePlače 2026 uporabljal umetno inteligenco — končni opis postopka

**Namen tega dokumenta** je na enem mestu, jasno in preprosto, opisati kako sem v sklopu diplomske naloge *Razvoj celovite platforme v spletu za obračun plač* uporabljal orodja umetne inteligence (v nadaljevanju AI). Dokument je napisan v prvi osebi, tako da ga je mogoče neposredno vključiti v diplomsko nalogo ali predstaviti na zagovoru. Ne skriva ničesar in ne olepšuje ničesar — navaja, kaj sem delal sam, kaj je bilo delo AI in kako sem nadzoroval, da je bilo vse pravilno.

---

## 1. Izhodišče in vloga AI

Sem začetnik v razvoju plačnih sistemov. Prakso sem opravljal pri podjetju Hisoft IT d. o. o. v januarju, februarju in marcu 2026, kjer sem spoznal obstoječi (že zastareli) namizni program za obračun plač. Cilj diplomske naloge je bil zasnovati in prototipno izvesti njegovo spletno prenovo — platformo **ePlače 2026** — kot SaaS rešitev v Angularju, Node.js/TypeScript in MS SQL Server.

Pri delu sem imel močno podporo sodelavcev z več kot dvajsetletnimi izkušnjami v plačnem sistemu, a za raziskavo, pisanje osnutkov in generiranje kode sem si pomagal tudi z AI. Umetna inteligenca je v tem projektu nastopala v treh vlogah:

- kot **raziskovalec** — pomagala mi je iskati, zbirati in strukturirati zakonodajne vire in konkurenco;
- kot **razvijalec** — na podlagi mojih navodil je generirala SQL skripte, TypeScript vmesnike, HTML prototip in pomagala pri razhroščevanju;
- kot **asistent pri pisanju** — oblikovala je osnutke diplomskih poglavij, kazala, povzetke in predstavitev za zagovor.

Vse pomembne odločitve — kaj bo sistem delal, kakšno arhitekturo bom uporabil, katere vrednosti parametrov so pravilne in kako bo dokument končno izgledal — sem sprejel **jaz**. AI ni nikoli ničesar objavil ali oddal namesto mene; je bil orodje, ki sem ga usmerjal in nadzoroval.

---

## 2. Načelo dela: ena stvar naenkrat, vse takoj v datoteko

Preden sem začel, sem si postavil nekaj preprostih pravil, da delo z AI ne bi ušlo izpod nadzora.

- **Ena naloga na pogovor.** Nikoli nisem hkrati pisal kode in diplome; vsak poziv je imel en jasen cilj, na primer »napiši mi SQL DDL za 8 tabel« ali »pripravi osnutek poglavja 5«.
- **Kontekst najprej, generiranje šele nato.** Pred vsako večjo zahtevo sem AI priložil dispozicijo, zadnje dogovorjene odločitve in potrebne vhodne datoteke, da ni ugibal.
- **Vse gre v datoteko.** Vsak rezultat sem takoj shranil v `.md`, `.sql`, `.html` ali `.txt` datoteko v ustrezno mapo. Tako sem na koncu imel celotno zgodovino dela, ne pa le spomina v klepetu.
- **Pravne številke nikoli na pamet.** Vsako vrednost (prispevke, minimalno plačo, olajšave) sem od AI zahteval s povezavo na uradni vir (PISRS, FURS, Uradni list). Zastarele vrednosti sem takoj popravil.
- **Napaka = takojšnja povratna zanka.** Ko sem kaj narobe našel, sem napako opisal in zahteval **cel popravljen kos**, ne le obrazložitve.
- **Brez samodejnega pakiranja.** ZIP z vsemi datotekami sem ukazal narediti šele, ko sem bil popolnoma prepričan, da je vsebina končna.

Delo je potekalo iterativno, približno eno zaključeno celoto na teden. Na koncu vsake faze je nastala markdown datoteka, ki je bila vhod v naslednjo fazo.

---

## 3. Korak 1 — Uvoz izhodišč (dispozicija, lastni zapiski)

Prvo, kar sem dal AI-ju, je bila moja uradna dispozicija (v TXT in PDF obliki) in lasten osnutek v JSON datoteki, kjer sem popisal motivacijo, ozadje Hisofta, lastne izkušnje in želeni končni izdelek.

AI je na podlagi tega razčlenil:
- predlagani naslov,
- oris problematike (podatkovni kaos, varnostna tveganja, slab Windows-form vmesnik),
- cilje (tehnološka posodobitev, 80 % manj ročnega dela, RLS, 100-odstotna skladnost z ZDR-1 in dohodninsko lestvico),
- tri hipoteze (asinhronost, Angular in Reactive Forms, RLS varnost v bazi),
- metodo dela (analiza, načrtovanje, iterativni razvoj, validacija s primerjavo),
- predpisano strukturo osmih poglavij.

Iz tega je nastala prva datoteka z izvirnikom dispozicije in krovnim razvojnim načrtom. **Jaz sem preveril**, da AI ciljev in hipotez ni spremenil ali preoblikoval — to je bila stalna kontrolna točka skozi ves projekt.

---

## 4. Korak 2 — Zbiranje virov in zakonodaje

Pred pisanjem kode sem potreboval trdno podlago v slovenski zakonodaji. Postopek je bil vedno enak:

1. Jaz sem navedel ključno besedo ali področje (npr. minimalna plača 2026, bolniška do 30 dni, REK-O obrazec, SEPA pain.001, prispevek za dolgotrajno oskrbo).
2. AI je po spletu poiskal vire, jih prebral in zame strukturiral.
3. Rezultat je bil seznam URL-jev z opisom, kaj bom na katerem mestu potreboval.

Viri so bili razvrščeni v tri skupine:

- **Primarni (uradni):** PISRS (ZDR-1, ZDoh-2, ZZVZZ, ZPIZ-2, ZDOsk-1, ZMinP, ZEPDSV, ZIZ, Uredba o davčni obravnavi povračil stroškov), FURS (stran z REK obrazci, eDavki, navodila za REK-O), SPOT portal in dokumentacija za eNDM, ZZZS eBOL, ZBS SEPA standardi in Halcom SEPA dokumentacija.
- **Sekundarni (strokovne razlage):** Optius, Seja.si, IUS-INFO za razlago členov kot je 137. člen ZDR-1 o nadomestilih plače.
- **Terciarni (konkurenca):** pomoč in dokumentacija Minimaxa, Vasca, Birokrata, SAOP iCentra, Pantheona, e-računov, Kope ter drugih slovenskih programov za obračun plač. To mi je bilo pomembno za oblikovanje delovnih tokov in uporabniške izkušnje.

V tej fazi sem dobil tudi **končne delovne konstante za leto 2026**, ki so bile nato uporabljene v izračunih:

- minimalna plača 1.481,88 € bruto (približno 8,56 € na uro ob polnem skladu 174 ur),
- malica 7,96 € na dan,
- prevoz 0,21 € na kilometer,
- prispevki delojemalca skupaj 23,10 % (PIZ 15,50 %, zdravstvo 6,36 %, starševstvo 0,10 %, brezposelnost 0,14 %, dolgotrajna oskrba 1,00 %) in fiksni OZP v višini 35,00 €,
- prispevki delodajalca skupaj okoli 17,10 % (PIZ 8,85 %, zdravstvo 6,56 %, starševstvo 0,10 %, brezposelnost 0,06 %, poškodbe 0,53 %, dolgotrajna oskrba 1,00 %),
- nadure najmanj +30 % (130 %),
- bolniška do 30 delovnih dni v bremenu delodajalca v višini 80 % osnove, nad tem refundacija ZZZS,
- letni dopust v višini 100 % osnove, povprečje zadnjih treh mesecev.

Kjer je bil v virih podatek nejasen (na primer iz OCR-ja je bilo videti 0,07 % oz. 2 € za dolgotrajno oskrbo, zakon ZDOsk-1 pa določa 1,00 %), sem to v dokumentaciji **eksplicitno označil** in se za kodo odločil za zakonsko vrednost 1,00 %.

---

## 5. Korak 3 — Analiza starega sistema z OCR

Starega sistema ni bilo mogoče preprosto prebrati iz baze, ker je bilo več kot 150 razpršenih tabel brez jasnih relacij. Zato sem se odločil za metodo, ki sem jo poimenoval »od plačilne liste nazaj« — začel sem pri končnem izpisu in šel nazaj do vhodnih podatkov.

AI sem priskrbel izboljšane posnetke zaslonov obstoječega programa in lasten OCR zapisnik. Pred samim razpoznavanjem smo posnetke pripravili s postopki, ki so izboljšali natančnost:
- izboljšava kontrasta (CLAHE),
- trikratna povečava s kakovostnim algoritmom Lanczos,
- ostrenje slike,
- uporaba načina razpoznavanja PSM 6 (ena stolpčna postavitev besedila).

Po obdelavi je bilo uspešno prebranih 442 od 522 posnetih okvirjev.

Iz tega je AI nato za mano strukturiral vse ključne dele REK-O obrazca:
- glavo A00x (davčna številka, ime, priimek, rezidentstvo, napotitve, invalid nad kvoto, 60+ let, pogodbe za določen/nedoločen čas),
- dohodkovni del A052–A053 (vrsta dohodka 1001, osnove, normirani stroški),
- prispevke delojemalca A071–A075 in delodajalca A081–A086,
- plačne postavke M0x (M01 plača, M02 nadomestilo ZPIZ, M03 nadure, M04 dopust, M05 bolniške, M06 plačana odsotnost, M07 povračila, M08 razlika do najnižje osnove),
- statistične podatke S0x (matična številka, osnovna plača, dodatki, poslovna uspešnost, nadomestila, neto),
- bonitete B014–B017 (zlasti B014 za službeno vozilo s podatki o nabavni vrednosti, gorivu in privatnih poteh).

Poleg tega sva skupaj popisala obstoječi delovni tok: kadrovska evidenca → parametri mesečnega obračuna → obračun → plačilne liste → REK-O → plačilni nalogi → dodatni izpisi. To je bil kasneje osnoven scenarij uporabe v novem sistemu.

---

## 6. Korak 4 — Teorija in knjižna podlaga

Diplomska naloga ne sme stati samo na praksi, zato sem želel, da so odločitve podprte tudi s teorijo. AI sem prosil za priporočilo strokovne literature s področja arhitekture, SaaS, podatkovno intenzivnih aplikacij, čiste kode in uporabniške izkušnje. Tako je nastal seznam 25 knjig (npr. Kleppmann *Designing Data-Intensive Applications*, Martin *Clean Architecture*, Richards in Ford *Fundamentals of Software Architecture*, Newman *Building Microservices* idr.).

Za vsako knjigo je AI izpisal pet do šest konkretnih nasvetov, ki sem jih lahko neposredno uporabil za ePlače. Na primer:
- plače so finančni podatki in zahtevajo ACID transakcije, zato ostajamo na MS SQL Server;
- poslovna logika obračuna mora biti čisti TypeScript brez odvisnosti od baze ali spletnega ogrodja;
- na začetku razvijamo kot modularni monolit, ne takoj kot mikro storitve;
- vsaka večja arhitekturna odločitev mora biti zapisana in utemeljena.

Iz te knjižne podlage so izšle tudi teoretične utemeljitve za vse tri hipoteze.

---

## 7. Korak 5 — Načrt diplomske naloge (kazalo in vprašanja)

Pred pisanjem in pred večjim kodiranjem sem postavil jasno ogrodje. AI je iz dispozicije pripravil tri različice kazala:
- **enostavno** — za jasno in preprosto pisanje,
- **znanstveno** — z izrecno metodologijo in meritvami,
- **hibridno** — ki je bila na koncu izbrana in je uporabljena v končnem besedilu.

Kazalo je 1:1 sledilo dispoziciji (Uvod → Tehnična arhitektura → Analiza starega sistema → Načrtovanje → Implementacija → Migracija in testiranje → Analiza rezultatov → Zaključek). Za vsako poglavje je bil napisan seznam vprašanj, na katerega mora besedilo odgovoriti: *kaj, zakaj, kako in zakaj tako in ne drugače*.

Tako sem ves čas razvoja in pisanja točno vedel, kaj še manjka in kam kakšna vsebina spada.

---

## 8. Korak 6 — Načrtovanje baze (od 150 tabel do 8)

Eden največjih problemov starega sistema je bil podatkovni kaos. AI sem postavil izziv: preoblikovati 150+ tabel v preprost, normaliziran model, ki bo podpiral multi-tenancy (več podjetij v eni bazi), revizijsko sled in hiter obračun.

Nastalih je bilo osem osnovnih tabel:
- `tenants` (podjetja/najemniki),
- `users` (uporabniki z vlogami),
- `job_positions` (delovna mesta),
- `employees` (zaposleni),
- `monthly_hours` (mesečni vnos ur in odsotnosti),
- `payroll_runs` (posamezni mesečni obračun z življenjskim ciklom),
- `payroll_lines` (vrstice obračuna za vsakega zaposlenega),
- `audit_logs` (revizijska sled).

AI je zame pripravil tudi DDL SQL skripto, ki je takoj vključevala napredne varnostne mehanizme MS SQL Server:
- **Row-Level Security** s politiko po `tenant_id` in kontekstu `SESSION_CONTEXT`, tako da podatki tujega podjetja nikoli ne zapustijo baze, niti če v aplikaciji nastane hrošč;
- **Temporalne tabele** s sistemskim verzioniranjem, ki samodejno arhivirajo vsako spremembo;
- pravilne tipe za zneske (`DECIMAL(10,4)`), brez `FLOAT`, ki bi povzročal zaokrožitvene napake.

V tej fazi sem kasneje dodal še stolpce za **dvojni način obračuna (Dual-Mode)**:
- `employees.urna_postavka` za delavce, plačane po uri,
- `monthly_hours.m04_dopust_ure` in `m05_bolniske_ure`,
- `payroll_params.MINIMALNA_PLACA` kot nastavljiv parameter,
- v `payroll_lines` ločene zneske za redno delo, dopust, bolniško in nadure.

Logika je bila preprosta:
- če ima zaposleni izpolnjeno `urna_postavka`, se bruto izračuna **parametrično** iz ur (redno + dopust po 100 % + bolniška po 80 % + nadure po 130 %),
- sicer se obdrži obstoječe fiksno obnašanje s pro-rata skaliranjem na osnovi `bruto_osnove`,
- v vsakem primeru motor preveri, ali bruto ni pod sorazmernim delom minimalne plače, in v nasprotnem primeru javi opisno napako.

---

## 9. Korak 7 — Backend, API in obračunski motor

Naslednji korak je bil zaledni del. AI je na mojo zahtevo pripravil specifikacijo za Node.js in TypeScript z Express ogrodjem, v duhu čiste arhitekture: **Controllers → Services → Repositories → DTO**.

Varnost je bila zasnovana tako:
- uporabnik se prijavi in dobi JWT žeton,
- glede na vlogo (RBAC) dobi dovoljenja,
- `tenant_id` se skozi celoten asinhroni tok prenaša z `AsyncLocalStorage`, da ga vsak SQL ukaz vidi v varnostnem kontekstu.

**Obračunski motor** je bil zasnovan kot čisti TypeScript modul, brez odvisnosti od baze ali spletnega ogrodja. To pomeni, da so ga lahko poganjali tako enotski testi kot CLI skripte kot Express poti. Motor uporablja natančno aritmetiko (BigNumber.js) in ločeno obdela:
- prispevke delojemalca in delodajalca po REK-O strukturi,
- dohodnino in olajšave (splošna olajšava, olajšava za otroke …),
- povračila stroškov (malica, prevoz),
- bonitete,
- obe veji obračuna (fiksni in parametrični),
- preverbo minimalne plače.

Za potrjevanje prve hipoteze (asinhronost) sva vgradila **BullMQ vrsto z Redisom**. Ko uporabnik sproži obračun, Express zapiše opravilo v Redis in takoj odgovori s statusom `202 Accepted`. V ozadju se zažene delavec (Worker), ki obračunava zaposlene enega za drugim, v Redis sproti zapisuje napredek v odstotkih, Angular pa ta napredek prikazuje prek spletne vtičnice. Tako se vmesnik ne zamrzne niti pri stotinah zaposlenih.

---

## 10. Korak 8 — Integracije z zunanjimi sistemi

Med cilji diplome je bilo tudi zmanjšanje ročnega dela za 80 %, zato smo načrtovali integracije:
- s **SPOT portalom** prek SOAP spletnega servisa za avtomatični uvoz e-bolniških in podatkov o delovnih razmerjih,
- z **ZZZS** (eBOL) za prijavo refundacij bolniških nad 30 dni,
- s **FURS eDavki** — izvoz REK-O XML,
- z **bankami** — izvoz SEPA plačilnih nalogov v formatu pain.001,
- z **računovodskimi programi** (Minimax, Vasco) — izvoz VOD XML temeljnic za glavno knjigo.

AI za te integracije ni pisal končne produkcijske kode, ker bi bilo potrebno dejansko testiranje na preizkusnih okoljih državnih portalov, je pa pripravil strukturo, podatkovne modele in poti API-jev, tako da je integracije mogoče dograditi.

---

## 11. Korak 9 — Frontend (Angular in HTML prototip)

Sprednji del je zasnovan kot **enostranska aplikacija (SPA) v Angular 18+**, s samostojnimi komponentami (Standalone Components), Signals za reaktivno stanje in Reactive Forms za obrazce. Za stiliranje je predvidena knjižnica Tailwind CSS.

AI je poleg formalne Angular specifikacije pripravil tudi **delujoči HTML prototip** (`eplace_mvp.html`) — eno samo datoteko, ki je ni bilo treba nameščati, da sem v brskalniku videl, kako bo sistem izgledal. V prototipu so bili:
- zavihki za mesečni obračun, register delavcev, bruto–neto kalkulator in navodila,
- na desni strani t. i. inženirski dnevnik, ki je v živo izpisoval dnevniške zapise `[DB]`, `[MID]`, `[ENGINE]`, `[API]`, da se je videlo, kako potujejo podatki po plasteh,
- kalkulator z vsemi polji, ki sem jih spoznal iz OCR analize.

Pri izdelavi prototipa je AI naredil tudi nekaj napak, ki sva jih skupaj odpravila. Najpomembnejša je bila napaka `Cannot set properties of null (setting 'innerText')`, ki je nastala zato, ker je JavaScript bral ID `worker-status`, ki ga v HTML sploh ni bilo. Rešitev je bila, da je AI preko preprostega validacijskega skripta preveril vse `document.getElementById(...)` klice in jih poravnal z dejanskimi ID-ji v HTML. Na podoben način so bili odpravljeni še manjkajoči `tab-architecture` in `v-olajsava`. Po končanih popravkih je bilo poročilo »Missing IDs now: set()« — torej nič manjkajočih povezav.

---

## 12. Korak 10 — Testiranje in potrjevanje hipotez

Vsak izračun je moral biti pravilen. AI je na mojo zahtevo pripravil **testne scenarije** s pričakovanimi rezultati:

- Parametrični obračun: urna postavka 10 €, 160 ur rednega dela, 8 ur dopusta, 8 ur bolniške, 4 ure nadur — pričakovani bruto 1.796,00 €.
- Fiksni bruto: 2.000 € bruto ob 160 urah od 174 — pričakovani bruto 1.839,08 €.
- Pod minimalno plačo: urna postavka 6 € ob polnem mesecu — motor mora javiti napako.
- RLS test: uporabnik podjetja A poskuša prebrati vse vrstice v `payroll_lines` — mora dobiti 0 vrstic tujega podjetja.
- Asinhronost: zagon obračuna za 100 zaposlenih mora takoj vrniti `202 Accepted`, delo pa poteka v ozadju z vidnim napredkom.
- Neto kalkulacija: preizkus z bruto 2.600 €, rezidentom, dvema otrokoma, OZP, službenim vozilom, malice in prevoza.

Poleg testov izračunov so bile narejene tudi **primerjalne meritve** za hipoteze:
- H1 (asinhronost): Express nit med masovnim obračunom ostane prosta, uporabniški vmesnik ohrani odzivnost.
- H2 (Angular/Reactive Forms): napačno vnešeni podatki so zavrnjeni že na odjemalcu, še preden se pošljejo na strežnik.
- H3 (RLS): neposreden SQL ukaz brez ustreznega konteksta podjetja ne vrne nobene tuje vrstice.

Za nazornejši pregled arhitekture so bili v tej fazi pripravljeni tudi trije HTML vodniki — za celotno arhitekturo, za podatkovno bazo in za API/middleware.

---

## 13. Korak 11 — Pisanje diplomske naloge

Ko so bili vsi tehnični deli v grobem pripravljeni, sem začel s pisanjem same naloge. Postopek je bil enak kot pri kodiranju:

1. Najprej sem naročil **kratek osnutek** poglavja in določil ton (»preprosto«, »ne piši kode«, »opisno«, »copy-paste ready«).
2. Osnutek sem prebral, popravil in označil, kaj je treba spremeniti.
3. AI je nato razširil potrjeni osnutek v celotno poglavje.
4. Končno besedilo sem še enkrat prebral, uskladil s dispozicijo in preveril, da ni nobene trditve brez osnove.

Tako so nastala vsa poglavja: Uvod (z motivacijo, cilji in tremi hipotezami), Tehnična arhitektura, Analiza starega sistema, Načrtovanje nove rešitve, Implementacija, Migracija in testiranje, Analiza rezultatov, Zaključek. Za vsako fazo je bilo izdelanih več različic (enostavna, znanstvena, hibridna), na koncu je bila izbrana t.i. **končna tekstovna verzija**, ki je akademsko formalna, a še vedno berljiva.

AI je pripravil tudi izvleček, seznam ključnih besed, seznam literature s 25 knjigami in 5–6 konkretnimi nauki na knjigo ter opombe za oblikovanje.

---

## 14. Korak 12 — Oblikovanje v Wordu, kazalo in paket

Za končno oddajo sem vsebino prenesel v **Microsoft Word** (kopiral iz markdown datotek in uporabil slogove Naslov 1/2/3), da je bilo mogoče samodejno generirati kazalo, kazalo slik in kazalo kod. Oblikovna pravila (robovi, pisava, razmik) so bila zapisana v posebnem navodilu.

Pripravil sem tudi **predstavitev za zagovor** z osmimi diapozitivi (naslov, problem in cilji, hipoteze, vsaka hipoteza posebej, integracije, zaključek) in govornimi opombami za vsak diapozitiv.

Na koncu sem ukazal, da se vse datoteke, urejene v sedmih mapah (dispozicija, analiza trga, zakonodaja, baza, backend, frontend, akademsko pisanje), zapakirajo v ZIP arhiv. V zadnji različici so bile zaradi združljivosti vse datoteke pretvorjene v `.txt`, celovitost paketa pa sem potrdil s testom arhiva.

---

## 15. Tri ključne odločitve, ki sem jih moral potrditi sam

Na zagovoru bom lahko pojasnil tri glavne odločitve, ki sem jih na podlagi predlogov AI sprejel sam.

**Zakaj RLS v bazi in ne aplikacijsko filtriranje?**
Ker je RLS (Row-Level Security) na nivoju MS SQL Serverja edini način, ki v celoti prepreči, da bi se podatki dveh podjetij pomešali. Tudi če razvijalec pozabi dodati `WHERE tenant_id=…` ali če žeton ponaredimo, baza sama filtrira vrstice po `SESSION_CONTEXT`. To neposredno potrjuje tretjo hipotezo.

**Zakaj asinhrona vrsta (BullMQ in Redis)?**
Ker obračun za večje število zaposlenih traja in bi sinhrono izvajanje zamrznilo tako strežnik kot uporabniški vmesnik — natanko tako kot v starem sistemu. Z delavcem v ozadju uporabnik dobi takoj odgovor, vidi napredek in lahko med čakanjem počne druge stvari. To potrjuje prvo hipotezo.

**Zakaj Angular SPA z Reactive Forms?**
Ker je Angular primeren za velike obrazce in gosto tabelarično delo, kot ga imajo računovodje. Reactive Forms omogočajo takojšnjo validacijo vnosov še na odjemalcu, kar zmanjša število napak. To potrjuje drugo hipotezo.

---

## 16. Delitev dela — kaj sem naredil jaz in kaj AI

Naj bom povsem jasen:

- **Jaz sem** priskrbel vsa izhodišča (dispozicija, JSON osnutek, slike zaslonov, poznavanje delovanja starega sistema in zakonodaje).
- **Jaz sem** določal, kaj bo sistem delal in kaj ne, kakšno arhitekturo bom uporabil in katere vire štejem za verodostojne.
- **Jaz sem** potrjeval vse pravne in finančne vrednosti in popravljal vse netočnosti (vključno z vrednostjo minimalne plače za 2026 in odstotkom dolgotrajne oskrbe).
- **Jaz sem** pregledal vsako vrstico kode in vsak odstavek besedila, ki ga je AI pripravil.
- **Jaz sem** končno oblikoval Word dokument, naredil ZIP paket in bom delo predstavil na zagovoru.

**AI je** pomagala pri iskanju in strukturiranju virov, pri generiranju osnutkov specifikacij in kode, pri odpravljanju napak (zlasti v HTML prototipu), pri oblikovanju diplomskih poglavij in pri pripravi predstavitve. AI ni nikoli samostojno odločala o vsebini, ni preverjala pravilnosti v produkcijskem okolju in ni ničesar oddala namesto mene.

---

## 17. Kaj sem se naučil in kaj bi naredil drugače

Delo z AI me je naučilo, da umetna inteligenca ni čarobna palica. Dobre rezultate da le, če ji daš jasna navodila, točne vire in dosledno preverjaš izhode. Med delom sem se naučil:
- pravilnega postavljanja vprašanj oz. pisanja promptov,
- osnov slovenske zakonodaje na področju plač,
- uporabe sodobnega tehnološkega sklada (Angular 18, Node.js z AsyncLocalStorage, MS SQL RLS in temporalne tabele, Redis in BullMQ),
- kako razmišljati v smeri SaaS in varnosti na nivoju baze,
- kako sistematično razbiti večji projekt v obvladljive tedenske korake.

Če bi projekt delal še enkrat, bi že od prvega dne uvedel dosledno verzioniranje z Gitom in bi za vsako arhitekturno odločitev že sproti pisal krajše zapise (ADR). Prav tako bi vrednost minimalne plače in drugih parametrov preveril že pred prvimi izračuni, ne šele ob poznejšem iskanju. V produkciji bi HTML prototip zamenjal s pravim Angular buildom brez zunanjega CDN za Tailwind.

---

## 18. Izjava o uporabi umetne inteligence

Za potrebe oddaje diplomske naloge prilagam še izjavo, ki jo je mogoče neposredno vključiti:

> Pri izdelavi diplomskega dela *Razvoj celovite platforme v spletu za obračun plač* sem kot pomožno orodje uporabljal generativno umetno inteligenco. Orodje mi je pomagalo pri iskanju in strukturiranju pravnih in tehničnih virov, oblikovanju opisov arhitekture in specifikacij podatkovne baze, generiranju in dopolnjevanju programske kode po mojih natančnih navodilih (SQL DDL, TypeScript vmesniki in psevdokoda, HTML prototip), odpravljanju napak v prototipu, oblikovanju osnutkov diplomskih poglavij in pripravi predstavitve za zagovor. Vse vsebinske, arhitekturne in metodološke odločitve sem sprejel sam. Vse generirane vsebine sem pregledal, primerjal z veljavno zakonodajo in s svojim poznavanjem obstoječega sistema, popravil in dopolnil. Umetna inteligenca ni avtorica diplomskega dela, temveč razvojno orodje, ki sem ga uporabljal pod lastnim nadzorom v vseh fazah projekta.

---

*Ta dokument je končni, enovit opis postopka uporabe umetne inteligence pri projektu ePlače 2026 in je pripravljen za vključitev v diplomsko nalogo ali priloge.*
