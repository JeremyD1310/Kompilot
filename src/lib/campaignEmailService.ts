/**
 * campaignEmailService.ts — Send email campaigns via Blink Notifications SDK
 *
 * Wraps blink.notifications.email() for batch campaign sending with:
 * - Rate limiting (batched sends to avoid 429)
 * - Per-recipient personalization ({{firstName}}, {{company}})
 * - Progress tracking callback
 * - Error collection with partial failure support
 * - Unsubscribe footer (compliance)
 */

import { blink } from '../blink/client';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface CampaignRecipient {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  [key: string]: string | undefined;
}

export interface SendCampaignOptions {
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName?: string;
  replyTo?: string;
  recipients: CampaignRecipient[];
  batchSize?: number;       // default 10
  delayMs?: number;         // default 1000ms between batches
  onProgress?: (sent: number, total: number, errors: number) => void;
}

export interface SendResult {
  totalSent: number;
  totalFailed: number;
  totalRecipients: number;
  errors: Array<{ email: string; error: string }>;
  duration: number; // ms
}

/* ── Personalization ───────────────────────────────────────────────────────── */

function personalize(template: string, vars: Record<string, string | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || vars[key.toLowerCase()] || '');
}

/* ── Compliance footer ─────────────────────────────────────────────────────── */

function addUnsubscribeFooter(html: string, campaignId: string, projectId: string): string {
  const footer = `
    <div style="margin-top:40px;padding:20px 0;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af;font-family:Arial,sans-serif;">
      <p>Vous recevez cet email car vous êtes inscrit(e) à notre liste de diffusion.</p>
      <p><a href="https://${projectId}.blinkpowered.com/unsubscribe?cid=${campaignId}" style="color:#0D9488;text-decoration:underline;">Se désinscrire</a> · <a href="https://${projectId}.blinkpowered.com/preferences" style="color:#0D9488;text-decoration:underline;">Gérer mes préférences</a></p>
    </div>`;
  // Insert before closing body tag, or append at end
  if (html.includes('</body>')) {
    return html.replace('</body>', footer + '</body>');
  }
  return html + footer;
}

/* ── Batch send with rate limiting ─────────────────────────────────────────── */

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function sendCampaign(options: SendCampaignOptions): Promise<SendResult> {
  const {
    subject,
    htmlContent,
    textContent,
    fromName,
    replyTo,
    recipients,
    batchSize = 10,
    delayMs = 1000,
    onProgress,
  } = options;

  const startTime = Date.now();
  const errors: Array<{ email: string; error: string }> = [];
  let sent = 0;
  let failed = 0;

  // Get project ID from blink client
  const projectId = (blink as any).projectId || 'kompilot';

  // Build personalized + compliant HTML for each batch
  const totalBatches = Math.ceil(recipients.length / batchSize);

  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const batchStart = batchIdx * batchSize;
    const batch = recipients.slice(batchStart, batchStart + batchSize);

    // Send all emails in this batch concurrently
    const results = await Promise.allSettled(
      batch.map(async (recipient) => {
        const vars: Record<string, string | undefined> = {
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          company: recipient.company,
          email: recipient.email,
          phone: recipient.phone,
        };

        const personalizedSubject = personalize(subject, vars);
        const personalizedHtml = personalize(htmlContent, vars);
        const compliantHtml = addUnsubscribeFooter(personalizedHtml, `camp-${Date.now()}`, projectId);

        const personalizedText = textContent ? personalize(textContent, vars) : personalizedHtml.replace(/<[^>]*>/g, '');

        try {
          const result = await blink.notifications.email({
            to: recipient.email,
            subject: personalizedSubject,
            html: compliantHtml,
            text: personalizedText,
            ...(replyTo ? { replyTo } : {}),
            ...(fromName ? { from: fromName } : {}),
          });

          if (!result.success) {
            throw new Error('Send failed');
          }

          return { success: true, email: recipient.email };
        } catch (err: any) {
          const message = err?.message || err?.details?.message || 'Erreur inconnue';
          return { success: false, email: recipient.email, error: message };
        }
      })
    );

    // Collect results
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          sent++;
        } else {
          failed++;
          errors.push({ email: result.value.email, error: (result as any).value.error });
        }
      } else {
        failed++;
        errors.push({ email: 'unknown', error: result.reason?.message || 'Promise rejected' });
      }
    }

    // Report progress
    onProgress?.(sent + failed, recipients.length, failed);

    // Delay between batches (skip after last batch)
    if (batchIdx < totalBatches - 1) {
      await sleep(delayMs);
    }
  }

  return {
    totalSent: sent,
    totalFailed: failed,
    totalRecipients: recipients.length,
    errors,
    duration: Date.now() - startTime,
  };
}

/* ── Preview personalization ───────────────────────────────────────────────── */

export function previewPersonalized(
  template: string,
  sampleRecipient: CampaignRecipient = { email: 'demo@exemple.com', firstName: 'Marie', lastName: 'Dupont', company: 'Atelier Rose' }
): string {
  return personalize(template, sampleRecipient as Record<string, string | undefined>);
}

/* ── Validate recipients ───────────────────────────────────────────────────── */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRecipients(recipients: CampaignRecipient[]): {
  valid: CampaignRecipient[];
  invalid: Array<{ email: string; reason: string }>;
  duplicates: number;
} {
  const seen = new Set<string>();
  const valid: CampaignRecipient[] = [];
  const invalid: Array<{ email: string; reason: string }> = [];
  let duplicates = 0;

  for (const r of recipients) {
    const email = r.email?.toLowerCase().trim();
    if (!email) {
      invalid.push({ email: '', reason: 'Email manquant' });
    } else if (!EMAIL_RE.test(email)) {
      invalid.push({ email, reason: 'Format invalide' });
    } else if (seen.has(email)) {
      duplicates++;
    } else {
      seen.add(email);
      valid.push({ ...r, email });
    }
  }

  return { valid, invalid, duplicates };
}

/* ── Import from text (CSV parsing + contact extraction) ───────────────────── */

export function parseContactsFromCSV(text: string): CampaignRecipient[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { cells.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z_]/g, ''));
  const fieldMap: Record<string, string> = {
    email: 'email', courriel: 'email', mail: 'email', 'e-mail': 'email',
    prenom: 'firstName', prénom: 'firstName', first_name: 'firstName',
    nom: 'lastName', last_name: 'lastName',
    telephone: 'phone', tel: 'phone', phone: 'phone',
    entreprise: 'company', societe: 'company', company: 'company', organisation: 'company',
  };

  const colIndex: Record<number, string> = {};
  headers.forEach((h, i) => {
    if (fieldMap[h]) colIndex[i] = fieldMap[h];
  });

  return lines.slice(1).map(line => {
    const cells = parseLine(line);
    const contact: CampaignRecipient = { email: '' };
    for (const [idx, field] of Object.entries(colIndex)) {
      (contact as any)[field] = cells[parseInt(idx)] || '';
    }
    return contact;
  }).filter(c => c.email);
}
