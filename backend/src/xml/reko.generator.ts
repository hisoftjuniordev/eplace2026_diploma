import { create } from 'xmlbuilder2';
import { IPayrollRun, IPayrollLine } from '../types/interfaces';

interface RekoLine extends IPayrollLine {
  priimek: string;
  ime: string;
  emso: string;
  davcna_stevilka_del: string; // delavec davčna
  m01_ure: number;
  m03_nadure_ure: number;
}

interface RekoTenant {
  davcna_stevilka: string;
  naziv_podjetja: string;
}

function pad(n: number, len: number) {
  return String(n).padStart(len, '0');
}

function isoDate(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

function firstDayOfMonth(leto: number, mesec: number): string {
  return `${leto}-${pad(mesec, 2)}-01`;
}

function lastDayOfMonth(leto: number, mesec: number): string {
  const d = new Date(leto, mesec, 0); // day 0 of next month = last day of current
  return `${leto}-${pad(mesec, 2)}-${pad(d.getDate(), 2)}`;
}

export function generateRekoXml(
  run: IPayrollRun,
  lines: RekoLine[],
  tenant: RekoTenant
): string {
  const errors: string[] = [];

  for (const l of lines) {
    if (!l.emso || !/^\d{13}$/.test(l.emso)) {
      errors.push(`Delavec ${l.priimek} ${l.ime}: neveljaven EMSO (mora biti 13 cifer)`);
    }
    if (!l.davcna_stevilka_del || !/^\d{8}$/.test(l.davcna_stevilka_del)) {
      errors.push(`Delavec ${l.priimek} ${l.ime}: neveljaven EMŠO/davčna (mora biti 8 cifer)`);
    }
  }

  if (errors.length > 0) {
    throw new Error('REK-O validacija:\n' + errors.join('\n'));
  }

  const datumOd = firstDayOfMonth(run.leto, run.mesec);
  const datumDo = lastDayOfMonth(run.leto, run.mesec);
  const datumPredlozitve = isoDate(new Date());

  const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('REK', {
      xmlns: 'http://edavki.durs.si/Documents/Schemas/REK_O_ObracunDajatevZaDohodkeIzDelovnegaRazmerja.xsd',
    });

  // Header — glava
  const glava = root.ele('Glava');
  glava.ele('VrstaRek').txt('1001');                        // REK-O = 1001
  glava.ele('DavcnaStevilkaPredlagatelja').txt(tenant.davcna_stevilka);
  glava.ele('NazivPredlagatelja').txt(tenant.naziv_podjetja);
  glava.ele('DatumPredlozitve').txt(datumPredlozitve);
  glava.ele('ObdobjeOd').txt(datumOd);
  glava.ele('ObdobjeDo').txt(datumDo);

  // iREK rows — one per employee
  for (const l of lines) {
    const rek = root.ele('iREK');

    // Employee identification
    const del = rek.ele('Delojemalec');
    del.ele('EMSO').txt(l.emso);
    del.ele('DavcnaStevilka').txt(l.davcna_stevilka_del);
    del.ele('Priimek').txt(l.priimek);
    del.ele('Ime').txt(l.ime);

    // Work hours
    const s04 = rek.ele('S04');
    s04.ele('Redno').txt(String(l.m01_ure ?? 0));
    s04.ele('Nadurno').txt(String(l.m03_nadure_ure ?? 0));

    // Amounts — all rounded to 2 decimals
    rek.ele('A011').txt(fmt(l.bruto_1));                          // Bruto plača
    rek.ele('A041').txt(fmt(sumEmployeeContributions(l)));        // Skupaj prispevki delojemalec
    rek.ele('A043').txt(fmt(sumEmployerContributions(l)));        // Skupaj prispevki delodajalec
    rek.ele('A051').txt(fmt(l.dohodnina));                        // Akontacija dohodnine
    rek.ele('B04').txt(fmt(l.m07_prehrana));                      // Povračilo prehrane
    rek.ele('B05').txt(fmt(l.m07_prevoz));                        // Povračilo prevoza
  }

  return root.end({ prettyPrint: true });
}

function fmt(n: number | null | undefined): string {
  return Number(n ?? 0).toFixed(2);
}

function sumEmployeeContributions(l: RekoLine): number {
  return (l.a071_piz_del ?? 0) +
         (l.a072_zz_del ?? 0) +
         (l.a072a_ozp_del ?? 0) +
         (l.a072b_do_del ?? 0) +
         (l.a073_star_del ?? 0) +
         (l.a074_zap_del ?? 0);
}

function sumEmployerContributions(l: RekoLine): number {
  return (l.a081_piz_del_adr ?? 0) +
         (l.a082_do_del_adr ?? 0) +
         (l.a083_zz_del_adr ?? 0) +
         (l.a084_zap_del_adr ?? 0) +
         (l.a085_star_del_adr ?? 0) +
         (l.a086_posk_del_adr ?? 0);
}
