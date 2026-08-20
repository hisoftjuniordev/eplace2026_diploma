import { create } from 'xmlbuilder2';
import { IPayrollRun, IPayrollLine, ITenant } from '../types/interfaces';

interface SepaLine extends IPayrollLine {
  priimek: string;
  ime: string;
  trr: string;
}

function getBic(iban: string): string {
  // Simplified BIC extraction — works for SI56 IBANs
  const bankCode = iban.substring(4, 9);
  const bankBicMap: Record<string, string> = {
    '01000': 'BSLJSI2X', // NLB
    '02000': 'LJBASI2X', // SKB
    '03000': 'KBMESI2X', // Nova KBM
    '04000': 'ZBSISI2X', // Abanka
    '07000': 'CITISI2X', // Citi
    '10100': 'HYPOATWW', // Addiko
    '19000': 'PRVASI21', // Primorska
    '31000': 'SABASIBB', // Sberbank
    '39000': 'BACXSI22', // BKS
    '47000': 'INGBSI2X', // ING
    '60000': 'BKBMSI22', // Delavska
    '65000': 'DEUTSI2X', // Deutsche
    '92000': 'FIISSI21', // Fidea
  };
  return bankBicMap[bankCode] ?? 'BSLJSI2X';
}

export function generateSepaXml(
  run: IPayrollRun,
  lines: SepaLine[],
  tenant: ITenant
): string {
  const validLines = lines.filter((l) => l.koncno_izplacilo_trr > 0);
  if (validLines.length === 0) throw new Error('Ni vrstic z pozitivnim izplačilom');

  const ctrlSum = validLines
    .reduce((sum, l) => sum + parseFloat(l.koncno_izplacilo_trr.toString()), 0)
    .toFixed(2);

  const now = new Date().toISOString().slice(0, 19);
  const msgId = `EPLACE-${run.id.slice(0, 8)}-${Date.now()}`;

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Document', {
      xmlns: 'urn:iso:std:iso:20022:tech:xsd:pain.001.001.03',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    })
    .ele('CstmrCdtTrfInitn')
    .ele('GrpHdr')
    .ele('MsgId').txt(msgId).up()
    .ele('CreDtTm').txt(now).up()
    .ele('NbOfTxs').txt(String(validLines.length)).up()
    .ele('CtrlSum').txt(ctrlSum).up()
    .ele('InitgPty').ele('Nm').txt(tenant.naziv_podjetja).up().up()
    .up() // GrpHdr
    .ele('PmtInf')
    .ele('PmtInfId').txt(`PLACA-${run.mesec}-${run.leto}`).up()
    .ele('PmtMtd').txt('TRF').up()
    .ele('NbOfTxs').txt(String(validLines.length)).up()
    .ele('CtrlSum').txt(ctrlSum).up()
    .ele('PmtTpInf')
    .ele('SvcLvl').ele('Cd').txt('SEPA').up().up()
    .ele('LclInstrm').ele('Cd').txt('CORE').up().up()
    .up() // PmtTpInf
    .ele('ReqdExctnDt').txt(new Date(run.datum_izplacila).toISOString().split('T')[0]).up()
    .ele('Dbtr').ele('Nm').txt(tenant.naziv_podjetja).up().up()
    .ele('DbtrAcct').ele('Id').ele('IBAN').txt(tenant.iban).up().up().up()
    .ele('DbtrAgt').ele('FinInstnId').ele('BIC').txt(getBic(tenant.iban)).up().up().up();

  for (const line of validLines) {
    const amount = parseFloat(line.koncno_izplacilo_trr.toString()).toFixed(2);
    doc
      .ele('CdtTrfTxInf')
      .ele('PmtId')
      .ele('EndToEndId').txt(`PLACA-${line.davcna_stevilka}-${run.mesec}`).up()
      .up()
      .ele('Amt')
      .ele('InstdAmt', { Ccy: 'EUR' }).txt(amount).up()
      .up()
      .ele('CdtrAgt').ele('FinInstnId').ele('BIC').txt(getBic(line.trr)).up().up().up()
      .ele('Cdtr').ele('Nm').txt(`${line.priimek} ${line.ime}`).up().up()
      .ele('CdtrAcct').ele('Id').ele('IBAN').txt(line.trr).up().up().up()
      .up(); // CdtTrfTxInf
  }

  return doc.end({ prettyPrint: true });
}
