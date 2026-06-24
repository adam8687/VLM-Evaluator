/** Entry point: wires inline handlers to window, then initializes the app. */
import { loadSessions } from './services/storage.js';
import { renderTable } from './ui/log.js';
import { updateMetrics } from './ui/metrics.js';
import { renderInsights } from './ui/insights.js';
import { renderSessionsTab } from './ui/sessions.js';
import { updateSessionIndicator, updateProviderBadge } from './ui/header.js';
import { switchTab } from './ui/tabs.js';
import { openCompareModal, closeCompareModal } from './ui/compareModal.js';
import { showToast } from './ui/toast.js';
import { store } from './state/store.js';
import {
  initDropZone, handleFileUpload, updateFrameCalc, clearVideoUpload,
  applyGroundTruthFromVideoId, analyzeModelOutput, selectRadio, setAccuracy,
  toggleCheckStyle, syncPromptPreview, loadLogToWorkbench, runModel
} from './ui/evaluate.js';
import {
  submitEvaluation, resetForm, renameVideoId, deleteEntry,
  newSession, loadSession, deleteSession, renameSession,
  importJSON, exportJSON, exportCSV, loadSavedApiKey, handleApiKeyInput
} from './state/actions.js';

// Inline HTML handlers (onclick/oninput/onchange) need these on the global scope.
Object.assign(window, {
  // tabs / header
  switchTab, renameSession, updateProviderBadge, handleApiKeyInput,
  // evaluate workbench
  handleFileUpload, updateFrameCalc, clearVideoUpload, applyGroundTruthFromVideoId,
  analyzeModelOutput, selectRadio, setAccuracy, toggleCheckStyle, syncPromptPreview,
  loadLogToWorkbench, runModel,
  // evaluation crud
  submitEvaluation, resetForm, renameVideoId, deleteEntry,
  // sessions
  newSession, loadSession, deleteSession, openCompareModal, closeCompareModal,
  // import / export
  importJSON, exportJSON, exportCSV
});

function init() {
  lucide.createIcons();
  initDropZone();
  loadSessions();
  loadSavedApiKey();
  renderTable();
  updateMetrics();
  renderInsights();
  renderSessionsTab();
  updateSessionIndicator();

  if (store.storageWarning) showToast(store.storageWarning, 'warn', 8000);
  else if (location.protocol === 'file:') {
    showToast(
      'Opened as a local file. Sessions are stored per browser URL — if data looks missing, open the app the same way you did before (e.g. editor preview) and use Export JSON, or run serve.ps1 for a stable local URL.',
      'info',
      10000
    );
  }
}

init();
