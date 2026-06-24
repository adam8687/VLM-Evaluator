/** Pure helpers with no app state or DOM dependencies. */

export function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function csvEsc(val) {
  const s = String(val || '').replace(/"/g, '""');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
}

export function dateStamp() { return new Date().toISOString().slice(0,10); }

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
