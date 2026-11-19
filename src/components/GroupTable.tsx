import type { Aggregate } from '../lib/types';
import { fmtEur, fmtInt, fmtPct } from '../lib/format';

/** Tulemused tootegruppide lõikes. */
export default function GroupTable({ groups }: { groups: Aggregate[] }) {
  return (
    <section className="card">
      <h2>Tulemused tootegruppide lõikes</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tootegrupp</th>
              <th className="num">Kontaktid</th>
              <th className="num">Pakkumised</th>
              <th className="num">Lepingud</th>
              <th className="num">Lepingute osakaal</th>
              <th className="num">Laekumine</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.nimi}>
                <td>{g.nimi}</td>
                <td className="num">{fmtInt(g.kontaktid)}</td>
                <td className="num">{fmtInt(g.pakkumised)}</td>
                <td className="num">{fmtInt(g.lepingud)}</td>
                <td className="num">{fmtPct(g.lepinguteOsakaal)}</td>
                <td className="num">{fmtEur(g.laekumine)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        Laekumiste iseloom tootegruppides erineb: kindlustuse puhul on see samal kuul sõlmitud lepingute esimese kuu
        kuumaksete summa (mitte korduv laekumine). Seetõttu ei ole tootegruppide laekumised otseselt võrreldavad.
      </p>
    </section>
  );
}
