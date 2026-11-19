// Arvude kuvamine Eesti vormingus (tühik tuhandete eraldajana, koma kümnendmärgina).
const intFmt = new Intl.NumberFormat('et-EE', { maximumFractionDigits: 0 });
const signedIntFmt = new Intl.NumberFormat('et-EE', { maximumFractionDigits: 0, signDisplay: 'exceptZero' });
const eurFmt = new Intl.NumberFormat('et-EE', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2,
});
const signedEurFmt = new Intl.NumberFormat('et-EE', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2, signDisplay: 'exceptZero',
});
const pctFmt = new Intl.NumberFormat('et-EE', { style: 'percent', maximumFractionDigits: 1 });
const signedPctFmt = new Intl.NumberFormat('et-EE', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' });
const ppFmt = new Intl.NumberFormat('et-EE', { maximumFractionDigits: 1, signDisplay: 'exceptZero' });

export const fmtInt = (n: number) => intFmt.format(n);
export const fmtEur = (n: number) => eurFmt.format(n);
/** Määr protsendina; kui määra ei saa arvutada (nimetaja 0), kuvatakse „–”. */
export const fmtPct = (n: number | null) => (n === null ? '–' : pctFmt.format(n));
export const fmtSignedInt = (n: number | null) => (n === null ? '–' : signedIntFmt.format(n));
export const fmtSignedEur = (n: number | null) => (n === null ? '–' : signedEurFmt.format(n));
export const fmtSignedPct = (n: number | null) => (n === null ? '–' : signedPctFmt.format(n));
/** Protsendipunktid; sisend murdarvuna (0,012 → „+1,2 pp”). */
export const fmtPp = (n: number | null) => (n === null ? '–' : `${ppFmt.format(n * 100)} pp`);
