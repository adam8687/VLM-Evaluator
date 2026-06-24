/** State mutations + persistence orchestration. Bridges UI events to the store. */
import { store, getCurrentSession, makeSession, defaultSessionName } from './store.js';
import { saveSessions, loadApiKey, saveApiKey } from '../services/storage.js';
import { parseImportFile } from '../services/import.js';
import { exportEvaluationsJSON, exportEvaluationsCSV } from '../services/export.js';
import { renderTable } from '../ui/log.js';
import { updateMetrics } from '../ui/metrics.js';
import { renderInsights } from '../ui/insights.js';
import { renderSessionsTab } from '../ui/sessions.js';
import { updateSessionIndicator, updateProviderBadge } from '../ui/header.js';
import { switchTab } from '../ui/tabs.js';
import { showToast } from '../ui/toast.js';

function renderAll() {
  renderTable();
  updateMetrics();
  renderInsights();
  renderSessionsTab();
}

// ─── EVALUATION CRUD ──────────────────────────────────────────────────────────
export function submitEvaluation() {
  const videoId = document.getElementById('video-id').value.trim();
  const modelName = document.getElementById('model-select').value.trim();
  const promptText = document.getElementById('prompt-text').value.trim();
  const modelOutput = document.getElementById('model-output').value.trim();
  const notes = document.getElementById('reviewer-notes').value.trim();

  if (!videoId) { showToast('Please enter a Video ID or filename.', 'warn'); return; }
  if (!modelName) { showToast('Please enter the Model Name.', 'warn'); return; }
  if (!store.groundTruth) { showToast('Please select a Ground Truth label.', 'warn'); return; }
  if (!store.modelPrediction) { showToast('Please select a Model Prediction.', 'warn'); return; }
  if (!store.currentAccuracy) { showToast('Please set the Final Accuracy Verdict.', 'warn'); return; }

  const errorTags = [];
  document.querySelectorAll('#error-checkboxes input[type="checkbox"]:checked').forEach(cb => {
    errorTags.push(cb.value);
  });

  const entry = {
    id: Date.now(),
    seq: store.evaluations.length + 1,
    videoId,
    modelName,
    promptText,
    modelOutput,
    groundTruth: store.groundTruth,
    modelPrediction: store.modelPrediction,
    accuracy: store.currentAccuracy,
    errorTags,
    notes,
    timestamp: new Date().toLocaleString()
  };

  store.evaluations.push(entry);
  saveSessions();
  renderAll();
  showToast(`Evaluation #${entry.seq} logged.`, 'ok');
  resetForm();
}

export function resetForm() {
  document.getElementById('video-id').value = '';
  document.getElementById('model-output').value = '';
  document.getElementById('reviewer-notes').value = '';
  const status = document.getElementById('output-status');
  status.textContent = 'awaiting run…';
  status.style.color = '';
  store.currentAccuracy = null;
  store.groundTruth = null;
  store.modelPrediction = null;
  document.querySelectorAll('[data-group]').forEach(btn => btn.className = 'radio-btn');
  document.getElementById('btn-accurate').className = 'acc-btn';
  document.getElementById('btn-flawed').className = 'acc-btn';
  document.querySelectorAll('#error-checkboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
    cb.closest('label').classList.remove('checked');
  });
}

export function renameVideoId(el) {
  const id = parseInt(el.dataset.id);
  const newName = el.textContent.trim();
  const entry = store.evaluations.find(e => e.id === id);
  if (!entry) return;
  if (!newName) { el.textContent = entry.videoId; return; }
  entry.videoId = newName;
  getCurrentSession().evaluations = store.evaluations;
  saveSessions();
}

export function deleteEntry(id) {
  store.evaluations = store.evaluations.filter(e => e.id !== id);
  store.evaluations.forEach((e, i) => e.seq = i + 1);
  getCurrentSession().evaluations = store.evaluations;
  saveSessions();
  renderAll();
  showToast('Entry deleted.', 'info');
}

// ─── SESSIONS ─────────────────────────────────────────────────────────────────
export function newSession() {
  const s = makeSession(defaultSessionName());
  store.allSessions.push(s);
  store.currentSessionId = s.id;
  store.evaluations = s.evaluations;
  saveSessions();
  renderAll();
  updateSessionIndicator();
  resetForm();
  showToast(`Started “${s.name}”`, 'ok');
}

export function loadSession(id) {
  store.currentSessionId = id;
  store.evaluations = getCurrentSession().evaluations;
  saveSessions();
  renderAll();
  updateSessionIndicator();
  switchTab('evaluate');
  showToast(`Loaded “${getCurrentSession().name}”`, 'ok');
}

export function deleteSession(id) {
  if (store.allSessions.length <= 1) { showToast('Cannot delete the only session.', 'warn'); return; }
  const name = store.allSessions.find(s => s.id === id)?.name || 'session';
  if (!confirm(`Delete “${name}” and all its evaluations? This cannot be undone.`)) return;
  store.allSessions = store.allSessions.filter(s => s.id !== id);
  if (store.currentSessionId === id) {
    store.currentSessionId = store.allSessions[store.allSessions.length - 1].id;
    store.evaluations = getCurrentSession().evaluations;
  }
  saveSessions();
  renderAll();
  updateSessionIndicator();
  showToast(`“${name}” deleted.`, 'info');
}

export function renameSession(name) {
  if (!name.trim()) return;
  getCurrentSession().name = name.trim();
  saveSessions();
  renderSessionsTab();
}

// ─── IMPORT / EXPORT ──────────────────────────────────────────────────────────
export function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  parseImportFile(file)
    .then(importedEvals => {
      const sessionName = file.name.replace('.json', '') + ' (Imported)';
      const s = makeSession(sessionName);
      s.evaluations = importedEvals;
      store.allSessions.push(s);
      store.currentSessionId = s.id;
      store.evaluations = s.evaluations;

      saveSessions();
      renderAll();
      updateSessionIndicator();
      showToast(`Successfully imported ${importedEvals.length} evaluations.`, 'ok');
    })
    .catch(err => showToast(`Failed to import: ${err.message}`, 'warn'))
    .finally(() => { event.target.value = ''; });
}

export function exportJSON() {
  if (store.evaluations.length === 0) { showToast('No data to export yet.', 'warn'); return; }
  exportEvaluationsJSON(store.evaluations);
  showToast(`Exported ${store.evaluations.length} evaluations as JSON.`, 'ok');
}

export function exportCSV() {
  if (store.evaluations.length === 0) { showToast('No data to export yet.', 'warn'); return; }
  exportEvaluationsCSV(store.evaluations);
  showToast(`Exported ${store.evaluations.length} evaluations as CSV.`, 'ok');
}

// ─── API KEY ──────────────────────────────────────────────────────────────────
export function loadSavedApiKey() {
  const saved = loadApiKey();
  if (saved) document.getElementById('api-key').value = saved;
  updateProviderBadge();
}

export function handleApiKeyInput(value) {
  saveApiKey(value);
  updateProviderBadge();
}
