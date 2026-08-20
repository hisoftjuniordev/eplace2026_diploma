export interface IJwtPayload {
  sub: string;
  tenantId: string;
  email: string;
  vloga: 'SistemskiAdmin' | 'Skrbnik' | 'Uporabnik';
  ime: string;
  priimek: string;
  iat: number;
  exp: number;
}

export interface IPayrollInput {
  tenantId: string;
  employeeId: string;
  brutoOsnova: number;
  urnaPostavka: number | null;
  olajsavaVzdrzevani: number;
  glavniDelodajalec: boolean;
  zavezanecOzp: boolean;
  boniteta: number;
  m01Ure: number;
  m03NadureUre: number;
  m04DopustUre: number;
  m05BolniskeUre: number;
  m07PrehranaDnevi: number;
  m07PrevozKm: number;
  odtegljaji: number;
}

export interface IPayrollResult {
  bruto1: number;
  boniteta: number;
  // Mode B breakdown (null for Mode A / fixed bruto)
  m01RednoZnesek: number | null;
  m04DopustZnesek: number | null;
  m05BolniskaZnesek: number | null;
  pizDel: number;
  zzDel: number;
  ozpDel: number;
  doDel: number;
  starDel: number;
  zapDel: number;
  davcnaOsnova: number;
  dohodnina: number;
  netoPredOzp: number;
  netoPoOzp: number;
  prehranaPovracilo: number;
  prevozPovracilo: number;
  odtegljaji: number;
  koncnoIzplaciloTrr: number;
  pizDelAdr: number;
  doDelAdr: number;
  zzDelAdr: number;
  zapDelAdr: number;
  starDelAdr: number;
  poskDelAdr: number;
  bruto2Strosek: number;
}

export interface ITenant {
  id: string;
  naziv_podjetja: string;
  davcna_stevilka: string;
  maticna_stevilka: string;
  iban: string;
}

export interface IEmployee {
  id: string;
  tenant_id: string;
  job_position_id: string | null;
  ime: string;
  priimek: string;
  davcna_stevilka: string;
  emso: string;
  trr: string;
  naslov: string | null;
  kraj: string | null;
  posta: string | null;
  bruto_osnova: number;
  urna_postavka: number | null;
  a004_rezident: 'R' | 'N';
  a014_invalid_nad_kvoto: boolean;
  a017_starost_60_let: boolean;
  a031_zavezanec_ozp: boolean;
  glavni_delodajalec: boolean;
  olajsava_vzdrzevani_znesek: number;
  b014_has_vozilo: boolean;
  b014_vozilo_nv: number | null;
  b014_vozilo_gorivo: boolean;
  b014_vozilo_el: boolean;
  aktivno: boolean;
  datum_zaposlitve: string;
}

export interface ICreateEmployeeDto {
  ime: string;
  priimek: string;
  davcna_stevilka: string;
  emso: string;
  trr: string;
  bruto_osnova: number;
  urna_postavka?: number | null;
  job_position_id?: string;
  a004_rezident?: 'R' | 'N';
  a014_invalid_nad_kvoto?: boolean;
  a017_starost_60_let?: boolean;
  a031_zavezanec_ozp?: boolean;
  glavni_delodajalec?: boolean;
  olajsava_vzdrzevani_znesek?: number;
  naslov?: string;
  kraj?: string;
  posta?: string;
  b014_has_vozilo?: boolean;
  b014_vozilo_nv?: number;
  b014_vozilo_gorivo?: boolean;
  b014_vozilo_el?: boolean;
  datum_zaposlitve?: Date | string;
  aktivno?: boolean;
}

export interface IJobPosition {
  id: string;
  tenant_id: string;
  naziv_delovnega_mesta: string;
  tarifni_razred: number;
  zahtevana_izobrazba: string | null;
  aktivno: boolean;
}

export interface ICreateJobPositionDto {
  naziv_delovnega_mesta: string;
  tarifni_razred: number;
  zahtevana_izobrazba?: string;
}

export interface IPayrollRun {
  id: string;
  tenant_id: string;
  leto: number;
  mesec: number;
  datum_izplacila: string;
  status_obracuna: 'Osnutek' | 'Procesiranje' | 'Zakljucen' | 'Napaka';
  progress_procent: number;
  ustvarjen_ob: string;
  napaka_opis: string | null;
  zakljucen_ob: string | null;
}

export interface IPayrollLine {
  id: string;
  tenant_id: string;
  payroll_run_id: string;
  employee_id: string;
  bruto_1: number;
  boniteta_b014: number;
  a071_piz_del: number;
  a072_zz_del: number;
  a072a_ozp_del: number;
  a072b_do_del: number;
  a073_star_del: number;
  a074_zap_del: number;
  davcna_osnova: number;
  dohodnina: number;
  neto_pred_ozp: number;
  neto_po_ozp: number;
  m07_prehrana: number;
  m07_prevoz: number;
  odtegljaji_kredit: number;
  koncno_izplacilo_trr: number;
  a081_piz_del_adr: number;
  a082_do_del_adr: number;
  a083_zz_del_adr: number;
  a084_zap_del_adr: number;
  a085_star_del_adr: number;
  a086_posk_del_adr: number;
  bruto_2_strosek: number;
  m01_redno_znesek: number | null;
  m04_dopust_znesek: number | null;
  m05_bolniska_znesek: number | null;
  // joined from employees
  ime?: string;
  priimek?: string;
  davcna_stevilka?: string;
  trr?: string;
}

export interface IPayrollParamRow {
  id: string;
  kljuc: string;
  vrednost: string;
  opis: string;
  veljavno_od: string;
  veljavno_do: string | null;
  ustvarjen_ob: string;
  posodobljen_ob: string;
}

export interface IDohodninaRazred {
  od: number;
  do: number | null;
  stopnja: number;
  fiksni: number;
}

export interface IPayrollParams {
  STOPNJA_PIZ_DEL: number;
  STOPNJA_ZZ_DEL: number;
  STOPNJA_ZAP_DEL: number;
  STOPNJA_STAR_DEL: number;
  STOPNJA_DO_DEL: number;
  STOPNJA_PIZ_ADR: number;
  STOPNJA_ZZ_ADR: number;
  STOPNJA_ZAP_ADR: number;
  STOPNJA_STAR_ADR: number;
  STOPNJA_POSK_ADR: number;
  STOPNJA_DO_ADR: number;
  OZP_MESECNI: number;
  SPLOSNA_OLAJSAVA: number;
  PREHRANA_DNEVNA_MEJA: number;
  PREVOZ_KM_MEJA: number;
  POLNI_MESEC_URE: number;
  DOHODNINSKA_LESTVICA: IDohodninaRazred[];
  MINIMALNA_PLACA: number;
  MINIMALNA_URNA_POSTAVKA: number;
  BOLNISKA_FAKTOR_DEL: number;
  NADURE_FAKTOR: number;
  DOPUST_FAKTOR: number;
}

export interface IMonthlyHours {
  id: string;
  employee_id: string;
  leto: number;
  mesec: number;
  m01_redno_ure: number;
  m02_refund_ure: number;
  m03_nadure_ure: number;
  m04_dopust_ure: number;
  m05_bolniske_ure: number;
  m06_odsot_ure: number;
  m07_preh_dnevi: number;
  m07_prevoz_km: number;
  odtegljaji_kred: number;
}
