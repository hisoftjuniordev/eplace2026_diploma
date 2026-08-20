import { z } from 'zod';

const uuid = z
  .string()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Invalid UUID')
  .transform(v => v.toLowerCase());

export const createEmployeeSchema = z.object({
  ime:                        z.string().min(1).max(50),
  priimek:                    z.string().min(1).max(50),
  davcna_stevilka:            z.string().length(8).regex(/^\d{8}$/),
  emso:                       z.string().length(13).regex(/^\d{13}$/),
  trr:                        z.string().min(15).max(34),
  bruto_osnova:               z.number().min(0),
  urna_postavka:              z.number().min(0).nullable().optional(),
  job_position_id:            uuid.optional(),
  a004_rezident:              z.enum(['R', 'N']).optional(),
  a014_invalid_nad_kvoto:     z.boolean().optional(),
  a017_starost_60_let:        z.boolean().optional(),
  a031_zavezanec_ozp:         z.boolean().optional(),
  glavni_delodajalec:         z.boolean().optional(),
  olajsava_vzdrzevani_znesek: z.number().min(0).optional(),
  naslov:                     z.string().max(150).optional(),
  kraj:                       z.string().max(100).optional(),
  posta:                      z.string().max(10).optional(),
  b014_has_vozilo:            z.boolean().optional(),
  b014_vozilo_nv:             z.number().positive().optional(),
  b014_vozilo_gorivo:         z.boolean().optional(),
  b014_vozilo_el:             z.boolean().optional(),
  datum_zaposlitve:           z.string().datetime({ offset: true }).or(z.string().date()).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({
  davcna_stevilka: true,
  emso: true,
});

const coerceInt = (min: number, max: number) =>
  z.union([z.number(), z.string().transform(Number)]).pipe(
    z.number().int().min(min).max(max)
  );

const coerceNum = (min: number, max: number) =>
  z.union([z.number(), z.string().transform(Number)]).pipe(
    z.number().min(min).max(max)
  );

export const upsertHoursSchema = z.object({
  employee_id:    uuid,
  leto:           coerceInt(2020, 2099),
  mesec:          coerceInt(1, 12),
  m01_redno_ure:  coerceInt(0, 744).optional(),
  m02_refund_ure: coerceInt(0, 744).optional(),
  m03_nadure_ure: coerceInt(0, 200).optional(),
  m06_odsot_ure:  coerceInt(0, 744).optional(),
  m07_preh_dnevi: coerceInt(0, 31).optional(),
  m04_dopust_ure:  coerceInt(0, 744).optional(),
  m05_bolniske_ure: coerceInt(0, 744).optional(),
  m07_prevoz_km:   coerceNum(0, 9999.99).optional(),
  odtegljaji_kred: coerceNum(0, 999999).optional(),
});

export const upsertPayrollParamSchema = z.object({
  vrednost:   z.string().min(1).max(2000),
  opis:       z.string().min(1).max(300),
  veljavno_od: z.string().date(),
  veljavno_do: z.string().date().nullable().optional(),
});

export const createJobPositionSchema = z.object({
  naziv_delovnega_mesta: z.string().min(1).max(100),
  tarifni_razred:        z.number().int().min(1).max(9),
  zahtevana_izobrazba:   z.string().max(50).optional(),
});

export const updateJobPositionSchema = createJobPositionSchema.partial();
