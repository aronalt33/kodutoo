import type { Aggregate } from '../lib/types';
import { CHANNEL_LABELS } from '../lib/constants';
import { fmtEur, fmtInt, fmtPct } from '../lib/format';

interface Props {
  total: Aggregate;
  channels: Aggregate[];
  period: string;
  isSample: boolean;
}

/** Kiirülevaade: reeglipõhine tekst otse arvutatud näitajatest (ilma tehisintellektita). */
export default function QuickOverview({ total, channels, period, isSample }: Props) {
  const top = [...channels].sort((a, b) => b.lepingud - a.lepingud)[0];
  return (
    <section className="card overview">
      <h2>Ülevaade: {period}</h2>
      <p>
        Valitud perioodil oli {fmtInt(total.kontaktid)} tegeletud kontakti, {fmtInt(total.pakkumised)} pakkumist ja{' '}
        {fmtInt(total.lepingud)} sõlmitud lepingut; laekumine kokku {fmtEur(total.laekumine)}. Pakkumiste osakaal
        kontaktidest oli {fmtPct(total.pakkumisteOsakaal)} ja lepingute osakaal pakkumistest{' '}
        {fmtPct(total.lepinguteOsakaal)}.
        {top && ` Kõige rohkem lepinguid sõlmiti kanalis „${CHANNEL_LABELS[top.nimi] ?? top.nimi}” (${fmtInt(top.lepingud)}).`}
      </p>
      {isSample && <p className="muted small">Fiktiivsed näidisandmed – ei ole Compensa tegelikud müügitulemused.</p>}
    </section>
  );
}
