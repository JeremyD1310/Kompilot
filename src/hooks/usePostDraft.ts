import { useEffect, useCallback } from 'react';

const DRAFT_KEY = 'kompilot_post_draft';

export interface PostDraft {
  text: string;
  savedAt: string;
}

export function usePostDraft() {
  const saveDraft = useCallback((text: string) => {
    if (!text.trim()) {
      localStorage.removeItem(DRAFT_KEY);
      return;
    }
    const draft: PostDraft = { text, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, []);

  const loadDraft = useCallback((): PostDraft | null => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PostDraft;
    } catch {
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  // Save on page unload
  const registerUnloadSave = useCallback((getText: () => string) => {
    const handler = () => saveDraft(getText());
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveDraft]);

  return { saveDraft, loadDraft, clearDraft, registerUnloadSave };
}
