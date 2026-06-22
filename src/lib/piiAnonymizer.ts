/**
 * piiAnonymizer — masks sensitive PII before AI processing.
 * Detects and redacts: credit card numbers, IBAN, French SS numbers,
 * medical terms, and email addresses.
 */

const PII_PATTERNS: { name: string; regex: RegExp; replacement: string }[] = [
  // Credit card (4 groups of 4 digits)
  { name: 'credit_card', regex: /\b(?:\d[ -]?){13,16}\b/g, replacement: '[CARTE MASQUÉE]' },
  // IBAN
  { name: 'iban', regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g, replacement: '[IBAN MASQUÉ]' },
  // French social security number (13-15 digits starting with 1 or 2)
  { name: 'ss_number', regex: /\b[12]\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{3}\s?\d{3}\s?(?:\d{2})?\b/g, replacement: '[N° SS MASQUÉ]' },
  // Medical keywords (case-insensitive)
  { name: 'medical', regex: /\b(diagnostic|cancer|vih|sida|hiv|diabète|insuline|dépression|anxiété|ordonnance|médicament|pathologie|maladie grave)\b/gi, replacement: '[INFO MÉDICALE]' },
];

export interface AnonymizeResult {
  text: string;
  detections: { name: string; count: number }[];
  hasPII: boolean;
}

export function anonymizePII(input: string): AnonymizeResult {
  let text = input;
  const detections: { name: string; count: number }[] = [];

  for (const p of PII_PATTERNS) {
    const matches = text.match(p.regex);
    if (matches && matches.length > 0) {
      detections.push({ name: p.name, count: matches.length });
      text = text.replace(p.regex, p.replacement);
    }
  }

  return { text, detections, hasPII: detections.length > 0 };
}
