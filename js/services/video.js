/** Video frame extraction and frame-count calculation. */

export function seekAndCapture(video, time) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Seek timeout — try a shorter video or fewer frames')), 8000);
    const handler = () => { clearTimeout(timeout); video.removeEventListener('seeked', handler); resolve(); };
    video.addEventListener('seeked', handler);
    video.currentTime = time;
  });
}

export async function extractFrames(video, numFrames) {
  const canvas = document.createElement('canvas');
  const MAX_DIM = 512;
  const ar = video.videoWidth / video.videoHeight;
  if (ar >= 1) { canvas.width = MAX_DIM; canvas.height = Math.round(MAX_DIM / ar); }
  else { canvas.height = MAX_DIM; canvas.width = Math.round(MAX_DIM * ar); }
  const ctx = canvas.getContext('2d');
  const dur = video.duration;
  if (!dur || isNaN(dur)) throw new Error('Video duration unavailable — ensure the file is fully loaded.');
  const frames = [];
  for (let i = 0; i < numFrames; i++) {
    const t = numFrames === 1 ? dur / 2 : (dur / (numFrames - 1)) * i;
    await seekAndCapture(video, Math.min(Math.max(t, 0), dur - 0.05));
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.75).split(',')[1]);
  }
  return frames;
}

/** Optimal frame count for a duration given an fps multiplier (clamped 4-200). */
export function frameCalculator(durationInSeconds, fpsMultiplier) {
  const mult = parseFloat(fpsMultiplier) || 1;
  return Math.max(4, Math.min(Math.ceil(durationInSeconds * mult), 200));
}
