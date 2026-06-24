/** localStorage persistence: sessions, legacy migration, and API key. No DOM. */
import { STORAGE_KEYS } from '../constants.js';
import { store, getCurrentSession, makeSession, defaultSessionName } from '../state/store.js';

/**
 * Load sessions into the store, migrating legacy data and ensuring an active session.
 * Returns nothing; mutates `store`.
 */
export function loadSessions() {
  let parseFailed = false;
  const raw = localStorage.getItem(STORAGE_KEYS.sessions);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      store.allSessions = data.sessions || [];
      store.currentSessionId = data.currentSessionId || null;
    } catch (e) {
      parseFailed = true;
      console.error('Could not read saved sessions:', e);
      store.storageWarning =
        'Saved session data could not be read. Your previous data is still in localStorage — try opening the app the same way you did before, or restore from a JSON export.';
    }
  }

  const legacy = localStorage.getItem(STORAGE_KEYS.legacyEvals);
  if (legacy && store.allSessions.length === 0 && !parseFailed) {
    try {
      const old = JSON.parse(legacy);
      if (old.length > 0) {
        const s = makeSession('Session 1 (migrated)');
        s.evaluations = old;
        store.allSessions = [s];
        store.currentSessionId = s.id;
        saveSessions();
        localStorage.removeItem(STORAGE_KEYS.legacyEvals);
      }
    } catch (e) {}
  }

  if (store.allSessions.length === 0 || !store.currentSessionId || !store.allSessions.find(s => s.id === store.currentSessionId)) {
    const s = makeSession(defaultSessionName());
    store.allSessions = store.allSessions.length ? store.allSessions : [s];
    store.currentSessionId = store.allSessions[store.allSessions.length - 1].id;
    if (!parseFailed) saveSessions();
  }
  store.evaluations = getCurrentSession().evaluations;
}

/** Persist the current session's evaluations and the full session list. */
export function saveSessions() {
  getCurrentSession().evaluations = store.evaluations;
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify({ currentSessionId: store.currentSessionId, sessions: store.allSessions }));
}

export function loadApiKey() {
  return localStorage.getItem(STORAGE_KEYS.apiKey) || '';
}

export function saveApiKey(value) {
  localStorage.setItem(STORAGE_KEYS.apiKey, value);
}
