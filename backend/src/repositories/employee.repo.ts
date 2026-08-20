import sql from 'mssql';
import { withTenant } from '../config/db';
import { IEmployee, ICreateEmployeeDto } from '../types/interfaces';

const SELECT_COLS = `
  id, tenant_id, job_position_id, ime, priimek, davcna_stevilka,
  emso, trr, naslov, kraj, posta, bruto_osnova, urna_postavka,
  a004_rezident, a014_invalid_nad_kvoto, a017_starost_60_let,
  a031_zavezanec_ozp, glavni_delodajalec, olajsava_vzdrzevani_znesek,
  b014_has_vozilo, b014_vozilo_nv, b014_vozilo_gorivo, b014_vozilo_el,
  aktivno, datum_zaposlitve
`;

export async function findAllEmployees(
  tenantId: string,
  page = 1,
  limit = 50,
  includeInactive = false
): Promise<{ data: IEmployee[]; total: number }> {
  return withTenant(tenantId, async (tx) => {
    const offset = (page - 1) * limit;
    const req = new sql.Request(tx);
    req.input('offset', sql.Int, offset);
    req.input('limit', sql.Int, limit);
    const whereClause = includeInactive ? '' : 'WHERE aktivno = 1';
    const result = await req.query<IEmployee & { total_count: number }>(`
      SELECT ${SELECT_COLS}, COUNT(*) OVER () AS total_count
      FROM dbo.employees
      ${whereClause}
      ORDER BY priimek, ime
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);
    const total = result.recordset[0]?.total_count ?? 0;
    return { data: result.recordset, total };
  });
}

export async function findEmployeeById(tenantId: string, id: string): Promise<IEmployee | null> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('id', sql.UniqueIdentifier, id);
    const result = await req.query<IEmployee>(`
      SELECT ${SELECT_COLS}
      FROM dbo.employees WHERE id = @id AND aktivno = 1
    `);
    return result.recordset[0] ?? null;
  });
}

export async function createEmployee(tenantId: string, dto: ICreateEmployeeDto): Promise<IEmployee> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('tenantId',      sql.UniqueIdentifier, tenantId);
    req.input('jobPositionId', sql.UniqueIdentifier, dto.job_position_id ?? null);
    req.input('ime',           sql.NVarChar, dto.ime);
    req.input('priimek',       sql.NVarChar, dto.priimek);
    req.input('davcna',        sql.VarChar,  dto.davcna_stevilka);
    req.input('emso',          sql.VarChar,  dto.emso);
    req.input('trr',           sql.VarChar,  dto.trr);
    req.input('bruto',         sql.Decimal(10, 2), dto.bruto_osnova);
    req.input('urnaPostavka',  sql.Decimal(10, 4), dto.urna_postavka ?? null);
    req.input('rezident',      sql.Char, dto.a004_rezident ?? 'R');
    req.input('invalid',       sql.Bit, dto.a014_invalid_nad_kvoto ? 1 : 0);
    req.input('starost60',     sql.Bit, dto.a017_starost_60_let ? 1 : 0);
    req.input('ozp',           sql.Bit, dto.a031_zavezanec_ozp !== false ? 1 : 0);
    req.input('glavni',        sql.Bit, dto.glavni_delodajalec !== false ? 1 : 0);
    req.input('olajsava',      sql.Decimal(10, 2), dto.olajsava_vzdrzevani_znesek ?? 0);
    req.input('naslov',        sql.NVarChar, dto.naslov ?? null);
    req.input('kraj',          sql.NVarChar, dto.kraj ?? null);
    req.input('posta',         sql.VarChar,  dto.posta ?? null);
    req.input('hasVozilo',     sql.Bit, dto.b014_has_vozilo ? 1 : 0);
    req.input('voziloNv',      sql.Decimal(10, 2), dto.b014_vozilo_nv ?? null);
    req.input('voziloGorivo',  sql.Bit, dto.b014_vozilo_gorivo ? 1 : 0);
    req.input('voziloEl',      sql.Bit, dto.b014_vozilo_el ? 1 : 0);
    req.input('datumZap',      sql.Date, dto.datum_zaposlitve ?? new Date());

    const result = await req.query<IEmployee>(`
      INSERT INTO dbo.employees (
        tenant_id, job_position_id, ime, priimek, davcna_stevilka, emso, trr,
        bruto_osnova, urna_postavka, a004_rezident, a014_invalid_nad_kvoto, a017_starost_60_let,
        a031_zavezanec_ozp, glavni_delodajalec, olajsava_vzdrzevani_znesek,
        naslov, kraj, posta,
        b014_has_vozilo, b014_vozilo_nv, b014_vozilo_gorivo, b014_vozilo_el,
        datum_zaposlitve
      )
      OUTPUT INSERTED.*
      VALUES (
        @tenantId, @jobPositionId, @ime, @priimek, @davcna, @emso, @trr,
        @bruto, @urnaPostavka, @rezident, @invalid, @starost60,
        @ozp, @glavni, @olajsava,
        @naslov, @kraj, @posta,
        @hasVozilo, @voziloNv, @voziloGorivo, @voziloEl,
        @datumZap
      )
    `);
    return result.recordset[0];
  });
}

export async function updateEmployee(
  tenantId: string,
  id: string,
  dto: Partial<ICreateEmployeeDto>
): Promise<IEmployee | null> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('id', sql.UniqueIdentifier, id);

    type FieldDef = [keyof ICreateEmployeeDto, string, (v: unknown) => void];
    const fields: FieldDef[] = [
      ['ime',                        'ime = @ime',                        () => req.input('ime',         sql.NVarChar,     dto.ime)],
      ['priimek',                    'priimek = @priimek',                () => req.input('priimek',     sql.NVarChar,     dto.priimek)],
      ['bruto_osnova',               'bruto_osnova = @bruto',             () => req.input('bruto',         sql.Decimal(10,2),dto.bruto_osnova)],
      ['urna_postavka',              'urna_postavka = @urnaPostavka',     () => req.input('urnaPostavka',  sql.Decimal(10,4),dto.urna_postavka ?? null)],
      ['trr',                        'trr = @trr',                        () => req.input('trr',           sql.VarChar,      dto.trr)],
      ['naslov',                     'naslov = @naslov',                  () => req.input('naslov',      sql.NVarChar,     dto.naslov ?? null)],
      ['kraj',                       'kraj = @kraj',                      () => req.input('kraj',        sql.NVarChar,     dto.kraj ?? null)],
      ['posta',                      'posta = @posta',                    () => req.input('posta',       sql.VarChar,      dto.posta ?? null)],
      ['olajsava_vzdrzevani_znesek', 'olajsava_vzdrzevani_znesek = @olajsava', () => req.input('olajsava', sql.Decimal(10,2), dto.olajsava_vzdrzevani_znesek)],
      ['a004_rezident',              'a004_rezident = @rezident',         () => req.input('rezident',    sql.Char,         dto.a004_rezident)],
      ['a014_invalid_nad_kvoto',     'a014_invalid_nad_kvoto = @invalid', () => req.input('invalid',     sql.Bit,          dto.a014_invalid_nad_kvoto ? 1 : 0)],
      ['a017_starost_60_let',        'a017_starost_60_let = @starost60',  () => req.input('starost60',   sql.Bit,          dto.a017_starost_60_let ? 1 : 0)],
      ['a031_zavezanec_ozp',         'a031_zavezanec_ozp = @ozp',         () => req.input('ozp',         sql.Bit,          dto.a031_zavezanec_ozp ? 1 : 0)],
      ['glavni_delodajalec',         'glavni_delodajalec = @glavni',      () => req.input('glavni',      sql.Bit,          dto.glavni_delodajalec ? 1 : 0)],
      ['b014_has_vozilo',            'b014_has_vozilo = @hasVozilo',      () => req.input('hasVozilo',   sql.Bit,          dto.b014_has_vozilo ? 1 : 0)],
      ['b014_vozilo_nv',             'b014_vozilo_nv = @voziloNv',        () => req.input('voziloNv',    sql.Decimal(10,2),dto.b014_vozilo_nv ?? null)],
      ['b014_vozilo_gorivo',         'b014_vozilo_gorivo = @voziloGorivo',() => req.input('voziloGorivo',sql.Bit,          dto.b014_vozilo_gorivo ? 1 : 0)],
      ['b014_vozilo_el',             'b014_vozilo_el = @voziloEl',        () => req.input('voziloEl',    sql.Bit,          dto.b014_vozilo_el ? 1 : 0)],
      ['datum_zaposlitve',           'datum_zaposlitve = @datumZap',      () => req.input('datumZap',    sql.Date,         dto.datum_zaposlitve)],
      ['job_position_id',            'job_position_id = @jobPositionId',  () => req.input('jobPositionId', sql.UniqueIdentifier, dto.job_position_id ?? null)],
      ['aktivno',                    'aktivno = @aktivno',                () => req.input('aktivno',     sql.Bit,          dto.aktivno ? 1 : 0)],
    ];

    const sets: string[] = [];
    for (const [field, clause, bind] of fields) {
      if (dto[field] !== undefined) {
        bind(dto[field]);
        sets.push(clause);
      }
    }

    if (sets.length === 0) return findEmployeeById(tenantId, id);

    const result = await req.query<IEmployee>(`
      UPDATE dbo.employees SET ${sets.join(', ')}
      OUTPUT INSERTED.*
      WHERE id = @id AND aktivno = 1
    `);
    return result.recordset[0] ?? null;
  });
}

export async function deleteEmployee(tenantId: string, id: string): Promise<boolean> {
  return withTenant(tenantId, async (tx) => {
    const req = new sql.Request(tx);
    req.input('id', sql.UniqueIdentifier, id);
    const result = await req.query(`
      UPDATE dbo.employees SET aktivno = 0 WHERE id = @id AND aktivno = 1
    `);
    return (result.rowsAffected[0] ?? 0) > 0;
  });
}
