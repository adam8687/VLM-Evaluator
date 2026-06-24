import { store } from '../state/store.js';
import { escapeHtml } from '../utils.js';

export function renderTable() {
  const evaluations = store.evaluations;
  const tbody = document.getElementById('log-tbody');
  document.getElementById('log-count').textContent = `${evaluations.length} entr${evaluations.length === 1 ? 'y' : 'ies'}`;
  document.getElementById('tab-log-badge').textContent = evaluations.length;

  if (evaluations.length === 0) {
    tbody.innerHTML = `<tr id="empty-row"><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:48px;font-size:0.82rem;">No evaluations logged yet. Go to the Evaluate tab to get started.</td></tr>`;
    return;
  }

  tbody.innerHTML = evaluations.slice().reverse().map((e, i) => {
    const isNew = i === 0;

    const gtIcon = e.groundTruth === 'Success' ? 'check-circle' : 'x-circle';
    const gtBadge = `<span class="badge ${e.groundTruth === 'Success' ? 'badge-success' : 'badge-failure'}"><i data-lucide="${gtIcon}"></i> ${e.groundTruth}</span>`;

    const predClass = e.modelPrediction === 'Success' ? 'badge-success' : e.modelPrediction === 'Failure' ? 'badge-failure' : 'badge-truncated';
    const predIcon = e.modelPrediction === 'Success' ? 'check-circle' : e.modelPrediction === 'Failure' ? 'x-circle' : 'alert-triangle';
    const predBadge = `<span class="badge ${predClass}"><i data-lucide="${predIcon}"></i> ${e.modelPrediction}</span>`;

    const accIcon = e.accuracy === 'Accurate' ? 'check' : 'x';
    const accBadge = `<span class="badge ${e.accuracy === 'Accurate' ? 'badge-accurate' : 'badge-flawed'}"><i data-lucide="${accIcon}"></i> ${e.accuracy}</span>`;

    const tags = e.errorTags.length
      ? e.errorTags.map(t => `<span style="font-size:0.65rem;background:rgba(244,91,122,0.12);border:1px solid rgba(244,91,122,0.3);color:var(--red);border-radius:4px;padding:1px 6px;margin-right:3px;white-space:nowrap;">${t}</span>`).join('')
      : '<span style="color:var(--text-secondary);font-size:0.72rem;">—</span>';
    const modelShort = e.modelName.length > 16 ? e.modelName.slice(0, 14) + '…' : e.modelName;

    return `<tr class="${isNew ? 'row-new' : ''}">
      <td style="color:var(--text-secondary);">${e.seq}</td>
      <td>
        <span
          contenteditable="true"
          spellcheck="false"
          title="Click to rename"
          data-id="${e.id}"
          onblur="renameVideoId(this)"
          onkeydown="if(event.key==='Enter'){event.preventDefault();this.blur();}"
          style="display:inline-block;font-weight:600;color:var(--accent);outline:none;border-bottom:1px dashed transparent;border-radius:2px;padding:1px 3px;cursor:text;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:all 0.2s ease;"
          onfocus="this.style.borderBottomColor='var(--accent)';this.style.background='rgba(36,126,199,0.08)'"
          onfocusout="this.style.borderBottomColor='transparent';this.style.background=''"
        >${escapeHtml(e.videoId)}</span>
      </td>
      <td title="${escapeHtml(e.modelName)}">${escapeHtml(modelShort)}</td>
      <td>${gtBadge}</td>
      <td>${predBadge}</td>
      <td>${accBadge}</td>
      <td style="max-width:200px;">${tags}</td>
      <td style="color:var(--text-secondary);font-size:0.72rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(e.notes)}">${escapeHtml(e.notes) || '—'}</td>
      <td style="color:var(--text-secondary);white-space:nowrap;font-size:0.72rem;">${e.timestamp}</td>
      <td><button class="btn-danger" onclick="deleteEntry(${e.id})" style="padding:4px 9px;"><i data-lucide="trash-2" class="w-3 h-3"></i></button></td>
    </tr>`;
  }).join('');

  lucide.createIcons();
}
