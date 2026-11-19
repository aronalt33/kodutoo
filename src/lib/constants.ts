export const MONTHS = [
  'Jaanuar', 'Veebruar', 'Märts', 'Aprill', 'Mai', 'Juuni',
  'Juuli', 'August', 'September', 'Oktoober', 'November', 'Detsember',
];

export const CHANNELS = ['otse', 'partner', 'maakler', 'online'];

export const CHANNEL_LABELS: Record<string, string> = {
  otse: 'Otse',
  partner: 'Partner',
  maakler: 'Maakler',
  online: 'Online',
};

export const channelLabel = (c: string) => CHANNEL_LABELS[c] ?? c;

export const METRIC_LABELS = {
  kontaktid: 'Tegeletud kontaktid',
  pakkumised: 'Pakkumised',
  lepingud: 'Sõlmitud lepingud',
  laekumine: 'Laekumine',
  pakkumisteOsakaal: 'Pakkumiste osakaal kontaktidest',
  lepinguteOsakaal: 'Lepingute osakaal pakkumistest',
} as const;

// Analüüsireeglite lävendid (raporti tekstid lähtuvad ainult nendest reeglitest).
export const THRESHOLDS = {
  countChangePct: 0.05, // tegeliku väärtuse muutus ≥ 5% loetakse märkimisväärseks
  rateChangePp: 0.02, // määra muutus ≥ 2 protsendipunkti
  groupDiffPp: 0.05, // kanal/tootegrupp erineb koondmäärast ≥ 5 pp
  highDropoff: 0.5, // etapi väljalangevus üle 50%
  minRows: 10, // vähem ridu → andmehulk on väike
};
