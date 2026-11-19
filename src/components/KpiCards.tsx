import type { Comparison } from '../lib/types';
import { METRIC_LABELS } from '../lib/constants';
import { fmtEur, fmtInt, fmtPct } from '../lib/format';
import { CountDelta, RateDelta } from './Change';

/** KPI-kaardid: tegelikud väärtused ja arvutatud määrad on eraldi märgistatud. */
export default function KpiCards({ change, hasPrev }: { change: Comparison; hasPrev: boolean }) {
  const counts = (['kontaktid', 'pakkumised', 'lepingud', 'laekumine'] as const).map((k) => ({
    key: k,
    value: k === 'laekumine' ? fmtEur(change[k].current) : fmtInt(change[k].current),
    prev:
      change[k].previous === null ? null : k === 'laekumine' ? fmtEur(change[k].previous!) : fmtInt(change[k].previous!),
    delta: <CountDelta c={change[k]} eur={k === 'laekumine'} />,
  }));
  const rates = (['pakkumisteOsakaal', 'lepinguteOsakaal'] as const).map((k) => ({
    key: k,
    value: fmtPct(change[k].current),
    prev: change[k].previous === null ? null : fmtPct(change[k].previous),
    delta: <RateDelta c={change[k]} />,
    hint: k === 'pakkumisteOsakaal' ? 'pakkumised / kontaktid' : 'lepingud / pakkumised',
  }));

  return (
    <section className="kpis" aria-label="Müügitulemused">
      {counts.map((c) => (
        <div className="kpi" key={c.key}>
          <span className="tag tag-actual">Tegelik väärtus</span>
          <div className="kpi-label">{METRIC_LABELS[c.key]}</div>
          <div className="kpi-value">{c.value}</div>
          {hasPrev && (
            <div className="kpi-compare">
              Eelmine: {c.prev ?? '–'} · {c.delta}
            </div>
          )}
        </div>
      ))}
      {rates.map((r) => (
        <div className="kpi kpi-rate" key={r.key}>
          <span className="tag tag-calc">Arvutatud määr</span>
          <div className="kpi-label">{METRIC_LABELS[r.key]}</div>
          <div className="kpi-value">{r.value}</div>
          <div className="kpi-hint">{r.hint}</div>
          {hasPrev && (
            <div className="kpi-compare">
              Eelmine: {r.prev ?? '–'} · {r.delta}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
