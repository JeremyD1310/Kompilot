import { blink } from '../blink/client';
import { backendFetch } from './backend';

export async function consumeContentQuotaClient(action: string, amount = 1) {
  const token = await blink.auth.getValidToken();
  const response = await backendFetch('/api/content-credits/consume', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, action }),
  }, 10000);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error === 'CONTENT_QUOTA_EXCEEDED'
      ? 'Plafond Machine à Contenu atteint. Ajoutez des crédits depuis Paramètres → Machine à Contenu.'
      : payload.error || 'Impossible de vérifier le quota de contenu.');
  }
  return payload;
}

export async function releaseContentQuotaClient(amount = 1) {
  const token = await blink.auth.getValidToken();
  await backendFetch('/api/content-credits/release', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  }, 10000);
}
