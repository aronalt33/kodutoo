import Papa from 'papaparse';
import type { ParseResult, RowError, SalesRow } from './types';
import { MONTHS, CHANNELS } from './constants';

/** Normaliseerib teksti võrdlemiseks: väiketähed, täpitähed ilma täppideta, ainult tähed/numbrid. */
export function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Mitu jätkubaiti (10xxxxxx) järgneb UTF-8 algusbaidile; 0 = ei ole kehtiv algusbait. */
function utf8SeqLength(lead: number): number {
  if (lead >= 0xc2 && lead <= 0xdf) return 1;
  if (lead >= 0xe0 && lead <= 0xef) return 2;
  if (lead >= 0xf0 && lead <= 0xf4) return 3;
  return 0;
}

/**
 * Faili dekodeerimine. Proovime kõigepealt UTF-8. Kui fail pole korrektne UTF-8
 * (nt Excelist salvestatud Windows-1252 või segakodeering samas reas), loeme baithaaval:
 * kehtiv UTF-8 jada dekodeeritakse UTF-8-na, iga muu bait Windows-1252 märgina.
 */
export function decodeFile(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '');
  } catch {
    const utf8 = new TextDecoder('utf-8');
    const legacy = new TextDecoder('windows-1252');
    let out = '';
    let asciiStart = 0;
    let i = 0;
    while (i < bytes.length) {
      const b = bytes[i];
      if (b < 0x80) { i++; continue; }
      out += legacy.decode(bytes.subarray(asciiStart, i)); // ASCII osa
      const n = utf8SeqLength(b);
      let valid = n > 0;
      for (let k = 1; valid && k <= n; k++) valid = i + k < bytes.length && (bytes[i + k] & 0xc0) === 0x80;
      if (valid) {
        out += utf8.decode(bytes.subarray(i, i + n + 1));
        i += n + 1;
      } else {
        out += legacy.decode(bytes.subarray(i, i + 1));
        i += 1;
      }
      asciiStart = i;
    }
    out += legacy.decode(bytes.subarray(asciiStart));
    return out.replace(/^﻿/, '');
  }
}

type Field = keyof SalesRow;

// Nõutud veerud: kuvatav nimi ja lubatud päisevariandid (normaliseeritult).
const COLUMNS: { field: Field; label: string; aliases: string[] }[] = [
  { field: 'kuu', label: 'Kuu', aliases: ['kuu'] },
  { field: 'kanal', label: 'Müügikanal', aliases: ['muugikanal', 'kanal'] },
  { field: 'tootegrupp', label: 'Tootegrupp', aliases: ['tootegrupp'] },
  { field: 'toode', label: 'Toode', aliases: ['toode'] },
  { field: 'kontaktid', label: 'Tegeletud kontaktide arv', aliases: ['tegeletud kontaktide arv', 'kontaktide arv', 'kontaktid'] },
  { field: 'pakkumised', label: 'Pakkumiste arv', aliases: ['pakkumiste arv', 'pakkumised'] },
  { field: 'lepingud', label: 'Sõlmitud lep arv', aliases: ['solmitud lep arv', 'solmitud lepingute arv', 'lepingute arv', 'lepingud'] },
  { field: 'laekumine', label: 'Laekumine (EUR)', aliases: ['laekumine eur', 'laekumine'] },
];

const INTEGER_FIELDS: Field[] = ['kontaktid', 'pakkumised', 'lepingud'];

/**
 * Loeb arvu tekstist. Lubatud on tühikud tuhandete eraldajana ja koma kümnendmärgina.
 * Tagastab null, kui väärtust ei saa üheselt arvuks lugeda.
 */
function parseNumber(raw: string): number | null {
  let s = raw.replace(/[\s €]/g, '');
  if (s === '') return null;
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** Parsib ja valideerib CSV teksti. Vigased read jäetakse välja ja nendest antakse teada. */
export function parseSalesCsv(text: string): ParseResult {
  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: 'greedy',
    delimitersToGuess: [';', ',', '\t'],
  });
  const data = parsed.data;
  const empty: ParseResult = { rows: [], errors: [], warnings: [], dataLineCount: 0 };

  if (data.length === 0) return { ...empty, fatal: 'Fail on tühi.' };

  // Päise veergude leidmine nime järgi (järjekord ei ole oluline).
  const header = data[0].map((h) => norm(h));
  const index = {} as Record<Field, number>;
  const missing: string[] = [];
  for (const col of COLUMNS) {
    const i = header.findIndex((h) => col.aliases.includes(h));
    if (i === -1) missing.push(`„${col.label}”`);
    else index[col.field] = i;
  }
  if (missing.length > 0) {
    return {
      ...empty,
      dataLineCount: data.length - 1,
      fatal:
        (missing.length === 1
          ? `Failist puudub veerg ${missing[0]}. Lisa see veerg faili päisesse ja laadi fail uuesti.`
          : `Failist puuduvad veerud ${missing.join(', ')}. Lisa need veerud faili päisesse ja laadi fail uuesti.`),
    };
  }

  const rows: SalesRow[] = [];
  const errors: RowError[] = [];

  data.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (f: Field) => (cells[index[f]] ?? '').trim();
    const problems: string[] = [];

    // Kuu: peab olema eestikeelne kuu nimi.
    const month = MONTHS.find((m) => norm(m) === norm(get('kuu')));
    if (!month) problems.push(`veerg „Kuu” – „${get('kuu') || 'tühi'}” ei ole kuu nimi`);

    // Müügikanal: üks neljast lubatud väärtusest.
    const channel = CHANNELS.find((c) => c === norm(get('kanal')));
    if (!channel) problems.push(`veerg „Müügikanal” – „${get('kanal') || 'tühi'}” ei ole lubatud kanal`);

    for (const f of ['tootegrupp', 'toode'] as Field[]) {
      if (!get(f)) problems.push(`veerg „${COLUMNS.find((c) => c.field === f)!.label}” on tühi`);
    }

    // Arvväärtused: loetavad, mitte negatiivsed; arvud peavad olema täisarvud.
    const nums = {} as Record<Field, number>;
    for (const f of ['kontaktid', 'pakkumised', 'lepingud', 'laekumine'] as Field[]) {
      const label = COLUMNS.find((c) => c.field === f)!.label;
      const raw = get(f);
      const n = parseNumber(raw);
      if (n === null) problems.push(`veerg „${label}” – „${raw || 'tühi'}” ei ole loetav arv`);
      else if (n < 0) problems.push(`veerg „${label}” on negatiivne`);
      else if (INTEGER_FIELDS.includes(f) && !Number.isInteger(n)) problems.push(`veerg „${label}” peab olema täisarv`);
      else nums[f] = n;
    }

    if (problems.length > 0) {
      errors.push({ line, message: problems.join('; ') });
      return;
    }

    rows.push({
      kuu: month!,
      kanal: channel!,
      tootegrupp: get('tootegrupp'),
      toode: get('toode'),
      kontaktid: nums.kontaktid,
      pakkumised: nums.pakkumised,
      lepingud: nums.lepingud,
      laekumine: nums.laekumine,
    });
  });

  // Hoiatused – rida jääb arvestusse, kuid andmetes võib olla ebakõla.
  const warnings: string[] = [];
  const illogical = rows.filter((r) => r.pakkumised > r.kontaktid || r.lepingud > r.pakkumised).length;
  if (illogical > 0) {
    warnings.push(
      `${illogical} real on pakkumisi rohkem kui kontakte või lepinguid rohkem kui pakkumisi. Numbreid ei muudetud – kontrolli algandmeid.`,
    );
  }

  return { rows, errors, warnings, dataLineCount: data.length - 1 };
}
