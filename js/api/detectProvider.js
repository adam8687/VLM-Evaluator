/** Decide which provider to call based on model name and API key shape. */
export function detectProvider(model, apiKey) {
  if (model.toLowerCase().startsWith('gemini')) return 'gemini';
  if (model.toLowerCase().startsWith('qwen')) return 'qwen';
  if (apiKey.startsWith('ghp_') || apiKey.startsWith('github_pat_')) return 'github';
  return 'openai';
}
