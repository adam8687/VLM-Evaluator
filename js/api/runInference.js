/** Orchestrates provider dispatch and builds the hidden frame-context prompt. */
import { detectProvider } from './detectProvider.js';
import { callOpenAI } from './openai.js';
import { callGemini } from './gemini.js';
import { callGitHub } from './github.js';
import { callQwen } from './qwen.js';

/**
 * @param {{apiKey:string, model:string, prompt:string, frames:string[], numFrames:number, vidDuration:string}} args
 * @returns {Promise<string>} model output text
 */
export async function runInference({ apiKey, model, prompt, frames, numFrames, vidDuration }) {
  const hiddenContext = `\n\n[SYSTEM CONTEXT: You are analyzing exactly ${numFrames} static frames extracted evenly from a ${vidDuration}-second video. Frame 1 represents 0.0s and Frame ${numFrames} represents ${vidDuration}s. You must mathematically interpolate exact timestamps for any events you describe based on this frame scale.]`;
  const finalPrompt = prompt + hiddenContext;

  const provider = detectProvider(model, apiKey);
  if (provider === 'gemini') return callGemini(apiKey, model, finalPrompt, frames);
  if (provider === 'github') return callGitHub(apiKey, model, finalPrompt, frames);
  if (provider === 'qwen') return callQwen(apiKey, model, finalPrompt, frames);
  return callOpenAI(apiKey, model, finalPrompt, frames);
}
