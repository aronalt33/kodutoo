import { Fragment, useState } from 'react';
import type { GroupComparison, SalesRow } from '../lib/types';
import { compareProducts } from '../lib/metrics';
import { fmtEur, fmtInt, fmtPct } from '../lib/format';
import { CountDelta } from './Change';

interface Props {
  groups: GroupComparison[];
  rows: SalesRow[];
  prevRows: SalesRow[] | null;
  hasPrev: boolean;
}

/** Tootegruppide võrdlus; müügimaht = tegeletud kontaktide arv. Grupi saab avada toodete kaupa. */
export default function ProductAnalysis({ groups, rows, prevRows, hasPrev }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const row = (g: GroupComparison, child = false) => (
    <>
      <td className={child ? 'child' : ''}>
        {child ? (
          g.nimi
        ) : (
          <button className="link" onClick={() => setOpen(open === g.nimi ? null : g.nimi)} aria-expanded={open === g.nimi}>
            {open === g.nimi ? '▾' : '▸'} {g.nimi}
          </button>
        )}
      </td>
      <td className="num">{fmtInt(g.current.kontaktid)}</td>
      <td className="num">{fmtInt(g.current.pakkumised)}</td>
      <td className="num">{fmtInt(g.current.lepingud)}</td>
      {hasPrev && <td className="num"><CountDelta c={g.change.lepingud} /></td>}
      <td className="num calc">{fmtPct(g.current.pakkumisteOsakaal)}</td>
      <td className="num calc">{fmtPct(g.current.lepinguteOsakaal)}</td>
      <td className="num">{fmtEur(g.current.laekumine)}</td>
      {hasPrev && <td className="num"><CountDelta c={g.change.laekumine} eur /></td>}
    </>
  );

  return (
    <section className="card">
      <h2>Tooteanalüüs</h2>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tootegrupp / toode</th>
              <th className="num">Müügimaht (kontaktid)</th>
              <th className="num">Pakkumised</th>
              <th className="num">Lepingud</th>
              {hasPrev && <th className="num">Lepingute muutus</th>}
              <th className="num calc">Pakk. / kont.</th>
              <th className="num calc">Lep. / pakk.</th>
              <th className="num">Laekumine</th>
              {hasPrev && <th className="num">Laekumise muutus</th>}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <Fragment key={g.nimi}>
                <tr className="group-row">{row(g)}</tr>
                {open === g.nimi &&
                  compareProducts(rows, prevRows, g.nimi).map((p) => <tr key={p.nimi}>{row(p, true)}</tr>)}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        Müügimahuna näidatakse tegeletud kontaktide arvu. Laekumiste iseloom tootegruppides erineb: kindlustuse puhul on
        see samal kuul sõlmitud lepingute esimese kuu kuumaksete summa (mitte korduv laekumine), seega tootegruppide
        laekumised ei ole otseselt võrreldavad. Ava tootegrupp, et näha tooteid.
      </p>
    </section>
  );
}
