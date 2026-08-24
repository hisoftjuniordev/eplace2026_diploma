# ePlače 2026 — Napake in popravki

Kronološki dnevnik vseh odkritih napak in njihovih popravkov.

---

## Seja 3 — 17. 8. 2026 (E2E testiranje)

### N-01: RLS blokira login pri prvem zagonu

**Simptom:** `POST /auth/login` vrne 500, v logu `"Login error: [RLS policy violation]"`.  
**Vzrok:** Poizvedba za iskanje uporabnika po emailu je bila izvedena brez nastavljenega `SESSION_CONTEXT`, zato je RLS filtriral vse vrstice v `users`.  
**Popravek:** `auth.controller.ts` — login poizvedba izvede `sp_set_session_context` s `NULL` (posebna RLS izjema za login) preden poišče email.

### N-02: Race condition pri JWT middleware in auth poizvedbi

**Simptom:** Občasno 401 takoj po prijavi pri hitrem klikanju.  
**Vzrok:** Angular je poslal zahtevo preden je JWT token bil shranjen v `localStorage`.  
**Popravek:** `auth.service.ts` — `login()` metoda vrne `Observable`, ki se razreši šele po shranitvi tokena.

### N-03: `[ngValue]` tipa neskladje pri select elementu

**Simptom:** Vrednost meseca v čarovniku je bila tipa `string` namesto `number`.  
**Vzrok:** HTML `<select>` z `[value]` atributom vedno vrne niz.  
**Popravek:** `wizard.component.ts` — zamenjava `[value]` z `[ngValue]` ohrani izvorni tip.

### N-04: Zod UUID regex zavrnil veljavne UUID-je

**Simptom:** `PUT /employees/:id` vrne 400 za veljavne UUID-je.  
**Vzrok:** Zod validacijska shema je imela napačen regex za UUID.  
**Popravek:** `schemas.ts` — zamenjava lastnega regex z `z.string().uuid()`.

### N-05: XML datum v napačnem formatu (SEPA)

**Simptom:** Banka zavrne SEPA datoteko.  
**Vzrok:** `sepa.generator.ts` je datume zapisoval kot `DD.MM.YYYY` namesto ISO `YYYY-MM-DD`.  
**Popravek:** `sepa.generator.ts` — `toISOString().split('T')[0]`.

### N-06: `/export` poti brez JWT preverjanja

**Simptom:** Izvozne poti so bile dostopne brez avtentikacije.  
**Vzrok:** `export.controller.ts` ni imel `auth.middleware`.  
**Popravek:** Dodan `authMiddleware` na vse `/export/*` poti.

### N-07: Datum izplačila se ni osvežil po spremembi meseca

**Simptom:** `datum_izplacila` v čarovniku je ostal na starem datumu po spremembi meseca.  
**Vzrok:** `computeDatum()` se je klicala samo ob kliku, ne ob spremembi vrednosti.  
**Popravek:** `wizard.component.ts` — dodan `valueChanges.subscribe(() => this.computeDatum())` za polji `leto` in `mesec`.

### N-08: GET /employees vrnil objekt namesto polja

**Simptom:** `employees()` signal je bil vedno prazen, delavci se niso prikazali.  
**Vzrok:** Backend vrne `{ data: [], total: N }`, frontend je pričakoval neposredno polje.  
**Popravek:** `wizard.component.ts` — `res.data` namesto `res`.

---

## Seja 5 — 24. 8. 2026 (lokalno razhroščevanje)

### N-09: 409 Conflict — čarovnik prikaže napako namesto preusmeritve

**Datoteka:** `frontend/src/app/features/payroll/wizard.component.ts`  
**Simptom:** Ko za izbrani mesec že obstaja obračun, čarovnik prikaže sporočilo "Obračun za ta mesec že obstaja" in se ne odziva.  
**Vzrok:** `sprozObracun()` metoda je vse napake (vključno s 409) prikazala v UI. Ni preverila statusa napake.  
**Popravek:** Dodan `if (err?.status === 409)` pogoj — pri 409 se pokliče `GET /payroll/runs`, poišče obstoječi obračun za ta mesec in preusmeri na `/payroll/:id/progress`.

```typescript
// wizard.component.ts — sprozObracun() error handler
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
```

**Status:** ✅ Popravljeno

---

### N-10: Zastareli plačilni listi po deaktivaciji delavcev

**Datoteka:** Podatkovni nivo — ni kode spremembe  
**Simptom:** Progress stran obračuna prikazuje delavce, ki so bili medtem "izbrisani".  
**Vzrok:** Gumb "Briši" izvede mehki izbris (`aktivno = 0`). Plačilne vrstice (`payroll_lines`) se ne izbrišejo, ko se deaktivira delavec — to je pravilno vedenje (plačilne liste so pravni dokumenti).  
**Diagnoza:** Obračun je bil izveden, ko sta bila 2 delavca aktivna. Po deaktivaciji sta vrstici ostali v `payroll_lines`.  
**Rešitev:** Za lokalno testiranje je bil ročno izbrisan obračunski zapis (CASCADE izbris je odstranil tudi vrstice). Novi obračun zajame samo aktivne delavce.

**Lekcija:** Ni napaka — je pričakovano vedenje. Za produkcijo bi bilo smiselno dodati UI opozorilo: "Ta obračun vsebuje delavce, ki so bili od takrat deaktivirani."

---

### N-11: `sa` ne zaobide RLS brez SESSION_CONTEXT

**Datoteka:** Ni kode spremembe — diagnostična ugotovitev  
**Simptom:** Direktna SQL poizvedba v Docker kontejnerju (`SELECT COUNT(*) FROM employees WITH (NOLOCK)`) je vrnila 0 vrstic, čeprav je aplikacija delovala normalno.  
**Vzrok:** MS SQL Server RLS politika filtrira **vse** vrstice, kadar `SESSION_CONTEXT(N'tenant_id')` ni nastavljen — vključno za `sa`.  
**Rešitev (za diagnostiko):**
```sql
EXEC sp_set_session_context N'tenant_id', N'11111111-1111-1111-1111-111111111111';
SELECT COUNT(*) FROM dbo.employees; -- zdaj vrne prave vrednosti
```

---

## Povzetek odprtih napak

*Trenutno ni znanih odprtih napak.*

---

## Znane omejitve (ne napake)

| Omejitev | Opis | Prioriteta |
|----------|------|-----------|
| Ni brisanja obračuna | UI ne omogoča brisanja obstoječega mesečnega obračuna | Nizka |
| Ni ponavljanja obračuna | Če obračun ni uspel, ni gumba "Ponovi" | Srednja |
| Ni pregleda historije delavcev | Temporalne tabele so v DB, nimamo UI-ja | Nizka |
