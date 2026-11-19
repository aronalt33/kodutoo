import { useMemo, useState } from 'react';
import { SAMPLE_CSV } from './data/sampleData';
import { decodeFile, parseSalesCsv } from './lib/csv';
import {
  aggregate, compare, compareChannels, compareGroups, defaultSelection, funnel,
  missingGroupsByMonth, missingProductsByMonth, monthsIn, periodLabel, previousPeriod,
} from './lib/metrics';
import { buildReport } from './lib/report';
import type { ParseResult } from './lib/types';
import Header from './components/Header';
import PeriodPicker from './components/PeriodPicker';
import KpiCards from './components/KpiCards';
import FunnelPanel from './components/FunnelPanel';
import ChannelAnalysis from './components/ChannelAnalysis';
import ProductAnalysis from './components/ProductAnalysis';
import DataPanel from './components/DataPanel';
import ReportPanel from './components/ReportPanel';

const sampleResult = parseSalesCsv(SAMPLE_CSV);

export default function App() {
  // Kõik andmed hoitakse ainult brauseri mälus (React state); väliseid teenuseid ei kasutata.
  const [result, setResult] = useState<ParseResult>(sampleResult);
  const [isSample, setIsSample] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(() => defaultSelection(monthsIn(sampleResult.rows)));

  const available = useMemo(() => monthsIn(result.rows), [result]);
  const previous = useMemo(() => previousPeriod(selected, available), [selected, available]);
  const hasPrev = previous.months !== null;

  // Valitud ja eelmise perioodi read
  const rows = useMemo(() => result.rows.filter((r) => selected.includes(r.kuu)), [result, selected]);
  const prevRows = useMemo(
    () => (previous.months ? result.rows.filter((r) => previous.months!.includes(r.kuu)) : null),
    [result, previous],
  );

  // Arvutused (vt src/lib/metrics.ts)
  const total = useMemo(() => aggregate(rows), [rows]);
  const change = useMemo(() => compare(total, prevRows ? aggregate(prevRows) : null), [total, prevRows]);
  const fun = useMemo(() => funnel(total), [total]);
  const channels = useMemo(() => compareChannels(rows, prevRows), [rows, prevRows]);
  const groups = useMemo(() => compareGroups(rows, prevRows), [rows, prevRows]);
  const period = periodLabel(selected);

  // Reeglipõhine raport (vt src/lib/report.ts)
  const report = useMemo(
    () =>
      buildReport({
        periood: period,
        vordlusperiood: previous.months ? periodLabel(previous.months) : null,
        previous,
        total,
        change,
        channels,
        groups,
        funnel: fun,
        errorCount: result.errors.length,
        warnings: result.warnings,
        missingNotes: missingGroupsByMonth(result.rows, [...selected, ...(previous.months ?? [])]),
        missingProducts: missingProductsByMonth(result.rows, [...selected, ...(previous.months ?? [])]),
        isSample,
      }),
    [period, previous, total, change, channels, groups, fun, result, selected, isSample],
  );

  function loadResult(r: ParseResult, sample: boolean, name: string | null) {
    setResult(r);
    setIsSample(sample);
    setFileName(name);
    setSelected(defaultSelection(monthsIn(r.rows)));
  }

  async function handleFile(file: File) {
    setUploadError(null);
    try {
      const r = parseSalesCsv(decodeFile(await file.arrayBuffer()));
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
          <PeriodPicker available={available} selected={selected} previous={previous} onChange={setSelected} />
        </section>

        <DataPanel result={result} isSample={isSample} />

        {!hasData ? (
          <section className="card empty">
            <h2>Valitud perioodil andmed puuduvad</h2>
            <p>Vali vähemalt üks kuu, mille kohta on andmeid, või laadi teine CSV-fail.</p>
          </section>
        ) : (
          <>
            <h2 className="section-title">Müügitulemused: {period}</h2>
            <KpiCards change={change} hasPrev={hasPrev} />
            <div className="grid-2">
              <FunnelPanel funnel={fun} />
              <ChannelAnalysis channels={channels} hasPrev={hasPrev} />
            </div>
            <ProductAnalysis groups={groups} rows={rows} prevRows={prevRows} hasPrev={hasPrev} />
            <ReportPanel report={report} />
          </>
        )}
      </main>
      <footer className="footer container">
        Rakendus kasutab ainult näidisandmeid või sinu üles laaditud faili. Andmeid hoitakse ainult brauseri mälus ning
        kõik arvutused ja raport koostatakse rakenduses – väliseid AI-teenuseid ei kasutata.
      </footer>
    </>
  );
}
