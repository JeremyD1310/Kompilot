/**
 * contentGuardrail — MODULE 6
 * Semantic filter to detect prompt injection and suspicious content.
 * Returns a verdict (safe / blocked) with the matched keywords.
 */

// ── Injection patterns ────────────────────────────────────────────────────────

/**
 * Keywords that signal potential prompt injection or harmful content.
 * Grouped by category for better reporting.
 */
export const INJECTION_PATTERNS = {
  // Classic prompt injection
  prompt_injection: [
    /\bignore\b/i,
    /\bignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)\b/i,
    /\bforget\s+everything\b/i,
    /\bdisregard\b/i,
    /\bact\s+as\b/i,
    /\byou\s+are\s+now\b/i,
    /\bjailbreak\b/i,
    /\bsystem\s+prompt\b/i,
    /\bnew\s+instructions?\b/i,
    /\boverride\b/i,
  ],
  // Harmful content
  harmful: [
    /\barnaque\b/i,
    /\bavarié\b/i,
    /\bintoxicat/i,
    /\bempoisonn/i,
    /\bmenace\b/i,
    /\bchantage\b/i,
    /\billégal\b/i,
    /\bescroc\b/i,
    /\bfraud/i,
    /\bfaux\s+avis\b/i,
    /\bfabriqu/i,
  ],
  // Spam/manipulation
  spam: [
    /\b(clique|cliquez|cliquer)\s+(ici|maintenant)\b/i,
    /\bgagne[zr]?\s+\d+/i,
    /\bpromotion\s+réservée\s+à\s+vous\b/i,
    /\bREMPLACEZ\s+PAR\b/i,
    /\bINSERT\s+HERE\b/i,
    /\b\[PLACEHOLDER\]/i,
  ],
  // Medical/legal false claims
  false_claims: [
    /\bguérit\b/i,
    /\bcure\s+(contre|définitive)\b/i,
    /\bremède\s+miracle\b/i,
    /\bgaranti\s+à\s+100%\b/i,
  ],
};

export type ViolationCategory = keyof typeof INJECTION_PATTERNS;

export interface GuardrailResult {
  safe: boolean;
  violations: Array<{
    category: ViolationCategory;
    matchedText: string;
    pattern: string;
  }>;
  riskScore: number;   // 0–100
}

// ── Severity scoring ──────────────────────────────────────────────────────────

const CATEGORY_WEIGHTS: Record<ViolationCategory, number> = {
  prompt_injection: 100,
  harmful: 80,
  spam: 40,
  false_claims: 60,
};

// ── Main filter function ──────────────────────────────────────────────────────

/**
 * Analyzes text for injection patterns and suspicious content.
 * @param text — User-submitted text (review response, AI prompt, post content)
 * @returns GuardrailResult with safe flag, violations list, and risk score
 */
export function analyzeContent(text: string): GuardrailResult {
  const violations: GuardrailResult['violations'] = [];

  for (const [category, patterns] of Object.entries(INJECTION_PATTERNS) as [ViolationCategory, RegExp[]][]) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        violations.push({
          category,
          matchedText: match[0],
          pattern: pattern.toString(),
        });
      }
    }
  }

  // Calculate risk score (0–100)
  const riskScore = Math.min(
    100,
    violations.reduce((max, v) => Math.max(max, CATEGORY_WEIGHTS[v.category] ?? 0), 0)
  );

  return {
    safe: violations.length === 0,
    violations,
    riskScore,
  };
}

/**
 * Quick boolean check — use when only safe/unsafe matters.
 */
export function isContentSafe(text: string): boolean {
  return analyzeContent(text).safe;
}

/**
 * Returns human-readable label for a violation category.
 */
export function getCategoryLabel(category: ViolationCategory): string {
  const labels: Record<ViolationCategory, string> = {
    prompt_injection: 'Injection de prompt',
    harmful: 'Contenu potentiellement nuisible',
    spam: 'Contenu spam ou trompeur',
    false_claims: 'Affirmation médicale/légale non vérifiable',
  };
  return labels[category] ?? category;
}
