// Arvude kuvamine Eesti vormingus (tühik tuhandete eraldajana, koma kümnendmärgina).
const intFmt = new Intl.NumberFormat('et-EE', { maximumFractionDigits: 0 });
const eurFmt = new Intl.NumberFormat('et-EE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const pctFmt = new Intl.NumberFormat('et-EE', { style: 'percent', maximumFractionDigits: 1 });

export const fmtInt = (n: number) => intFmt.format(n);
export const fmtEur = (n: number) => eurFmt.format(n);
/** Määr protsendina; kui määra ei saa arvutada (nimetaja 0), kuvatakse „–”. */
export const fmtPct = (n: number | null) => (n === null ? '–' : pctFmt.format(n));
