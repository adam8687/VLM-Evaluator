/** Error-mode tags used across the evaluate form, insights, and error bars. */
export const ERROR_MODES = [
  'Hallucinated Asset',
  'Temporal / Timestamp Error',
  'Perspective Illusion',
  'Missed Root Cause',
  'Context Loss',
  'Other'
];

/** localStorage keys. Must remain stable for backward compatibility. */
export const STORAGE_KEYS = {
  sessions: 'videoLLMSessions',
  legacyEvals: 'videoLLMEvals',
  apiKey: 'llmApiKey'
};
