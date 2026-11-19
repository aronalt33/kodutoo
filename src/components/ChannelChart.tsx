import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Aggregate } from '../lib/types';
import { CHANNEL_LABELS } from '../lib/constants';
import { fmtInt, fmtPct } from '../lib/format';

/** Sõlmitud lepingud müügikanalite lõikes. */
export default function ChannelChart({ channels }: { channels: Aggregate[] }) {
  const data = channels.map((c) => ({ ...c, label: CHANNEL_LABELS[c.nimi] ?? c.nimi }));
  return (
    <section className="card">
      <h2>Sõlmitud lepingud müügikanalite lõikes</h2>
      <div className="chart">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 20, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e2e2" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={fmtInt} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,134,65,0.06)' }}
              formatter={(v: number) => [fmtInt(v), 'Lepingud']}
            />
            <Bar dataKey="lepingud" fill="#008641" radius={[4, 4, 0, 0]} maxBarSize={56}>
              <LabelList dataKey="lepingud" position="top" formatter={fmtInt} className="bar-label" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="table compact">
        <thead>
          <tr>
            <th>Kanal</th>
            <th className="num">Pakkumiste osakaal</th>
            <th className="num">Lepingute osakaal</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.nimi}>
              <td>{c.label}</td>
              <td className="num">{fmtPct(c.pakkumisteOsakaal)}</td>
              <td className="num">{fmtPct(c.lepinguteOsakaal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
