import React, { useState } from 'react';
import sourceData from '../../data.json';

const weeks = [...sourceData].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
const names = { naive: 'Naive', ses: 'SES', holt: 'Holt' };
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC',
});
const numberFormat = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 });

function formatDate(timestamp) {
  return dateFormat.format(new Date(timestamp));
}

export default function App() {
  const [algorithm, setAlgorithm] = useState('holt');
  const [alpha, setAlpha] = useState('0.5');
  const [beta, setBeta] = useState('0.3');
  const [selected, setSelected] = useState(() => new Set(weeks.map((week) => week.timestamp)));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const minimum = algorithm === 'holt' ? 2 : 1;

  function toggleWeek(timestamp) {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(timestamp)) next.delete(timestamp);
      else next.add(timestamp);
      return next;
    });
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    const data = weeks.filter((week) => selected.has(week.timestamp));
    if (data.length < minimum) {
      setError(`${names[algorithm]} needs at least ${minimum} selected ${minimum === 1 ? 'week' : 'weeks'}.`);
      return;
    }

    const params = [];
    if (algorithm !== 'naive') params.push({ name: 'alpha', value: Number(alpha) });
    if (algorithm === 'holt') params.push({ name: 'beta', value: Number(beta) });

    setLoading(true);
    try {
      const response = await fetch(`/${algorithm}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params, data }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Prediction failed. Please try again.');

      setResult({ algorithm, sourceCount: data.length, data: body.data });
    } catch (error) {
      setError(error.message || 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="workspace">
      <header className="page-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none"><path d="M5 17v-4m7 4V9m7 8V5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
          </span>
          <div><h1>Predict<span>.</span></h1><p>Weekly sales, one step ahead.</p></div>
        </div>
        <span className="horizon"><span />10-week forecast</span>
      </header>

      <section className="panel settings" aria-labelledby="settings-title">
        <div className="section-title"><span className="step">01</span><h2 id="settings-title">Prediction settings</h2></div>
        <form onSubmit={submit}>
          <div className="controls">
            <label className="field algorithm-field">
              <span>Algorithm</span>
              <select value={algorithm} onChange={(event) => { setAlgorithm(event.target.value); setError(''); }} disabled={loading}>
                <option value="naive">Naive — last value</option>
                <option value="ses">SES — smoothed level</option>
                <option value="holt">Holt — level + trend</option>
              </select>
            </label>
            <label className="field">
              <span>Alpha <small>Level smoothing</small></span>
              <input type="number" min="0" max="1" step="any" required value={alpha} onChange={(event) => setAlpha(event.target.value)} disabled={loading || algorithm === 'naive'} />
            </label>
            <label className="field">
              <span>Beta <small>Trend smoothing</small></span>
              <input type="number" min="0" max="1" step="any" required value={beta} onChange={(event) => setBeta(event.target.value)} disabled={loading || algorithm !== 'holt'} />
            </label>
            <button className="submit-button" type="submit" disabled={loading || selected.size < minimum}>
              {loading ? 'Predicting…' : 'Submit'}<span aria-hidden="true">→</span>
            </button>
          </div>
          <div className="settings-footer">
            <p>Choose your method and the weeks to include below.</p>
            <span>{selected.size} weeks selected{selected.size < minimum ? ` · Select at least ${minimum}` : ''}</span>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      </section>

      <div className="data-panels">
        <section className="panel" aria-labelledby="weeks-title">
          <header className="panel-header">
            <div className="section-title"><span className="step">02</span><div><h2 id="weeks-title">Sales history</h2><p>Select the weeks to include in your prediction.</p></div></div>
            <span className="count">{selected.size} / {weeks.length}</span>
          </header>
          <div className="list-toolbar">
            <span className="file-label">data.json</span>
            <div>
              <button type="button" className="text-button" disabled={loading} onClick={() => { setSelected(new Set(weeks.map((week) => week.timestamp))); setError(''); }}>Select all</button>
              <span className="divider">/</span>
              <button type="button" className="text-button muted" disabled={loading} onClick={() => { setSelected(new Set()); setError(''); }}>Clear</button>
            </div>
          </div>
          <div className="column-labels history-columns"><span /><span>Week starting</span><span>Units sold</span></div>
          <ul className="week-list">
            {weeks.map((week) => (
              <li key={week.timestamp}>
                <label className={`week-row ${selected.has(week.timestamp) ? 'selected' : ''}`}>
                  <input type="checkbox" checked={selected.has(week.timestamp)} onChange={() => toggleWeek(week.timestamp)} disabled={loading} aria-label={`Include week ${formatDate(week.timestamp)}`} />
                  <span>{formatDate(week.timestamp)}</span>
                  <strong>{numberFormat.format(week.value)}</strong>
                </label>
              </li>
            ))}
          </ul>
          <footer className="panel-footer">{formatDate(weeks[0].timestamp)}<span>—</span>{formatDate(weeks.at(-1).timestamp)}</footer>
        </section>

        <section className="panel results-panel" aria-labelledby="results-title" aria-busy={loading}>
          <header className="panel-header">
            <div className="section-title"><span className="step">03</span><div><h2 id="results-title">Prediction</h2><p>The next 10 weeks, based on your selection.</p></div></div>
            <span className={`count ${result ? 'result-count' : ''}`}>{result ? names[result.algorithm] : '10 weeks'}</span>
          </header>
          {result ? (
            <>
              <div className="result-summary"><span className="status-dot" />Last prediction · {result.sourceCount} input weeks<span className="result-status" role="status">{loading ? 'Updating…' : 'Complete'}</span></div>
              <div className="column-labels result-columns"><span>Week</span><span>Week starting</span><span>Predicted units</span></div>
              <ol className="prediction-list">
                {result.data.map((week, index) => (
                  <li className="prediction-row" key={week.timestamp}>
                    <span className="week-number">{String(index + 1).padStart(2, '0')}</span>
                    <span>{formatDate(week.timestamp)}</span>
                    <strong title={String(week.value)}>{numberFormat.format(week.value)}</strong>
                  </li>
                ))}
              </ol>
              <footer className="panel-footer">Weekly predictions<span>·</span>Values shown to 2 decimal places</footer>
            </>
          ) : (
            <div className="empty-state" role="status">
              <span className="empty-icon" aria-hidden="true">↗</span>
              <h3>{loading ? 'Calculating your prediction…' : 'A look at what comes next'}</h3>
              <p>Select your weeks and click Submit.<br />Your weekly predictions will appear here.</p>
            </div>
          )}
        </section>
      </div>
      <footer className="page-footer">Predict / Weekly sales explorer<span>Naive · SES · Holt</span></footer>
    </main>
  );
}
