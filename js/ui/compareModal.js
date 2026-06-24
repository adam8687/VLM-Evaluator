import { store, getCurrentSession } from '../state/store.js';
import { escapeHtml } from '../utils.js';

export function openCompareModal(targetSessionId) {
  const active = getCurrentSession();
  const target = store.allSessions.find(s => s.id === targetSessionId);
  if (!target) return;

  const matches = [];
  active.evaluations.forEach(eA => {
    const eB = target.evaluations.find(e => e.seq === eA.seq);
    if (eB) matches.push({ eA, eB });
  });

  matches.sort((a, b) => a.eA.seq - b.eA.seq);

  const agreements = matches.filter(m => m.eA.modelPrediction === m.eB.modelPrediction);
  const disagreements = matches.filter(m => m.eA.modelPrediction !== m.eB.modelPrediction);

  const buildTable = (list, title, color) => {
    if (list.length === 0) return '';
    return `
       <div style="margin-top:24px; padding-bottom:8px; border-bottom:2px solid ${color}; display:flex; justify-content:space-between; align-items:flex-end;">
         <h3 style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin:0;">${title}</h3>
         <span style="font-size:0.8rem; font-weight:700; color:${color}; background:${color}22; padding:3px 10px; border-radius:12px;">${list.length} Videos</span>
       </div>
       <table class="data-table" style="margin-top:12px; width:100%;">
         <thead>
           <tr>
             <th style="width:40px;">#</th>
             <th>Video ID (Active)</th>
             <th>Ground Truth</th>
             <th style="border-left:1px solid var(--border); padding-left:12px; color:var(--accent);">${escapeHtml(active.name)}</th>
             <th style="border-left:1px solid var(--border); padding-left:12px;">${escapeHtml(target.name)}</th>
             <th style="text-align:right;">Watch</th>
           </tr>
         </thead>
         <tbody>
           ${list.map(m => {
             const gtIcon = m.eA.groundTruth === 'Success' ? 'check-circle' : 'x-circle';
             const predAIcon = m.eA.modelPrediction === 'Success' ? 'check-circle' : m.eA.modelPrediction === 'Failure' ? 'x-circle' : 'alert-triangle';
             const predBIcon = m.eB.modelPrediction === 'Success' ? 'check-circle' : m.eB.modelPrediction === 'Failure' ? 'x-circle' : 'alert-triangle';
             const accAIcon = m.eA.accuracy === 'Accurate' ? 'check' : 'x';
             const accBIcon = m.eB.accuracy === 'Accurate' ? 'check' : 'x';

             return `
             <tr style="cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='var(--surface-3)'" onmouseout="this.style.background='transparent'" onclick="loadLogToWorkbench('${escapeHtml(m.eA.videoId)}', '${m.eA.groundTruth}')">
               <td style="color:var(--text-secondary);">${m.eA.seq}</td>
               <td style="font-weight:600; color:var(--text-primary);" title="Target ID: ${escapeHtml(m.eB.videoId)}">${escapeHtml(m.eA.videoId)}</td>
               <td><span class="badge ${m.eA.groundTruth === 'Success' ? 'badge-success' : 'badge-failure'}"><i data-lucide="${gtIcon}"></i> ${m.eA.groundTruth}</span></td>

               <td style="border-left:1px solid var(--border); padding-left:12px;">
                 <span class="badge ${m.eA.modelPrediction === 'Success' ? 'badge-success' : m.eA.modelPrediction === 'Failure' ? 'badge-failure' : 'badge-truncated'}"><i data-lucide="${predAIcon}"></i> ${m.eA.modelPrediction}</span>
                 <span style="display:inline-flex; align-items:center; font-size:0.75rem; font-weight:700; color:${m.eA.accuracy === 'Accurate' ? 'var(--green)' : 'var(--red)'}; margin-left:8px;"><i data-lucide="${accAIcon}" class="w-3 h-3"></i></span>
               </td>

               <td style="border-left:1px solid var(--border); padding-left:12px;">
                 <span class="badge ${m.eB.modelPrediction === 'Success' ? 'badge-success' : m.eB.modelPrediction === 'Failure' ? 'badge-failure' : 'badge-truncated'}"><i data-lucide="${predBIcon}"></i> ${m.eB.modelPrediction}</span>
                 <span style="display:inline-flex; align-items:center; font-size:0.75rem; font-weight:700; color:${m.eB.accuracy === 'Accurate' ? 'var(--green)' : 'var(--red)'}; margin-left:8px;"><i data-lucide="${accBIcon}" class="w-3 h-3"></i></span>
               </td>

               <td style="text-align:right;">
                 <span style="display:inline-flex; align-items:center; opacity:0.6; transition:color 0.2s;" onmouseover="this.style.color='var(--accent)'" onmouseout="this.style.color=''"><i data-lucide="play-circle" class="w-5 h-5"></i></span>
               </td>
             </tr>
           `}).join('')}
         </tbody>
       </table>
     `;
  };

  document.getElementById('compare-modal-body').innerHTML = `
    ${buildTable(disagreements, 'Disagreements (Divergent Predictions)', 'var(--yellow)')}
    ${buildTable(agreements, 'Agreements (Matched Predictions)', 'var(--border)')}
    ${matches.length === 0 ? `<div style="text-align:center; padding:40px; color:var(--text-secondary);">No matching evaluation numbers (#) found between these two sessions. Ensure they were run in the same sequential order.</div>` : ''}
  `;

  document.getElementById('compare-modal').style.display = 'flex';
  lucide.createIcons();

  setTimeout(() => {
    document.getElementById('compare-modal').style.opacity = '1';
  }, 10);
}

export function closeCompareModal() {
  document.getElementById('compare-modal').style.opacity = '0';
  setTimeout(() => {
    document.getElementById('compare-modal').style.display = 'none';
  }, 300);
}
