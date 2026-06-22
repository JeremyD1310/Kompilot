/**
 * FlashPostGenerator — Encart 1 "L'Idée du jour".
 *
 * Génère des idées de posts via l'IA (blink.ai.generateText) contextualisées
 * à l'établissement actif. Fallback sur le pool statique si l'IA échoue.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, RefreshCw, ImagePlus, Sparkles, CalendarDays, Loader2 } from 'lucide-react';
import { blink } from '../../../blink/client';
import { useEstablishment } from '../../../context/EstablishmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PostIdea = {
  text: string;
  visualHint: string;
  channel: string;
  channelColor: string;
  tone: string;
  engagement: string;
  isAI?: boolean;
};

// ── Static fallback pool ───────────────────────────────────────────────────────

const POST_IDEAS: PostIdea[] = [
  {
    text: '☀️ Nouvelle semaine, nouvelles opportunités ! Notre équipe est à votre service du lundi au samedi. Réservez votre créneau en ligne — les créneaux partent vite. 🗓️',
    visualHint: "Photo d'ambiance du commerce ou de l'équipe souriante",
    channel: 'Instagram',
    channelColor: '#E879F9',
    tone: 'Chaleureux & Communautaire',
    engagement: "+34% d'engagement estimé",
  },
  {
    text: '🎯 70% de nos clients nous ont découverts via Google. Valorisez votre savoir-faire local — laissez-nous un avis et aidez vos voisins à vous trouver. ⭐',
    visualHint: "Capture d'écran de vos étoiles Google ou logo établissement",
    channel: 'Google Business',
    channelColor: '#FB923C',
    tone: 'Social Proof & Local',
    engagement: '+41% de clics GMB',
  },
  {
    text: '💼 Dernière prestation livrée avec notre exigence habituelle. Chaque client mérite notre expertise complète — c\'est pourquoi nous ne faisons jamais de compromis.',
    visualHint: 'Résultat "avant/après" ou photo du travail terminé',
    channel: 'LinkedIn',
    channelColor: '#60A5FA',
    tone: 'Expertise & Confiance',
    engagement: '+28% de partages',
  },
  {
    text: '🔥 Offre exclusive cette semaine uniquement — profitez de -15% sur votre prochaine réservation. Partagez ce post pour en faire profiter un proche. 🎟️',
    visualHint: 'Visuel promo avec fond coloré et texte en évidence',
    channel: 'Facebook',
    channelColor: '#60A5FA',
    tone: 'Urgence & Conversion',
    engagement: '+52% de clics estimés',
  },
  {
    text: '✨ Chaque détail compte. Voici les coulisses de notre métier — parce que la qualité se voit, se ressent, et se mérite. Bienvenue dans notre univers.',
    visualHint: 'Vidéo courte ou photo des coulisses de votre activité',
    channel: 'Instagram',
    channelColor: '#E879F9',
    tone: 'Storytelling & Authenticité',
    engagement: '+47% de sauvegardes',
  },
  {
    text: '📣 Vos retours comptent énormément pour nous. Merci à tous nos clients fidèles — c\'est grâce à vous que nous donnons le meilleur chaque jour. 💚',
    visualHint: "Capture d'un avis 5 étoiles ou collage de témoignages clients",
    channel: 'Google Business',
    channelColor: '#FB923C',
    tone: 'Gratitude & Fidélisation',
    engagement: "+38% d'interactions",
  },
  {
    text: '🗓️ Planning de la semaine chargé mais maîtrisé. Vous avez besoin d\'un créneau en urgence ? Notre agenda en ligne est mis à jour en temps réel.',
    visualHint: "Calendrier stylisé ou photo de l'équipe au travail",
    channel: 'Instagram',
    channelColor: '#E879F9',
    tone: 'Disponibilité & Réactivité',
    engagement: '+31% de prises de RDV',
  },
];

const CHANNEL_COLORS: Record<string, string> = {
  instagram: '#E879F9',
  facebook: '#60A5FA',
  'google business': '#FB923C',
  linkedin: '#60A5FA',
  twitter: '#38BDF8',
  tiktok: '#F43F5E',
};

function channelColor(name: string): string {
  return CHANNEL_COLORS[name.toLowerCase()] ?? '#94A3B8';
}

// ── AI generation ─────────────────────────────────────────────────────────────

async function generateAIIdea(
  establishmentName: string,
  activity: string,
  city: string
): Promise<PostIdea> {
  const prompt = `Tu es un expert en marketing local pour les TPE/PME françaises.

Génère UNE idée de post engageante pour "${establishmentName}" (secteur: ${activity}, ville: ${city}).

Réponds UNIQUEMENT en JSON valide avec ce format exact:
{
  "text": "Texte du post avec 1-3 phrases percutantes, emojis pertinents, maximum 280 caractères",
  "visualHint": "Suggestion visuelle concrète pour accompagner le post (1 phrase)",
  "channel": "Un parmi: Instagram, Facebook, Google Business, LinkedIn",
  "tone": "Ton utilisé en 2-4 mots (ex: Urgence & Conversion)",
  "engagement": "Statistique d'engagement estimée (ex: +35% d'engagement)"
}

Le post doit être en français, adapté au secteur "${activity}", avec un angle original.`;

  const { text: raw } = await blink.ai.generateText({
    prompt,
    model: 'gpt-4.1-mini',
    maxTokens: 350,
    temperature: 0.85,
  });

  // Extract JSON — the model sometimes wraps it in ```json fences
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    text: String(parsed.text || ''),
    visualHint: String(parsed.visualHint || 'Photo de votre établissement ou équipe'),
    channel: String(parsed.channel || 'Instagram'),
    channelColor: channelColor(String(parsed.channel || 'Instagram')),
    tone: String(parsed.tone || 'Engagement & Authenticité'),
    engagement: String(parsed.engagement || '+30% d\'engagement estimé'),
    isAI: true,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface FlashPostGeneratorProps {
  onApprove?: (text: string, channel: string) => void;
}

export function FlashPostGenerator({ onApprove }: FlashPostGeneratorProps) {
  const { activeEstablishment } = useEstablishment();

  const initialIndex = new Date().getDay() % POST_IDEAS.length;
  const [currentIdea, setCurrentIdea] = useState<PostIdea>(POST_IDEAS[initialIndex]);
  const [staticIndex, setStaticIndex] = useState(initialIndex);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [approved, setApproved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const handleRegenerate = useCallback(async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError(false);
    setDirection(1);
    setApproved(false);

    try {
      const name = activeEstablishment.name || activeEstablishment.shortName || 'Mon Commerce';
      const activity = activeEstablishment.category || 'Commerce local';
      const city = activeEstablishment.address?.split(',').pop()?.trim() || 'France';

      const idea = await generateAIIdea(name, activity, city);
      setCurrentIdea(idea);
    } catch (_err) {
      // Fallback to static pool on error
      setAiError(true);
      const nextIndex = (staticIndex + 1) % POST_IDEAS.length;
      setStaticIndex(nextIndex);
      setCurrentIdea(POST_IDEAS[nextIndex]);
    } finally {
      setAiLoading(false);
    }
  }, [aiLoading, staticIndex, activeEstablishment]);

  const handleApprove = useCallback(() => {
    if (approved) return;
    setApproved(true);
    try {
      localStorage.setItem('kompilot_flash_post_draft', JSON.stringify({
        text: currentIdea.text,
        channel: currentIdea.channel,
        approvedAt: new Date().toISOString(),
      }));
    } catch (_) { /* ignore */ }
    window.dispatchEvent(new CustomEvent('kompilot:flash-post-ready', {
      detail: { text: currentIdea.text, channel: currentIdea.channel },
    }));
    onApprove?.(currentIdea.text, currentIdea.channel);
  }, [approved, currentIdea, onApprove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(145deg, rgba(13,148,136,0.11) 0%, rgba(13,148,136,0.04) 100%)',
        border: '1.5px solid rgba(13,148,136,0.22)',
        boxShadow: '0 4px 28px rgba(13,148,136,0.09)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 pt-4 pb-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(13,148,136,0.12)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(13,148,136,0.28), rgba(13,148,136,0.12))',
              border: '1px solid rgba(13,148,136,0.32)',
            }}
          >
            <Sparkles size={13} className="text-[#0D9488]" />
          </div>
          <div>
            <p className="text-[9px] text-[#0D9488]/70 uppercase tracking-widest font-black">
              IA · Idée du jour
            </p>
            <p className="text-[11px] font-bold text-white leading-tight">Générateur Flash</p>
          </div>
        </div>

        {/* Channel badge + AI indicator */}
        <div className="flex items-center gap-1.5">
          {currentIdea.isAI && (
            <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(13,148,136,0.15)',
                border: '1px solid rgba(13,148,136,0.3)',
                color: '#2DD4BF',
              }}
            >
              ✦ IA live
            </span>
          )}
          <AnimatePresence mode="wait">
            <motion.span
              key={currentIdea.channel}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18 }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{
                background: `${currentIdea.channelColor}15`,
                border: `1px solid ${currentIdea.channelColor}30`,
                color: currentIdea.channelColor,
              }}
            >
              {currentIdea.channel}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Post text preview ─────────────────────────────────────── */}
      <div className="flex-1 px-4 py-3 space-y-3">
        {/* Animated text swap */}
        <div className="relative min-h-[4.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            {aiLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col gap-2 justify-center"
              >
                <div
                  className="h-2.5 rounded-full animate-pulse"
                  style={{ background: 'rgba(13,148,136,0.18)', width: '85%' }}
                />
                <div
                  className="h-2.5 rounded-full animate-pulse"
                  style={{ background: 'rgba(13,148,136,0.12)', width: '70%', animationDelay: '0.1s' }}
                />
                <div
                  className="h-2.5 rounded-full animate-pulse"
                  style={{ background: 'rgba(13,148,136,0.08)', width: '50%', animationDelay: '0.2s' }}
                />
              </motion.div>
            ) : (
              <motion.p
                key={currentIdea.text.slice(0, 20)}
                initial={{ opacity: 0, y: direction * 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: direction * -8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="text-xs text-slate-300 leading-relaxed absolute inset-0"
              >
                {currentIdea.text}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Visual hint */}
        <div
          className="flex items-start gap-2 rounded-xl px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <ImagePlus size={12} className="text-slate-600 shrink-0 mt-0.5" />
          <AnimatePresence mode="wait">
            <motion.p
              key={currentIdea.visualHint.slice(0, 15)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[10px] text-slate-500 italic leading-snug"
            >
              {aiLoading ? 'Génération en cours…' : currentIdea.visualHint}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentIdea.tone}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                color: '#64748B',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              🎨 {currentIdea.tone}
            </motion.span>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.span
              key={currentIdea.engagement}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(52,211,153,0.08)',
                color: '#34D399',
                border: '1px solid rgba(52,211,153,0.15)',
              }}
            >
              📈 {currentIdea.engagement}
            </motion.span>
          </AnimatePresence>
          {aiError && (
            <span
              className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(251,191,36,0.08)',
                color: '#FBBF24',
                border: '1px solid rgba(251,191,36,0.15)',
              }}
            >
              ↩ Pool local
            </span>
          )}
        </div>
      </div>

      {/* ── Action row ───────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Approve & Publish CTA */}
        <motion.button
          onClick={handleApprove}
          disabled={approved || aiLoading}
          whileHover={!approved && !aiLoading ? { scale: 1.02 } : {}}
          whileTap={!approved && !aiLoading ? { scale: 0.97 } : {}}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all disabled:cursor-default"
          style={{
            background: approved
              ? 'linear-gradient(135deg, #059669, #047857)'
              : aiLoading
              ? 'rgba(13,148,136,0.3)'
              : 'linear-gradient(135deg, #0D9488, #0B7A6F)',
            boxShadow: approved
              ? '0 2px 12px rgba(5,150,105,0.35)'
              : aiLoading
              ? 'none'
              : '0 4px 20px rgba(13,148,136,0.42)',
            color: '#fff',
          }}
        >
          {approved ? (
            <>
              <CheckCircle2 size={13} />
              Post prêt dans la modale ✓
            </>
          ) : (
            <>
              <CalendarDays size={13} />
              Approuver &amp; Publier
            </>
          )}
        </motion.button>

        {/* Regenerate — calls AI */}
        <motion.button
          onClick={handleRegenerate}
          disabled={aiLoading}
          whileHover={!aiLoading ? { scale: 1.08 } : {}}
          whileTap={!aiLoading ? { scale: 0.92 } : {}}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-50"
          style={{
            background: aiLoading
              ? 'rgba(13,148,136,0.12)'
              : 'rgba(255,255,255,0.04)',
            border: aiLoading
              ? '1px solid rgba(13,148,136,0.3)'
              : '1px solid rgba(255,255,255,0.09)',
            color: aiLoading ? '#0D9488' : '#64748B',
          }}
          title={aiLoading ? 'Génération IA en cours…' : 'Générer une nouvelle idée avec l\'IA'}
        >
          {aiLoading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RefreshCw size={13} className="transition-transform hover:rotate-180 duration-300" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default FlashPostGenerator;
