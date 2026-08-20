import sql from 'mssql';
import { sysQuery } from '../config/db';
import { IPayrollParamRow, IPayrollParams, IDohodninaRazred } from '../types/interfaces';

export const REQUIRED_KEYS: Array<keyof IPayrollParams> = [
  'STOPNJA_PIZ_DEL', 'STOPNJA_ZZ_DEL', 'STOPNJA_ZAP_DEL', 'STOPNJA_STAR_DEL', 'STOPNJA_DO_DEL',
  'STOPNJA_PIZ_ADR', 'STOPNJA_ZZ_ADR', 'STOPNJA_ZAP_ADR', 'STOPNJA_STAR_ADR', 'STOPNJA_POSK_ADR', 'STOPNJA_DO_ADR',
  'OZP_MESECNI', 'SPLOSNA_OLAJSAVA', 'PREHRANA_DNEVNA_MEJA', 'PREVOZ_KM_MEJA', 'POLNI_MESEC_URE',
  'DOHODNINSKA_LESTVICA',
  'MINIMALNA_PLACA', 'MINIMALNA_URNA_POSTAVKA', 'BOLNISKA_FAKTOR_DEL', 'NADURE_FAKTOR', 'DOPUST_FAKTOR',
];

export async function getAllPayrollParams(): Promise<IPayrollParamRow[]> {
  const res = await sysQuery<IPayrollParamRow>(`
    SELECT id, kljuc, vrednost, opis, veljavno_od, veljavno_do, ustvarjen_ob, posodobljen_ob
    FROM dbo.payroll_params
    ORDER BY kljuc, veljavno_od DESC
  `);
  return res.recordset;
}

export async function getActivePayrollParams(): Promise<IPayrollParams> {
  const today = new Date().toISOString().split('T')[0];
  const res = await sysQuery<IPayrollParamRow>(
    `SELECT kljuc, vrednost FROM dbo.payroll_params
     WHERE veljavno_od <= @today
       AND (veljavno_do IS NULL OR veljavno_do >= @today)
     ORDER BY veljavno_od DESC`,
    (req) => req.input('today', sql.Date, today)
  );

  const map: Record<string, string> = {};
  for (const row of res.recordset) {
    map[row.kljuc] = row.vrednost;
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in map)) {
      throw new Error(`Manjkajoč parameter obračuna: ${key}. Poženi 06_payroll_params.sql.`);
    }
  }

  const parseLestvica = (): IDohodninaRazred[] => {
    try {
      return JSON.parse(map['DOHODNINSKA_LESTVICA']);
    } catch {
      throw new Error('Neveljaven JSON v parametru DOHODNINSKA_LESTVICA');
    }
  };

  return {
    STOPNJA_PIZ_DEL:     parseFloat(map['STOPNJA_PIZ_DEL']),
    STOPNJA_ZZ_DEL:      parseFloat(map['STOPNJA_ZZ_DEL']),
    STOPNJA_ZAP_DEL:     parseFloat(map['STOPNJA_ZAP_DEL']),
    STOPNJA_STAR_DEL:    parseFloat(map['STOPNJA_STAR_DEL']),
    STOPNJA_DO_DEL:      parseFloat(map['STOPNJA_DO_DEL']),
    STOPNJA_PIZ_ADR:     parseFloat(map['STOPNJA_PIZ_ADR']),
    STOPNJA_ZZ_ADR:      parseFloat(map['STOPNJA_ZZ_ADR']),
    STOPNJA_ZAP_ADR:     parseFloat(map['STOPNJA_ZAP_ADR']),
    STOPNJA_STAR_ADR:    parseFloat(map['STOPNJA_STAR_ADR']),
    STOPNJA_POSK_ADR:    parseFloat(map['STOPNJA_POSK_ADR']),
    STOPNJA_DO_ADR:      parseFloat(map['STOPNJA_DO_ADR']),
    OZP_MESECNI:         parseFloat(map['OZP_MESECNI']),
    SPLOSNA_OLAJSAVA:    parseFloat(map['SPLOSNA_OLAJSAVA']),
    PREHRANA_DNEVNA_MEJA: parseFloat(map['PREHRANA_DNEVNA_MEJA']),
    PREVOZ_KM_MEJA:      parseFloat(map['PREVOZ_KM_MEJA']),
    POLNI_MESEC_URE:          parseFloat(map['POLNI_MESEC_URE']),
    DOHODNINSKA_LESTVICA:     parseLestvica(),
    MINIMALNA_PLACA:          parseFloat(map['MINIMALNA_PLACA']),
    MINIMALNA_URNA_POSTAVKA:  parseFloat(map['MINIMALNA_URNA_POSTAVKA']),
    BOLNISKA_FAKTOR_DEL:      parseFloat(map['BOLNISKA_FAKTOR_DEL']),
    NADURE_FAKTOR:            parseFloat(map['NADURE_FAKTOR']),
    DOPUST_FAKTOR:            parseFloat(map['DOPUST_FAKTOR']),
  };
}

export async function upsertPayrollParam(
  kljuc: string,
  vrednost: string,
  opis: string,
  veljavno_od: string,
  veljavno_do: string | null
): Promise<IPayrollParamRow> {
  const res = await sysQuery<IPayrollParamRow>(
    `MERGE dbo.payroll_params AS target
     USING (SELECT @kljuc AS kljuc, @veljavno_od AS veljavno_od) AS src
     ON target.kljuc = src.kljuc AND target.veljavno_od = src.veljavno_od
     WHEN MATCHED THEN
       UPDATE SET vrednost = @vrednost, opis = @opis, veljavno_do = @veljavno_do, posodobljen_ob = GETDATE()
     WHEN NOT MATCHED THEN
       INSERT (kljuc, vrednost, opis, veljavno_od, veljavno_do)
       VALUES (@kljuc, @vrednost, @opis, @veljavno_od, @veljavno_do)
     OUTPUT INSERTED.id, INSERTED.kljuc, INSERTED.vrednost, INSERTED.opis,
            INSERTED.veljavno_od, INSERTED.veljavno_do, INSERTED.ustvarjen_ob, INSERTED.posodobljen_ob;`,
    (req) => {
      req.input('kljuc',       sql.VarChar(50),   kljuc);
      req.input('vrednost',    sql.NVarChar(2000), vrednost);
      req.input('opis',        sql.NVarChar(300),  opis);
      req.input('veljavno_od', sql.Date,            veljavno_od);
      req.input('veljavno_do', sql.Date,            veljavno_do ?? null);
    }
  );
  return res.recordset[0];
}
