/**
 * Reeglipõhine juhtimisraport. Tekst koostatakse eelmääratud mallide ja lävendite (THRESHOLDS) põhjal
 * ainult arvutatud näitajatest. Puuduvaid väärtusi ei hinnata ega tuletata; kui võrdlusperiood puudub,
 * ei väideta kasvu ega langust.
 */
import type { Aggregate, Comparison, CountChange, Funnel, GroupComparison, PreviousPeriod, RateChange, Report } from './types';
import { channelLabel, METRIC_LABELS, THRESHOLDS } from './constants';
import { fmtEur, fmtInt, fmtPct, fmtPp, fmtSignedEur, fmtSignedInt, fmtSignedPct } from './format';
import { isInsurance } from './metrics';

export interface ReportInput {
  periood: string;
  vordlusperiood: string | null;
  previous: PreviousPeriod;
  total: Aggregate;
  change: Comparison;
  channels: GroupComparison[];
  groups: GroupComparison[];
  funnel: Funnel;
  errorCount: number;
  warnings: string[];
  missingNotes: string[];
  missingProducts: string[];
  isSample: boolean;
}

type CountMetric = 'kontaktid' | 'pakkumised' | 'lepingud' | 'laekumine';
type RateMetric = 'pakkumisteOsakaal' | 'lepinguteOsakaal';

const fmtValue = (k: CountMetric, v: number) => (k === 'laekumine' ? fmtEur(v) : fmtInt(v));
const fmtDiff = (k: CountMetric, v: number | null) => (k === 'laekumine' ? fmtSignedEur(v) : fmtSignedInt(v));

/** Tegeliku väärtuse muutuse kirjeldus, nt „1 234 (eelmisel perioodil 1 100; muutus +134, +12,2%)”. */
function countLine(k: CountMetric, c: CountChange): string {
  const base = `${METRIC_LABELS[k]}: ${fmtValue(k, c.current)}`;
  if (c.previous === null) return base;
  const pct = c.pct === null ? '' : `, ${fmtSignedPct(c.pct)}`;
  return `${base} (eelmisel perioodil ${fmtValue(k, c.previous)}; muutus ${fmtDiff(k, c.diff)}${pct})`;
}

/** Arvutatud määra kirjeldus koos muutusega protsendipunktides. */
function rateLine(k: RateMetric, c: RateChange): string {
  const base = `${METRIC_LABELS[k]} (arvutatud määr): ${fmtPct(c.current)}`;
  if (c.previous === null && c.pp === null) return base;
  return `${base} (eelmisel perioodil ${fmtPct(c.previous)}; muutus ${fmtPp(c.pp)})`;
}

const significantCount = (c: CountChange) => c.pct !== null && Math.abs(c.pct) >= THRESHOLDS.countChangePct;
const significantRate = (c: RateChange) => c.pp !== null && Math.abs(c.pp) >= THRESHOLDS.rateChangePp;

export function buildReport(input: ReportInput): Report {
  const { total, change, channels, groups, funnel: fun, previous } = input;
  const hasPrev = previous.months !== null;
  const cname = (g: GroupComparison) => `„${channelLabel(g.nimi)}”`;
  const gname = (g: GroupComparison) => `„${g.nimi}”`;

  // Kanalid/tootegrupid, mille lepingute osakaalu saab arvutada – järjestatud kõrgeimast madalaimani.
  const ratedChannels = channels
    .filter((c) => c.current.lepinguteOsakaal !== null)
    .sort((a, b) => b.current.lepinguteOsakaal! - a.current.lepinguteOsakaal!);
  const ratedGroups = groups
    .filter((g) => g.current.lepinguteOsakaal !== null)
    .sort((a, b) => b.current.lepinguteOsakaal! - a.current.lepinguteOsakaal!);
  const bestChannel = ratedChannels[0];
  const worstChannel = ratedChannels.length > 1 ? ratedChannels[ratedChannels.length - 1] : undefined;
  const topByContracts = [...channels].sort((a, b) => b.current.lepingud - a.current.lepingud)[0];
  const totalRate = total.lepinguteOsakaal;
  const belowAvg = (g: GroupComparison) =>
    totalRate !== null && g.current.lepinguteOsakaal !== null && totalRate - g.current.lepinguteOsakaal >= THRESHOLDS.groupDiffPp;
  const aboveAvg = (g: GroupComparison) =>
    totalRate !== null && g.current.lepinguteOsakaal !== null && g.current.lepinguteOsakaal - totalRate >= THRESHOLDS.groupDiffPp;

  // 1. Juhtkonna kokkuvõte
  const kokkuvote: string[] = [];
  kokkuvote.push(
    `Perioodil ${input.periood} tegeleti ${fmtInt(total.kontaktid)} kontaktiga, tehti ${fmtInt(total.pakkumised)} pakkumist ` +
      `ja sõlmiti ${fmtInt(total.lepingud)} lepingut; laekumine kokku oli ${fmtEur(total.laekumine)}.`,
  );
  kokkuvote.push(
    `Arvutatud määrade järgi oli pakkumiste osakaal kontaktidest ${fmtPct(total.pakkumisteOsakaal)} ` +
      `ja lepingute osakaal pakkumistest ${fmtPct(total.lepinguteOsakaal)}.`,
  );
  if (hasPrev) {
    const l = change.lepingud;
    const e = change.laekumine;
    kokkuvote.push(
      `Võrreldes perioodiga ${input.vordlusperiood} muutus lepingute arv ${fmtSignedInt(l.diff)} (${fmtSignedPct(l.pct)}) ` +
        `ja laekumine ${fmtSignedEur(e.diff)} (${fmtSignedPct(e.pct)}).`,
    );
  } else {
    kokkuvote.push('Võrreldavat eelmist perioodi ei ole, seetõttu tulemuste muutust ei hinnata.');
  }
  if (fun.weakest) {
    kokkuvote.push(
      `Müügilehtri nõrgim etapp oli „${fun.weakest.from} → ${fun.weakest.to}” (konversioon ${fmtPct(fun.weakest.conversion)}).`,
    );
  }

  // 2. Peamised tähelepanekud
  const leiud: string[] = [];
  if (topByContracts && total.lepingud > 0) {
    leiud.push(
      `Kõige rohkem lepinguid sõlmiti kanalis ${cname(topByContracts)}: ${fmtInt(topByContracts.current.lepingud)} ` +
        `(${fmtPct(topByContracts.current.lepingud / total.lepingud)} kõigist lepingutest).`,
    );
  }
  if (bestChannel && worstChannel) {
    leiud.push(
      `Lepingute osakaal pakkumistest oli kõrgeim kanalis ${cname(bestChannel)} (${fmtPct(bestChannel.current.lepinguteOsakaal)}) ` +
        `ja madalaim kanalis ${cname(worstChannel)} (${fmtPct(worstChannel.current.lepinguteOsakaal)}).`,
    );
  }
  if (ratedGroups.length > 1) {
    const b = ratedGroups[0];
    const w = ratedGroups[ratedGroups.length - 1];
    leiud.push(
      `Tootegruppidest oli lepingute osakaal pakkumistest kõrgeim grupis ${gname(b)} (${fmtPct(b.current.lepinguteOsakaal)}) ` +
        `ja madalaim grupis ${gname(w)} (${fmtPct(w.current.lepinguteOsakaal)}).`,
    );
  }
  const unit: Record<string, string> = { Kontaktid: 'kontakti', Pakkumised: 'pakkumist' };
  for (const s of fun.stages) {
    if (s.conversion === null) continue;
    leiud.push(
      `Etapis „${s.from} → ${s.to}” ei liikunud edasi ${fmtInt(s.lost)} ${unit[s.from] ?? ''} (väljalangevus ${fmtPct(s.dropoff)}).`,
    );
  }

  // 3. Positiivsed arengud ja 4. võimalikud probleemid
  const positiivne: string[] = [];
  const probleemid: string[] = [];
  if (hasPrev) {
    for (const k of ['kontaktid', 'pakkumised', 'lepingud', 'laekumine'] as CountMetric[]) {
      const c = change[k];
      if (!significantCount(c)) continue;
      const text = `${METRIC_LABELS[k]}: ${fmtDiff(k, c.diff)} (${fmtSignedPct(c.pct)}) võrreldes eelmise perioodiga.`;
      (c.diff! > 0 ? positiivne : probleemid).push(text);
    }
    for (const k of ['pakkumisteOsakaal', 'lepinguteOsakaal'] as RateMetric[]) {
      const c = change[k];
      if (!significantRate(c)) continue;
      const text = `${METRIC_LABELS[k]} muutus ${fmtPp(c.pp)} (${fmtPct(c.previous)} → ${fmtPct(c.current)}).`;
      (c.pp! > 0 ? positiivne : probleemid).push(text);
    }
    for (const ch of channels) {
      const c = ch.change.lepingud;
      if (!significantCount(c)) continue;
      const text = `Kanali ${cname(ch)} lepingute arv muutus ${fmtSignedInt(c.diff)} (${fmtSignedPct(c.pct)}).`;
      (c.diff! > 0 ? positiivne : probleemid).push(text);
    }
  }
  for (const ch of channels.filter(aboveAvg)) {
    positiivne.push(
      `Kanali ${cname(ch)} lepingute osakaal pakkumistest (${fmtPct(ch.current.lepinguteOsakaal)}) on vähemalt ` +
        `${fmtPp(THRESHOLDS.groupDiffPp).replace('+', '')} üle koondtaseme (${fmtPct(totalRate)}).`,
    );
  }
  for (const ch of channels.filter(belowAvg)) {
    probleemid.push(
      `Kanali ${cname(ch)} lepingute osakaal pakkumistest (${fmtPct(ch.current.lepinguteOsakaal)}) jääb vähemalt ` +
        `${fmtPp(THRESHOLDS.groupDiffPp).replace('+', '')} alla koondtaseme (${fmtPct(totalRate)}).`,
    );
  }
  for (const g of groups.filter(belowAvg)) {
    probleemid.push(
      `Tootegrupi ${gname(g)} lepingute osakaal pakkumistest (${fmtPct(g.current.lepinguteOsakaal)}) jääb alla koondtaseme (${fmtPct(totalRate)}).`,
    );
  }
  for (const s of fun.stages) {
    if (s.dropoff !== null && s.dropoff > THRESHOLDS.highDropoff) {
      probleemid.push(`Etapi „${s.from} → ${s.to}” väljalangevus on üle 50% (${fmtPct(s.dropoff)}).`);
    }
  }
  if (positiivne.length === 0) positiivne.push('Kehtestatud reeglite järgi märkimisväärseid positiivseid arenguid ei tuvastatud.');
  if (probleemid.length === 0) probleemid.push('Kehtestatud reeglite järgi märkimisväärseid probleeme ei tuvastatud.');

  // 5. Võrdlus eelmise perioodiga
  const vordlus: string[] = [];
  if (hasPrev) {
    vordlus.push(`Võrdlusperiood: ${input.vordlusperiood} (sama arv kuid vahetult enne valitud perioodi).`);
    for (const k of ['kontaktid', 'pakkumised', 'lepingud', 'laekumine'] as CountMetric[]) vordlus.push(countLine(k, change[k]));
    for (const k of ['pakkumisteOsakaal', 'lepinguteOsakaal'] as RateMetric[]) vordlus.push(rateLine(k, change[k]));
    const newChannels = channels.filter((c) => c.previous === null);
    if (newChannels.length) {
      vordlus.push(`Eelmisel perioodil puudusid andmed kanali(te) ${newChannels.map(cname).join(', ')} kohta; neid ei võrrelda.`);
    }
  } else {
    vordlus.push(`Võrdlust ei tehtud. ${previous.reason ?? ''}`.trim());
  }

  // 6. Soovitused (3–5), valitakse käivitunud reeglite põhjal prioriteedi järjekorras
  const soovitused: string[] = [];
  if (fun.weakest) {
    soovitused.push(
      fun.weakest.from === 'Kontaktid'
        ? `Analüüsige, miks ${fmtPct(fun.weakest.dropoff)} kontaktidest ei jõua pakkumiseni; vaadake üle kontaktide kvalifitseerimine ja pakkumise tegemise protsess.`
        : `Vaadake üle pakkumiste järeltegevus: ${fmtPct(fun.weakest.dropoff)} pakkumistest ei lõppenud lepinguga. Kaardistage, millises etapis kliendid otsustavad loobuda.`,
    );
  }
  if (hasPrev) {
    const drop = (['lepingud', 'laekumine', 'pakkumised', 'kontaktid'] as CountMetric[]).find(
      (k) => significantCount(change[k]) && change[k].diff! < 0,
    );
    if (drop) {
      soovitused.push(
        `${METRIC_LABELS[drop]} vähenes ${fmtSignedPct(change[drop].pct)} võrreldes eelmise perioodiga; selgitage välja, millistes kanalites ja tootegruppides vähenemine tekkis.`,
      );
    }
  }
  if (worstChannel && belowAvg(worstChannel) && bestChannel) {
    soovitused.push(
      `Uurige kanali ${cname(worstChannel)} müügiprotsessi (lepingute osakaal ${fmtPct(worstChannel.current.lepinguteOsakaal)}) ` +
        `ja võrrelge seda kanaliga ${cname(bestChannel)} (${fmtPct(bestChannel.current.lepinguteOsakaal)}).`,
    );
  }
  if (bestChannel && aboveAvg(bestChannel)) {
    soovitused.push(
      `Kirjeldage kanali ${cname(bestChannel)} toimivaid praktikaid ja hinnake, kas neid saab rakendada ka teistes kanalites.`,
    );
  }
  const worstGroup = ratedGroups.length > 1 ? ratedGroups[ratedGroups.length - 1] : undefined;
  if (worstGroup && belowAvg(worstGroup)) {
    soovitused.push(
      `Vaadake üle tootegrupi ${gname(worstGroup)} pakkumised, kuna nende lepinguteks muutumise määr (${fmtPct(worstGroup.current.lepinguteOsakaal)}) on tootegruppidest madalaim.`,
    );
  }
  if (input.errorCount > 0) {
    soovitused.push(`Parandage ${fmtInt(input.errorCount)} vigast andmerida, et järgmine raport põhineks täielikel andmetel.`);
  }
  // Lisasoovitused, kui reegleid käivitus vähem kui kolm
  const fallback = [
    !hasPrev ? 'Lisage andmestikku ka eelneva perioodi andmed, et tulemusi saaks perioodide vahel võrrelda.' : null,
    fun.weakest
      ? `Seadke järgmiseks perioodiks mõõdetav eesmärk etapi „${fun.weakest.from} → ${fun.weakest.to}” konversioonile ja jälgige seda selles rakenduses.`
      : null,
    'Arutage koosolekul kanalite ja tootegruppide tulemusi koos müügimeeskonnaga ning leppige kokku järgmise perioodi fookus.',
  ].filter((s): s is string => s !== null);
  for (const f of fallback) if (soovitused.length < 3) soovitused.push(f);

  // Andmete piirangud
  const piirangud: string[] = [];
  if (input.isSample) piirangud.push('Raport põhineb fiktiivsetel näidisandmetel, mitte Compensa tegelikel müügitulemustel.');
  if (input.errorCount > 0) piirangud.push(`${fmtInt(input.errorCount)} vigast andmerida jäeti arvestusest välja.`);
  piirangud.push(...input.warnings);
  if (!hasPrev && previous.reason) piirangud.push(previous.reason);
  if (input.missingNotes.length) piirangud.push(`Puuduvad andmed: ${input.missingNotes.join('; ')}.`);
  if (input.missingProducts.length) {
    piirangud.push(
      `Osa toodete read puuduvad mõnes analüüsitud kuus: ${input.missingProducts.join('; ')}. Puuduvaid väärtusi ei ole hinnatud, mistõttu nende toodete tulemused ei ole kuude ja perioodide vahel täielikult võrreldavad.`,
    );
  }
  if (total.ridu < THRESHOLDS.minRows) {
    piirangud.push(`Valitud perioodil on ainult ${fmtInt(total.ridu)} andmerida – järeldused on väikese andmehulga tõttu ebakindlad.`);
  }
  if (groups.some((g) => isInsurance(g.nimi)) && groups.some((g) => !isInsurance(g.nimi))) {
    piirangud.push(
      'Laekumise iseloom tootegruppides erineb: kindlustuse puhul on see samal kuul sõlmitud lepingute esimese kuu kuumaksete summa. Tootegruppide laekumised ei ole otseselt võrreldavad.',
    );
  }

  return {
    periood: input.periood,
    vordlusperiood: hasPrev ? input.vordlusperiood : null,
    kokkuvote,
    leiud,
    positiivne,
    probleemid,
    vordlus,
    soovitused: soovitused.slice(0, 5),
    piirangud,
  };
}

export const REPORT_SECTIONS: { key: keyof Report; title: string; ordered?: boolean }[] = [
  { key: 'kokkuvote', title: 'Juhtkonna kokkuvõte' },
  { key: 'leiud', title: 'Peamised tähelepanekud' },
  { key: 'positiivne', title: 'Positiivsed arengud' },
  { key: 'probleemid', title: 'Võimalikud probleemid' },
  { key: 'vordlus', title: 'Võrdlus eelmise perioodiga' },
  { key: 'soovitused', title: 'Soovitused', ordered: true },
  { key: 'piirangud', title: 'Andmete piirangud' },
];

/** Raport lihttekstina kopeerimiseks ja allalaadimiseks. */
export function reportToText(r: Report): string {
  const lines = [
    'MÜÜGITULEMUSTE JUHTIMISRAPORT',
    `Periood: ${r.periood}`,
    `Võrdlusperiood: ${r.vordlusperiood ?? 'puudub'}`,
    '',
  ];
  REPORT_SECTIONS.forEach((s, i) => {
    lines.push(`${i + 1}. ${s.title}`);
    const items = r[s.key] as string[];
    if (s.key === 'kokkuvote') lines.push(items.join(' '));
    else items.forEach((t, j) => lines.push(s.ordered ? `${j + 1}) ${t}` : `- ${t}`));
    lines.push('');
  });
  lines.push('Raport on koostatud reeglipõhiselt rakenduse arvutatud näitajatest.');
  return lines.join('\n');
}
