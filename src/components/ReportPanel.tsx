import { useState } from 'react';
import type { Report } from '../lib/types';
import { REPORT_SECTIONS, reportToText } from '../lib/report';

/** Automaatne juhtimisraport valitud perioodi kohta, koostatud reeglite ja mallide põhjal. */
export default function ReportPanel({ report }: { report: Report }) {
  const [copied, setCopied] = useState(false);
  const text = reportToText(report);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Kopeerimine ebaõnnestus. Vali tekst ja kopeeri see käsitsi.');
    }
  }

  function download() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myygiraport-${report.periood.replace(/[^\p{L}\d]+/gu, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card summary">
      <div className="summary-head">
        <div>
          <h2>Juhtimisraport</h2>
          <p className="muted small">
            Periood: {report.periood} · Võrdlusperiood: {report.vordlusperiood ?? 'puudub'} · koostatud reeglipõhiselt
            arvutatud näitajatest
          </p>
        </div>
        <div className="summary-actions">
          <button className="btn btn-secondary" onClick={copy}>
            {copied ? 'Kopeeritud ✓' : 'Kopeeri raport'}
          </button>
          <button className="btn btn-secondary" onClick={download}>
            Laadi raport alla
          </button>
        </div>
      </div>
      <div className="summary-body">
        {REPORT_SECTIONS.map((s, i) => {
          const items = report[s.key] as string[];
          return (
            <div key={s.key}>
              <h3>
                {i + 1}. {s.title}
              </h3>
              {s.key === 'kokkuvote' ? (
                <p>{items.join(' ')}</p>
              ) : s.ordered ? (
                <ol>{items.map((t) => <li key={t}>{t}</li>)}</ol>
              ) : (
                <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
