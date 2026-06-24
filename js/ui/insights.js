import { store } from '../state/store.js';
import { errorBreakdown, generateInsights } from '../lib/insights.js';

export function renderInsights() {
  renderErrorBars();
  renderTextInsights();
}

function renderErrorBars() {
  const container = document.getElementById('error-bars');
  const bars = errorBreakdown(store.evaluations);

  if (bars.length === 0) {
    container.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);text-align:center;padding:16px 0;">No errors logged yet</div>';
    return;
  }

  container.innerHTML = bars.map(({ label, count, pct }) => {
    return `<div class="error-bar">
      <div class="error-bar-label" title="${label}">${label}</div>
      <div class="error-bar-track"><div class="error-bar-fill" style="width:${pct}%"></div></div>
      <div class="error-bar-count">${count}</div>
    </div>`;
  }).join('');
}

function renderTextInsights() {
  const container = document.getElementById('insights-container');
  if (store.evaluations.length === 0) {
    container.innerHTML = '<div style="font-size:0.78rem;color:var(--text-secondary);text-align:center;padding:16px 0;">Insights will generate after evaluations are logged.</div>';
    return;
  }

  const insights = generateInsights(store.evaluations);
  container.innerHTML = insights.map(i => `
    <div class="insight-card">
      <div class="insight-label">Insight · ${i.label}</div>
      <div>${i.text}</div>
    </div>
  `).join('');
}
