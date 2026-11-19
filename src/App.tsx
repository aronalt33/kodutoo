import { useMemo, useState } from 'react';
import { SAMPLE_CSV } from './data/sampleData';
import { decodeFile, parseSalesCsv } from './lib/csv';
import { aggregate, byChannel, byGroup, missingGroupsByMonth, monthsIn, periodLabel } from './lib/metrics';
import { buildPayload } from './lib/summary';
import type { ParseResult, SummaryText } from './lib/types';
import Header from './components/Header';
import PeriodPicker from './components/PeriodPicker';
import KpiCards from './components/KpiCards';
import QuickOverview from './components/QuickOverview';
import ChannelChart from './components/ChannelChart';
import GroupTable from './components/GroupTable';
import DataPanel from './components/DataPanel';
import SummaryPanel, { type SummaryState } from './components/SummaryPanel';

const sampleResult = parseSalesCsv(SAMPLE_CSV);

export default function App() {
  // Kõik andmed hoitakse ainult brauseri mälus (React state).
  const [result, setResult] = useState<ParseResult>(sampleResult);
  const [isSample, setIsSample] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(() => monthsIn(sampleResult.rows));
  const [summary, setSummary] = useState<SummaryState>({ status: 'idle' });

  const available = useMemo(() => monthsIn(result.rows), [result]);
  const rows = useMemo(() => result.rows.filter((r) => selected.includes(r.kuu)), [result, selected]);
  const total = useMemo(() => aggregate(rows), [rows]);
  const channels = useMemo(() => byChannel(rows), [rows]);
  const groups = useMemo(() => byGroup(rows), [rows]);
  const period = periodLabel(selected);

  function loadResult(r: ParseResult, sample: boolean, name: string | null) {
    setResult(r);
    setIsSample(sample);
    setFileName(name);
    setSelected(monthsIn(r.rows));
    setSummary({ status: 'idle' });
  }

  async function handleFile(file: File) {
    setUploadError(null);
    try {
      const text = decodeFile(await file.arrayBuffer());
      const r = parseSalesCsv(text);
      if (r.fatal) {
        // Faili ei saa kasutada – jätame eelmised andmed alles ja näitame põhjust.
        setUploadError(r.fatal);
        return;
      }
      if (r.rows.length === 0) {
        setUploadError('Failis ei olnud ühtegi korrektset andmerida. Vaata allpool vigaste ridade loetelu.');
      }
      loadResult(r, false, file.name);
    } catch {
      setUploadError('Faili lugemine ebaõnnestus. Kontrolli, et tegemist on CSV-failiga.');
    }
  }

  function restoreSample() {
    setUploadError(null);
    loadResult(sampleResult, true, null);
  }

  function changePeriod(months: string[]) {
    setSelected(months);
    setSummary({ status: 'idle' }); // vana kokkuvõte ei vasta enam valitud perioodile
  }

  async function generate() {
    setSummary({ status: 'loading' });
    const payload = buildPayload({
      periood: period,
      kuudeArv: selected.length,
      naidisandmed: isSample,
      kokku: total,
      kanalid: channels,
      tootegrupid: groups,
      vigaseidRidu: result.errors.length,
      hoiatused: result.warnings,
      puuduvadAndmed: missingGroupsByMonth(result.rows, selected),
    });
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Viga ${res.status}`);
      setSummary({ status: 'done', text: data as SummaryText, period, isSample });
    } catch (e) {
      setSummary({ status: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }

  const hasData = rows.length > 0;

  return (
    <>
      <Header />
      <main className="container">
        <section className="card controls">
          <div className="source">
            {isSample ? (
              <span className="badge badge-sample">Fiktiivsed näidisandmed</span>
            ) : (
              <span className="badge badge-user">Sinu andmed: {fileName}</span>
            )}
            <div className="source-actions">
              <label className="btn btn-secondary">
                Laadi CSV-fail
                <input
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <button className="btn btn-ghost" onClick={restoreSample} disabled={isSample}>
                Taasta näidisandmed
              </button>
            </div>
          </div>
          {uploadError && <div className="alert alert-error" role="alert">{uploadError}</div>}
          <PeriodPicker available={available} selected={selected} onChange={changePeriod} />
        </section>

        <DataPanel result={result} isSample={isSample} />

        {!hasData ? (
          <section className="card empty">
            <h2>Valitud perioodil andmed puuduvad</h2>
            <p>Vali vähemalt üks kuu, mille kohta on andmeid, või laadi teine CSV-fail.</p>
          </section>
        ) : (
          <>
            <QuickOverview total={total} channels={channels} period={period} isSample={isSample} />
            <KpiCards total={total} />
            <div className="grid-2">
              <ChannelChart channels={channels} />
              <GroupTable groups={groups} />
            </div>
          </>
        )}

        <SummaryPanel state={summary} disabled={!hasData} onGenerate={generate} total={total} />
      </main>
      <footer className="footer container">
        Rakendus kasutab ainult näidisandmeid või sinu üles laaditud faili. Andmeid hoitakse ainult brauseri mälus;
        tekstilise kokkuvõtte koostamiseks saadetakse Claude'i mudelile ainult arvutatud koondnäitajad.
      </footer>
    </>
  );
}
