/** JSON + CSV export. Builds blobs and triggers download. */
import { csvEsc, dateStamp, downloadBlob } from '../utils.js';

export function exportEvaluationsJSON(evaluations) {
  const payload = { exportedAt: new Date().toISOString(), totalEvaluations: evaluations.length, evaluations };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `video-llm-eval-${dateStamp()}.json`);
}

export function exportEvaluationsCSV(evaluations) {
  const headers = ['#','Video ID','Model','Prompt','Ground Truth','Model Prediction','Accuracy','Error Tags','Notes','Timestamp'];
  const rows = evaluations.map(e => [ e.seq, csvEsc(e.videoId), csvEsc(e.modelName), csvEsc(e.promptText), e.groundTruth, e.modelPrediction, e.accuracy, csvEsc(e.errorTags.join('; ')), csvEsc(e.notes), csvEsc(e.timestamp) ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadBlob(blob, `video-llm-eval-${dateStamp()}.csv`);
}
