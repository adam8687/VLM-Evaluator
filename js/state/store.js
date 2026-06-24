/**
 * Single source of truth for sessions + workbench form state.
 * Mutate properties on this object; modules read live values from it.
 *
 * @typedef {Object} Evaluation
 * @property {number} id
 * @property {number} seq
 * @property {string} videoId
 * @property {string} modelName
 * @property {string} promptText
 * @property {string} modelOutput
 * @property {'Success'|'Failure'} groundTruth
 * @property {'Success'|'Failure'|'Truncated'} modelPrediction
 * @property {'Accurate'|'Flawed'} accuracy
 * @property {string[]} errorTags
 * @property {string} notes
 * @property {string} timestamp
 *
 * @typedef {Object} Session
 * @property {string} id
 * @property {string} name
 * @property {string} createdAt
 * @property {Evaluation[]} evaluations
 */
export const store = {
  /** @type {Session[]} */
  allSessions: [],
  /** @type {string|null} */
  currentSessionId: null,
  /** @type {Evaluation[]} live reference to the current session's evaluations */
  evaluations: [],

  // Workbench form state
  currentAccuracy: null,
  groundTruth: null,
  modelPrediction: null,
  currentVideoURL: null,

  // Toast timer handle
  toastTimer: null,

  /** Set when localStorage session data fails to parse */
  storageWarning: null
};

export function getCurrentSession() {
  return store.allSessions.find(s => s.id === store.currentSessionId) || store.allSessions[0];
}

export function makeSession(name) {
  return { id: Date.now().toString() + Math.random().toString(36).slice(2), name, createdAt: new Date().toISOString(), evaluations: [] };
}

export function defaultSessionName() {
  const n = store.allSessions.length + 1;
  const d = new Date();
  const ds = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const ts = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `Session ${n} · ${ds} ${ts}`;
}
