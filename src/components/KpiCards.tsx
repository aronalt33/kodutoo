import type { Aggregate } from '../lib/types';
import { fmtEur, fmtInt, fmtPct } from '../lib/format';

export default function KpiCards({ total }: { total: Aggregate }) {
  const cards = [
    { label: 'Tegeletud kontaktid', value: fmtInt(total.kontaktid) },
    { label: 'Pakkumised', value: fmtInt(total.pakkumised) },
    { label: 'Sõlmitud lepingud', value: fmtInt(total.lepingud) },
    { label: 'Laekumine', value: fmtEur(total.laekumine) },
    { label: 'Pakkumiste osakaal kontaktidest', value: fmtPct(total.pakkumisteOsakaal), hint: 'pakkumised / kontaktid' },
    { label: 'Lepingute osakaal pakkumistest', value: fmtPct(total.lepinguteOsakaal), hint: 'lepingud / pakkumised' },
  ];
  return (
    <section className="kpis" aria-label="Põhinäitajad">
      {cards.map((c) => (
        <div className="kpi" key={c.label}>
          <div className="kpi-label">{c.label}</div>
          <div className="kpi-value">{c.value}</div>
          {c.hint && <div className="kpi-hint">{c.hint}</div>}
        </div>
      ))}
    </section>
  );
}
