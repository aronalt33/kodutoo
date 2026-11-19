// Üks valideeritud andmerida. Numbreid ei muudeta – need on täpselt sellised, nagu failis.
export interface SalesRow {
  kuu: string; // kanooniline kuu nimi, nt „Jaanuar”
  kanal: string; // otse | partner | maakler | online
  tootegrupp: string;
  toode: string;
  kontaktid: number;
  pakkumised: number;
  lepingud: number;
  laekumine: number;
}

export interface RowError {
  line: number; // rea number failis (päis = 1)
  message: string;
}

export interface ParseResult {
  rows: SalesRow[];
  errors: RowError[]; // vigased read, mis jäeti arvestusest välja
  warnings: string[]; // hoiatused, mis rida välja ei jäta
  fatal?: string; // viga, mille tõttu faili ei saa üldse kasutada (nt puuduv veerg)
  dataLineCount: number; // andmeridade arv failis (ilma päiseta)
}

// Koondnäitajad. Tegelikud väärtused on summad; määrad arvutatakse alati kogusummadest (null = nimetaja 0).
export interface Aggregate {
  nimi: string;
  ridu: number;
  kontaktid: number;
  pakkumised: number;
  lepingud: number;
  laekumine: number;
  pakkumisteOsakaal: number | null; // pakkumised / kontaktid
  lepinguteOsakaal: number | null; // lepingud / pakkumised
}

export type CountKey = 'kontaktid' | 'pakkumised' | 'lepingud' | 'laekumine';
export type RateKey = 'pakkumisteOsakaal' | 'lepinguteOsakaal';

/** Tegeliku väärtuse muutus võrreldes eelmise perioodiga. */
export interface CountChange {
  current: number;
  previous: number | null; // null = võrdlusperiood puudub
  diff: number | null;
  pct: number | null; // suhteline muutus; null, kui eelmine väärtus on 0 või puudub
}

/** Arvutatud määra muutus protsendipunktides. */
export interface RateChange {
  current: number | null;
  previous: number | null;
  pp: number | null; // protsendipunkti muutus murdarvuna (0,012 = +1,2 pp)
}

export type Comparison = Record<CountKey, CountChange> & Record<RateKey, RateChange>;

/** Grupi (kanal, tootegrupp, toode) näitajad koos eelmise perioodiga. */
export interface GroupComparison {
  nimi: string;
  current: Aggregate;
  previous: Aggregate | null;
  change: Comparison;
}

export interface FunnelStage {
  from: string;
  to: string;
  fromCount: number;
  toCount: number;
  conversion: number | null; // arvutatud: to / from
  dropoff: number | null; // arvutatud: 1 − konversioon
  lost: number; // tegelik: from − to
}

export interface Funnel {
  stages: FunnelStage[];
  weakest: FunnelStage | null; // madalaima konversiooniga etapp
}

export interface PreviousPeriod {
  months: string[] | null;
  reason?: string; // miks võrdlusperioodi ei saa kasutada
}

export interface Report {
  periood: string;
  vordlusperiood: string | null;
  kokkuvote: string[];
  leiud: string[];
  positiivne: string[];
  probleemid: string[];
  vordlus: string[];
  soovitused: string[];
  piirangud: string[];
}
