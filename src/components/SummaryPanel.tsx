import { useState } from 'react';
import type { Aggregate, SummaryText } from '../lib/types';
import { keyFigureLines, summaryToText } from '../lib/summary';

export type SummaryState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; text: SummaryText; period: string; isSample: boolean };

interface Props {
  state: SummaryState;
  disabled: boolean;
  onGenerate: () => void;
  total: Aggregate;
}

export default function SummaryPanel({ state, disabled, onGenerate, total }: Props) {
  const [copied, setCopied] = useState(false);
  const plain = state.status === 'done' ? summaryToText(state.text, total, state.period, state.isSample) : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Kopeerimine ebaõnnestus. Vali tekst ja kopeeri see käsitsi.');
    }
  }

  function download() {
    const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'myygikoosoleku-kokkuvote.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="card summary">
      <div className="summary-head">
        <h2>Koosoleku kokkuvõte</h2>
        <button className="btn btn-primary" onClick={onGenerate} disabled={disabled || state.status === 'loading'}>
          {state.status === 'loading' ? 'Koostan…' : 'Koosta koosoleku kokkuvõte'}
        </button>
      </div>

      {state.status === 'idle' && (
        <p className="muted">
          {disabled
            ? 'Kokkuvõtte koostamiseks vali periood, mille kohta on andmeid.'
            : 'Vajuta nuppu, et koostada valitud perioodi näitajate põhjal koosolekul kasutatav tekst.'}
        </p>
      )}

      {state.status === 'loading' && (
        <div className="loading" role="status">
          <span className="spinner" aria-hidden /> Koostan kokkuvõtet, see võtab mõne sekundi…
        </div>
      )}

      {state.status === 'error' && (
        <div className="alert alert-error" role="alert">
          Tekstilist kokkuvõtet ei õnnestunud luua. Arvutatud näitajad on ülal endiselt kasutatavad.
          <div className="small muted">Põhjus: {state.message}</div>
        </div>
      )}

      {state.status === 'done' && (
        <>
          <div className="summary-body">
            <h3>1. Lühikokkuvõte</h3>
            <p>{state.text.lyhikokkuvote}</p>
            <h3>2. Põhinäitajad</h3>
            <ul>
              {keyFigureLines(total).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <h3>3. Olulisemad tähelepanekud</h3>
            {state.text.tahelepanekud.length > 0 ? (
              <ul>
                {state.text.tahelepanekud.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">Andmed ei toeta eraldi tähelepanekuid.</p>
            )}
            <h3>4. Aruteluküsimused</h3>
            <ol>
              {state.text.kusimused.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
            <h3>5. Andmete piirangud</h3>
            <ul>
              {state.text.piirangud.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="summary-actions">
            <button className="btn btn-secondary" onClick={copy}>
              {copied ? 'Kopeeritud ✓' : 'Kopeeri kokkuvõte'}
            </button>
            <button className="btn btn-secondary" onClick={download}>
              Laadi kokkuvõte alla
            </button>
          </div>
        </>
      )}
    </section>
  );
}
