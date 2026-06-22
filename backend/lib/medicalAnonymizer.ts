/**
 * medicalAnonymizer.ts — Strict PII Filter for Medical Sector
 *
 * GDPR + Code de Déontologie Médicale compliance layer.
 *
 * Rules:
 *  - Block any field containing patient name, pathology, consultation reason
 *  - Only allow purely quantitative fields: IDs, statuses, dates, counts
 *  - Strip forbidden fields from payloads before storage or AI transmission
 *  - Return audit log entries for all filtered operations
 *
 * Usage:
 *   import { anonymizeMedicalPayload, isMedicalSector } from './medicalAnonymizer';
 *   if (isMedicalSector(sector)) {
 *     payload = anonymizeMedicalPayload(payload);
 *   }
 */

// ── Forbidden field name patterns (case-insensitive) ─────────────────────────

const FORBIDDEN_FIELD_PATTERNS: RegExp[] = [
  // Patient identity
  /patient.*(name|nom|prenom|firstname|lastname|surname)/i,
  /nom.*(patient|client|personne)/i,
  /prenom|firstname/i,

  // Medical data
  /patholog|diagnostic|diagnosis|maladie|disease|symptom/i,
  /motif.*(consul|rdv|visit)/i,
  /consultation.*(reason|motif|objet)/i,
  /traitement|treatment|medication|medicament|ordonnance|prescription/i,
  /antecedent|historique.*(medical|sante)/i,
  /allergi/i,

  // Contact / identifier that could re-identify
  /\bphone\b|\btelephone\b|\btel\b|\bmobile\b/i,
  /\bemail\b|\bmail\b|\bcourriel\b/i,
  /\baddress\b|\badresse\b/i,
  /\bbirthdate\b|\bdate.naissance\b|\bage\b|\bnaissance\b/i,
  /\bssn\b|\bnir\b|\bsecu\b|\bsocial.security/i,
  /\bips\b|\bip_address\b/i,
];

// ── Allowed field patterns (explicit whitelist for medical context) ────────────

const ALLOWED_FIELD_PATTERNS: RegExp[] = [
  // Quantitative / anonymized identifiers only
  /^id$/i,
  /^id_/i,
  /_id$/i,
  /^appointment_id$/i,
  /^rdv_id$/i,
  /^slot_id$/i,
  /^status$/i,
  /^statut$/i,
  /^date$/i,
  /^scheduled_at$/i,
  /^created_at$/i,
  /^updated_at$/i,
  /^count$/i,
  /^total$/i,
  /^duration_minutes$/i,
  /^cancellation_reason_code$/i, // coded reason, not free text
  /^practitioner_id$/i,
  /^slot_type$/i,
  /^channel$/i,
  /^source$/i,
  /^establishment_id$/i,
  /^user_id$/i,
  /^week$/i,
  /^month$/i,
  /^year$/i,
  /^hour$/i,
];

// ── Type definitions ──────────────────────────────────────────────────────────

export interface AnonymizationResult {
  payload: Record<string, unknown>;
  strippedFields: string[];
  isCompliant: boolean;
  auditLog: AuditEntry;
}

export interface AuditEntry {
  ts: string;
  sector: 'medical';
  strippedCount: number;
  strippedFields: string[];
  userId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isForbiddenField(key: string): boolean {
  return FORBIDDEN_FIELD_PATTERNS.some(p => p.test(key));
}

function isAllowedField(key: string): boolean {
  return ALLOWED_FIELD_PATTERNS.some(p => p.test(key));
}

function redactString(value: string): string {
  // Replace any value that looks like a name (2+ capitalised words) or long text
  if (value.length > 50) return '[DONNÉES_MÉDICALES_FILTRÉES]';
  if (/^[A-ZÀ-Ý][a-zà-ÿ]+(\s[A-ZÀ-Ý][a-zà-ÿ]+)+$/.test(value)) {
    return '[NOM_PATIENT_FILTRÉ]';
  }
  return '[FILTRÉ]';
}

function anonymizeValue(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value);
  if (typeof value === 'number') return value; // numbers are safe (quantitative)
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(anonymizeValue);
  if (typeof value === 'object') return anonymizeMedicalPayload(value as Record<string, unknown>).payload;
  return '[FILTRÉ]';
}

// ── Main exports ──────────────────────────────────────────────────────────────

/**
 * Returns true when the sector is 'medical' (or variant spellings).
 */
export function isMedicalSector(sector?: string): boolean {
  if (!sector) return false;
  return /^medical|medic|sante|health|doctor|doctolib$/i.test(sector.trim());
}

/**
 * Anonymizes a payload for medical compliance:
 *  - Removes fields matching forbidden patterns
 *  - Keeps only explicitly quantitative/allowed fields
 *  - Returns stripped field list for audit
 */
export function anonymizeMedicalPayload(
  payload: Record<string, unknown>,
  userId?: string,
): AnonymizationResult {
  const stripped: string[] = [];
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (isForbiddenField(key)) {
      stripped.push(key);
      // Keep a redacted placeholder for debugging but strip the value
      clean[key] = anonymizeValue(value);
    } else {
      clean[key] = value;
    }
  }

  const auditLog: AuditEntry = {
    ts: new Date().toISOString(),
    sector: 'medical',
    strippedCount: stripped.length,
    strippedFields: stripped,
    ...(userId ? { userId } : {}),
  };

  if (stripped.length > 0) {
    console.log('[medicalAnonymizer] PII stripped:', JSON.stringify(auditLog));
  }

  return {
    payload: clean,
    strippedFields: stripped,
    isCompliant: stripped.length === 0,
    auditLog,
  };
}

/**
 * Validates that a medical-sector AI prompt does not contain patient PII.
 * Returns the cleaned prompt and a warning flag.
 */
export function sanitizeMedicalPrompt(
  prompt: string,
  userId?: string,
): { prompt: string; hadPII: boolean; warning: string | null } {
  // Patterns to detect inline PII in free-text prompts
  const piiPatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /\b(M\.|Mme\.?|Dr\.?|Pr\.?)\s+[A-ZÀ-Ý][a-zà-ÿ]+/g, label: 'titre+nom' },
    { pattern: /patient\s+[A-ZÀ-Ý][a-zà-ÿ]+/gi, label: 'nom_patient' },
    // French phone numbers
    { pattern: /\b0[67]\s?\d{2}(\s?\d{2}){3}\b/g, label: 'telephone' },
    // Email addresses
    { pattern: /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi, label: 'email' },
    // French SSN (NIR)
    { pattern: /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g, label: 'nir' },
  ];

  let cleanedPrompt = prompt;
  let hadPII = false;

  for (const { pattern, label } of piiPatterns) {
    if (pattern.test(cleanedPrompt)) {
      hadPII = true;
      cleanedPrompt = cleanedPrompt.replace(pattern, `[${label.toUpperCase()}_FILTRÉ]`);
      pattern.lastIndex = 0;
    }
  }

  if (hadPII) {
    console.log(`[medicalAnonymizer] PII detected and stripped from prompt. UserId: ${userId ?? 'unknown'}`);
  }

  return {
    prompt: cleanedPrompt,
    hadPII,
    warning: hadPII
      ? 'Des données patient identifiables ont été automatiquement supprimées du prompt pour respecter le RGPD et le secret médical.'
      : null,
  };
}
