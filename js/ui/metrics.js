import { store } from '../state/store.js';
import { confusionMatrix, accuracyPct } from '../lib/metrics.js';

export function updateMetrics() {
  const evaluations = store.evaluations;
  const total = evaluations.length;
  const accurate = evaluations.filter(e => e.accuracy === 'Accurate').length;
  const flawed = evaluations.filter(e => e.accuracy === 'Flawed').length;
  const truncated = evaluations.filter(e => e.modelPrediction === 'Truncated').length;

  const { tp, tn, fp, fn } = confusionMatrix(evaluations);

  const accPct = accuracyPct(evaluations);
  const circumference = 138.2;

  document.getElementById('m-total').textContent = total;
  document.getElementById('m-accuracy').textContent = accPct !== null ? `${accPct}%` : '—';
  document.getElementById('m-tp').textContent = tp;
  document.getElementById('m-tn').textContent = tn;
  document.getElementById('m-fp').textContent = fp;
  document.getElementById('m-fn').textContent = fn;
  document.getElementById('m-flawed').textContent = flawed;
  document.getElementById('m-truncated').textContent = truncated;

  const offset = accPct !== null ? circumference - (circumference * accPct / 100) : circumference;
  document.getElementById('acc-ring').style.strokeDashoffset = offset;
  document.getElementById('acc-ring-text').textContent = accPct !== null ? `${accPct}%` : '0%';
  document.getElementById('acc-progress').style.width = (accPct || 0) + '%';

  const ringColor = accPct === null ? 'var(--green)' : accPct >= 70 ? 'var(--green)' : accPct >= 40 ? 'var(--yellow)' : 'var(--red)';
  document.getElementById('acc-ring').style.stroke = ringColor;
  document.getElementById('acc-progress').style.background = `linear-gradient(90deg, ${ringColor}, ${ringColor}99)`;
}
