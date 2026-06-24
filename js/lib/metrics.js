/** Pure scoring math shared by the metric bar and the sessions tab. */

/**
 * Compute TP/TN/FP/FN over a list of evaluations.
 * Truncated predictions are excluded from the matrix.
 * @returns {{tp:number, tn:number, fp:number, fn:number}}
 */
export function confusionMatrix(evaluations) {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  evaluations.forEach(e => {
    const gt = e.groundTruth;
    const pred = e.modelPrediction === 'Truncated' ? null : e.modelPrediction;
    if (!pred) return;
    if (gt === 'Success' && pred === 'Success') tp++;
    else if (gt === 'Failure' && pred === 'Failure') tn++;
    else if (gt === 'Failure' && pred === 'Success') fp++;
    else if (gt === 'Success' && pred === 'Failure') fn++;
  });
  return { tp, tn, fp, fn };
}

/** Overall accuracy as a 0-100 integer, or null when there are no evaluations. */
export function accuracyPct(evaluations) {
  const total = evaluations.length;
  if (total === 0) return null;
  const accurate = evaluations.filter(e => e.accuracy === 'Accurate').length;
  return Math.round((accurate / total) * 100);
}
