import { useState } from 'react';
import { Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, toast } from '@blinkdotnew/ui';
import { Search, Sparkles, Play, RefreshCw, Lock, Video, Check, Zap, ArrowRight } from 'lucide-react';
import { blink } from '../../blink/client';
import { useSubscription } from '../../context/SubscriptionContext';
import { useDemoMode } from '../../context/DemoModeContext';

/* ── Demo vertical video items (Unsplash portrait crops) ──────────────────── */
const DEMO_VIDEOS = [
  { id: 'dv1', title: 'Plat signature', category: 'Restaurant', duration: '0:15', tags: ['restaurant', 'food', 'plat'], thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=360&h=640&fit=crop&q=80', accent: 'from-orange-500/70 to-rose-600/70' },
  { id: 'dv2', title: 'Routine beauté', category: 'Beauté', duration: '0:12', tags: ['beauté', 'soin', 'cosmétique'], thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=360&h=640&fit=crop&q=80', accent: 'from-pink-500/70 to-purple-600/70' },
  { id: 'dv3', title: 'Séance fitness', category: 'Sport', duration: '0:20', tags: ['sport', 'fitness', 'santé'], thumbnail: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=360&h=640&fit=crop&q=80', accent: 'from-emerald-500/70 to-teal-600/70' },
  { id: 'dv4', title: 'Visite virtuelle', category: 'Immobilier', duration: '0:30', tags: ['immobilier', 'maison', 'appartement'], thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=360&h=640&fit=crop&q=80', accent: 'from-sky-500/70 to-blue-600/70' },
  { id: 'dv5', title: 'Démo produit', category: 'Tech', duration: '0:25', tags: ['tech', 'digital', 'produit'], thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=360&h=640&fit=crop&q=80', accent: 'from-violet-500/70 to-indigo-600/70' },
  { id: 'dv6', title: 'Ambiance boutique', category: 'Commerce', duration: '0:18', tags: ['boutique', 'commerce', 'shopping'], thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=360&h=640&fit=crop&q=80', accent: 'from-amber-500/70 to-orange-600/70' },
  { id: 'dv7', title: 'Lifestyle nature', category: 'Lifestyle', duration: '0:22', tags: ['lifestyle', 'nature', 'détente'], thumbnail: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=360&h=640&fit=crop&q=80', accent: 'from-green-500/70 to-emerald-600/70' },
  { id: 'dv8', title: 'Atelier artisan', category: 'Artisanat', duration: '0:28', tags: ['artisan', 'création', 'fait-main'], thumbnail: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=360&h=640&fit=crop&q=80', accent: 'from-stone-500/70 to-brown-600/70' },
];

/* ── Upgrade dialog ───────────────────────────────────────────────────────── */
function VideoUpgradeDialog({ open, onClose, onUpgrade }: { open: boolean; onClose: () => void; onUpgrade: () => void }) {
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle className="sr-only">Passer à Pro</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center shadow-lg">
            <Video size={28} className="text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-foreground">Boostez votre engagement avec la vidéo !</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La génération de vidéos par IA est réservée aux membres <span className="font-bold text-primary">Pro</span>.
              Passez à l'offre Pro pour <span className="font-bold">19€/mois</span>.
            </p>
          </div>
          <div className="w-full space-y-2">
            {['Génération vidéo IA illimitée', 'Boîte de réception unifiée', 'Adaptation IA multi-plateformes'].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Check size={14} className="text-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <Button onClick={onUpgrade} className="w-full gap-2 mt-1">
            <Zap size={14} />
            Passer à Pro — 19€/mois
            <ArrowRight size={14} />
          </Button>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:underline">
            Continuer avec l'offre gratuite
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface VideoPickerTabProps {
  onSelect: (url: string, type: 'video') => void;
}

export function VideoPickerTab({ onSelect }: VideoPickerTabProps) {
  const { currentPlan, setPlan } = useSubscription();
  const { isDemoActive } = useDemoMode();
  // Demo mode bypasses the free gate — demo always gets video picker access
  const isFree = currentPlan.id === 'free' && !isDemoActive;

  const [showUpgrade, setShowUpgrade] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // Show upgrade modal immediately if free user
  if (isFree && !showUpgrade) {
    // Trigger on mount via useEffect equivalent — we set it on first render
  }

  const filtered = query.trim()
    ? DEMO_VIDEOS.filter(v =>
        v.title.toLowerCase().includes(query.toLowerCase()) ||
        v.category.toLowerCase().includes(query.toLowerCase()) ||
        v.tags.some(t => t.includes(query.toLowerCase()))
      )
    : DEMO_VIDEOS;

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error('Décrivez la vidéo à générer.'); return; }
    setGenerating(true);
    setGeneratedUrl(null);
    try {
      const { result } = await blink.ai.generateVideo({
        prompt: aiPrompt,
        model: 'fal-ai/veo3.1/fast',
        aspect_ratio: '9:16',
        duration: '5s',
      });
      setGeneratedUrl(result.video.url);
      toast.success('Vidéo générée !', { description: 'Cliquez pour la sélectionner.' });
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.name === 'BlinkAuthError') {
        blink.auth.login(window.location.href);
        return;
      }
      toast.error('Erreur de génération.', { description: err?.message ?? 'Réessayez.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSelect = (url: string, id: string) => {
    setSelectedId(id);
    onSelect(url, 'video');
    toast.success('Vidéo sélectionnée !', { description: 'Elle apparaît dans l\'aperçu réaliste.' });
  };

  return (
    <>
      {/* Free plan upgrade gate */}
      <VideoUpgradeDialog
        open={isFree}
        onClose={() => {/* stay on tab, user chose to stay */}}
        onUpgrade={() => {
          setPlan('pro');
          toast.success('Bienvenue sur Pro !', { description: 'Accès aux vidéos IA débloqué.' });
        }}
      />

      {/* Tab content (shown even if free — overlay handles gate) */}
      <div className={`space-y-4 ${isFree ? 'pointer-events-none opacity-40 select-none' : ''}`}>
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher : restaurant, beauté, sport..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {/* AI Generation */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles size={13} />
            Générer une vidéo par l'IA
          </div>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="Ex : une boulangerie artisanale avec des croissants dorés, ambiance chaleureuse, lumière naturelle..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[72px]"
          />
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating || !aiPrompt.trim()}
            className="w-full gap-2 h-8 text-xs"
          >
            {generating
              ? <><RefreshCw size={12} className="animate-spin" /> Génération en cours (~30s)...</>
              : <><Sparkles size={12} /> Générer la vidéo IA</>
            }
          </Button>
        </div>

        {/* Generated video result */}
        {generatedUrl && (
          <button
            type="button"
            onClick={() => handleSelect(generatedUrl, 'ai-generated')}
            className={`w-full rounded-xl border-2 overflow-hidden transition-all ${
              selectedId === 'ai-generated' ? 'border-primary ring-2 ring-primary/30' : 'border-primary/40 hover:border-primary'
            }`}
          >
            <div className="relative" style={{ aspectRatio: '9/16', maxHeight: 200, overflow: 'hidden' }}>
              <video src={generatedUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-primary/90 rounded-full p-2">
                  <Play size={16} className="text-white fill-white" />
                </div>
              </div>
              <span className="absolute top-2 left-2 text-[9px] font-bold bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                IA Généré
              </span>
            </div>
            {selectedId === 'ai-generated' && (
              <div className="py-1.5 bg-primary/10 text-center text-xs text-primary font-semibold flex items-center justify-center gap-1">
                <Check size={11} strokeWidth={3} /> Sélectionné
              </div>
            )}
          </button>
        )}

        {/* Demo grid */}
        <div>
          <p className="text-[11px] text-muted-foreground font-medium mb-2">
            Vidéos démo — Format Réels/TikTok (9:16)
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {filtered.map(video => (
              <button
                key={video.id}
                type="button"
                onClick={() => handleSelect(video.thumbnail, video.id)}
                className={`relative rounded-lg overflow-hidden transition-all group ${
                  selectedId === video.id
                    ? 'ring-2 ring-primary scale-[0.97]'
                    : 'hover:scale-[1.03] hover:ring-2 hover:ring-primary/40'
                }`}
                style={{ aspectRatio: '9/16' }}
              >
                {/* Thumbnail */}
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${video.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />

                {/* Play button */}
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                  selectedId === video.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    selectedId === video.id ? 'bg-primary' : 'bg-black/60 backdrop-blur-sm'
                  }`}>
                    {selectedId === video.id
                      ? <Check size={14} className="text-white" strokeWidth={3} />
                      : <Play size={14} className="text-white fill-white" />
                    }
                  </div>
                </div>

                {/* Duration badge */}
                <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/70 text-white rounded px-1 py-0.5">
                  {video.duration}
                </span>

                {/* Category */}
                <span className="absolute top-1 left-1 text-[9px] font-bold bg-black/60 text-white rounded px-1 py-0.5 truncate max-w-[90%]">
                  {video.category}
                </span>

                {/* Animated "playing" indicator */}
                <div className="absolute bottom-1 left-1 flex gap-0.5 items-end h-3 opacity-70">
                  {[2, 4, 3, 5, 2].map((h, i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-white rounded-full animate-pulse"
                      style={{
                        height: `${h * 2}px`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: `${0.6 + i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Cliquez pour sélectionner · Aperçu réaliste à droite
          </p>
        </div>
      </div>
    </>
  );
}
