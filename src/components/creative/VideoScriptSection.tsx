import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { Sparkles, Video, ChevronDown, ChevronUp, Copy, RotateCcw } from 'lucide-react';
import { blink } from '../../blink/client';
import { VideoScript, markCreativeGenerated } from './utils';

// ── Video Script / UGC Generator Section ──────────────────────────────────────

export function VideoScriptSection({ userId }: { userId?: string }) {
  const [topic,    setTopic]    = useState('');
  const [sector,   setSector]   = useState('restaurant');
  const [tone,     setTone]     = useState('dynamique');
  const [loading,  setLoading]  = useState(false);
  const [script,   setScript]   = useState<VideoScript | null>(null);
  const [expanded, setExpanded] = useState<string | null>('hook');

  const SECTORS = ['Restaurant', 'Coiffeur', 'Médical', 'Boutique', 'Salle de sport', 'Autre'];
  const TONES   = ['Dynamique', 'Professionnel', 'Fun & Décalé', 'Inspirant', 'Urgence / Promo'];

  async function handleGenerate() {
    if (!topic.trim()) {
      toast.error('Décrivez le sujet de votre vidéo');
      return;
    }
    setLoading(true);
    try {
      const { text } = await blink.ai.generateText({
        prompt: `Tu es un expert en contenu viral TikTok/Instagram Reels pour des PME françaises.
Génère un script storyboard complet pour une vidéo courte (30-60s) sur ce sujet : "${topic}"
Secteur : ${sector}, Ton : ${tone}

Réponds UNIQUEMENT en JSON avec cette structure exacte :
{
  "hook": "Le hook visuel accrocheur (3-5 secondes, description de l'action/visage/situation choc)",
  "body": "Le corps du message (ce qu'on montre/dit, 20-40 secondes, 3-4 points)",
  "cta": "L'appel à l'action final (5-10 secondes, texte exact à dire/afficher)",
  "format": "Format recommandé (ex: Reel vertical 9:16 • 45 secondes)",
  "broll": [
    "Action physique précise #1 : ce que le commerçant doit filmer avec son téléphone (ex: Filmez vos mains en train de préparer...)",
    "Action physique précise #2 : plan produit ou service en gros plan (ex: Zoomez lentement sur...)",
    "Action physique précise #3 : plan d'ambiance ou client satisfait (ex: Filmez l'entrée de votre établissement...)"
  ]
}`,
        model: 'gpt-4.1-mini',
      });
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Format de réponse inattendu');
      const parsed: VideoScript = JSON.parse(jsonMatch[0]);
      setScript(parsed);
      if (userId) markCreativeGenerated(userId);
      toast.success('🎬 Script généré !');
    } catch (err: any) {
      toast.error('Erreur : ' + (err?.message ?? 'Réessayez'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Controls */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Video size={16} className="text-primary" /> Concepteur de Scripts UGC
        </h2>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Sujet de la vidéo</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            rows={3}
            placeholder="Ex: Nouvelle offre découverte petit-déjeuner à 9€ ce weekend seulement…"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Secteur</label>
            <select
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {SECTORS.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Ton</label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {TONES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
            </select>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full gap-2">
          {loading ? <><span className="animate-spin">⟳</span> Génération…</> : <><Sparkles size={16} /> Générer le script</>}
        </Button>
        <p className="text-[10px] text-muted-foreground/70 text-center mt-1 leading-relaxed">
          ✍️ En validant ce contenu IA, vous en acceptez l'entière responsabilité éditoriale.
        </p>
      </div>

      {/* Script output */}
      <div className="rounded-2xl border border-border bg-card p-5">
        {!script ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Video size={28} className="text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">Votre script storyboard apparaîtra ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">📋 Script Storyboard</h3>
              <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/15 font-medium">
                {script.format}
              </span>
            </div>

            {[
              { key: 'hook', label: '🎣 Hook visuel',     emoji: '⚡', color: 'amber',   content: script.hook },
              { key: 'body', label: '📢 Corps du message', emoji: '💬', color: 'blue',    content: script.body },
              { key: 'cta',  label: '🚀 Appel à l\'action', emoji: '🎯', color: 'green', content: script.cta  },
            ].map(section => (
              <div
                key={section.key}
                className="rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === section.key ? null : section.key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-foreground">{section.label}</span>
                  {expanded === section.key
                    ? <ChevronUp size={14} className="text-muted-foreground" />
                    : <ChevronDown size={14} className="text-muted-foreground" />}
                </button>
                {expanded === section.key && (
                  <div className="px-4 py-3 text-sm text-foreground/80 leading-relaxed bg-background">
                    {section.content}
                    <button
                      onClick={() => navigator.clipboard.writeText(section.content)}
                      className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Copy size={11} /> Copier
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* ── B-Roll Shooting Guide ── */}
            {script.broll && script.broll.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b border-border flex items-center gap-2">
                  <span className="text-base">📸</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">Vos instructions de tournage (B-Rolls)</p>
                    <p className="text-[10px] text-muted-foreground">3 plans à filmer avec votre téléphone pour illustrer ce script</p>
                  </div>
                </div>
                <div className="divide-y divide-border/60">
                  {script.broll.slice(0, 3).map((instruction, idx) => (
                    <div key={idx} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed flex-1">{instruction}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 bg-amber-50/50 dark:bg-amber-950/10 flex items-center gap-1.5">
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    💡 Astuce : Filmez chaque plan en 3 secondes min. Mode portrait, lumière naturelle si possible.
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setScript(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              <RotateCcw size={12} /> Régénérer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
