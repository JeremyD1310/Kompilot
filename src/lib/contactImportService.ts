/**
 * contactImportService.ts — Import contacts from CSV, PDF, and Excel files
 *
 * Uses:
 * - Client-side CSV parsing (no server needed)
 * - blink.storage.upload() + blink.data.extractFromUrl() for PDF extraction
 * - blink.db for persistence to crm_contacts table
 */

import { blink } from '../blink/client';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export interface ImportedContact {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  tags?: string[];
  source?: string;
  customFields?: Record<string, string>;
}

export interface ImportResult {
  totalParsed: number;
  validContacts: ImportedContact[];
  invalidRows: number;
  duplicates: number;
  fieldMapping: Record<string, string>;
}

/* ── CSV Parser ────────────────────────────────────────────────────────────── */

function parseCSVLine(line: string): string[] {
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
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  return {
    headers: parseCSVLine(lines[0]),
    rows: lines.slice(1).map(parseCSVLine),
  };
}

/* ── Field auto-detection ──────────────────────────────────────────────────── */

const FIELD_MAP: Record<string, string> = {
  email: 'email', courriel: 'email', mail: 'email', 'e-mail': 'email',
  prenom: 'firstName', prénom: 'firstName', first_name: 'firstName', firstname: 'firstName',
  nom: 'lastName', last_name: 'lastName', lastname: 'lastName', famille: 'lastName',
  telephone: 'phone', tel: 'phone', phone: 'phone', mobile: 'phone', portable: 'phone',
  entreprise: 'company', societe: 'company', company: 'company', organisation: 'company',
  tags: 'tags', tag: 'tags', label: 'tags', labels: 'tags',
  notes: 'notes', note: 'notes', remarque: 'notes', commentaires: 'notes',
};

export function autoDetectColumns(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {};
  headers.forEach((h, i) => {
    const normalized = h.toLowerCase().replace(/[^a-z_éàè]/g, '').trim();
    if (FIELD_MAP[normalized]) {
      mapping[i] = FIELD_MAP[normalized];
    }
  });
  return mapping;
}

/* ── CSV import ────────────────────────────────────────────────────────────── */

export function importFromCSV(text: string): ImportResult {
  const { headers, rows } = parseCSV(text);
  const fieldMapping = autoDetectColumns(headers);

  const emailIdx = Object.entries(fieldMapping).find(([, v]) => v === 'email')?.[0];

  const seen = new Set<string>();
  const validContacts: ImportedContact[] = [];
  let invalidRows = 0;
  let duplicates = 0;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const row of rows) {
    // Build contact from mapped columns
    const contact: ImportedContact = { email: '' };
    for (const [idx, field] of Object.entries(fieldMapping)) {
      const value = row[parseInt(idx)] || '';
      if (field === 'tags') {
        contact.tags = value.split(/[;,]/).map(t => t.trim()).filter(Boolean);
      } else {
        (contact as any)[field] = value;
      }
    }

    // Validate email
    const email = contact.email.toLowerCase().trim();
    if (!email || !EMAIL_RE.test(email)) {
      invalidRows++;
      continue;
    }

    // Check duplicates
    if (seen.has(email)) {
      duplicates++;
      continue;
    }

    seen.add(email);
    contact.email = email;
    contact.source = 'csv';
    validContacts.push(contact);
  }

  return {
    totalParsed: rows.length,
    validContacts,
    invalidRows,
    duplicates,
    fieldMapping,
  };
}

/* ── PDF import (via Blink SDK) ────────────────────────────────────────────── */

export async function importFromPDF(file: File): Promise<ImportResult> {
  try {
    // Upload file to Blink Storage
    const { publicUrl } = await blink.storage.upload(
      file,
      `imports/${Date.now()}-${file.name}`
    );

    // Extract text from the uploaded PDF
    const extractedText = await blink.data.extractFromUrl(publicUrl);

    if (typeof extractedText === 'string') {
      // Try to parse as CSV first (many exports are CSV saved as PDF)
      if (extractedText.includes(',') && extractedText.includes('\n')) {
        return importFromCSV(extractedText);
      }

      // Otherwise, try to extract emails from plain text
      const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
      const emails = extractedText.match(EMAIL_RE) || [];
      const seen = new Set<string>();
      const validContacts: ImportedContact[] = [];

      for (const email of emails) {
        const normalized = email.toLowerCase().trim();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          validContacts.push({ email: normalized, source: 'pdf' });
        }
      }

      return {
        totalParsed: emails.length,
        validContacts,
        invalidRows: 0,
        duplicates: emails.length - validContacts.length,
        fieldMapping: {},
      };
    }

    // If extractFromUrl returns array of chunks
    if (Array.isArray(extractedText)) {
      const combined = extractedText.join('\n');
      return importFromCSV(combined);
    }

    return { totalParsed: 0, validContacts: [], invalidRows: 0, duplicates: 0, fieldMapping: {} };
  } catch (err: any) {
    console.error('[PDF Import]', err);
    throw new Error(`Erreur lors de l'extraction PDF: ${err?.message || 'Format non supporté'}`);
  }
}

/* ── Excel import (via Blink SDK extraction) ───────────────────────────────── */

export async function importFromExcel(file: File): Promise<ImportResult> {
  try {
    // Upload to Blink Storage
    const { publicUrl } = await blink.storage.upload(
      file,
      `imports/${Date.now()}-${file.name}`
    );

    // Blink's extractFromUrl handles XLSX → text conversion
    const extractedText = await blink.data.extractFromUrl(publicUrl);

    if (typeof extractedText === 'string') {
      return importFromCSV(extractedText);
    }

    if (Array.isArray(extractedText)) {
      return importFromCSV(extractedText.join('\n'));
    }

    return { totalParsed: 0, validContacts: [], invalidRows: 0, duplicates: 0, fieldMapping: {} };
  } catch (err: any) {
    console.error('[Excel Import]', err);
    throw new Error(`Erreur lors de l'extraction Excel: ${err?.message || 'Format non supporté'}`);
  }
}

/* ── Universal file importer ───────────────────────────────────────────────── */

export async function importFromFile(file: File): Promise<ImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv' || ext === 'txt') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          resolve(importFromCSV(text));
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  }

  if (ext === 'pdf') {
    return importFromPDF(file);
  }

  if (ext === 'xlsx' || ext === 'xls') {
    return importFromExcel(file);
  }

  throw new Error(`Format de fichier non supporté: .${ext}`);
}

/* ── Persist contacts to DB ────────────────────────────────────────────────── */

export async function persistContacts(
  contacts: ImportedContact[],
  userId: string,
  segmentId?: string
): Promise<{ created: number; errors: number }> {
  let created = 0;
  let errors = 0;

  for (const contact of contacts) {
    try {
      const id = `crm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await (blink.db as any).table('crm_contacts').create({
        id,
        userId,
        email: contact.email,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        phone: contact.phone || '',
        company: contact.company || '',
        tags: JSON.stringify(contact.tags || []),
        customFields: JSON.stringify(contact.customFields || {}),
        source: contact.source || 'import',
        status: 'active',
        notes: '',
      });
      created++;

      // If a segment is specified, add the association
      if (segmentId) {
        await (blink.db as any).table('crm_segment_contacts').create({
          id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          segmentId,
          contactId: id,
        });
      }
    } catch (err) {
      console.error('[Persist Contact]', contact.email, err);
      errors++;
    }
  }

  return { created, errors };
}

/* ── Segment filter engine ─────────────────────────────────────────────────── */

export interface SegmentFilterRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'is_empty' | 'is_not_empty' | 'greater_than' | 'less_than';
  value: string;
  logic?: 'AND' | 'OR';
}

export function applySegmentFilters<T extends Record<string, any>>(
  items: T[],
  filters: SegmentFilterRule[]
): T[] {
  if (!filters.length) return items;

  return items.filter(item => {
    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (const filter of filters) {
      const fieldValue = String(item[filter.field] || '').toLowerCase();
      const filterValue = filter.value.toLowerCase();

      let matches = false;
      switch (filter.operator) {
        case 'equals': matches = fieldValue === filterValue; break;
        case 'not_equals': matches = fieldValue !== filterValue; break;
        case 'contains': matches = fieldValue.includes(filterValue); break;
        case 'not_contains': matches = !fieldValue.includes(filterValue); break;
        case 'starts_with': matches = fieldValue.startsWith(filterValue); break;
        case 'ends_with': matches = fieldValue.endsWith(filterValue); break;
        case 'is_empty': matches = !fieldValue || fieldValue === '[]'; break;
        case 'is_not_empty': matches = !!fieldValue && fieldValue !== '[]'; break;
        case 'greater_than': matches = Number(fieldValue) > Number(filter.value); break;
        case 'less_than': matches = Number(fieldValue) < Number(filter.value); break;
      }

      if (currentLogic === 'AND') {
        result = result && matches;
      } else {
        result = result || matches;
      }

      if (filter.logic) {
        currentLogic = filter.logic;
      }
    }

    return result;
  });
}
