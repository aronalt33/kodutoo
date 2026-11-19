import type { Aggregate, SummaryText } from './types';
import { CHANNEL_LABELS } from './constants';
import { fmtEur, fmtInt, fmtPct } from './format';
import { isInsurance } from './metrics';

/** Koondinfo, mis saadetakse mudelile. Ainult arvutatud tulemused – mitte algandmete read. */
export interface SummaryPayload {
  periood: string;
  kuudeArv: number;
  naidisandmed: boolean;
  kokku: Aggregate;
  kanalid: Aggregate[];
  tootegrupid: (Aggregate & { laekumiseIseloom: string })[];
  andmed: {
    arvestatudRidu: number;
    valjaJaetudVigaseidRidu: number;
    hoiatused: string[];
    puuduvadAndmed: string[];
  };
}

export function buildPayload(args: {
  periood: string;
  kuudeArv: number;
  naidisandmed: boolean;
  kokku: Aggregate;
  kanalid: Aggregate[];
  tootegrupid: Aggregate[];
  vigaseidRidu: number;
  hoiatused: string[];
  puuduvadAndmed: string[];
}): SummaryPayload {
  return {
    periood: args.periood,
    kuudeArv: args.kuudeArv,
    naidisandmed: args.naidisandmed,
    kokku: args.kokku,
    kanalid: args.kanalid.map((k) => ({ ...k, nimi: CHANNEL_LABELS[k.nimi] ?? k.nimi })),
    tootegrupid: args.tootegrupid.map((g) => ({
      ...g,
      laekumiseIseloom: isInsurance(g.nimi)
        ? 'Samal kuul sõlmitud lepingute esimese kuu kuumaksete summa (ei ole korduv laekumine).'
        : 'Samal kuul sõlmitud lepingutega seotud laekunud summa; iseloom erineb kindlustusest.',
    })),
    andmed: {
      arvestatudRidu: args.kokku.ridu,
      valjaJaetudVigaseidRidu: args.vigaseidRidu,
      hoiatused: args.hoiatused,
      puuduvadAndmed: args.puuduvadAndmed,
    },
  };
}

/** Põhinäitajate read – arvutatud rakenduses, mitte mudeli poolt. */
export function keyFigureLines(k: Aggregate): string[] {
  return [
    `Tegeletud kontaktid: ${fmtInt(k.kontaktid)}`,
    `Pakkumised: ${fmtInt(k.pakkumised)}`,
    `Sõlmitud lepingud: ${fmtInt(k.lepingud)}`,
    `Laekumine: ${fmtEur(k.laekumine)}`,
    `Pakkumiste osakaal kontaktidest: ${fmtPct(k.pakkumisteOsakaal)}`,
    `Lepingute osakaal pakkumistest: ${fmtPct(k.lepinguteOsakaal)}`,
  ];
}

/** Kokkuvõte lihttekstina kopeerimiseks ja allalaadimiseks. */
export function summaryToText(s: SummaryText, kokku: Aggregate, periood: string, naidisandmed: boolean): string {
  const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
  return [
    'MÜÜGIKOOSOLEKU KOKKUVÕTE',
    `Periood: ${periood}`,
    naidisandmed ? 'Andmed: Fiktiivsed näidisandmed' : 'Andmed: kasutaja üles laaditud CSV-fail',
    '',
    '1. Lühikokkuvõte',
    s.lyhikokkuvote,
    '',
    '2. Põhinäitajad',
    list(keyFigureLines(kokku)),
    '',
    '3. Olulisemad tähelepanekud',
    s.tahelepanekud.length ? list(s.tahelepanekud) : '- Andmed ei toeta eraldi tähelepanekuid.',
    '',
    '4. Aruteluküsimused',
    list(s.kusimused),
    '',
    '5. Andmete piirangud',
    list(s.piirangud),
    '',
  ].join('\n');
}
