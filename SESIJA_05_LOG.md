# ePlače 2026 — Seja 5: Dnevnik dela

**Datum:** 24. 8. 2026  
**Seja:** 5 (lokalno razhroščevanje)  
**Namen:** Diagnoza in popravek napake 409, čiščenje podatkov, dokumentacija  
**Zaveza:** BREZ COMMITOV med razhroščevanjem — le lokalno  

---

## Pregled seje

Ta seja se je osredotočila izključno na diagnostiko in popravek napake pri ponovnem zagonu obračuna plač za isti mesec. Nobenih novih funkcij ni bilo dodanih.

---

## Kronologija

### 1. Napaka 409 — "Obračun za ta mesec že obstaja"

**Situacija:** Obračunski čarovnik je pri klicu `POST /payroll/runs` za avgust 2026 vrnil napako, ker je v tabeli `payroll_runs` že obstajal vnos za tega najemnika in mesec. MS SQL Server je sprožil kodo napake 2601 (kršitev unikatnega indeksa), backend pa je to prevedel v HTTP 409.

**Diagnoza:** Koda v `payroll.controller.ts` pravilno lovi napako 2601 in vrne `{ error: 'Obračun za ta mesec že obstaja' }` s statusom 409. Problem je bil v frontendu — `wizard.component.ts` je to napako preprosto prikazal uporabniku, namesto da bi ga preusmeril na obstoječi obračun.

**Popravek (`frontend/src/app/features/payroll/wizard.component.ts`):**

```typescript
// PREJ — prikaže napako:
error: (err) => {
  this.error = err?.error?.error ?? 'Napaka pri sprožitvi obračuna';
  this.loading = false;
},

// PO — pri 409 poišče obstoječi obračun in preusmeri:
error: (err) => {
  if (err?.status === 409) {
    const { leto, mesec } = this.periodForm.value;
    this.http.get<{ id: string; leto: number; mesec: number }[]>(`${API}/payroll/runs`).subscribe({
      next: (runs) => {
        const existing = runs.find(r => r.leto === leto && r.mesec === mesec);
        if (existing) {
          this.router.navigate(['/payroll', existing.id, 'progress']);
        } else {
          this.error = err?.error?.error ?? 'Napaka pri sprožitvi obračuna';
          this.loading = false;
        }
      },
      error: () => {
        this.error = err?.error?.error ?? 'Napaka pri sprožitvi obračuna';
        this.loading = false;
      },
    });
    return;
  }
  this.error = err?.error?.error ?? 'Napaka pri sprožitvi obračuna';
  this.loading = false;
},
```

**Rezultat:** Ko obračun za mesec že obstaja, čarovnik samodejno poišče njegov ID in preusmeri na `/payroll/:id/progress`.

---

### 2. Napaka — "Zastareli podatki v obračunu (2 delavca namesto 1)"

**Situacija:** Po zagonu obračuna je stran za napredek prikazovala 2 delavca (Ana Kovač, Janez Novak), čeprav je bil v sistemu samo 1 aktiven delavec.

**Diagnoza (korak za korakom):**

1. Sprva smo posumili, da Docker kontejner ne vsebuje pravih podatkov — poizvedba `SELECT COUNT(*) FROM dbo.employees WITH (NOLOCK)` je vrnila 0.
2. Ugotovili smo, da **MS SQL Server Row-Level Security (RLS) filtrira tudi uporabnika `sa`**, kadar `SESSION_CONTEXT(N'tenant_id')` ni nastavljen.
3. Po nastavitvi konteksta (`EXEC sp_set_session_context N'tenant_id', N'11111111-...'`) smo videli 3 delavce:
   - `Janez Novak` — `aktivno = 0` (deaktiviran)
   - `Ana Kovač` — `aktivno = 0` (deaktivirana)
   - `Mihaec Mahec` — `aktivno = 1` (aktiven)
4. Ugotovili smo, da gumb "Briši" v meniju Delavci izvede **mehki izbris** (`aktivno = 0`), ne fizičnega brisanja vrstice.
5. Obračun je bil izveden, ko sta bila Novak in Kovač še aktivna → njune vrstice so shranjene v `payroll_lines`.
6. Brisanje delavca po zaključenem obračunu **ne izbriše historičnih vrstic plačilnih listov**.

**Rešitev:** Ročno brisanje obstoječega avgustovskega obračuna iz baze (ID `81C1ABAE-...`). Ker FK `FK_pl_run` vsebuje `ON DELETE CASCADE`, je brisanje iz `payroll_runs` samodejno zbrisalo tudi vse vrstice v `payroll_lines`.

```sql
USE eplace2026;
EXEC sp_set_session_context N'tenant_id', N'11111111-1111-1111-1111-111111111111';
DELETE FROM dbo.payroll_runs WHERE id = '81C1ABAE-18F5-4787-8306-E64A8B9AD6A8';
-- Rezultat: 0 runs, 0 lines (cascade izbris)
```

**Rezultat:** Čarovnik po novem kreira obračun samo z aktivnim delavcem Mahec.

---

### 3. Ugotovitev — RLS in uporabnik `sa`

**Ključna ugotovitev te seje:** MS SQL Server Row-Level Security **ne zaobide niti sistemski administrator (`sa`)**, kadar je varnostni predikat vezan na `SESSION_CONTEXT`. To je bil vzrok za zavajajoče "0 vrstic" pri direktnih SQL poizvedbah v kontejnerju.

Za direktno diagnostično poizvedbo v Dockerju je treba vedno nastaviti kontekst:

```sql
EXEC sp_set_session_context N'tenant_id', N'<GUID>';
```

---

### 4. Restart aplikacije

Ugotovljeno: backend se zažene kot `dist/app.js` (ne `dist/index.js`). TypeScript je treba pred zagonom prevesti z `npm run build`.

Vrstni red zagona:
1. Docker kontejnerji: `docker compose up -d`
2. Build: `cd backend && npm run build`
3. Backend: `node dist/app.js`
4. Worker: `node dist/workers/payroll.worker.js`
5. Frontend: `ng serve --open`

---

## Datoteke, ki so bile spremenjene

| Datoteka | Sprememba |
|----------|-----------|
| `frontend/src/app/features/payroll/wizard.component.ts` | 409 handler: redirect na obstoječi obračun |

---

## Status hipotez po seji 5

| Hipoteza | Status |
|----------|--------|
| H1 — POST /runs vrne 202 Accepted asinhrono | ✅ Potrjeno |
| H2 — Angular forma blokira 100 % neveljavnih vnosov | ✅ Potrjeno |
| H3 — MS SQL RLS izolira najemnike | ✅ Potrjeno (+ diagnostično verificirano v tej seji) |
