import type { Aggregate, SalesRow } from './types';
import { CHANNELS, MONTHS } from './constants';

/** Jagamine, mis tagastab null, kui nimetaja on 0 – nulliga ei jagata kunagi. */
export function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

/**
 * Koondab read: liidab kontaktid, pakkumised, lepingud ja laekumise.
 * Määrad arvutatakse ainult kogusummadest (mitte alamrühmade protsentide liitmise või keskmistamise teel).
 */
export function aggregate(rows: SalesRow[], nimi = 'Kokku'): Aggregate {
  const sum = (f: 'kontaktid' | 'pakkumised' | 'lepingud' | 'laekumine') =>
    rows.reduce((acc, r) => acc + r[f], 0);
  const kontaktid = sum('kontaktid');
  const pakkumised = sum('pakkumised');
  const lepingud = sum('lepingud');
  return {
    nimi,
    ridu: rows.length,
    kontaktid,
    pakkumised,
    lepingud,
    laekumine: sum('laekumine'),
    pakkumisteOsakaal: ratio(pakkumised, kontaktid),
    lepinguteOsakaal: ratio(lepingud, pakkumised),
  };
}

/** Koondab read võtme (kanal / tootegrupp) järgi. Järjekord: `order`, seejärel ilmumise järjekord. */
export function aggregateBy(rows: SalesRow[], key: 'kanal' | 'tootegrupp', order: string[] = []): Aggregate[] {
  const groups = new Map<string, SalesRow[]>();
  for (const o of order) groups.set(o, []);
  for (const r of rows) {
    if (!groups.has(r[key])) groups.set(r[key], []);
    groups.get(r[key])!.push(r);
  }
  return [...groups.entries()].filter(([, rs]) => rs.length > 0).map(([name, rs]) => aggregate(rs, name));
}

export const byChannel = (rows: SalesRow[]) => aggregateBy(rows, 'kanal', CHANNELS);
export const byGroup = (rows: SalesRow[]) => aggregateBy(rows, 'tootegrupp');

/** Andmetes esinevad kuud kalendri järjekorras. */
export function monthsIn(rows: SalesRow[]): string[] {
  const present = new Set(rows.map((r) => r.kuu));
  return MONTHS.filter((m) => present.has(m));
}

/** Kas tootegrupp on kindlustus (laekumine = esimese kuu kuumaksete summa). */
export function isInsurance(group: string): boolean {
  return group.toLowerCase().includes('kindlustus');
}

/**
 * Leiab valitud kuud, kus mõni andmestikus esinev tootegrupp puudub täielikult.
 * Seda kasutatakse andmete piirangute kirjeldamiseks (puuduvaid väärtusi ei tuletata).
 */
export function missingGroupsByMonth(allRows: SalesRow[], months: string[]): string[] {
  const groups = [...new Set(allRows.map((r) => r.tootegrupp))];
  const notes: string[] = [];
  for (const m of months) {
    const inMonth = new Set(allRows.filter((r) => r.kuu === m).map((r) => r.tootegrupp));
    const missing = groups.filter((g) => !inMonth.has(g));
    if (missing.length > 0) notes.push(`${m}: puuduvad read tootegrupi(de)l ${missing.join(', ')}`);
  }
  return notes;
}

/** Perioodi nimetus, nt „Jaanuar–September” või „Jaanuar, Märts”. */
export function periodLabel(months: string[]): string {
  if (months.length === 0) return 'periood valimata';
  const idx = months.map((m) => MONTHS.indexOf(m)).sort((a, b) => a - b);
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (months.length === 1) return MONTHS[idx[0]];
  if (contiguous) return `${MONTHS[idx[0]]}–${MONTHS[idx[idx.length - 1]]}`;
  return idx.map((i) => MONTHS[i]).join(', ');
}
