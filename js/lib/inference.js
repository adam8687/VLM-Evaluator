/** Pure heuristics for auto-detecting labels from filenames and model output. */

export function inferGroundTruth(filename) {
  const name = String(filename || '').toLowerCase();
  if (!name) return null;
  const hasSuccess = /(^|[^a-z])(success|successful|passed|pass)($|[^a-z])/.test(name);
  const hasFailure = /(^|[^a-z])(failure|failed|fail|error)($|[^a-z])/.test(name);
  if (hasSuccess && !hasFailure) return 'Success';
  if (hasFailure && !hasSuccess) return 'Failure';
  return null;
}

export function inferPrediction(output) {
  const text = String(output || '').trim().toLowerCase();
  if (!text) return null;
  if (text.startsWith('[error]') || /\b(truncated|cut off|incomplete response|max token)\b/.test(text)) return 'Truncated';

  const statusMatch = text.match(/final[_\s-]?status[:\s]+([a-z-]+)/);
  if (statusMatch) {
    const s = statusMatch[1];
    if (/success/.test(s)) return 'Success';
    if (/fail|inconclusive|truncat/.test(s)) return s.includes('truncat') ? 'Truncated' : 'Failure';
  }

  const hasSuccess = /\b(success|successful|succeeded|pass|passed|task complete|completed successfully|achieved|correctly placed|locked|closed successfully)\b/.test(text);
  const hasFailure = /\b(failure|failed|fail|failing|unsuccessful|error|not complete|did not|couldn't|could not|dropped|missed|wrong|incorrect|never)\b/.test(text);

  if (hasSuccess && !hasFailure) return 'Success';
  if (hasFailure && !hasSuccess) return 'Failure';
  if (hasSuccess && hasFailure) return 'Failure';
  return null;
}

export function inferErrorTags(output) {
  const text = String(output || '').toLowerCase();
  const tags = [];
  if (/\b(hallucin|fabricat|invented|non-?existent|not present|doesn't exist|ghost)\b/.test(text)) tags.push('Hallucinated Asset');
  if (/\b(timestamp|time.?step|temporal|frame \d|second|at \d+s|:xx|00:|timing)\b/.test(text)) tags.push('Temporal / Timestamp Error');
  if (/\b(perspective|angle|camera|side.?view|overhead|occlud|depth|parallax|illusion)\b/.test(text)) tags.push('Perspective Illusion');
  if (/\b(root.?cause|why|reason|underlying|misidentif|wrong cause|attributed)\b/.test(text)) tags.push('Missed Root Cause');
  if (/\b(context|earlier|previous|prior frame|forgot|lost track|unaware)\b/.test(text)) tags.push('Context Loss');
  return tags;
}
