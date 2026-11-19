import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GroupComparison } from '../lib/types';
import { channelLabel } from '../lib/constants';
import { fmtEur, fmtInt, fmtPct } from '../lib/format';
import { CountDelta, RateDelta } from './Change';

/** Müügikanalite võrdlus: graafik (lepingud) ja tabel kõigi näitajatega. */
export default function ChannelAnalysis({ channels, hasPrev }: { channels: GroupComparison[]; hasPrev: boolean }) {
  const data = channels.map((c) => ({
    label: channelLabel(c.nimi),
    lepingud: c.current.lepingud,
    eelmine: c.previous?.lepingud ?? null,
  }));
  return (
    <section className="card">
      <h2>Müügikanalite analüüs</h2>
      <div className="chart">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e2e2" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={fmtInt} allowDecimals={false} />
            <Tooltip cursor={{ fill: 'rgba(0,134,65,0.06)' }} formatter={(v: number) => fmtInt(v)} />
            {hasPrev && <Bar dataKey="eelmine" name="Lepingud, eelmine periood" fill="#b9dcc8" radius={[4, 4, 0, 0]} maxBarSize={40} />}
            <Bar dataKey="lepingud" name="Lepingud, valitud periood" fill="#008641" radius={[4, 4, 0, 0]} maxBarSize={40} />
            {hasPrev && <Legend wrapperStyle={{ fontSize: 12 }} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="table-wrap">
        <table className="table compact">
          <thead>
            <tr>
              <th>Kanal</th>
              <th className="num">Kontaktid</th>
              <th className="num">Pakkumised</th>
              <th className="num">Lepingud</th>
              {hasPrev && <th className="num">Lepingute muutus</th>}
              <th className="num calc">Pakk. / kont.</th>
              <th className="num calc">Lep. / pakk.</th>
              {hasPrev && <th className="num calc">Muutus</th>}
              <th className="num">Laekumine</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.nimi}>
                <td>{channelLabel(c.nimi)}</td>
                <td className="num">{fmtInt(c.current.kontaktid)}</td>
                <td className="num">{fmtInt(c.current.pakkumised)}</td>
                <td className="num">{fmtInt(c.current.lepingud)}</td>
                {hasPrev && <td className="num"><CountDelta c={c.change.lepingud} /></td>}
                <td className="num calc">{fmtPct(c.current.pakkumisteOsakaal)}</td>
                <td className="num calc">{fmtPct(c.current.lepinguteOsakaal)}</td>
                {hasPrev && <td className="num calc"><RateDelta c={c.change.lepinguteOsakaal} /></td>}
                <td className="num">{fmtEur(c.current.laekumine)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">Rohelise taustaga veerud on arvutatud määrad; ülejäänud on tegelikud väärtused.</p>
    </section>
  );
}
