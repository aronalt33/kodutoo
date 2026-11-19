import type { PreviousPeriod } from '../lib/types';
import { periodLabel } from '../lib/metrics';

interface Props {
  available: string[];
  selected: string[];
  previous: PreviousPeriod;
  onChange: (months: string[]) => void;
}

/** Perioodi valik: üks või mitu kuud. Näitab ka võrdlusperioodi või põhjust, miks see puudub. */
export default function PeriodPicker({ available, selected, previous, onChange }: Props) {
  const all = available.length > 0 && available.every((m) => selected.includes(m));
  const toggle = (m: string) =>
    onChange(selected.includes(m) ? selected.filter((s) => s !== m) : available.filter((a) => a === m || selected.includes(a)));

  return (
    <fieldset className="period">
      <legend>Periood</legend>
      <div className="chips">
        <button type="button" className={`chip ${all ? 'chip-on' : ''}`} onClick={() => onChange(all ? [] : available)} aria-pressed={all}>
          Kõik kuud
        </button>
        {available.map((m) => (
          <button
            key={m}
            type="button"
            className={`chip ${selected.includes(m) ? 'chip-on' : ''}`}
            onClick={() => toggle(m)}
            aria-pressed={selected.includes(m)}
          >
            {m}
          </button>
        ))}
      </div>
      {available.length === 0 ? (
        <p className="muted small">Andmetes ei ole ühtegi kuud.</p>
      ) : (
        <p className="muted small compare-info">
          {previous.months
            ? `Võrdlusperiood: ${periodLabel(previous.months)} (sama arv kuid vahetult enne valitud perioodi).`
            : `Võrdlusperiood puudub: ${previous.reason}`}
        </p>
      )}
    </fieldset>
  );
}
