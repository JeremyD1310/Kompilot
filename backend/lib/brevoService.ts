/**
 * brevoService.ts — Typed wrapper around the Brevo v3 REST API
 *
 * All methods return `{ success, data?, error? }` and enforce a 10 s timeout.
 * Never expose the API key to the client — this file is server-only.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface BrevoResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SendEmailParams {
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  tags?: string[];
}

export interface CreateCampaignParams {
  name: string;
  subject: string;
  htmlContent: string;
  recipients: number[];      // Brevo list IDs
  scheduledAt?: string;      // ISO 8601
  fromName?: string;
  fromEmail?: string;
  tag?: string;
}

export interface CreateContactParams {
  email: string;
  attributes?: Record<string, any>;
  listIds?: number[];
  updateEnabled?: boolean;
}

export interface SyncContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  [key: string]: any;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const BASE = 'https://api.brevo.com/v3';

function headers(apiKey: string): Record<string, string> {
  return {
    'api-key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
}

async function timedFetch(url: string, init: RequestInit, ms = 10_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ── Service methods ──────────────────────────────────────────────────────────

/**
 * Validate a Brevo API key by hitting the /account endpoint.
 */
export async function testConnection(apiKey: string): Promise<BrevoResult<{ email: string }>> {
  try {
    const res = await timedFetch(`${BASE}/account`, { headers: headers(apiKey) });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { success: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = await res.json() as any;
    return {
      success: true,
      data: { email: data.email ?? data.plan?.[0]?.type ?? 'connected' },
    };
  } catch (e: any) {
    return { success: false, error: e.name === 'AbortError' ? 'Timeout (10 s)' : e.message };
  }
}

/**
 * Fetch the list of email templates from Brevo.
 */
export async function getTemplates(apiKey: string): Promise<BrevoResult<{ templates: Array<{ id: number; name: string; subject: string; isActive: boolean; htmlContent: string }> }>> {
  try {
    const res = await timedFetch(
      `${BASE}/templates?templateType=classic&limit=50&offset=0&sort=desc`,
      { headers: headers(apiKey) },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { success: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    const data = await res.json() as any;
    const templates = (data.templates ?? []).map((t: any) => ({
      id: t.id,
      name: t.name ?? '',
      subject: t.subject ?? '',
      isActive: t.isActive ?? false,
      htmlContent: t.htmlContent ?? '',
    }));
    return { success: true, data: { templates } };
  } catch (e: any) {
    return { success: false, error: e.name === 'AbortError' ? 'Timeout (10 s)' : e.message };
  }
}

/**
 * Create or update a contact in Brevo.
 */
export async function createContact(
  apiKey: string,
  params: CreateContactParams,
): Promise<BrevoResult<{ id: string }>> {
  try {
    const body: Record<string, any> = {
      email: params.email,
      updateEnabled: params.updateEnabled ?? true,
    };
    if (params.attributes && Object.keys(params.attributes).length > 0) {
      body.attributes = params.attributes;
    }
    if (params.listIds && params.listIds.length > 0) {
      body.listIds = params.listIds;
    }

    const res = await timedFetch(`${BASE}/contacts`, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as any;
      // Brevo returns 204 on duplicate — treat as success
      if (res.status === 204 || errBody.code === 'duplicate_parameter') {
        return { success: true, data: { id: 'existing' } };
      }
      return { success: false, error: errBody.message ?? `HTTP ${res.status}` };
    }

    const data = await res.json() as any;
    return { success: true, data: { id: data.id ?? 'created' } };
  } catch (e: any) {
    return { success: false, error: e.name === 'AbortError' ? 'Timeout (10 s)' : e.message };
  }
}

/**
 * Send a transactional email via Brevo SMTP.
 */
export async function sendEmail(
  apiKey: string,
  params: SendEmailParams,
): Promise<BrevoResult<{ messageId: string }>> {
  try {
    const payload: Record<string, any> = {
      sender: { name: params.fromName, email: params.fromEmail },
      to: params.to.map(r => ({ email: r.email, name: r.name ?? r.email })),
      subject: params.subject,
      htmlContent: params.htmlContent,
    };
    if (params.replyTo) {
      payload.replyTo = { email: params.replyTo };
    }
    if (params.tags && params.tags.length > 0) {
      payload.tags = params.tags;
    }

    const res = await timedFetch(`${BASE}/smtp/email`, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as any;
      return { success: false, error: errBody.message ?? `HTTP ${res.status}` };
    }

    const data = await res.json() as any;
    return { success: true, data: { messageId: data.messageId ?? '' } };
  } catch (e: any) {
    return { success: false, error: e.name === 'AbortError' ? 'Timeout (10 s)' : e.message };
  }
}

/**
 * Create a bulk email campaign in Brevo.
 */
export async function createCampaign(
  apiKey: string,
  params: CreateCampaignParams,
): Promise<BrevoResult<{ campaignId: number }>> {
  try {
    const payload: Record<string, any> = {
      name: params.name,
      subject: params.subject,
      htmlContent: params.htmlContent,
      recipients: { listIds: params.recipients },
      type: 'classic',
    };

    if (params.scheduledAt) {
      payload.scheduledAt = params.scheduledAt;
    }
    if (params.fromName || params.fromEmail) {
      payload.sender = {
        name: params.fromName ?? 'Kompilot',
        email: params.fromEmail ?? 'noreply@kompilot.fr',
      };
    }
    if (params.tag) {
      payload.tag = params.tag;
    }

    const res = await timedFetch(`${BASE}/emailCampaigns`, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as any;
      return { success: false, error: errBody.message ?? `HTTP ${res.status}` };
    }

    const data = await res.json() as any;
    return { success: true, data: { campaignId: data.id } };
  } catch (e: any) {
    return { success: false, error: e.name === 'AbortError' ? 'Timeout (10 s)' : e.message };
  }
}

/**
 * Retrieve campaign statistics (opens, clicks, bounces, etc.).
 */
export async function getCampaignStats(
  apiKey: string,
  campaignId: number | string,
): Promise<BrevoResult<Record<string, any>>> {
  try {
    const res = await timedFetch(
      `${BASE}/emailCampaigns/${campaignId}`,
      { headers: headers(apiKey) },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { success: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }

    const data = await res.json() as any;
    const stats = data.statistics?.globalStats ?? {};
    return {
      success: true,
      data: {
        campaignId: data.id,
        name: data.name,
        status: data.status,
        sent: stats.sent ?? 0,
        delivered: stats.delivered ?? 0,
        opens: stats.openers ?? 0,
        uniqueOpens: stats.uniqueOpeners ?? 0,
        clicks: stats.clickers ?? 0,
        uniqueClicks: stats.uniqueClickers ?? 0,
        bounces: stats.hardBounces + stats.softBounces ?? 0,
        hardBounces: stats.hardBounces ?? 0,
        softBounces: stats.softBounces ?? 0,
        unsubscribed: stats.unsubscriptions ?? 0,
        complaints: stats.complaints ?? 0,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.name === 'AbortError' ? 'Timeout (10 s)' : e.message };
  }
}

/**
 * Bulk-import contacts into a Brevo list.
 * Uses the /contacts/import endpoint (up to 50 000 contacts per call).
 */
export async function syncContacts(
  apiKey: string,
  contacts: SyncContact[],
  listId: number,
): Promise<BrevoResult<{ processId: string }>> {
  try {
    const body = {
      listIds: [listId],
      updateExistingContacts: true,
      jsonBody: contacts.map(c => ({
        email: c.email,
        attributes: {
          FIRSTNAME: c.firstName ?? '',
          LASTNAME: c.lastName ?? '',
          SMS: c.phone ?? '',
          COMPANY: c.company ?? '',
          ...(c.tags?.length ? { TAGS: c.tags } : {}),
        },
      })),
    };

    const res = await timedFetch(`${BASE}/contacts/import`, {
      method: 'POST',
      headers: headers(apiKey),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as any;
      return { success: false, error: errBody.message ?? `HTTP ${res.status}` };
    }

    const data = await res.json() as any;
    return { success: true, data: { processId: data.processId ?? '' } };
  } catch (e: any) {
    return { success: false, error: e.name === 'AbortError' ? 'Timeout (10 s)' : e.message };
  }
}
