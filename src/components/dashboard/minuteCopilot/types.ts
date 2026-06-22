// ── Types for LaMinuteCopilot ──────────────────────────────────────────────────

export interface ContentStrategy {
  summary: string;
  post_ideas: { title: string; hook: string; channel: string }[];
  hashtags: string[];
  angles: { label: string; description: string }[];
}

export type RecordStep = 'prompt' | 'recording' | 'transcribing' | 'analyzing' | 'result' | 'error';
