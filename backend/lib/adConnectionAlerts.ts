import { decryptToken } from './tokenEncryption';
import type { AdProvider, AdTenantContext } from './adTenantStore';

export async function notifyAdConnectionFailure(blink: any, env: Record<string, string>, context: AdTenantContext, provider: AdProvider, message: string) {
  const events = blink.db.table<any>('ad_connection_events');
  await events.create({ id: `ad_event_${crypto.randomUUID()}`, userId: context.userId, organizationId: context.organizationId, provider, eventType: 'connection_error', message });
  try {
    await blink.db.table<any>('notifications_queue').create({ id: `ad_notification_${crypto.randomUUID()}`, userId: context.userId, title: `${provider === 'meta' ? 'Meta Ads' : 'Google Ads'} déconnecté`, body: message, type: 'ad_connection', url: '/settings?tab=connexions', icon: 'shield-alert', status: 'sent' });
  } catch (error) { console.error('[Ad alert] in-app notification failed', error); }
  const prefs = await blink.db.table<any>('ad_alert_preferences').list({ where: { organizationId: context.organizationId, provider }, limit: 1 });
  const preference = prefs[0];
  if (!preference || Number(preference.slackEnabled) === 0 || !preference.slackWebhookUrlEncrypted) return;
  try {
    const webhook = await decryptToken(preference.slackWebhookUrlEncrypted, env.TOKEN_ENCRYPTION_KEY);
    if (!webhook.startsWith('https://hooks.slack.com/')) return;
    await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `⚠️ Connexion ${provider === 'meta' ? 'Meta Ads' : 'Google Ads'} perdue pour l’organisation ${context.organizationId}. ${message}` }), signal: AbortSignal.timeout(8_000) });
  } catch (error) { console.error('[Ad alert] Slack notification failed', error); }
}
