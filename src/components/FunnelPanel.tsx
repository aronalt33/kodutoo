import type { Funnel } from '../lib/types';
import { fmtInt, fmtPct } from '../lib/format';

/** Müügilehter: etappide tegelikud arvud, arvutatud konversioon ja väljalangevus, nõrgim etapp esile tõstetud. */
export default function FunnelPanel({ funnel }: { funnel: Funnel }) {
  const top = funnel.stages[0].fromCount;
  const levels = [
    { name: funnel.stages[0].from, count: funnel.stages[0].fromCount },
    ...funnel.stages.map((s) => ({ name: s.to, count: s.toCount })),
  ];
  const width = (n: number) => (top > 0 ? Math.max(8, (n / top) * 100) : 8);

  return (
    <section className="card">
      <h2>Müügilehtri analüüs</h2>
      <div className="funnel">
        {levels.map((l, i) => (
          <div key={l.name}>
            <div className="funnel-level">
              <div className="funnel-bar" style={{ width: `${width(l.count)}%` }} />
              <div className="funnel-text">
                <span>{l.name}</span>
                <strong>{fmtInt(l.count)}</strong>
              </div>
            </div>
            {i < funnel.stages.length && (
              <StageInfo stage={funnel.stages[i]} weakest={funnel.weakest === funnel.stages[i]} />
            )}
          </div>
        ))}
      </div>
      {funnel.weakest ? (
        <p className="note">
          Nõrgim etapp on madalaima konversiooniga etapp: <strong>{funnel.weakest.from} → {funnel.weakest.to}</strong>.
        </p>
      ) : (
        <p className="note">Konversioonimäärasid ei saa arvutada, sest etappide arvud on nullid.</p>
      )}
    </section>
  );
}

function StageInfo({ stage, weakest }: { stage: Funnel['stages'][number]; weakest: boolean }) {
  return (
    <div className={`funnel-stage ${weakest ? 'funnel-weak' : ''}`}>
      <span>
        Konversioon <strong>{fmtPct(stage.conversion)}</strong>
      </span>
      <span>
        Väljalangevus <strong>{fmtPct(stage.dropoff)}</strong> ({fmtInt(stage.lost)})
      </span>
      {weakest && <span className="badge-weak">Nõrgim etapp</span>}
    </div>
  );
}
