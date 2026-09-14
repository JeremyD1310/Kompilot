/**
 * QuickSocialPost — Inline social media posting widget for the Dashboard.
 * Lets users write and publish to connected social channels without leaving the page.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send, Calendar, Sparkles, ImagePlus, Globe, Clock,
  CheckCircle2, Loader2, ChevronDown,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { usePublishNow, useSchedulePost, useFacebookStatus, useInstagramStatus, useTiktokStatus, useGbpStatus, useYouTubeStatus } from '../../hooks/useSocialPublish';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '../../lib/utils';

// ── Platform config ──────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', color: 'bg-blue-500', textColor: 'text-blue-400', icon: '📘' },
  { id: 'instagram', label: 'Instagram', color: 'bg-pink-500', textColor: 'text-pink-400', icon: '📸' },
  { id: 'tiktok', label: 'TikTok', color: 'bg-slate-800', textColor: 'text-slate-300', icon: '🎵' },
  { id: 'youtube', label: 'YouTube', color: 'bg-red-600', textColor: 'text-red-400', icon: '📺' },
  { id: 'google_business', label: 'Google', color: 'bg-orange-500', textColor: 'text-orange-400', icon: '📍' },
];

// ── Component ────────────────────────────────────────────────────────────────

export function QuickSocialPost() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [posting, setPosting] = useState(false);
  const [justPosted, setJustPosted] = useState(false);

  // Check which platforms are connected
  const { data: fbStatus } = useFacebookStatus();
  const { data: igStatus } = useInstagramStatus();
  const { data: ttStatus } = useTiktokStatus();
  const { data: gbpStatus } = useGbpStatus();
  const { data: ytStatus } = useYouTubeStatus();

  const connectionMap: Record<string, boolean> = {
    facebook: !!fbStatus?.connected,
    instagram: !!igStatus?.connected,
    tiktok: !!ttStatus?.connected,
    youtube: !!ytStatus?.connected,
    google_business: !!gbpStatus?.connected,
  };

  const connectedPlatforms = PLATFORMS.filter(p => connectionMap[p.id]);
  const anyConnected = connectedPlatforms.length > 0;

  const publishNow = usePublishNow();
  const schedulePost = useSchedulePost();

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    if (!text.trim() || selectedPlatforms.length === 0) return;
    setPosting(true);
    try {
      await publishNow.mutateAsync({
        channels: selectedPlatforms,
        text: text.trim(),
      });
      setText('');
      setJustPosted(true);
      setTimeout(() => setJustPosted(false), 3000);
      toast.success('Publication envoyée !', {
        description: `Envoyé sur ${selectedPlatforms.length} plateforme${selectedPlatforms.length > 1 ? 's' : ''}.`,
      });
    } catch (err: any) {
      toast.error('Erreur lors de la publication', {
        description: err?.message ?? 'Veuillez réessayer.',
      });
    } finally {
      setPosting(false);
    }
  };

  const handleSchedule = async () => {
    if (!text.trim() || selectedPlatforms.length === 0 || !scheduleDate || !scheduleTime) return;
    setPosting(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      await schedulePost.mutateAsync({
        text: text.trim(),
        channels: selectedPlatforms,
        scheduledAt,
      });
      setText('');
      setShowSchedule(false);
      setScheduleDate('');
      setScheduleTime('');
      toast.success('Post planifié !', {
        description: `Sera publié le ${new Date(scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.`,
      });
    } catch (err: any) {
      toast.error('Erreur lors de la planification', {
        description: err?.message ?? 'Veuillez réessayer.',
      });
    } finally {
      setPosting(false);
    }
  };

  const charCount = text.length;
  const maxChars = 2200;
  const isOverLimit = charCount > maxChars;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Send size={13} className="text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Poster sur les réseaux</h3>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">Publication rapide multi-plateforme</p>
          </div>
        </div>
        <button
          onClick={() => navigate({ to: '/calendar' })}
          className="text-[11px] font-semibold text-violet-500 hover:text-violet-400 transition-colors"
        >
          Calendrier →
        </button>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Text area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Quoi de neuf ? Écrivez votre post ou laissez l'IA rédiger…"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all"
          />
          <div className="flex items-center justify-between mt-1.5 px-1">
            <span className={cn(
              'text-[10px] font-medium',
              isOverLimit ? 'text-red-400' : charCount > maxChars * 0.9 ? 'text-amber-400' : 'text-muted-foreground/30'
            )}>
              {charCount}/{maxChars}
            </span>
            <button
              onClick={() => navigate({ to: '/cockpit' })}
              className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Sparkles size={10} /> Générer avec IA
            </button>
          </div>
        </div>

        {/* Platform selector */}
        {!anyConnected ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Globe size={13} className="text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-300">Aucun réseau connecté.</p>
            <button
              onClick={() => navigate({ to: '/settings' })}
              className="ml-auto text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              Connecter →
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {connectedPlatforms.map(p => {
              const selected = selectedPlatforms.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all',
                    selected
                      ? 'bg-violet-500/15 border-violet-500/30 text-violet-600'
                      : 'bg-muted border-border text-muted-foreground/60 hover:border-primary/30'
                  )}
                >
                  <span className="text-xs">{p.icon}</span>
                  {p.label}
                  {selected && <CheckCircle2 size={10} className="text-violet-500" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Schedule section (expandable) */}
        {showSchedule && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-1.5 flex-1">
              <Calendar size={12} className="text-muted-foreground/50 shrink-0" />
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <Clock size={12} className="text-muted-foreground/50 shrink-0" />
              <input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showSchedule ? (
            <Button
              size="sm"
              onClick={handleSchedule}
              disabled={!text.trim() || selectedPlatforms.length === 0 || !scheduleDate || !scheduleTime || posting || isOverLimit}
              className="flex-1 gap-1.5 bg-violet-600 hover:bg-violet-500 text-white border-0 h-9"
            >
              {posting ? <Loader2 size={13} className="animate-spin" /> : <Calendar size={13} />}
              Planifier
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={!text.trim() || selectedPlatforms.length === 0 || posting || isOverLimit}
              className="flex-1 gap-1.5 bg-violet-600 hover:bg-violet-500 text-white border-0 h-9 shadow-[0_0_12px_rgba(124,58,237,0.25)]"
            >
              {posting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : justPosted ? (
                <CheckCircle2 size={13} />
              ) : (
                <Send size={13} />
              )}
              {justPosted ? 'Envoyé !' : 'Publier maintenant'}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSchedule(v => !v)}
            className="gap-1 h-9 border-border text-muted-foreground hover:text-foreground"
          >
            <Clock size={13} />
            {showSchedule ? 'Annuler' : 'Planifier'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
