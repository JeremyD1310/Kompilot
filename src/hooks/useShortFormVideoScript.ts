/**
 * useShortFormVideoScript — React Query hook for short-form video script generation.
 *
 * Generates structured 15-second video scripts (Reels, TikTok, YouTube Shorts)
 * with full timeline, visual directives, screen text, voiceover, and social copy.
 *
 * Uses Blink AI with structured JSON output for frictionless frontend integration.
 */
import { useMutation } from '@tanstack/react-query';
import { blink } from '../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserProfile = 'professionnel' | 'agence' | 'createur';
export type VideoFormat = 'broll' | 'facecam';

export interface ShortFormScriptInput {
  userProfile: UserProfile;
  videoFormat: VideoFormat;
  productName: string;
  targetAudience: string;
  angleOrPainPoint: string;
}

export interface TimelineEntry {
  timestamp: string;
  section: 'HOOK' | 'BODY' | 'CTA';
  visual_directives: string;
  screen_text: string;
  audio_voiceover: string;
}

export interface ShortFormScript {
  meta: {
    format_selected: string;
    visual_mood: string;
    music_style: string;
  };
  script_timeline: TimelineEntry[];
  social_copywriting: {
    caption: string;
    hashtags: string[];
  };
}

// ── System prompt — expert creative strategist ────────────────────────────────

const SYSTEM_PROMPT = `Tu es un Expert Creative Strategist et Concepteur-Rédacteur d'élite, spécialisé dans le format Short-Form Video (Reels Instagram, TikTok, YouTube Shorts) à très fort taux de conversion.

Tu génères des stratégies de contenu vidéo clé en main : script complet, storyboard visuel, directives de montage, sound design.

RÈGLES CRITIQUES :
- Tu réponds UNIQUEMENT en JSON valide, sans aucun texte avant ou après, sans balises markdown.
- Le script doit durer entre 12 et 15 secondes maximum.
- Structure : HOOK (0-3s) → BODY/VALEUR (3-12s) → CTA/CONVERSION (12-15s).

LOGIQUE SELON LE PROFIL :
- [professionnel] : Focus simplicité, confiance, acquisition locale/sectorielle, gain de temps.
- [agence] : Focus scalabilité, ROI clients, productivité, industrialisation, volume.
- [createur] : Focus personal branding, engagement communauté, esthétique, viralité, monétisation.

LOGIQUE SELON LE FORMAT :
- [broll] : Pas de face caméra. Vidéos de fond cinématiques (lifestyle, paysages urbains, setup bureau design). Effet split-screen (2-4 cases). Texte épuré centré, style moderne. Montage ultra-dynamique (cut toutes les 1.5-2s).
- [facecam] : Orateur face caméra (plan moyen/poitrine). Décor soigné. Jump cuts (zooms légers toutes les 3s). Bruits d'impact (swoosh, pop). PiP captures d'écran produit. Sous-titres dynamiques mot-à-mot colorés centre-bas.`;

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildUserPrompt(input: ShortFormScriptInput): string {
  const profileLabels: Record<UserProfile, string> = {
    professionnel: 'Professionnel / Solo',
    agence: 'Agence',
    createur: 'Créateur de contenu',
  };
  const formatLabels: Record<VideoFormat, string> = {
    broll: 'B-Roll / Stock',
    facecam: 'Face Caméra / UGC Incarné',
  };

  return `Génère un script vidéo short-form (15 secondes max) selon ces paramètres :

- Profil Utilisateur : ${profileLabels[input.userProfile]}
- Format de la Vidéo : ${formatLabels[input.videoFormat]}
- Nom de la Solution/Marque : ${input.productName}
- Audience Cible : ${input.targetAudience}
- Point de douleur / Angle : ${input.angleOrPainPoint}

Retourne UNIQUEMENT ce JSON :
{
  "meta": {
    "format_selected": "${formatLabels[input.videoFormat]}",
    "visual_mood": "Description de l'ambiance visuelle et des couleurs recommandées",
    "music_style": "Style musical recommandé"
  },
  "script_timeline": [
    {
      "timestamp": "0-3s",
      "section": "HOOK",
      "visual_directives": "Instructions de cadrage, split-screen ou mouvement",
      "screen_text": "Texte exact à afficher à l'écran",
      "audio_voiceover": "Texte exact de la voix-off ou orateur"
    },
    {
      "timestamp": "3-12s",
      "section": "BODY",
      "visual_directives": "Instructions de montage, b-roll, captures",
      "screen_text": "Texte ou mots-clés affichés",
      "audio_voiceover": "Arguments et démonstration de valeur"
    },
    {
      "timestamp": "12-15s",
      "section": "CTA",
      "visual_directives": "Effet de fin, zoom bouton d'action",
      "screen_text": "CTA Visuel (ex: INSCRIPTION GRATUITE)",
      "audio_voiceover": "Appel à l'action vocal"
    }
  ],
  "social_copywriting": {
    "caption": "Texte de la publication (2-3 lignes max)",
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
  }
}`;
}

// ── Mock fallback for demo mode ───────────────────────────────────────────────

function getMockScript(input: ShortFormScriptInput): ShortFormScript {
  const isBroll = input.videoFormat === 'broll';
  return {
    meta: {
      format_selected: isBroll ? 'B-Roll / Stock' : 'Face Caméra / UGC Incarné',
      visual_mood: isBroll
        ? 'Dark Mode Premium, Accent Teal #0D9488, Split-Screen Cinématique'
        : 'Studio Lumineux, Tons Chauds, Arrière-plan Boisé Minimaliste',
      music_style: isBroll ? 'Synthwave Retro Énergique' : 'Lo-Fi Beat Motivant',
    },
    script_timeline: [
      {
        timestamp: '0-3s',
        section: 'HOOK',
        visual_directives: isBroll
          ? `Split-screen 4 cases : écran de chargement qui ralentit, notification "1 avis non répondu", agenda vide, icône de dollar barrée.`
          : `Plan poitrine face caméra, regard intense. Zoom avant léger sur "Tu perds des clients chaque jour".`,
        screen_text: 'Tu perds 3 clients par semaine sans le savoir.',
        audio_voiceover: `${input.productName} — ${input.angleOrPainPoint}. Tu perds des clients chaque jour sans même t'en rendre compte.`,
      },
      {
        timestamp: '3-12s',
        section: 'BODY',
        visual_directives: isBroll
          ? `Montage rapide (1.5s/cut) : interface ${input.productName} qui s'ouvre, tableau de bord qui remplit, avis 5 étoiles qui apparaissent, calendrier de posts qui se planifie. Split-screen gauche=démo droite=résultat.`
          : `Jump cut toutes les 3s. PiP capture écran ${input.productName} en incrustation droite. Sous-titres dynamiques mot-à-mot colorés (teal highlight sur les mots-clés).`,
        screen_text: isBroll
          ? `${input.productName}\n→ Réponses auto\n→ Posts planifiés\n→ Avis gérés`
          : `Réponses auto • Posts planifiés • Avis gérés\nEn 1 clic.`,
        audio_voiceover: `Avec ${input.productName}, tes avis Google sont répondus automatiquement, tes posts se planifient toute la semaine, et ton inbox est gérée en temps réel. Tout ça, depuis une seule appli.`,
      },
      {
        timestamp: '12-15s',
        section: 'CTA',
        visual_directives: isBroll
          ? `Écran final centré : logo ${input.productName} + bouton CTA pulsé + fond gradient teal→dark. Texte qui apparaît lettre par lettre.`
          : `Zoom arrière, orateur montre l'écran du téléphone avec ${input.productName}. Sous-titre final géant animé.`,
        screen_text: `Essaie ${input.productName} gratuitement →`,
        audio_voiceover: `Essaie ${input.productName} maintenant. Lien dans la bio.`,
      },
    ],
    social_copywriting: {
      caption: `${input.angleOrPainPoint} ?\n\n${input.productName} gère tes réponses, tes posts et tes avis pendant que toi, tu gères ton business.\n\nEssaie gratuitement 👇`,
      hashtags: [`#${input.productName.replace(/\s+/g, '')}`, '#PME', '#MarketingLocal', '#Productivité', '#IA'],
    },
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useShortFormVideoScript() {
  return useMutation({
    mutationFn: async (input: ShortFormScriptInput): Promise<ShortFormScript> => {
      // Demo mode: return mock instantly
      const isDemo = localStorage.getItem('kompilot_demo_mode') === '1';
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1500)); // simulate latency
        return getMockScript(input);
      }

      const { text } = await blink.ai.generateText({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        model: 'gpt-4.1',
        maxTokens: 1200,
        temperature: 0.8,
      });

      // Parse JSON — strip markdown fences if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        return JSON.parse(cleaned) as ShortFormScript;
      } catch {
        throw new Error('La réponse de l\'IA n\'est pas un JSON valide. Veuillez réessayer.');
      }
    },
  });
}
