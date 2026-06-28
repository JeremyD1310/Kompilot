/**
 * useVoiceover — React Query hook for TTS audio generation.
 * Generates speech audio from script text via the backend voiceover API.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { blink } from '../blink/client';

const BACKEND_URL = 'https://gbrhsehk.backend.blink.new';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VoicePreset {
  id: string;
  voice: string;
  speed: number;
  label: string;
}

export interface VoiceoverResult {
  audio: string; // data:audio/mpeg;base64,...
  voice: string;
  speed: number;
  format: string;
  charactersUsed: number;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useGenerateVoiceover() {
  return useMutation({
    mutationFn: async (params: {
      text: string;
      voice?: string;
      speed?: number;
      format?: 'mp3' | 'opus' | 'aac' | 'flac';
    }): Promise<VoiceoverResult> => {
      const token = await blink.auth.getValidToken();
      const res = await fetch(`${BACKEND_URL}/api/voiceover/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Erreur serveur: ${res.status}`);
      }
      return res.json();
    },
  });
}

export function useVoicePresets() {
  return useQuery({
    queryKey: ['voice-presets'],
    staleTime: Infinity, // Voice presets never change
    queryFn: async (): Promise<VoicePreset[]> => {
      const res = await fetch(`${BACKEND_URL}/api/voiceover/voices`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.voices ?? [];
    },
  });
}

// ── Audio playback helper (preserves user gesture) ────────────────────────────

export function createAudioPlayer() {
  let audioElement: HTMLAudioElement | null = null;

  return {
    /**
     * Play audio from a base64 data URL.
     * Must be called from a user gesture (click/tap handler).
     */
    play: async (audioDataUrl: string) => {
      // Reuse or create audio element
      if (!audioElement) {
        audioElement = new Audio();
      }
      audioElement.src = audioDataUrl;
      audioElement.load();
      await audioElement.play();
    },

    /** Stop current playback */
    stop: () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    },

    /** Check if currently playing */
    get isPlaying() {
      return audioElement ? !audioElement.paused : false;
    },
  };
}
