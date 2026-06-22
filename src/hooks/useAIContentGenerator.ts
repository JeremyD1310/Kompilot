import { useState, useCallback } from 'react';
import { blink } from '../blink/client';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ContentTone = 'professionnel' | 'décontracté' | 'promotionnel' | 'informatif' | 'inspirant';
export type ContentFormat = 'post_social' | 'description_business' | 'reponse_avis' | 'email_marketing' | 'story';

export interface GenerateContentParams {
  businessName: string;
  sector: string;
  city?: string;
  objectives?: string[];
  tone: ContentTone;
  format: ContentFormat;
  topic?: string;
  keywords?: string[];
  platform?: 'instagram' | 'facebook' | 'google' | 'linkedin' | 'tiktok';
  maxLength?: number;
}

export interface GeneratedVariant {
  id: string;
  text: string;
  charCount: number;
  hashtags: string[];
  emoji: string;
}

export interface GeneratedContent {
  variants: GeneratedVariant[];
  suggestedHashtags: string[];
  tip: string;
}

// ── Prompts ────────────────────────────────────────────────────────────────────

function buildSystemPrompt(sector: string, city?: string): string {
  return `Tu es un expert en marketing digital et communication pour les petites entreprises françaises, spécialisé dans le secteur "${sector}"${city ? ` à ${city}` : ''}.

Ton rôle :
- Rédiger du contenu social media percutant, naturel et adapté au public local français
- Générer des publications Instagram, Facebook, Google Business, LinkedIn selon le format demandé
- Adapter le ton selon les consignes (professionnel, décontracté, promotionnel, etc.)
- Inclure des hashtags pertinents et locaux quand c'est approprié

Règles absolues :
- Répondre UNIQUEMENT avec du JSON valide, sans markdown ni bloc de code
- Générer exactement 3 variantes avec des angles/accroches différents
- Chaque variante doit avoir son propre angle unique (ex: émotionnel / pratique / offre)
- Les hashtags doivent être pertinents pour le secteur et si possible la localité`;
}

function buildUserPrompt(p: GenerateContentParams): string {
  const formats: Record<ContentFormat, string> = {
    post_social:          'publication réseaux sociaux',
    description_business: 'description Google Business / annuaire',
    reponse_avis:         'réponse à avis client',
    email_marketing:      'email marketing / newsletter',
    story:                'story Instagram/Facebook (court, impactant)',
  };
  const tones: Record<ContentTone, string> = {
    professionnel: 'professionnel et sérieux',
    décontracté:   'décontracté et chaleureux',
    promotionnel:  'promotionnel et incitatif à l\'action',
    informatif:    'informatif et pédagogique',
    inspirant:     'inspirant et motivant',
  };
  const platformHints: Record<string, string> = {
    instagram: '(max 2200 car., hashtags groupés en fin)',
    facebook:  '(max 500 car. idéalement)',
    google:    '(max 1500 car., pas de hashtags)',
    linkedin:  '(ton plus professionnel, max 3000 car.)',
    tiktok:    '(accroche forte 1ère phrase, max 150 car.)',
  };

  return `Génère du contenu pour :
- Entreprise : ${p.businessName}
- Secteur : ${p.sector}${p.city ? `\n- Ville : ${p.city}` : ''}
- Format : ${formats[p.format]}
- Ton : ${tones[p.tone]}${p.platform ? `\n- Plateforme : ${p.platform} ${platformHints[p.platform] ?? ''}` : ''}${p.maxLength ? `\n- Limite : ${p.maxLength} caractères` : ''}${p.topic ? `\n- Sujet : "${p.topic}"` : ''}${p.keywords?.length ? `\n- Mots-clés : ${p.keywords.join(', ')}` : ''}${p.objectives?.length ? `\n- Objectifs marketing : ${p.objectives.join(', ')}` : ''}

Réponds UNIQUEMENT avec ce JSON (sans aucun markdown) :
{"variants":[{"id":"v1","text":"...","emoji":"🎯","hashtags":["#tag1","#tag2"]},{"id":"v2","text":"...","emoji":"💡","hashtags":["#tag3"]},{"id":"v3","text":"...","emoji":"✨","hashtags":["#tag4","#tag5"]}],"suggestedHashtags":["#tag1","#tag2","#tag3","#tag4","#tag5"],"tip":"Conseil de 1-2 phrases pour maximiser la portée"}`;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAIContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult]             = useState<GeneratedContent | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [streamText, setStreamText]     = useState('');

  const generate = useCallback(async (params: GenerateContentParams) => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setStreamText('');

    let raw = '';

    try {
      await blink.ai.streamText(
        {
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: buildSystemPrompt(params.sector, params.city) },
            { role: 'user',   content: buildUserPrompt(params) },
          ],
          temperature: 0.85,
          maxTokens: 1400,
        },
        (chunk: string) => {
          raw += chunk;
          setStreamText(raw);
        }
      );

      const jsonStart = raw.indexOf('{');
      const jsonEnd   = raw.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('Réponse invalide — réessayez.');

      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
        variants: Array<{ id: string; text: string; emoji: string; hashtags: string[] }>;
        suggestedHashtags: string[];
        tip: string;
      };

      setResult({
        variants: parsed.variants.map(v => ({
          id:        v.id,
          text:      v.text,
          charCount: v.text.length,
          hashtags:  Array.isArray(v.hashtags) ? v.hashtags : [],
          emoji:     v.emoji ?? '✨',
        })),
        suggestedHashtags: parsed.suggestedHashtags ?? [],
        tip: parsed.tip ?? '',
      });
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      // Surface authentication errors clearly
      const msg = rawMsg.includes('401') || rawMsg.toLowerCase().includes('unauthorized')
        ? 'Session expirée — veuillez vous reconnecter pour utiliser la génération IA.'
        : rawMsg;
      setError(msg);
    } finally {
      setIsGenerating(false);
      setStreamText('');
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setStreamText('');
  }, []);

  return { generate, isGenerating, result, error, streamText, reset };
}
