import type {
  Aggregate, Comparison, CountChange, CountKey, Funnel, FunnelStage, GroupComparison,
  PreviousPeriod, RateChange, RateKey, SalesRow,
} from './types';
import { CHANNELS, MONTHS } from './constants';

export const COUNT_KEYS: CountKey[] = ['kontaktid', 'pakkumised', 'lepingud', 'laekumine'];
export const RATE_KEYS: RateKey[] = ['pakkumisteOsakaal', 'lepinguteOsakaal'];

/** Jagamine, mis tagastab null, kui nimetaja on 0 – nulliga ei jagata kunagi. */
export function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

/**
 * Koondab read: liidab kontaktid, pakkumised, lepingud ja laekumise (tegelikud väärtused).
 * Määrad arvutatakse ainult kogusummadest (mitte alamrühmade protsentide liitmise või keskmistamise teel).
 */
export function aggregate(rows: SalesRow[], nimi = 'Kokku'): Aggregate {
  const sum = (f: CountKey) => rows.reduce((acc, r) => acc + r[f], 0);
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

/** Rühmitab read võtme järgi. Järjekord: `order`, seejärel esinemise järjekord. */
function groupRows(rows: SalesRow[], key: 'kanal' | 'tootegrupp' | 'toode', order: string[] = []) {
  const groups = new Map<string, SalesRow[]>();
  for (const o of order) groups.set(o, []);
  for (const r of rows) {
    if (!groups.has(r[key])) groups.set(r[key], []);
    groups.get(r[key])!.push(r);
  }
  return groups;
}

export function aggregateBy(rows: SalesRow[], key: 'kanal' | 'tootegrupp' | 'toode', order: string[] = []): Aggregate[] {
  return [...groupRows(rows, key, order).entries()]
    .filter(([, rs]) => rs.length > 0)
    .map(([name, rs]) => aggregate(rs, name));
}

/** Andmetes esinevad kuud kalendri järjekorras. */
export function monthsIn(rows: SalesRow[]): string[] {
  const present = new Set(rows.map((r) => r.kuu));
  return MONTHS.filter((m) => present.has(m));
}

/**
 * Vaikimisi periood: kui andmeid on vähemalt 6 kuu kohta, viimased 3 kuud (siis on olemas ka võrdlusperiood),
 * muidu kõik kuud.
 */
export function defaultSelection(available: string[]): string[] {
  return available.length >= 6 ? available.slice(-3) : available;
}

/**
 * Eelmine võrreldav periood: sama arv kuid vahetult enne valitud perioodi.
 * Andmetes ei ole aasta veergu, seega võrdlus toimub sama faili varasemate kuudega.
 * Kui valik ei ole järjestikune või eelnevad kuud puuduvad, võrdlust ei tehta (midagi ei tuletata).
 */
export function previousPeriod(selected: string[], available: string[]): PreviousPeriod {
  if (selected.length === 0) return { months: null, reason: 'Periood on valimata.' };
  const idx = selected.map((m) => MONTHS.indexOf(m)).sort((a, b) => a - b);
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
  if (!contiguous) {
    return { months: null, reason: 'Valitud kuud ei ole järjestikused, seega võrreldavat eelmist perioodi ei saa määrata.' };
  }
  const n = idx.length;
  const start = idx[0] - n;
  if (start < 0) {
    return { months: null, reason: 'Valitud perioodile eelnevate kuude andmeid ei ole (andmestikus pole eelmise aasta andmeid).' };
  }
  const months = MONTHS.slice(start, idx[0]);
  const missing = months.filter((m) => !available.includes(m));
  if (missing.length > 0) {
    return { months: null, reason: `Võrdlusperioodi kuude (${missing.join(', ')}) andmed puuduvad.` };
  }
  return { months };
}

function countChange(current: number, previous: number | null): CountChange {
  if (previous === null) return { current, previous: null, diff: null, pct: null };
  return { current, previous, diff: current - previous, pct: ratio(current - previous, previous) };
}

function rateChange(current: number | null, previous: number | null): RateChange {
  return { current, previous, pp: current !== null && previous !== null ? current - previous : null };
}

/** Võrdleb kahte perioodi: tegelike väärtuste muutus ja määrade muutus protsendipunktides. */
export function compare(cur: Aggregate, prev: Aggregate | null): Comparison {
  const out = {} as Comparison;
  for (const k of COUNT_KEYS) out[k] = countChange(cur[k], prev ? prev[k] : null);
  for (const k of RATE_KEYS) out[k] = rateChange(cur[k], prev ? prev[k] : null);
  return out;
}

/** Grupiviisiline võrdlus (kanalid, tootegrupid, tooted). Grupp puudub eelmisel perioodil → previous on null. */
export function compareBy(
  curRows: SalesRow[],
  prevRows: SalesRow[] | null,
  key: 'kanal' | 'tootegrupp' | 'toode',
  order: string[] = [],
): GroupComparison[] {
  const prevGroups = prevRows ? groupRows(prevRows, key) : null;
  return aggregateBy(curRows, key, order).map((cur) => {
    const pr = prevGroups?.get(cur.nimi);
    const previous = pr && pr.length > 0 ? aggregate(pr, cur.nimi) : null;
    return { nimi: cur.nimi, current: cur, previous, change: compare(cur, previous) };
  });
}

export const compareChannels = (cur: SalesRow[], prev: SalesRow[] | null) => compareBy(cur, prev, 'kanal', CHANNELS);
export const compareGroups = (cur: SalesRow[], prev: SalesRow[] | null) => compareBy(cur, prev, 'tootegrupp');

/** Tooted ühe tootegrupi sees. */
export function compareProducts(cur: SalesRow[], prev: SalesRow[] | null, group: string): GroupComparison[] {
  return compareBy(
    cur.filter((r) => r.tootegrupp === group),
    prev ? prev.filter((r) => r.tootegrupp === group) : null,
    'toode',
  );
}

/**
 * Müügilehter: kontaktid → pakkumised → lepingud.
 * Konversioon = järgmine etapp / eelmine etapp; väljalangevus = 1 − konversioon.
 * Nõrgim etapp on madalaima konversiooniga etapp (kui määra ei saa arvutada, etappi ei hinnata).
 */
export function funnel(a: Aggregate): Funnel {
  const stage = (from: string, to: string, f: number, t: number): FunnelStage => {
    const conversion = ratio(t, f);
    return { from, to, fromCount: f, toCount: t, conversion, dropoff: conversion === null ? null : 1 - conversion, lost: f - t };
  };
  const stages = [
    stage('Kontaktid', 'Pakkumised', a.kontaktid, a.pakkumised),
    stage('Pakkumised', 'Lepingud', a.pakkumised, a.lepingud),
  ];
  const rated = stages.filter((s) => s.conversion !== null);
  const weakest = rated.length ? rated.reduce((w, s) => (s.conversion! < w.conversion! ? s : w)) : null;
  return { stages, weakest };
}

/** Kas tootegrupp on kindlustus (laekumine = esimese kuu kuumaksete summa). */
export function isInsurance(group: string): boolean {
  return group.toLowerCase().includes('kindlustus');
}

/**
 * Leiab kuud, kus mõni andmestikus esinev tootegrupp puudub täielikult.
 * Kasutatakse andmete piirangute kirjeldamiseks (puuduvaid väärtusi ei tuletata).
 */
export function missingGroupsByMonth(allRows: SalesRow[], months: string[]): string[] {
  const groups = [...new Set(allRows.map((r) => r.tootegrupp))];
  const notes: string[] = [];
  for (const m of months) {
    const inMonth = new Set(allRows.filter((r) => r.kuu === m).map((r) => r.tootegrupp));
    const missing = groups.filter((g) => !inMonth.has(g));
    if (missing.length > 0) notes.push(`${m}: puuduvad tootegrupi ${missing.map((g) => `„${g}”`).join(', ')} read`);
  }
  return notes;
}

/**
 * Tooted, mille read puuduvad mõnes valitud või võrdlusperioodi kuus.
 * Selliste toodete puhul ei ole perioodid täielikult võrreldavad; väärtusi ei tuletata.
 */
export function missingProductsByMonth(allRows: SalesRow[], months: string[]): string[] {
  const products = [...new Set(allRows.map((r) => r.toode))];
  const notes: string[] = [];
  for (const p of products) {
    const missing = months.filter((m) => !allRows.some((r) => r.kuu === m && r.toode === p));
    if (missing.length > 0 && missing.length < months.length) {
      notes.push(`„${p}” (${MONTHS.filter((m) => missing.includes(m)).join(', ')})`);
    }
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
