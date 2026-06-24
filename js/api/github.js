export async function callGitHub(token, model, prompt, frames) {
  const body = {
    model,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, ...frames.map(f => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${f}`, detail: 'low' } }))] }]
  };
  if (model.includes('gpt-5') || model.startsWith('o')) body.max_completion_tokens = 2048;
  else body.max_tokens = 2048;

  const res = await fetch('https://models.inference.ai.azure.com/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error?.message || `HTTP ${res.status}`); }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '(empty response)';
}
