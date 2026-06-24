export async function callGemini(apiKey, model, prompt, frames) {
  const modelId = model.startsWith('models/') ? model : `models/${model}`;
  const parts = [{ text: prompt }, ...frames.map(f => ({ inline_data: { mime_type: 'image/jpeg', data: f } }))];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelId}:generateContent?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error?.message || `HTTP ${res.status}`); }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '(empty response)';
}
