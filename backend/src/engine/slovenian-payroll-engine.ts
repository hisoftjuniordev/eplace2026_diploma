import BigNumber from 'bignumber.js';
import { IPayrollInput, IPayrollResult, IPayrollParams, IDohodninaRazred } from '../types/interfaces';

BigNumber.config({ DECIMAL_PLACES: 10, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });

const R = (n: BigNumber) => n.decimalPlaces(2, BigNumber.ROUND_HALF_UP);

function progresivnaDohodnina(davcnaOsnova: BigNumber, lestvica: IDohodninaRazred[]): BigNumber {
  if (davcnaOsnova.lte(0)) return new BigNumber('0');

  for (const razred of lestvica) {
    const jeVRazredu = razred.do === null
      ? davcnaOsnova.gt(razred.od)
      : davcnaOsnova.gt(razred.od) && davcnaOsnova.lte(razred.do);

    if (jeVRazredu) {
      return R(
        new BigNumber(razred.fiksni).plus(
          davcnaOsnova.minus(razred.od).multipliedBy(razred.stopnja)
        )
      );
    }
  }
  throw new Error(`Davčna osnova ${davcnaOsnova.toFixed(2)} ne ustreza nobenemu razredu dohodninske lestvice`);
}

export class SlovenianPayrollEngine {
  calculate(input: IPayrollInput, params: IPayrollParams): IPayrollResult {
    const PIZ_DEL  = new BigNumber(params.STOPNJA_PIZ_DEL);
    const ZZ_DEL   = new BigNumber(params.STOPNJA_ZZ_DEL);
    const ZAP_DEL  = new BigNumber(params.STOPNJA_ZAP_DEL);
    const STAR_DEL = new BigNumber(params.STOPNJA_STAR_DEL);
    const DO_DEL   = new BigNumber(params.STOPNJA_DO_DEL);
    const PIZ_ADR  = new BigNumber(params.STOPNJA_PIZ_ADR);
    const ZZ_ADR   = new BigNumber(params.STOPNJA_ZZ_ADR);
    const ZAP_ADR  = new BigNumber(params.STOPNJA_ZAP_ADR);
    const STAR_ADR = new BigNumber(params.STOPNJA_STAR_ADR);
    const POSK_ADR = new BigNumber(params.STOPNJA_POSK_ADR);
    const DO_ADR   = new BigNumber(params.STOPNJA_DO_ADR);
    const OZP      = new BigNumber(params.OZP_MESECNI);
    const SPLOSNA_OLAJSAVA = new BigNumber(params.SPLOSNA_OLAJSAVA);
    const PREHRANA_MEJA    = new BigNumber(params.PREHRANA_DNEVNA_MEJA);
    const PREVOZ_KM_MEJA   = new BigNumber(params.PREVOZ_KM_MEJA);
    const POLNI_MESEC_URE  = new BigNumber(params.POLNI_MESEC_URE);

    const brutoOsnovaFull = new BigNumber(input.brutoOsnova.toString());
    const boniteta        = new BigNumber(input.boniteta.toString());
    const m01Ure          = new BigNumber(input.m01Ure.toString());
    const m03NadureUre    = new BigNumber((input.m03NadureUre ?? 0).toString());
    const m04DopustUre    = new BigNumber((input.m04DopustUre ?? 0).toString());
    const m05BolniskeUre  = new BigNumber((input.m05BolniskeUre ?? 0).toString());

    const BOL_FAKTOR = new BigNumber(params.BOLNISKA_FAKTOR_DEL);
    const DOP_FAKTOR = new BigNumber(params.DOPUST_FAKTOR);
    const NAD_FAKTOR = new BigNumber(params.NADURE_FAKTOR);

    let brutoOsnova: BigNumber;
    let nadureZnesek: BigNumber;
    let m01RednoZnesek: BigNumber | null   = null;
    let m04DopustZnesek: BigNumber | null  = null;
    let m05BolniskaZnesek: BigNumber | null = null;

    if (input.urnaPostavka && input.urnaPostavka > 0) {
      // ── NAČIN B — Parametrični (ZDR-1 čl. 127, 137/3, 137/9, 144) ─────────
      const up = new BigNumber(input.urnaPostavka.toString());

      m01RednoZnesek    = R(up.multipliedBy(DOP_FAKTOR).multipliedBy(m01Ure));
      m04DopustZnesek   = R(up.multipliedBy(DOP_FAKTOR).multipliedBy(m04DopustUre));
      m05BolniskaZnesek = R(up.multipliedBy(BOL_FAKTOR).multipliedBy(m05BolniskeUre));
      nadureZnesek      = R(up.multipliedBy(NAD_FAKTOR).multipliedBy(m03NadureUre));
      brutoOsnova       = R(m01RednoZnesek.plus(m04DopustZnesek).plus(m05BolniskaZnesek));

      // Kontrola minimalne plače
      const ureSkupaj = m01Ure.plus(m04DopustUre).plus(m05BolniskeUre).plus(m03NadureUre);
      const minWage = new BigNumber(params.MINIMALNA_PLACA)
        .multipliedBy(ureSkupaj).dividedBy(POLNI_MESEC_URE);
      if (brutoOsnova.plus(nadureZnesek).lt(minWage)) {
        throw new Error(
          `Bruto pod minimalno plačo: ${brutoOsnova.plus(nadureZnesek).toFixed(2)} € < ${minWage.toFixed(2)} €`
        );
      }
    } else {
      // ── NAČIN A — Fiksni bruto (nespremenjen) ────────────────────────────────
      const proRata = m01Ure.gt(0) && m01Ure.lt(POLNI_MESEC_URE)
        ? m01Ure.dividedBy(POLNI_MESEC_URE)
        : new BigNumber('1');
      brutoOsnova  = R(brutoOsnovaFull.multipliedBy(proRata));
      const up0 = POLNI_MESEC_URE.gt(0)
        ? brutoOsnovaFull.dividedBy(POLNI_MESEC_URE)
        : new BigNumber('0');
      nadureZnesek = R(up0.multipliedBy(m03NadureUre).multipliedBy(NAD_FAKTOR));
    }

    // 1. bruto1 (vključuje nadure in boniteto)
    const bruto1 = R(brutoOsnova.plus(nadureZnesek).plus(boniteta));

    // 2–6. Prispevki delavca
    const pizDel  = R(bruto1.multipliedBy(PIZ_DEL));
    const zzDel   = R(bruto1.multipliedBy(ZZ_DEL));
    const zapDel  = R(bruto1.multipliedBy(ZAP_DEL));
    const starDel = R(bruto1.multipliedBy(STAR_DEL));
    const doDel   = R(bruto1.multipliedBy(DO_DEL));

    // 7. Skupaj prispevki delavca
    const skupajPrispDel = R(pizDel.plus(zzDel).plus(zapDel).plus(starDel).plus(doDel));

    // 8. Olajšave
    const splosna = input.glavniDelodajalec ? SPLOSNA_OLAJSAVA : new BigNumber('0');
    const olajsavaSkupaj = splosna.plus(new BigNumber(input.olajsavaVzdrzevani.toString()));

    // 9. Davčna osnova
    const davcnaOsnovaRaw = bruto1.minus(skupajPrispDel).minus(olajsavaSkupaj);
    const davcnaOsnova    = R(BigNumber.maximum(0, davcnaOsnovaRaw));

    // 10. Dohodnina
    const dohodnina = progresivnaDohodnina(davcnaOsnova, params.DOHODNINSKA_LESTVICA);

    // 11. Neto pred OZP
    const netoPredOzp = R(bruto1.minus(skupajPrispDel).minus(dohodnina));

    // 12. OZP odtegljaj
    const ozpDel = input.zavezanecOzp ? OZP : new BigNumber('0');

    // 13. Neto po OZP
    const netoPoOzp = R(netoPredOzp.minus(ozpDel));

    // 14. Prehrana
    const prehranaPovracilo = R(
      new BigNumber(input.m07PrehranaDnevi.toString()).multipliedBy(PREHRANA_MEJA)
    );

    // 15. Prevoz (dnevna km razdalja × delovni dnevi × km rate)
    const prevozPovracilo = R(
      new BigNumber(input.m07PrehranaDnevi.toString())
        .multipliedBy(new BigNumber(input.m07PrevozKm.toString()))
        .multipliedBy(PREVOZ_KM_MEJA)
    );

    // 16. Končno izplačilo
    const odtegljaji = new BigNumber(input.odtegljaji.toString());
    const koncnoIzplaciloTrr = R(
      netoPoOzp.plus(prehranaPovracilo).plus(prevozPovracilo).minus(odtegljaji)
    );

    // 17–22. Prispevki delodajalca (na pro-rata bruto osnovo)
    const pizDelAdr  = R(brutoOsnova.multipliedBy(PIZ_ADR));
    const zzDelAdr   = R(brutoOsnova.multipliedBy(ZZ_ADR));
    const zapDelAdr  = R(brutoOsnova.multipliedBy(ZAP_ADR));
    const starDelAdr = R(brutoOsnova.multipliedBy(STAR_ADR));
    const poskDelAdr = R(brutoOsnova.multipliedBy(POSK_ADR));
    const doDelAdr   = R(brutoOsnova.multipliedBy(DO_ADR));

    // 23. Bruto 2 — točna vsota
    const bruto2Strosek = R(
      brutoOsnova
        .plus(pizDelAdr)
        .plus(zzDelAdr)
        .plus(zapDelAdr)
        .plus(starDelAdr)
        .plus(poskDelAdr)
        .plus(doDelAdr)
    );

    return {
      bruto1:               bruto1.toNumber(),
      boniteta:             boniteta.toNumber(),
      m01RednoZnesek:       m01RednoZnesek?.toNumber() ?? null,
      m04DopustZnesek:      m04DopustZnesek?.toNumber() ?? null,
      m05BolniskaZnesek:    m05BolniskaZnesek?.toNumber() ?? null,
      pizDel:               pizDel.toNumber(),
      zzDel:                zzDel.toNumber(),
      ozpDel:               ozpDel.toNumber(),
      doDel:                doDel.toNumber(),
      starDel:              starDel.toNumber(),
      zapDel:               zapDel.toNumber(),
      davcnaOsnova:         davcnaOsnova.toNumber(),
      dohodnina:            dohodnina.toNumber(),
      netoPredOzp:          netoPredOzp.toNumber(),
      netoPoOzp:            netoPoOzp.toNumber(),
      prehranaPovracilo:    prehranaPovracilo.toNumber(),
      prevozPovracilo:      prevozPovracilo.toNumber(),
      odtegljaji:           odtegljaji.toNumber(),
      koncnoIzplaciloTrr:   koncnoIzplaciloTrr.toNumber(),
      pizDelAdr:            pizDelAdr.toNumber(),
      doDelAdr:             doDelAdr.toNumber(),
      zzDelAdr:             zzDelAdr.toNumber(),
      zapDelAdr:            zapDelAdr.toNumber(),
      starDelAdr:           starDelAdr.toNumber(),
      poskDelAdr:           poskDelAdr.toNumber(),
      bruto2Strosek:        bruto2Strosek.toNumber(),
    };
  }
}
