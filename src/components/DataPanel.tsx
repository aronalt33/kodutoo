import type { ParseResult } from '../lib/types';
import { CHANNEL_LABELS } from '../lib/constants';
import { fmtEur, fmtInt } from '../lib/format';

/** Andmete eelvaade ning vigaste ridade ja hoiatuste loetelu. */
export default function DataPanel({ result, isSample }: { result: ParseResult; isSample: boolean }) {
  const { rows, errors, warnings, dataLineCount } = result;
  const preview = rows.slice(0, 8);
  return (
    <section className="card data-panel">
      {errors.length > 0 && (
        <div className="alert alert-warn" role="status">
          <strong>
            {errors.length} rida {dataLineCount}-st jäeti arvestusest välja, sest neis oli viga.
          </strong>
          <ul>
            {errors.slice(0, 10).map((e) => (
              <li key={e.line}>
                Rida {e.line}: {e.message}
              </li>
            ))}
          </ul>
          {errors.length > 10 && <p>…ja veel {errors.length - 10} vigast rida.</p>}
          <p>Paranda failis nimetatud veerud ja laadi fail uuesti.</p>
        </div>
      )}
      {warnings.map((w) => (
        <div className="alert alert-info" key={w}>{w}</div>
      ))}
      <details open={!isSample}>
        <summary>
          Andmete eelvaade ({fmtInt(rows.length)} korrektset rida{isSample ? ' · Fiktiivsed näidisandmed' : ''})
        </summary>
        <div className="table-wrap">
          <table className="table compact">
            <thead>
              <tr>
                <th>Kuu</th>
                <th>Kanal</th>
                <th>Tootegrupp</th>
                <th>Toode</th>
                <th className="num">Kontaktid</th>
                <th className="num">Pakkumised</th>
                <th className="num">Lepingud</th>
                <th className="num">Laekumine</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((r, i) => (
                <tr key={i}>
                  <td>{r.kuu}</td>
                  <td>{CHANNEL_LABELS[r.kanal]}</td>
                  <td>{r.tootegrupp}</td>
                  <td>{r.toode}</td>
                  <td className="num">{fmtInt(r.kontaktid)}</td>
                  <td className="num">{fmtInt(r.pakkumised)}</td>
                  <td className="num">{fmtInt(r.lepingud)}</td>
                  <td className="num">{fmtEur(r.laekumine)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > preview.length && <p className="muted small">Näidatakse esimest {preview.length} rida.</p>}
      </details>
    </section>
  );
}
