import { create } from 'xmlbuilder2';
import { IPayrollRun, IPayrollLine } from '../types/interfaces';
import BigNumber from 'bignumber.js';

BigNumber.config({ DECIMAL_PLACES: 2, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

function sum(lines: IPayrollLine[], field: keyof IPayrollLine): string {
  return lines
    .reduce((acc, l) => acc.plus(new BigNumber(String(l[field] ?? 0))), new BigNumber(0))
    .toFixed(2);
}

export function generateVodXml(run: IPayrollRun, lines: IPayrollLine[]): string {
  const mesecStr = String(run.mesec).padStart(2, '0');
  const opis = `Plače ${mesecStr}/${run.leto}`;

  const vsotaBruto1       = sum(lines, 'bruto_1');
  const vsotaKoncno       = sum(lines, 'koncno_izplacilo_trr');
  const vsotaPizDel       = sum(lines, 'a071_piz_del');
  const vsotaZzDel        = sum(lines, 'a072_zz_del');
  const vsotaOzpDel       = sum(lines, 'a072a_ozp_del');
  const vsotaDoDel        = sum(lines, 'a072b_do_del');
  const vsotaPizAdr       = sum(lines, 'a081_piz_del_adr');
  const vsotaZzAdr        = sum(lines, 'a083_zz_del_adr');
  const vsotaDoAdr        = sum(lines, 'a082_do_del_adr');
  const vsotaDohodnina    = sum(lines, 'dohodnina');
  const vsotaPrehrana     = sum(lines, 'm07_prehrana');
  const vsotaPrevoz       = sum(lines, 'm07_prevoz');
  const vsotaPosk         = sum(lines, 'a086_posk_del_adr');
  const vsotaStar         = sum(lines, 'a085_star_del_adr');
  const vsotaZap          = sum(lines, 'a084_zap_del_adr');
  const vsotaStarDel      = sum(lines, 'a073_star_del');
  const vsotaZapDel       = sum(lines, 'a074_zap_del');

  const vsotaPrehravoz    = new BigNumber(vsotaPrehrana).plus(vsotaPrevoz).toFixed(2);
  const vsotaPrispAdr     = new BigNumber(vsotaPizAdr).plus(vsotaZzAdr).plus(vsotaDoAdr)
    .plus(vsotaPosk).plus(vsotaStar).plus(vsotaZap).toFixed(2);

  // Debetna stran (stroški)
  const debetD = [
    { konto: '4700', znesek: vsotaBruto1,    opisP: `Bruto plače ${opis}` },
    { konto: '4730', znesek: vsotaPrispAdr,  opisP: `Prispevki delodajalec ${opis}` },
    { konto: '4750', znesek: vsotaPrehravoz, opisP: `Povračila (prehrana+prevoz) ${opis}` },
  ];

  // Kreditna stran (obveznosti)
  const kreditK = [
    { konto: '2200', znesek: vsotaKoncno,    opisP: `Neto plače za izplačilo ${opis}` },
    { konto: '2600', znesek: vsotaPizDel,    opisP: `PIZ delavec ${opis}` },
    { konto: '2601', znesek: vsotaZzDel,     opisP: `ZZ delavec ${opis}` },
    { konto: '2602', znesek: vsotaOzpDel,    opisP: `OZP odtegljaji ${opis}` },
    { konto: '2603', znesek: vsotaDoDel,     opisP: `DO delavec ${opis}` },
    { konto: '2604', znesek: vsotaZapDel,    opisP: `ZAP delavec ${opis}` },
    { konto: '2605', znesek: vsotaStarDel,   opisP: `STAR delavec ${opis}` },
    { konto: '2610', znesek: vsotaPizAdr,    opisP: `PIZ delodajalec ${opis}` },
    { konto: '2611', znesek: vsotaZzAdr,     opisP: `ZZ delodajalec ${opis}` },
    { konto: '2612', znesek: vsotaDoAdr,     opisP: `DO delodajalec ${opis}` },
    { konto: '2613', znesek: vsotaZap,       opisP: `ZAP delodajalec ${opis}` },
    { konto: '2614', znesek: vsotaStar,      opisP: `STAR delodajalec ${opis}` },
    { konto: '2615', znesek: vsotaPosk,      opisP: `POSK delodajalec ${opis}` },
    { konto: '2650', znesek: vsotaDohodnina, opisP: `Dohodnina ${opis}` },
  ];

  const vsotaD = debetD.reduce((a, r) => a.plus(r.znesek), new BigNumber(0));
  const vsotaK = kreditK.reduce((a, r) => a.plus(r.znesek), new BigNumber(0));

  if (!vsotaD.isEqualTo(vsotaK)) {
    console.warn(`[VOD] Temeljnica ni uravnotežena: D=${vsotaD.toFixed(2)} K=${vsotaK.toFixed(2)}`);
  }

  const skupajPostavk = debetD.length + kreditK.length;

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('VODDokument', { verzija: '1.0' })
    .ele('Glava')
    .ele('DatumKnjizenja').txt(new Date(run.datum_izplacila).toISOString().split('T')[0]).up()
    .ele('Opis').txt(opis).up()
    .ele('StevZapisov').txt(String(skupajPostavk)).up()
    .ele('VsotaD').txt(vsotaD.toFixed(2)).up()
    .ele('VsotaK').txt(vsotaK.toFixed(2)).up()
    .up()
    .ele('Postavke');

  for (const p of debetD) {
    doc
      .ele('Postavka')
      .ele('Konto').txt(p.konto).up()
      .ele('Stran').txt('D').up()
      .ele('Znesek').txt(p.znesek).up()
      .ele('Opis').txt(p.opisP).up()
      .up();
  }

  for (const p of kreditK) {
    doc
      .ele('Postavka')
      .ele('Konto').txt(p.konto).up()
      .ele('Stran').txt('K').up()
      .ele('Znesek').txt(p.znesek).up()
      .ele('Opis').txt(p.opisP).up()
      .up();
  }

  return doc.end({ prettyPrint: true });
}
