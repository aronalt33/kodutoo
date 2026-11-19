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

// Koondnäitajad. Määrad arvutatakse alati kogusummadest; null = nimetaja on 0.
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

export interface SummaryText {
  lyhikokkuvote: string;
  tahelepanekud: string[];
  kusimused: string[];
  piirangud: string[];
}
