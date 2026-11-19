import type { CountChange, RateChange } from '../lib/types';
import { fmtPp, fmtSignedEur, fmtSignedInt, fmtSignedPct } from '../lib/format';

const tone = (v: number | null) => (v === null || v === 0 ? 'flat' : v > 0 ? 'up' : 'down');

/** Tegeliku väärtuse muutus (arv ja %). */
export function CountDelta({ c, eur = false }: { c: CountChange; eur?: boolean }) {
  if (c.previous === null) return <span className="delta delta-none">–</span>;
  return (
    <span className={`delta delta-${tone(c.diff)}`}>
      {eur ? fmtSignedEur(c.diff) : fmtSignedInt(c.diff)}
      {c.pct !== null && <> ({fmtSignedPct(c.pct)})</>}
    </span>
  );
}

/** Arvutatud määra muutus protsendipunktides. */
export function RateDelta({ c }: { c: RateChange }) {
  if (c.pp === null) return <span className="delta delta-none">–</span>;
  return <span className={`delta delta-${tone(c.pp)}`}>{fmtPp(c.pp)}</span>;
}
