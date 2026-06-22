/**
 * UGCScriptSection — Générateur de scripts UGC complet
 * ──────────────────────────────────────────────────────
 * • 3 variantes de hooks (pattern interrupt / problème / résultat)
 * • Séquence démo / storytelling
 * • Appel à l'action avec mise en scène
 * • Sélection d'avatar
 * • Guide B-Roll détaillé (5 plans)
 */
import { useState } from 'react';
import { Sparkles, Video, Copy, RotateCcw, ChevronDown, ChevronUp, User, Camera, Clapperboard, Megaphone, Check } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UGCHook {
  type: 'pattern_interrupt' | 'problem' | 'result';
  label: string;
  emoji: string;
  text: string;
  direction: string;
}

interface UGCScript {
  hooks: UGCHook[];
  demo: {
    scene: string;
    lines: string[];
    transition: string;
  };
  cta: {
    text: string;
    direction: string;
  };
  format: string;
  duration: string;
  broll: Array<{
    seq: number;
    shot: string;
    duration: string;
    instruction: string;
  }>;
  avatar_tips: string;
}

interface AvatarProfile {
  id: string;
  label: string;
  desc: string;
  emoji: string;
  tips: string;
}

// ── Static data ────────────────────────────────────────────────────────────────

const SECTORS = ['Restaurant', 'Coiffeur', 'Médical', 'Boutique', 'Salle de sport', 'Artisan', 'Autre'];
const TONES   = ['Dynamique', 'Professionnel', 'Fun & Décalé', 'Inspirant', 'Urgence / Promo'];
const DURATIONS = ['15 secondes', '30 secondes', '45 secondes', '60 secondes'];

const AVATAR_PROFILES: AvatarProfile[] = [
  {
    id: 'owner',
    label: 'Le Patron',
    desc: 'Vous en tant que gérant, authenticité maximale',
    emoji: '👨‍💼',
    tips: 'Tenue semi-pro, fond de votre établissement reconnaissable',
  },
  {
    id: 'expert',
    label: "L'Expert",
    desc: 'Ton autoritaire et pédagogique, crédibilité métier',
    emoji: '🔬',
    tips: 'Tablier ou tenue de travail, outils visibles en arrière-plan',
  },
  {
    id: 'customer',
    label: 'Le Client',
    desc: 'Témoignage client réel ou simulé, social proof',
    emoji: '😊',
    tips: 'Tenue casual, fond neutre ou extérieur de votre établissement',
  },
  {
    id: 'storyteller',
    label: 'Le Narrateur',
    desc: 'Voix off + visuels produit, aucune présence physique',
    emoji: '🎙️',
    tips: 'Pas d\'apparition face caméra — uniquement voix + B-Roll',
  },
];

const HOOK_META: Record<string, { color: string; bg: string; border: string }> = {
  pattern_interrupt: { color: 'text-rose-600 dark:text-rose-400',   bg: 'bg-rose-50 dark:bg-rose-950/30',   border: 'border-rose-200 dark:border-rose-800' },
  problem:           { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
  result:            { color: 'text-teal-600 dark:text-teal-400',   bg: 'bg-teal-50 dark:bg-teal-950/30',   border: 'border-teal-200 dark:border-teal-800' },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function markCreativeGenerated(userId: string) {
  localStorage.setItem(`ai_creative_generated_${userId}`, '1');
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors mt-2"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function UGCScriptSection({ userId }: { userId?: string }) {
  const [topic,       setTopic]       = useState('');
  const [sector,      setSector]      = useState('Restaurant');
  const [tone,        setTone]        = useState('Dynamique');
  const [duration,    setDuration]    = useState('30 secondes');
  const [avatarId,    setAvatarId]    = useState<string>('owner');
  const [loading,     setLoading]     = useState(false);
  const [script,      setScript]      = useState<UGCScript | null>(null);
  const [activeHook,  setActiveHook]  = useState(0);
  const [expanded,    setExpanded]    = useState<string | null>('demo');

  const selectedAvatar = AVATAR_PROFILES.find(a => a.id === avatarId)!;

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error('Décrivez le sujet de votre vidéo');
      return;
    }
    setLoading(true);
    try {
      const { text } = await blink.ai.generateText({
        prompt: `Tu es un expert en contenu UGC viral TikTok/Instagram Reels pour PME françaises.
Génère un script UGC COMPLET pour : "${topic}"
Secteur : ${sector} | Ton : ${tone} | Durée cible : ${duration} | Profil avatar : ${selectedAvatar.label} (${selectedAvatar.desc})

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "hooks": [
    {
      "type": "pattern_interrupt",
      "label": "Brise-scroll",
      "emoji": "😱",
      "text": "Texte exact à dire/afficher (choc visuel, question provocante ou info surprenante)",
      "direction": "Indication de mise en scène (ex: Regarder droit caméra, air incrédule)"
    },
    {
      "type": "problem",
      "label": "Problème courant",
      "emoji": "😤",
      "text": "Texte sur le problème que le spectateur ressent (empathie immédiate)",
      "direction": "Indication de mise en scène (ex: Soupirer, téléphone à la main)"
    },
    {
      "type": "result",
      "label": "Promesse résultat",
      "emoji": "🚀",
      "text": "Texte sur le résultat concret chiffré (preuve sociale ou promesse précise)",
      "direction": "Indication de mise en scène (ex: Sourire, stats visibles en fond)"
    }
  ],
  "demo": {
    "scene": "Description courte de la scène/décor recommandé",
    "lines": [
      "Ligne de script 1 (avec indication de jeu entre parenthèses)",
      "Ligne de script 2",
      "Ligne de script 3",
      "Ligne de script 4"
    ],
    "transition": "Comment passer du hook à cette section (ex: Coupe franche / Zoom out)"
  },
  "cta": {
    "text": "Texte exact de l'appel à l'action",
    "direction": "Indication de mise en scène pour le CTA"
  },
  "format": "Format recommandé (ex: Reel vertical 9:16)",
  "duration": "Durée estimée avec répartition (ex: 30 sec : Hook 4s / Démo 20s / CTA 6s)",
  "broll": [
    { "seq": 1, "shot": "Ouverture", "duration": "0-4 sec", "instruction": "Description précise du plan à filmer" },
    { "seq": 2, "shot": "Storytelling", "duration": "4-12 sec", "instruction": "Description précise" },
    { "seq": 3, "shot": "Démo produit", "duration": "12-22 sec", "instruction": "Description précise" },
    { "seq": 4, "shot": "Preuve sociale", "duration": "22-27 sec", "instruction": "Description précise" },
    { "seq": 5, "shot": "CTA visuel", "duration": "27-30 sec", "instruction": "Description précise" }
  ],
  "avatar_tips": "Conseil spécifique pour ce profil avatar et ce secteur (tenue, cadrage, décor)"
}`,
        model: 'gpt-4.1-mini',
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format de réponse inattendu');
      const parsed: UGCScript = JSON.parse(jsonMatch[0]);
      setScript(parsed);
      setActiveHook(0);
      setExpanded('demo');
      if (userId) markCreativeGenerated(userId);
      toast.success('🎬 Script UGC généré !');
    } catch (err: any) {
      toast.error('Erreur : ' + (err?.message ?? 'Réessayez'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── LEFT: Controls (2 cols) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Config card */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clapperboard size={16} className="text-primary" /> Générateur UGC Script
            </h2>

            {/* Topic */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                Sujet de la vidéo
              </label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={3}
                placeholder="Ex: Nouvelle offre découverte petit-déjeuner à 9€ ce weekend seulement…"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* Sector + Tone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Secteur</label>
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {SECTORS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Ton</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {TONES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Durée cible</label>
              <div className="grid grid-cols-4 gap-1.5">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`text-xs py-1.5 rounded-lg border font-medium transition-all ${
                      duration === d
                        ? 'border-primary bg-primary/8 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                    }`}
                  >
                    {d.split(' ')[0]}s
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="w-full gap-2 h-11"
            >
              {loading
                ? <><span className="animate-spin inline-block">⟳</span> Génération en cours…</>
                : <><Sparkles size={15} /> Générer le script UGC</>
              }
            </Button>
            <p className="text-[10px] text-muted-foreground/70 text-center leading-relaxed">
              ✍️ En validant ce contenu IA, vous en acceptez l'entière responsabilité éditoriale.
            </p>
          </div>

          {/* Avatar selection */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User size={14} className="text-primary" /> Profil avatar
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {AVATAR_PROFILES.map(av => (
                <button
                  key={av.id}
                  onClick={() => setAvatarId(av.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                    avatarId === av.id
                      ? 'border-primary bg-primary/8 shadow-sm'
                      : 'border-border bg-background hover:border-primary/30'
                  }`}
                >
                  <span className="text-xl">{av.emoji}</span>
                  <span className={`text-xs font-semibold ${avatarId === av.id ? 'text-primary' : 'text-foreground'}`}>
                    {av.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-snug">{av.desc}</span>
                </button>
              ))}
            </div>
            {/* Avatar tip box */}
            <div className="bg-muted/40 rounded-xl px-3 py-2.5 border border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">💡 Conseil tournage :</span>{' '}
                {script?.avatar_tips ?? selectedAvatar.tips}
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Script output (3 cols) ── */}
        <div className="lg:col-span-3 space-y-4">

          {!script ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 flex flex-col items-center justify-center min-h-[500px] text-center space-y-4 p-8">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <Video size={28} className="text-muted-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Votre script UGC apparaîtra ici</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Remplissez le formulaire et cliquez sur Générer</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header strip */}
              <div className="flex items-center justify-between rounded-xl bg-muted/40 border border-border px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Clapperboard size={14} className="text-primary" />
                  <span className="text-sm font-bold text-foreground">Script UGC</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/15 font-medium">
                    {script.format}
                  </span>
                  <span className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border font-medium">
                    {script.duration.split(':')[0].trim()}
                  </span>
                </div>
              </div>

              {/* ── 3 Hook variants ── */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                  <span className="text-base">🎣</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">3 Variantes de Hook</p>
                    <p className="text-[10px] text-muted-foreground">Choisissez celui qui correspond le mieux à votre audience</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {/* Hook tab selector */}
                  <div className="flex gap-2">
                    {script.hooks.map((hook, i) => {
                      const meta = HOOK_META[hook.type];
                      return (
                        <button
                          key={i}
                          onClick={() => setActiveHook(i)}
                          className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all ${
                            activeHook === i
                              ? `${meta.bg} ${meta.border} ${meta.color}`
                              : 'border-border bg-background text-muted-foreground hover:border-primary/30'
                          }`}
                        >
                          <span className="text-base">{hook.emoji}</span>
                          <span className="leading-snug text-center text-[10px]">{hook.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Active hook content */}
                  {script.hooks[activeHook] && (() => {
                    const hook = script.hooks[activeHook];
                    const meta = HOOK_META[hook.type];
                    return (
                      <div className={`rounded-xl border p-3.5 space-y-2 ${meta.bg} ${meta.border}`}>
                        <p className={`text-sm font-semibold leading-relaxed ${meta.color}`}>
                          "{hook.text}"
                        </p>
                        <div className="flex items-start gap-1.5 pt-1 border-t border-current/10">
                          <Camera size={11} className="text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-[11px] text-muted-foreground italic">{hook.direction}</p>
                        </div>
                        <CopyButton text={hook.text} />
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* ── Demo / Storytelling ── */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === 'demo' ? null : 'demo')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left border-b border-border"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎬</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Démo / Storytelling</p>
                      {script.demo.scene && (
                        <p className="text-[10px] text-muted-foreground">{script.demo.scene}</p>
                      )}
                    </div>
                  </div>
                  {expanded === 'demo'
                    ? <ChevronUp size={14} className="text-muted-foreground" />
                    : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>
                {expanded === 'demo' && (
                  <div className="p-4 space-y-3">
                    {/* Transition badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-medium">
                        ↪ Transition : {script.demo.transition}
                      </span>
                    </div>
                    {/* Script lines */}
                    <div className="space-y-2">
                      {script.demo.lines.map((line, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-foreground/85 leading-relaxed flex-1">{line}</p>
                        </div>
                      ))}
                    </div>
                    <CopyButton text={script.demo.lines.join('\n')} />
                  </div>
                )}
              </div>

              {/* ── CTA ── */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === 'cta' ? null : 'cta')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left border-b border-border"
                >
                  <div className="flex items-center gap-2">
                    <Megaphone size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <p className="text-sm font-bold text-foreground">Appel à l'action</p>
                  </div>
                  {expanded === 'cta'
                    ? <ChevronUp size={14} className="text-muted-foreground" />
                    : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>
                {expanded === 'cta' && (
                  <div className="p-4 space-y-3">
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5 space-y-2">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 leading-relaxed">
                        "{script.cta.text}"
                      </p>
                      <div className="flex items-start gap-1.5 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/50">
                        <Camera size={11} className="text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-[11px] text-muted-foreground italic">{script.cta.direction}</p>
                      </div>
                    </div>
                    <CopyButton text={script.cta.text} />
                  </div>
                )}
              </div>

              {/* ── Reset ── */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setScript(null)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw size={12} /> Réinitialiser
                </button>
                <button
                  onClick={() => {
                    const full = [
                      `=== HOOK (${script.hooks[activeHook]?.label}) ===`,
                      script.hooks[activeHook]?.text ?? '',
                      `\n=== DÉMO ===`,
                      script.demo.lines.join('\n'),
                      `\n=== CTA ===`,
                      script.cta.text,
                    ].join('\n');
                    navigator.clipboard.writeText(full);
                    toast.success('Script copié dans le presse-papiers !');
                  }}
                  className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  <Copy size={12} /> Copier tout le script
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── B-Roll Guide (full width) ── */}
      {script && script.broll && script.broll.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Camera size={16} className="text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-bold text-foreground">Guide de tournage B-Roll</p>
                <p className="text-[11px] text-muted-foreground">5 plans séquentiels à filmer avec votre smartphone</p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full font-medium">
              {script.broll.length} plans
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-8">#</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-28">Timing</th>
                  <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Instruction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {script.broll.map((b, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center">
                        {b.seq}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-foreground">{b.shot}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-mono">
                        {b.duration}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-foreground/80 leading-relaxed">{b.instruction}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-amber-50/50 dark:bg-amber-950/10 border-t border-border flex items-center gap-2">
            <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              💡 Astuce pro : Filmez chaque plan en au moins 3 secondes · Mode portrait 9:16 · Lumière naturelle en contre-jour léger · Stabilisateur recommandé
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
