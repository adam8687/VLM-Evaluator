import { store } from '../state/store.js';

export function showToast(msg, type = 'ok', durationMs = 3000) {
  const toast = document.getElementById('toast');
  const colors = { ok: 'var(--green)', warn: 'var(--yellow)', info: 'var(--blue)' };
  const icon = type === 'ok' ? 'check-circle' : type === 'warn' ? 'alert-triangle' : 'info';

  toast.style.borderColor = colors[type] || 'var(--accent)';
  toast.innerHTML = `<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="${icon}" class="w-4 h-4"></i> ${msg}</div>`;
  lucide.createIcons();

  toast.classList.add('show');
  if (store.toastTimer) clearTimeout(store.toastTimer);
  store.toastTimer = setTimeout(() => toast.classList.remove('show'), durationMs);
}
