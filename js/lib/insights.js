/** Pure insight generation. Returns data objects, not HTML. */
import { ERROR_MODES } from '../constants.js';
import { escapeHtml } from '../utils.js';

/**
 * Error counts per mode for flawed responses.
 * @returns {Array<{label:string, count:number, pct:number}>} sorted desc, zero-counts removed
 */
export function errorBreakdown(evaluations) {
  const counts = {};
  ERROR_MODES.forEach(m => counts[m] = 0);
  evaluations.forEach(e => e.errorTags.forEach(t => { if (counts[t] !== undefined) counts[t]++; }));

  const flawedTotal = evaluations.filter(e => e.accuracy === 'Flawed').length;
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      count,
      pct: flawedTotal > 0 ? Math.round((count / flawedTotal) * 100) : 0
    }));
}

/**
 * Generate automated insight objects.
 * @returns {Array<{label:string, text:string}>} text may contain inline HTML
 */
export function generateInsights(evaluations) {
  const insights = [];
  const total = evaluations.length;
  if (total === 0) return insights;

  const flawed = evaluations.filter(e => e.accuracy === 'Flawed').length;
  const accurate = total - flawed;
  const accPct = Math.round((accurate / total) * 100);

  const byModel = {};
  evaluations.forEach(e => {
    if (!byModel[e.modelName]) byModel[e.modelName] = { total: 0, accurate: 0, errors: {} };
    byModel[e.modelName].total++;
    if (e.accuracy === 'Accurate') byModel[e.modelName].accurate++;
    e.errorTags.forEach(t => {
      byModel[e.modelName].errors[t] = (byModel[e.modelName].errors[t] || 0) + 1;
    });
  });

  insights.push({ label: 'Overall', text: `Across ${total} evaluation${total > 1 ? 's' : ''}, overall model accuracy is <strong>${accPct}%</strong> (${accurate} accurate, ${flawed} flawed).` });

  Object.entries(byModel).forEach(([model, data]) => {
    const mAcc = Math.round((data.accurate / data.total) * 100);
    const mFlawed = data.total - data.accurate;
    let txt = `<strong>${escapeHtml(model)}</strong> achieved <strong>${mAcc}%</strong> accuracy on ${data.total} video${data.total > 1 ? 's' : ''}.`;
    if (mFlawed > 0) {
      const topErr = Object.entries(data.errors).sort((a, b) => b[1] - a[1]);
      if (topErr.length > 0) {
        const errPct = Math.round((topErr[0][1] / mFlawed) * 100);
        txt += ` Primary failure mode: <strong>${topErr[0][0]}</strong> (${errPct}% of flawed responses).`;
      }
    }
    insights.push({ label: 'Model', text: txt });
  });

  const errCounts = {};
  evaluations.forEach(e => e.errorTags.forEach(t => errCounts[t] = (errCounts[t] || 0) + 1));
  const topErrors = Object.entries(errCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  topErrors.forEach(([err, count]) => {
    const pct = flawed > 0 ? Math.round((count / flawed) * 100) : 0;
    insights.push({ label: 'Error Pattern', text: `<strong>${err}</strong> accounts for <strong>${pct}%</strong> of all flawed responses (${count} occurrence${count > 1 ? 's' : ''}).` });
  });

  const truncated = evaluations.filter(e => e.modelPrediction === 'Truncated').length;
  if (truncated > 0) {
    const tPct = Math.round((truncated / total) * 100);
    insights.push({ label: 'Truncation', text: `${tPct}% of model responses were truncated (${truncated} of ${total}). Consider increasing max token limits.` });
  }

  const successVids = evaluations.filter(e => e.groundTruth === 'Success').length;
  const failureVids = evaluations.filter(e => e.groundTruth === 'Failure').length;
  if (total >= 2) {
    insights.push({ label: 'Dataset', text: `Dataset balance: <strong>${successVids}</strong> success video${successVids !== 1 ? 's' : ''} vs <strong>${failureVids}</strong> failure video${failureVids !== 1 ? 's' : ''}. ${Math.abs(successVids - failureVids) > total * 0.4 ? 'Consider balancing the test set.' : 'Distribution looks reasonable.'}` });
  }

  return insights;
}
