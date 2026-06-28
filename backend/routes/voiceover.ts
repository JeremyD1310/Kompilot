/**
 * Voiceover — Text-to-speech for UGC scripts
 *
 * POST /api/voiceover/generate — Generate audio from script text
 *
 * Uses OpenAI TTS API directly (server-side) since Blink SDK's generateSpeech
 * is client-only. Falls back gracefully if OPENAI_API_KEY is not available.
 */
import { Hono } from 'hono';
import type { Env } from '../lib/types';

export const router = new Hono<{ Bindings: Env }>();

function getUserId(h: string | undefined): string | null {
  if (!h?.startsWith('Bearer ')) return null;
  try {
    const p = h.split('.')[1];
    const d = JSON.parse(atob(p));
    return d.sub ?? d.user_id ?? null;
  } catch {
    return null;
  }
}

// Voice presets mapped to OpenAI TTS voices
const VOICE_PRESETS: Record<string, { voice: string; speed: number; label: string }> = {
  'nova':     { voice: 'nova',     speed: 1.0,  label: 'Nova — Chaleureuse, polyvalente' },
  'alloy':    { voice: 'alloy',    speed: 1.0,  label: 'Alloy — Neutre, équilibrée' },
  'echo':     { voice: 'echo',     speed: 1.0,  label: 'Echo — Claire, articulée' },
  'fable':    { voice: 'fable',    speed: 1.0,  label: 'Fable — Expressive, chaleureuse' },
  'onyx':     { voice: 'onyx',     speed: 1.0,  label: 'Onyx — Profonde, autoritaire' },
  'shimmer':  { voice: 'shimmer',  speed: 1.0,  label: 'Shimmer — Douce, apaisante' },
  'nova_fast': { voice: 'nova',    speed: 1.25, label: 'Nova rapide — Dynamique' },
  'onyx_slow': { voice: 'onyx',    speed: 0.85, label: 'Onyx lente — Dramatique' },
};

router.post('/api/voiceover/generate', async (c) => {
  const userId = getUserId(c.req.header('Authorization'));
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);

  const env = c.env as unknown as Env;
  const openaiKey = env.OPENAI_API_KEY;

  if (!openaiKey) {
    return c.json({
      error: 'TTS_NOT_CONFIGURED',
      message: 'La génération vocale nécessite OPENAI_API_KEY. Configurez-la dans les secrets du projet.',
    }, 503);
  }

  let body: {
    text?: string;
    voice?: string;
    speed?: number;
    format?: 'mp3' | 'opus' | 'aac' | 'flac';
  } = {};
  try { body = await c.req.json(); } catch { /* empty */ }

  if (!body.text?.trim()) {
    return c.json({ error: 'Le texte est requis' }, 400);
  }

  const text = body.text.trim();
  const voicePreset = VOICE_PRESETS[body.voice ?? 'nova'] ?? VOICE_PRESETS['nova'];
  const speed = body.speed ?? voicePreset.speed;
  const format = body.format ?? 'mp3';

  // OpenAI TTS has a 4096 character limit
  if (text.length > 4096) {
    return c.json({
      error: 'TEXT_TOO_LONG',
      message: `Le texte fait ${text.length} caractères. Maximum : 4096.`,
    }, 400);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voicePreset.voice,
        speed,
        response_format: format,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Voiceover] OpenAI TTS error ${response.status}: ${errText}`);
      return c.json({ error: `TTS generation failed: ${response.status}` }, 502);
    }

    // Stream the audio response back — use manual base64 for CF Workers compatibility
    const audioBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(audioBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Audio = btoa(binary);
    const mimeType = format === 'mp3' ? 'audio/mpeg' : `audio/${format}`;

    return c.json({
      audio: `data:${mimeType};base64,${base64Audio}`,
      voice: voicePreset.voice,
      speed,
      format,
      charactersUsed: text.length,
    });
  } catch (err: any) {
    console.error('[Voiceover] generate error:', err);
    return c.json({ error: err.message ?? 'Voice generation failed' }, 500);
  }
});

// List available voices
router.get('/api/voiceover/voices', async (c) => {
  return c.json({
    voices: Object.entries(VOICE_PRESETS).map(([id, config]) => ({
      id,
      voice: config.voice,
      speed: config.speed,
      label: config.label,
    })),
  });
});
