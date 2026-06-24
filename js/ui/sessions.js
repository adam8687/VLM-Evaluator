import { store } from '../state/store.js';
import { escapeHtml } from '../utils.js';
import { confusionMatrix } from '../lib/metrics.js';
import { updateSessionIndicator } from './header.js';

export function renderSessionsTab() {
  document.getElementById('tab-sessions-badge').textContent = store.allSessions.length;

  const grid = document.getElementById('sessions-grid');
  if (!grid) return;
  if (store.allSessions.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-secondary);font-size:0.85rem;grid-column:1/-1;text-align:center;padding:40px;">No sessions yet.</div>';
    return;
  }
  grid.innerHTML = store.allSessions.slice().reverse().map(s => {
    const isActive = s.id === store.currentSessionId;
    const evals = s.evaluations.length;
    const accurate = s.evaluations.filter(e => e.accuracy === 'Accurate').length;
    const accPct = evals > 0 ? Math.round(accurate / evals * 100) : null;
    const flawed = evals - accurate;

    const { tp, tn, fp, fn } = confusionMatrix(s.evaluations);

    const actSucc = tp + fn;
    const succRate = actSucc > 0 ? Math.round((tp / actSucc) * 100) + '%' : 'N/A';

    const actFail = tn + fp;
    const failRate = actFail > 0 ? Math.round((tn / actFail) * 100) + '%' : 'N/A';

    const created = new Date(s.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    return `<div class="session-card${isActive ? ' session-card-active' : ''}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:12px;">
        <div style="flex:1;">
          <div class="session-card-name">${escapeHtml(s.name)}</div>
          <div class="session-card-meta">${created}</div>
        </div>
        ${isActive ? '<span style="font-size:0.65rem;font-weight:700;padding:3px 8px;background:rgba(36,126,199,0.2);color:var(--accent);border-radius:20px;border:1px solid rgba(36,126,199,0.4);white-space:nowrap;">Active</span>' : ''}
      </div>

      <div style="display:flex;gap:16px;padding:12px 0;border-top:1px solid var(--border);border-bottom:1px dashed var(--border);margin-bottom:0;">
        <div><div class="session-stat-val" style="color:var(--accent);">${evals}</div><div class="session-stat-lbl">Evaluations</div></div>
        <div><div class="session-stat-val" style="color:var(--green);">${accPct !== null ? accPct + '%' : '—'}</div><div class="session-stat-lbl">Accuracy</div></div>
        <div><div class="session-stat-val" style="color:var(--red);">${flawed}</div><div class="session-stat-lbl">Flawed</div></div>
      </div>

      <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--border);margin-bottom:14px;">
         <div><div class="session-stat-val" style="font-size:1.1rem; color:var(--blue);">${succRate}</div><div class="session-stat-lbl">Success Det.</div></div>
         <div><div class="session-stat-val" style="font-size:1.1rem; color:var(--yellow);">${failRate}</div><div class="session-stat-lbl">Failure Det.</div></div>
      </div>

      <div style="display:flex;gap:6px;">
        <button class="btn-primary" onclick="loadSession('${s.id}')" style="flex:1;padding:8px 12px;font-size:0.75rem;">${isActive ? '<i data-lucide="check" class="w-3 h-3"></i> Active' : 'Load'}</button>
        ${!isActive ? `<button class="btn-secondary" onclick="openCompareModal('${s.id}')" style="flex:1;padding:8px 12px;font-size:0.75rem;" title="Compare with Active Session"><i data-lucide="scale" class="w-3 h-3"></i> Compare</button>` : `<div style="flex:1"></div>`}
        <button class="btn-danger" onclick="deleteSession('${s.id}')" style="padding:8px 12px;font-size:0.75rem;"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
      </div>
    </div>`;
  }).join('');
  updateSessionIndicator();
  lucide.createIcons();
}
