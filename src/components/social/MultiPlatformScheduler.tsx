import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, CardContent, Button, Textarea, Input, Badge, toast,
} from '@blinkdotnew/ui';
import {
  Camera, Users, Briefcase, Globe, Music2, MessageCircle,
  Calendar, Clock, Sparkles, Image as ImageIcon, Smile, MapPin,
  CheckCircle2, AlertCircle, RefreshCw, Send, Save, Trash2,
  ChevronDown, Smartphone, Eye, X,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useScheduledPosts } from '../../hooks/useScheduledPosts';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '@/lib/utils';

// ── Platform config ────────────────────────────────────────────────────────────

type Platform = 'Instagram' | 'Facebook' | 'LinkedIn' | 'Google' | 'TikTok' | 'WhatsApp';

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  maxChars: number;
  tips: string;
}

const PLATFORMS: PlatformConfig[] = [
  { id: 'Instagram', name: 'Instagram', icon: <Camera className="h-4 w-4" />, color: 'text-pink-500', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30', maxChars: 2200, tips: 'Hashtags, emojis et photos performent très bien' },
  { id: 'Facebook', name: 'Facebook', icon: <Users className="h-4 w-4" />, color: 'text-blue-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', maxChars: 63206, tips: 'Les posts avec questions génèrent plus d\'engagement' },
  { id: 'LinkedIn', name: 'LinkedIn', icon: <Briefcase className="h-4 w-4" />, color: 'text-blue-700', bgColor: 'bg-blue-700/10', borderColor: 'border-blue-700/30', maxChars: 3000, tips: 'Storytelling pro et insights sectoriels privilégiés' },
  { id: 'Google', name: 'Google Business', icon: <Globe className="h-4 w-4" />, color: 'text-orange-500', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', maxChars: 1500, tips: 'Informations pratiques : horaires, offres, événements' },
  { id: 'TikTok', name: 'TikTok', icon: <Music2 className="h-4 w-4" />, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', maxChars: 2200, tips: 'Texte court et accrocheur pour accompagner la vidéo' },
  { id: 'WhatsApp', name: 'WhatsApp Business', icon: <MessageCircle className="h-4 w-4" />, color: 'text-green-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', maxChars: 65536, tips: 'Messages personnalisés pour vos clients fidèles' },
];

const BEST_TIMES: Record<Platform, string> = {
  Instagram: 'Mer & Ven à 11h–13h',
  Facebook: 'Mar & Jeu à 9h–10h',
  LinkedIn: 'Mar–Jeu à 8h–10h',
  Google: 'Lun à 9h (actualité semaine)',
  TikTok: 'Soir 19h–21h',
  WhatsApp: 'Mar & Jeu à 10h',
};

const AI_TEMPLATES = [
  { id: 't1', emoji: '🌟', label: 'Offre spéciale', text: 'Ne manquez pas notre offre exclusive cette semaine ! 🚀 Profitez de [REMISE] sur [SERVICE]. Contactez-nous dès maintenant ! ' },
  { id: 't2', emoji: '📸', label: 'Coulisses équipe', text: 'Rencontrez les visages derrière votre expérience préférée 😊 Notre équipe passionnée œuvre chaque jour pour vous offrir le meilleur. ' },
  { id: 't3', emoji: '🎉', label: 'Événement local', text: 'Nous participons à [NOM_ÉVÉNEMENT] ! 📍 Venez nous retrouver le [DATE] à [LIEU]. On vous attend nombreux ! ' },
  { id: 't4', emoji: '⭐', label: 'Avis client', text: '"[TÉMOIGNAGE_CLIENT]" — [NOM_CLIENT] ⭐⭐⭐⭐⭐\nMerci pour cette confiance ! Votre satisfaction est notre priorité. ' },
  { id: 't5', emoji: '💡', label: 'Conseil expert', text: 'Astuce pro : [CONSEIL_UTILE] 💡\nSaviez-vous que [FAIT_INTÉRESSANT] ? Suivez-nous pour plus de conseils ! ' },
];

const SMART_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '17:00', '18:00', '19:00', '20:00'];

// ── Phone preview ──────────────────────────────────────────────────────────────

function PhonePreview({ content, platform }: { content: string; platform: Platform }) {
  const p = PLATFORMS.find(p => p.id === platform);
  return (
    <div className="relative mx-auto w-[200px]">
      {/* Phone shell */}
      <div className="relative bg-slate-900 rounded-[2.5rem] border-[6px] border-slate-800 shadow-2xl overflow-hidden aspect-[9/19]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-slate-800 rounded-b-xl z-10" />
        <div className="h-full bg-white flex flex-col overflow-hidden">
          {/* App header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-400 to-purple-500" />
              <span className="text-[9px] font-bold text-slate-800">kompilot</span>
            </div>
            <div className={cn('text-[8px] font-medium px-1.5 py-0.5 rounded-full', p?.bgColor, p?.color)}>
              {platform}
            </div>
          </div>
          {/* Post image area */}
          <div className="bg-slate-100 flex items-center justify-center" style={{ height: '90px' }}>
            <div className="flex flex-col items-center gap-1 text-slate-300">
              <ImageIcon size={20} />
              <span className="text-[7px]">Votre image</span>
            </div>
          </div>
          {/* Post content */}
          <div className="flex-1 px-3 py-2 overflow-hidden">
            <div className="flex gap-2 mb-1.5">
              {['❤️', '💬', '↗️'].map(e => (
                <span key={e} className="text-[11px]">{e}</span>
              ))}
            </div>
            <p className="text-[8px] font-bold text-slate-800 mb-0.5">kompilot</p>
            <p className="text-[8px] text-slate-600 leading-relaxed line-clamp-4">
              {content || 'Votre texte apparaîtra ici…'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Platform tip chip ──────────────────────────────────────────────────────────

function PlatformTip({ platform }: { platform: Platform }) {
  const p = PLATFORMS.find(p => p.id === platform);
  if (!p) return null;
  return (
    <div className={cn('flex items-start gap-2 rounded-xl border px-3 py-2', p.bgColor, p.borderColor)}>
      <div className={p.color}>{p.icon}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{p.tips}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export const MultiPlatformScheduler: React.FC = () => {
  const { user } = useAuth();
  const { createPost, isLoading } = useScheduledPosts();

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['Instagram', 'LinkedIn']);
  const [content, setContent] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('14:00');
  const [previewPlatform, setPreviewPlatform] = useState<Platform>('Instagram');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const timeRef = useRef<HTMLDivElement>(null);

  const charCount = content.length;
  const currentPlatformConfig = PLATFORMS.find(p => p.id === previewPlatform);
  const isOverLimit = currentPlatformConfig ? charCount > currentPlatformConfig.maxChars : false;

  // Close time dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (timeRef.current && !timeRef.current.contains(e.target as Node)) {
        setShowTimeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const togglePlatform = (id: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
    setPreviewPlatform(id);
  };

  const applySmartTime = () => {
    const today = new Date();
    const thursday = new Date(today);
    thursday.setDate(today.getDate() + ((4 - today.getDay() + 7) % 7 || 7));
    setScheduleDate(thursday.toISOString().split('T')[0]);
    setScheduleTime('14:00');
    toast.success('Créneau optimal appliqué : Jeudi 14:00');
  };

  const handleGenerateAI = async () => {
    if (!user) { blink.auth.login(window.location.href); return; }
    setGeneratingAI(true);
    setContent('');
    const platforms = selectedPlatforms.join(', ') || 'Instagram';
    try {
      let result = '';
      await blink.ai.streamText(
        {
          messages: [{
            role: 'user',
            content: `Génère un post accrocheur pour un commerçant local français, optimisé pour ${platforms}. 
Max 150 mots. Inclus des emojis pertinents. Commence directement par le texte du post, sans introduction.
Thème : mettre en valeur l'authenticité et le service client de l'établissement.`,
          }],
          model: 'gpt-4.1-mini',
          maxTokens: 200,
        },
        (chunk) => { result += chunk; setContent(result); }
      );
    } catch {
      toast.error('Erreur IA. Réessayez dans un instant.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) { toast.error('Le contenu ne peut pas être vide'); return; }
    setSaving(true);
    try {
      await createPost({
        textContent: content,
        channels: JSON.stringify(selectedPlatforms),
        status: 'draft',
        scheduledAt: undefined,
      });
      toast.success('Brouillon sauvegardé !');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0) { toast.error('Sélectionnez au moins un réseau'); return; }
    if (!content.trim()) { toast.error('Le contenu ne peut pas être vide'); return; }
    if (!scheduleDate) { toast.error('Choisissez une date de publication'); return; }
    setSaving(true);
    try {
      const scheduledAt = `${scheduleDate}T${scheduleTime}:00`;
      await createPost({
        textContent: content,
        channels: JSON.stringify(selectedPlatforms),
        status: 'scheduled',
        scheduledAt,
      });
      toast.success(`✅ Publication planifiée sur ${selectedPlatforms.length} réseau${selectedPlatforms.length > 1 ? 'x' : ''} !`);
      setContent('');
      setSelectedPlatforms(['Instagram', 'LinkedIn']);
      setScheduleDate('');
    } catch {
      toast.error('Erreur lors de la planification');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Platform selector */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Réseaux sociaux cibles
          </p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <motion.button
                  key={platform.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 transition-all duration-150 text-sm font-medium',
                    isSelected
                      ? `${platform.bgColor} ${platform.borderColor} ${platform.color} shadow-sm`
                      : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-border hover:bg-muted/50'
                  )}
                >
                  {platform.icon}
                  <span>{platform.name.split(' ')[0]}</span>
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 ml-0.5" />}
                </motion.button>
              );
            })}
          </div>

          {/* Best times strip */}
          <AnimatePresence>
            {selectedPlatforms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex flex-wrap gap-1.5 overflow-hidden"
              >
                {selectedPlatforms.map(p => (
                  <span key={p} className="text-[11px] text-muted-foreground bg-muted/50 border border-border/50 rounded-full px-2.5 py-1">
                    <span className="font-medium text-foreground/70">{p}</span> · {BEST_TIMES[p]}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Main editor grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-5">
        {/* Left: Editor */}
        <div className="space-y-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-4">
              {/* AI templates */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Modèles IA :</span>
                {AI_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setContent(prev => prev + t.text)}
                    className="text-[11px] bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium"
                  >
                    <span>{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="relative">
                <Textarea
                  placeholder="Rédigez votre publication ici, ou utilisez un modèle IA ci-dessus…"
                  className="min-h-[160px] resize-none text-sm p-4 pr-12 rounded-xl border-border/60 focus:ring-primary/20 leading-relaxed"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
                {/* Toolbar */}
                <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
                  <button title="Emojis" className="w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Smile size={14} />
                  </button>
                  <button title="Image" className="w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <ImageIcon size={14} />
                  </button>
                  <button title="Localisation" className="w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <MapPin size={14} />
                  </button>
                </div>
              </div>

              {/* Char count + AI generate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs font-mono tabular-nums', isOverLimit ? 'text-destructive font-bold' : 'text-muted-foreground')}>
                    {charCount.toLocaleString()}
                    {currentPlatformConfig && ` / ${currentPlatformConfig.maxChars.toLocaleString()}`}
                  </span>
                  {isOverLimit && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                      <AlertCircle size={10} /> Dépassement
                    </span>
                  )}
                </div>
                <button
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-primary to-violet-500 rounded-lg px-3 py-1.5 hover:opacity-90 active:scale-[0.97] transition-all disabled:opacity-60 shadow-sm"
                >
                  {generatingAI
                    ? <><RefreshCw size={12} className="animate-spin" /> Génération…</>
                    : <><Sparkles size={12} /> Générer avec l'IA</>
                  }
                </button>
              </div>

              {/* Platform tip */}
              {selectedPlatforms.length > 0 && (
                <PlatformTip platform={selectedPlatforms[0]} />
              )}
            </CardContent>
          </Card>

          {/* Schedule controls */}
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Planification
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar size={12} /> Date
                  </label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-9 text-sm bg-muted/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock size={12} /> Heure
                  </label>
                  <div className="relative" ref={timeRef}>
                    <button
                      onClick={() => setShowTimeDropdown(v => !v)}
                      className="w-full h-9 flex items-center justify-between px-3 text-sm bg-muted/30 border border-border rounded-lg hover:border-border/80 transition-colors"
                    >
                      <span>{scheduleTime}</span>
                      <ChevronDown size={14} className="text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {showTimeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-10 left-0 z-20 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden"
                        >
                          {SMART_TIMES.map(t => (
                            <button
                              key={t}
                              onClick={() => { setScheduleTime(t); setShowTimeDropdown(false); }}
                              className={cn('w-full text-left text-sm px-3 py-2 hover:bg-muted/70 transition-colors', scheduleTime === t && 'bg-primary/10 text-primary font-medium')}
                            >
                              {t}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Smart slot suggestion */}
              <button
                onClick={applySmartTime}
                className="w-full flex items-center gap-3 bg-primary/5 border border-primary/15 hover:bg-primary/10 transition-colors rounded-xl px-4 py-3 text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Créneau optimal IA</p>
                  <p className="text-xs text-muted-foreground">Jeudi 14:00 · Meilleur engagement sur LinkedIn & IG</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0">
                  Appliquer →
                </Badge>
              </button>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={saving || !content.trim()}
                  className="flex-1 gap-2"
                >
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  Brouillon
                </Button>
                <Button
                  size="sm"
                  onClick={handleSchedule}
                  disabled={saving || !content.trim() || selectedPlatforms.length === 0}
                  className="flex-1 gap-2"
                >
                  {saving ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  Planifier
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Phone preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone size={12} /> Aperçu
            </p>
            {/* Platform switch for preview */}
            {selectedPlatforms.length > 1 && (
              <div className="flex gap-1">
                {selectedPlatforms.slice(0, 3).map(p => {
                  const cfg = PLATFORMS.find(x => x.id === p)!;
                  return (
                    <button
                      key={p}
                      onClick={() => setPreviewPlatform(p)}
                      className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-all', cfg.bgColor, previewPlatform === p ? cfg.color + ' ring-2 ring-current/30' : 'text-muted-foreground')}
                    >
                      <span className="scale-75">{cfg.icon}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <PhonePreview content={content} platform={previewPlatform} />

          {/* Schedule summary */}
          {scheduleDate && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 p-3 space-y-1"
            >
              <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Publication planifiée
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-500">
                {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })} à {scheduleTime}
              </p>
              <p className="text-[10px] text-emerald-500">
                {selectedPlatforms.join(' · ')}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiPlatformScheduler;
