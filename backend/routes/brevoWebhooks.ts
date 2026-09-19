/**
 * brevoWebhooks.ts — Brevo (ex-Sendinblue) webhook receiver
 *
 * POST /api/webhooks/brevo   — receives tracking events (delivered, opened, clicked, bounced, unsubscribed)
 *
 * No authentication required — Brevo sends these server-to-server.
 * Always returns 200 (Brevo retries on non-2xx).
 *
 * Expected payload (Brevo webhook format):
 * {
 *   "event": "delivered|opened|clicked|bounced|unsubscribed",
 *   "email": "contact@example.com",
 *   "id": 123,               // message ID
 *   "date": "2024-01-01T00:00:00.000Z",
 *   "tags": ["campaign_abc123"],
 *   "campaign_id": 12345,     // Brevo campaign ID (optional)
 *   "reason": "hard-bounce",  // for bounced events
 *   "link": "https://...",    // for clicked events
 *   "subject": "...",
 *   "sender": "noreply@kompilot.fr",
 *   ...
 * }
 */
import { requireBlinkProjectId } from '../lib/blinkConfig';
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

export const brevoWebhookRouter = new Hono();

function getBlink(env: Record<string, string>) {
  return createClient({ projectId: requireBlinkProjectId(env), secretKey: env.BLINK_SECRET_KEY });
}

function uid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

/** Map Brevo event names to our internal event types */
const EVENT_MAP: Record<string, string> = {
  delivered: 'delivered',
  sent: 'delivered',
  opened: 'opened',
  click: 'clicked',
  clicked: 'clicked',
  soft_bounce: 'bounced',
  hard_bounce: 'bounced',
  bounced: 'bounced',
  unsubscribed: 'unsubscribed',
  unsubscribe: 'unsubscribed',
  spam: 'complaint',
  complaint: 'complaint',
};

/** Map event type to campaign counter field */
const COUNTER_FIELD: Record<string, string> = {
  opened: 'openCount',
  clicked: 'clickCount',
  bounced: 'bounceCount',
  unsubscribed: 'unsubscribeCount',
};

brevoWebhookRouter.post('/api/webhooks/brevo', async (c) => {
  try {
    const body = await c.req.json();

    // Validate minimum required fields
    if (!body.event) {
      console.warn('[Brevo Webhook] Missing event type');
      return c.json({ received: true });
    }

    const email = (body.email ?? '').toLowerCase().trim();
    const rawEvent = String(body.event).toLowerCase();
    const eventType = EVENT_MAP[rawEvent] ?? rawEvent;

    if (!email) {
      console.warn('[Brevo Webhook] Missing email in event:', rawEvent);
      return c.json({ received: true });
    }

    const blink = getBlink(c.env as Record<string, string>);

    // Extract campaign ID from tags (format: "campaign_{localId}")
    let localCampaignId: string | null = null;
    if (Array.isArray(body.tags)) {
      for (const tag of body.tags) {
        if (typeof tag === 'string' && tag.startsWith('campaign_')) {
          localCampaignId = tag.replace('campaign_', '');
          break;
        }
      }
    }

    // Also try matching by Brevo campaign ID
    let brevoCampaignId: string | null = body.campaign_id ? String(body.campaign_id) : null;

    // Try to find our local campaign if not found via tags
    if (!localCampaignId && brevoCampaignId) {
      try {
        const campaigns = await (blink as any).db.table('campaigns').list({
          where: { brevoCampaignId },
          limit: 1,
          select: ['id'],
        });
        if (campaigns.length > 0) {
          localCampaignId = campaigns[0].id;
        }
      } catch { /* non-critical */ }
    }

    // Build event data
    const eventData: Record<string, any> = {};
    if (body.reason) eventData.reason = body.reason;
    if (body.link) eventData.link = body.link;
    if (body.subject) eventData.subject = body.subject;
    if (brevoCampaignId) eventData.brevoCampaignId = brevoCampaignId;
    if (body.message_id) eventData.messageId = body.message_id;
    if (body.ip) eventData.ip = body.ip;
    if (body['user-agent']) eventData.userAgent = body['user-agent'];

    // Insert campaign event (only if we identified the campaign)
    if (localCampaignId) {
      try {
        await (blink as any).db.table('campaign_events').create({
          id: uid(),
          campaignId: localCampaignId,
          contactEmail: email,
          eventType,
          eventData: JSON.stringify(eventData),
          ipAddress: body.ip ?? '',
          userAgent: body['user-agent'] ?? '',
          brevoEventId: body['message-id'] ? String(body['message_id'] ?? '') : '',
          createdAt: body.date ?? new Date().toISOString(),
        });
      } catch (insertErr: any) {
        console.error('[Brevo Webhook] Event insert error:', insertErr.message);
      }

      // Update campaign counters
      const counterField = COUNTER_FIELD[eventType];
      if (counterField) {
        try {
          const campaign = await (blink as any).db.table('campaigns').get(localCampaignId);
          if (campaign) {
            const currentValue = Number(campaign[counterField] ?? 0);
            await (blink as any).db.table('campaigns').update(localCampaignId, {
              [counterField]: currentValue + 1,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (updateErr: any) {
          console.error('[Brevo Webhook] Counter update error:', updateErr.message);
        }
      }
    } else {
      // Log event without campaign association (for debugging)
      console.log('[Brevo Webhook] Unmatched event:', {
        event: eventType,
        email,
        brevoCampaignId,
        tags: body.tags,
      });
    }

    // Always return 200 — Brevo retries on non-2xx
    return c.json({ received: true });
  } catch (err: any) {
    console.error('[Brevo Webhook] Parse error:', err.message);
    // Still return 200 to prevent Brevo retries
    return c.json({ received: true, warning: 'parse_error' });
  }
});
