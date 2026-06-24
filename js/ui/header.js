import { getCurrentSession } from '../state/store.js';

export function updateSessionIndicator() {
  const s = getCurrentSession();
  if (!s) return;
  const nameEl = document.getElementById('session-name');
  if (nameEl) nameEl.value = s.name;
  const countEl = document.getElementById('session-eval-count');
  if (countEl) countEl.textContent = s.evaluations.length ? `${s.evaluations.length} eval${s.evaluations.length !== 1 ? 's' : ''}` : 'empty';
}

export function updateProviderBadge() {
  const model = (document.getElementById('model-select')?.value || '').toLowerCase();
  const key = (document.getElementById('api-key')?.value || '');
  const badge = document.getElementById('provider-badge');
  if (!badge) return;
  if (model.startsWith('gemini')) {
    badge.textContent = 'Google';
    badge.className = 'api-provider-badge provider-gemini';
  } else if (model.startsWith('qwen')) {
    badge.textContent = 'Alibaba';
    badge.className = 'api-provider-badge provider-openai';
  } else if (key.startsWith('ghp_') || key.startsWith('github_pat_')) {
    badge.textContent = 'GitHub — free';
    badge.className = 'api-provider-badge provider-github';
  } else {
    badge.textContent = 'OpenAI';
    badge.className = 'api-provider-badge provider-openai';
  }
}
