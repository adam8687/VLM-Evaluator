export async function callQwen(apiKey, model, prompt, frames) {
  const body = {
    model,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, ...frames.map(f => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${f}` } }))] }],
    max_tokens: 2048
  };

  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '(empty response)';
}
