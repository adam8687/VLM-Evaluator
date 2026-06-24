import { store } from '../state/store.js';
import { extractFrames, frameCalculator } from '../services/video.js';
import { inferGroundTruth, inferPrediction, inferErrorTags } from '../lib/inference.js';
import { runInference } from '../api/runInference.js';
import { showToast } from './toast.js';
import { switchTab } from './tabs.js';
import { escapeHtml } from '../utils.js';

// ─── FILE UPLOAD & FRAMES ─────────────────────────────────────────────────────
export function initDropZone() {
  const dropZone = document.getElementById('drop-zone');
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) loadVideoFile(file);
  });
}

export function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) loadVideoFile(file);
}

export function updateFrameCalc() {
  const player = document.getElementById('video-player');
  if (!player.duration || isNaN(player.duration)) return;
  const fpsMultiplier = document.getElementById('fps-select').value;
  document.getElementById('frame-count').value = frameCalculator(player.duration, fpsMultiplier);
}

export function loadVideoFile(file) {
  if (store.currentVideoURL) URL.revokeObjectURL(store.currentVideoURL);
  store.currentVideoURL = URL.createObjectURL(file);
  const player = document.getElementById('video-player');

  player.onloadedmetadata = function () {
    updateFrameCalc();
    showToast(`Video loaded. Frame count auto-calculated.`, 'info');
  };

  player.onerror = function () {
    showToast('Error: Your web browser cannot read this video format or codec. Try converting to H.264/MP4.', 'warn');
  };

  player.src = store.currentVideoURL;
  player.style.display = 'block';

  const playControls = document.getElementById('video-playback-controls');
  if (playControls) playControls.style.display = 'flex';

  document.getElementById('drop-icon').innerHTML = '<i data-lucide="file-video" class="w-8 h-8" style="color:var(--green)"></i>';
  document.getElementById('drop-label').textContent = file.name;
  const fd = document.getElementById('filename-display');
  fd.style.display = 'flex';
  document.getElementById('filename-text').textContent = file.name;
  if (!document.getElementById('video-id').value) {
    document.getElementById('video-id').value = file.name;
  }
  applyGroundTruthFromVideoId(file.name);
  lucide.createIcons();
}

export function clearVideoUpload() {
  const player = document.getElementById('video-player');
  player.pause();
  player.removeAttribute('src');
  player.load();
  player.style.display = 'none';
  const playControls = document.getElementById('video-playback-controls');
  if (playControls) playControls.style.display = 'none';
  if (store.currentVideoURL) { URL.revokeObjectURL(store.currentVideoURL); store.currentVideoURL = null; }
  document.getElementById('drop-icon').innerHTML = '<i data-lucide="upload-cloud" class="w-8 h-8"></i>';
  document.getElementById('drop-label').textContent = 'Drop MP4 here or click to browse';
  document.getElementById('filename-display').style.display = 'none';
  document.getElementById('filename-text').textContent = '';
  document.getElementById('file-input').value = '';
  lucide.createIcons();
}

// ─── AUTO-DETECTION (applies inference results to the DOM) ─────────────────────
export function setRadioValue(group, value) {
  const target = document.querySelector(`[data-group="${group}"][data-val="${value}"]`);
  if (!target) return false;
  selectRadio(target, group);
  return true;
}

export function autoSetAccuracyFromLabels() {
  if (!store.groundTruth || !store.modelPrediction) return;
  if (store.modelPrediction === 'Truncated') {
    setAccuracy('Flawed');
    return;
  }
  setAccuracy(store.groundTruth === store.modelPrediction ? 'Accurate' : 'Flawed');
}

export function applyGroundTruthFromVideoId(videoId) {
  const inferred = inferGroundTruth(videoId);
  if (!inferred) return;
  if (setRadioValue('gt', inferred)) {
    autoSetAccuracyFromLabels();
  }
}

export function applyPredictionFromOutput(outputText) {
  const inferred = inferPrediction(outputText);
  if (!inferred) return;
  if (setRadioValue('pred', inferred)) {
    autoSetAccuracyFromLabels();
  }
}

export function applyErrorTagsFromOutput(outputText) {
  const tags = inferErrorTags(outputText);
  if (store.currentAccuracy === 'Accurate') return;
  document.querySelectorAll('#error-checkboxes input[type="checkbox"]').forEach(cb => {
    const shouldCheck = tags.includes(cb.value);
    if (shouldCheck !== cb.checked) {
      cb.checked = shouldCheck;
      toggleCheckStyle(cb);
    }
  });
}

export function analyzeModelOutput(text) {
  if (!text.trim()) return;
  applyPredictionFromOutput(text);
  applyErrorTagsFromOutput(text);
  const status = document.getElementById('output-status');
  if (status && status.textContent.includes('awaiting')) {
    status.textContent = 'pasted';
    status.style.color = 'var(--blue)';
  }
}

// ─── FORM CONTROLS ────────────────────────────────────────────────────────────
export function selectRadio(el, group) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach(btn => {
    btn.className = 'radio-btn';
  });
  const val = el.dataset.val;
  if (val === 'Success') el.classList.add('selected-success');
  else if (val === 'Failure') el.classList.add('selected-failure');
  else if (val === 'Truncated') el.classList.add('selected-truncated');

  if (group === 'gt') store.groundTruth = val;
  if (group === 'pred') store.modelPrediction = val;

  autoSetAccuracyFromLabels();
}

export function setAccuracy(val) {
  store.currentAccuracy = val;
  document.getElementById('btn-accurate').className = 'acc-btn' + (val === 'Accurate' ? ' acc-accurate' : '');
  document.getElementById('btn-flawed').className = 'acc-btn' + (val === 'Flawed' ? ' acc-flawed' : '');
}

export function toggleCheckStyle(input) {
  const label = input.closest('label');
  if (input.checked) label.classList.add('checked');
  else label.classList.remove('checked');
}

export function syncPromptPreview() {
  const val = document.getElementById('prompt-text').value.trim();
  const el = document.getElementById('prompt-preview');
  if (!el) return;
  el.innerHTML = val ? `<span style="color:var(--text-primary);">${escapeHtml(val)}</span>` : `<em style="color:var(--surface-4);">Enter a prompt in the left panel…</em>`;
}

export function loadLogToWorkbench(vidId, gtLabel) {
  // closeCompareModal is exposed globally; call lazily to avoid an import cycle.
  if (window.closeCompareModal) window.closeCompareModal();
  switchTab('evaluate');

  document.getElementById('video-id').value = vidId;
  if (gtLabel) {
    setRadioValue('gt', gtLabel);
  }

  const dropZone = document.getElementById('drop-zone');
  dropZone.style.borderColor = 'var(--blue)';
  dropZone.style.background = 'rgba(56, 189, 248, 0.1)';

  setTimeout(() => {
    dropZone.style.borderColor = '';
    dropZone.style.background = '';
  }, 1500);

  showToast(`Loaded ${vidId}. Drop the original MP4 file into the upload zone above to watch it.`, 'info');
}

// ─── RUN MODEL ────────────────────────────────────────────────────────────────
export async function runModel() {
  const video = document.getElementById('video-player');
  const apiKey = document.getElementById('api-key').value.trim();
  const model = document.getElementById('model-select').value.trim();
  const userPrompt = document.getElementById('prompt-text').value.trim();
  const numFrames = Math.max(1, Math.min(200, parseInt(document.getElementById('frame-count').value) || 8));

  if (!apiKey) { showToast('Enter your API key first.', 'warn'); return; }
  if (!model) { showToast('Select or type a model name.', 'warn'); return; }
  if (!userPrompt) { showToast('Write a prompt first.', 'warn'); return; }
  if (!video.src || video.readyState < 1) { showToast('Upload a video file first.', 'warn'); return; }

  setRunLoading(true);
  document.getElementById('model-output').value = '';
  document.getElementById('output-status').innerHTML = '<span style="display:flex; align-items:center; gap:4px;"><i data-lucide="loader-2" class="w-3 h-3 spin"></i> running…</span>';
  document.getElementById('output-status').style.color = 'var(--yellow)';
  lucide.createIcons();

  try {
    showToast(`Extracting ${numFrames} frames…`, 'info');
    const frames = await extractFrames(video, numFrames);

    const vidDuration = video.duration.toFixed(1);
    showToast(`Calling ${model}…`, 'info');
    const output = await runInference({ apiKey, model, prompt: userPrompt, frames, numFrames, vidDuration });

    document.getElementById('model-output').value = output;
    document.getElementById('model-output').scrollTop = 0;
    applyPredictionFromOutput(output);
    document.getElementById('output-status').innerHTML = `<span style="display:flex; align-items:center; gap:4px;"><i data-lucide="check" class="w-3 h-3"></i> Output from ${model}</span>`;
    document.getElementById('output-status').style.color = 'var(--green)';
    lucide.createIcons();
    showToast('Response received — review and score below.', 'ok');
  } catch (err) {
    document.getElementById('model-output').value = `[Error] ${err.message}`;
    document.getElementById('output-status').innerHTML = `<span style="display:flex; align-items:center; gap:4px;"><i data-lucide="x" class="w-3 h-3"></i> Error</span>`;
    document.getElementById('output-status').style.color = 'var(--red)';
    lucide.createIcons();
    showToast(`${err.message}`, 'warn');
  } finally {
    setRunLoading(false);
  }
}

function setRunLoading(on) {
  const btn = document.getElementById('run-model-btn');
  btn.disabled = on;
  btn.innerHTML = on ? '<span style="display:flex; align-items:center; gap:6px;"><i data-lucide="loader-2" class="w-4 h-4 spin"></i> Running…</span>' : '<span style="display:flex; align-items:center; gap:6px;"><i data-lucide="play" class="w-4 h-4"></i> Run Model</span>';
  lucide.createIcons();
}
