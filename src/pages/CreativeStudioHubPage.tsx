/**
 * CreativeStudioHubPage
 * Community inspiration gallery + AI content generator integration.
 * Users can browse community creations, copy prompts, vote, and submit their own.
 */
import { useState, useMemo } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions,
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  toast,
} from '@blinkdotnew/ui';
import { Sparkles, Flame, Copy, Check, Upload, X, Zap, Plus, Filter } from 'lucide-react';
import { AIContentGeneratorModal } from '../components/ai/AIContentGeneratorModal';
import { useAuth } from '../hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

type Category = 'all' | 'trending' | 'prompts' | 'videos' | 'images' | 'text_ai';

interface Creation {
  id: string;
  title: string;
  thumbnail: string;
  type: 'image' | 'video' | 'text';
  category: Category;
  creator: string;
  creatorAvatar: string;
  prompt: string;
  likes: number;
  liked: boolean;
  tags: string[];
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_CREATIONS: Creation[] = [
  {
    id: '1',
    title: 'Campagne printemps bistro parisien',
    thumbnail: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
    type: 'image', category: 'trending',
    creator: '@chef_dupont', creatorAvatar: 'https://i.pravatar.cc/40?img=1',
    prompt: 'Crée un post Instagram chaleureux pour un bistro parisien annonçant sa carte printemps avec des légumes frais du marché. Ton décontracté, 200 mots max, hashtags locaux.',
    likes: 247, liked: false, tags: ['restauration', 'instagram'],
  },
  {
    id: '2',
    title: 'Promo soldes salon de coiffure',
    thumbnail: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop',
    type: 'image', category: 'prompts',
    creator: '@studio_beaute', creatorAvatar: 'https://i.pravatar.cc/40?img=5',
    prompt: 'Génère 3 variantes de story Instagram pour un salon de coiffure annonçant -30% sur les colorations. Urgent, limité à 48h. Ajoute des emojis et un CTA fort.',
    likes: 183, liked: false, tags: ['beauté', 'story'],
  },
  {
    id: '3',
    title: 'Réponse avis Google 5 étoiles',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    type: 'text', category: 'text_ai',
    creator: '@resto_lyon', creatorAvatar: 'https://i.pravatar.cc/40?img=8',
    prompt: 'Rédige une réponse chaleureuse et professionnelle à un avis Google 5 étoiles qui mentionne l\'accueil, la qualité des plats et l\'ambiance. Personnalise avec le prénom du client.',
    likes: 312, liked: false, tags: ['avis', 'google'],
  },
  {
    id: '4',
    title: 'Lancement produit e-commerce local',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
    type: 'image', category: 'trending',
    creator: '@boutique_mode', creatorAvatar: 'https://i.pravatar.cc/40?img=12',
    prompt: 'Post LinkedIn annonçant le lancement d\'une nouvelle collection capsule pour une boutique de mode locale. Storytelling autour du savoir-faire artisanal français. 400 mots.',
    likes: 156, liked: false, tags: ['retail', 'linkedin'],
  },
  {
    id: '5',
    title: 'Email automation bien-être spa',
    thumbnail: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop',
    type: 'text', category: 'text_ai',
    creator: '@zen_studio', creatorAvatar: 'https://i.pravatar.cc/40?img=15',
    prompt: 'Écris un email de réactivation pour les clients d\'un spa n\'ayant pas réservé depuis 3 mois. Offre une remise exclusive 15% valable 10 jours. Ton doux, inspirant.',
    likes: 94, liked: false, tags: ['bien-être', 'email'],
  },
  {
    id: '6',
    title: 'Vidéo shorts boulangerie artisanale',
    thumbnail: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
    type: 'video', category: 'videos',
    creator: '@boulange_paris', creatorAvatar: 'https://i.pravatar.cc/40?img=18',
    prompt: 'Script pour un Reels/TikTok de 30 secondes montrant les coulisses d\'une boulangerie artisanale : le pétrissage, la cuisson et la mise en vitrine. Narration inspirante.',
    likes: 428, liked: false, tags: ['restauration', 'reels'],
  },
  {
    id: '7',
    title: 'Description Google Maps garage auto',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    type: 'text', category: 'text_ai',
    creator: '@garage_expert', creatorAvatar: 'https://i.pravatar.cc/40?img=22',
    prompt: 'Rédige une description optimisée SEO local pour la fiche Google My Business d\'un garage automobile spécialisé révision, courroie de distribution et entretien toutes marques à Bordeaux.',
    likes: 71, liked: false, tags: ['automobile', 'google'],
  },
  {
    id: '8',
    title: 'Campagne SMS fidélité restaurant',
    thumbnail: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=400&fit=crop',
    type: 'text', category: 'prompts',
    creator: '@tableronde_bx', creatorAvatar: 'https://i.pravatar.cc/40?img=25',
    prompt: 'Génère 5 templates de SMS courts (max 160 car.) pour relancer des clients inactifs d\'un restaurant. Mentionner un plat du jour exclusif. CTA direct pour réservation.',
    likes: 209, liked: false, tags: ['restauration', 'sms'],
  },
  {
    id: '9',
    title: 'Story immobilier coup de cœur',
    thumbnail: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=400&fit=crop',
    type: 'image', category: 'images',
    creator: '@immo_prestige', creatorAvatar: 'https://i.pravatar.cc/40?img=30',
    prompt: 'Story Instagram pour une agence immobilière présentant un coup de cœur du moment : appartement 3P rénové, lumineux, vue dégagée. Ton enthousiaste sans être vendeur.',
    likes: 138, liked: false, tags: ['immobilier', 'story'],
  },
];

const FILTERS: { id: Category; label: string; emoji: string }[] = [
  { id: 'all',      label: 'Tout',       emoji: '🌟' },
  { id: 'trending', label: 'Tendances',  emoji: '🔥' },
  { id: 'prompts',  label: 'Prompts',    emoji: '💡' },
  { id: 'videos',   label: 'Vidéos',     emoji: '🎬' },
  { id: 'images',   label: 'Images',     emoji: '🖼️' },
  { id: 'text_ai',  label: 'Texte IA',   emoji: '✍️' },
];

const CATEGORIES = ['Restauration', 'Beauté', 'Retail', 'Immobilier', 'Bien-être', 'Automobile', 'Services', 'Autre'];

// ── Creation card ──────────────────────────────────────────────────────────────

function CreationCard({
  creation,
  onVote,
  onCopyPrompt,
  onOpenInStudio,
}: {
  creation: Creation;
  onVote: (id: string) => void;
  onCopyPrompt: (prompt: string) => void;
  onOpenInStudio: (creation: Creation) => void;
}) {
  const [hovering, setHovering] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(creation.prompt).catch(() => {});
    onCopyPrompt(creation.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border bg-card group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={creation.thumbnail}
          alt={creation.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold uppercase tracking-wide bg-black/60 text-white rounded-full px-2 py-0.5 backdrop-blur-sm">
            {creation.type === 'video' ? '🎬 Vidéo' : creation.type === 'text' ? '✍️ Texte' : '🖼️ Image'}
          </span>
        </div>

        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-black/70 backdrop-blur-[2px] flex flex-col justify-end p-3 transition-all duration-200 ${hovering ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white text-xs font-semibold mb-1 leading-tight truncate">{creation.creator}</p>
          <p className="text-white/80 text-[11px] leading-snug line-clamp-3 mb-3">{creation.prompt}</p>
          <div className="flex gap-2">
            <button
              onClick={e => { e.stopPropagation(); handleCopyPrompt(); }}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white rounded-lg py-1.5 transition-colors"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copié !' : 'Copier prompt'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); onOpenInStudio(creation); }}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-bold bg-primary/80 hover:bg-primary text-white rounded-lg py-1.5 transition-colors"
            >
              <Zap size={11} />
              Open in Studio
            </button>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <img src={creation.creatorAvatar} alt={creation.creator} className="w-6 h-6 rounded-full shrink-0 object-cover" />
          <span className="text-xs font-medium text-muted-foreground truncate">{creation.creator}</span>
        </div>
        <button
          onClick={() => onVote(creation.id)}
          className={`flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 transition-all shrink-0 ${
            creation.liked
              ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
              : 'bg-muted/60 text-muted-foreground hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-orange-950/30'
          }`}
        >
          🔥 {creation.likes}
        </button>
      </div>
    </div>
  );
}

// ── Submit modal ───────────────────────────────────────────────────────────────

function SubmitModal({ open, onClose, onSubmit }: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; prompt: string; category: string; file: File | null }) => Promise<void>;
}) {
  const [title, setTitle]       = useState('');
  const [prompt, setPrompt]     = useState('');
  const [category, setCategory] = useState('');
  const [file, setFile]         = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);

  const handleFile = (f: File) => { if (f) setFile(f); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !prompt.trim() || !category) return;
    setLoading(true);
    try {
      await onSubmit({ title, prompt, category, file });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); setTitle(''); setPrompt(''); setCategory(''); setFile(null); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            🚀 Soumettre une création
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">Partagez votre prompt et votre création avec la communauté.</p>
        </DialogHeader>

        {success ? (
          <div className="px-6 py-12 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-lg font-bold text-foreground">Soumis avec succès !</p>
            <p className="text-sm text-muted-foreground mt-1">Votre création sera examinée et publiée prochainement.</p>
          </div>
        ) : (
          <div className="px-6 pt-4 pb-6 space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Titre de la création *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex : Post promo printemps restaurant…"
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Media upload */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Média (image ou vidéo)</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-5 text-center transition-all cursor-pointer ${
                  dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 bg-muted/20'
                }`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
                {file ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{file.name}</span>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-muted-foreground hover:text-destructive ml-2">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Glissez-déposez ou cliquez pour sélectionner</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">PNG, JPG, MP4 · max 10 Mo</p>
                  </>
                )}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Prompt IA utilisé *</label>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Collez ici le prompt exact que vous avez utilisé pour générer ce contenu…"
                rows={4}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Catégorie / secteur *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary/60 transition-colors"
              >
                <option value="">Sélectionnez un secteur…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>Annuler</Button>
              <Button
                onClick={handleSubmit}
                disabled={!title.trim() || !prompt.trim() || !category || loading}
                className="gap-2"
              >
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publication…</> : '🚀 Publier dans la galerie'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CreativeStudioHubPage() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<Category>('all');
  const [creations, setCreations]       = useState<Creation[]>(MOCK_CREATIONS);
  const [submitOpen, setSubmitOpen]     = useState(false);
  const [aiOpen, setAiOpen]             = useState(false);
  const [studioPrompt, setStudioPrompt] = useState('');

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return creations;
    if (activeFilter === 'trending') return [...creations].sort((a, b) => b.likes - a.likes).slice(0, 6);
    return creations.filter(c => c.category === activeFilter || c.tags.some(t => activeFilter.includes(t)));
  }, [creations, activeFilter]);

  const handleVote = (id: string) => {
    setCreations(prev => prev.map(c =>
      c.id === id ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c
    ));
  };

  const handleCopyPrompt = (_prompt: string) => {
    toast.success('Prompt copié dans le presse-papier !');
  };

  const handleOpenInStudio = (creation: Creation) => {
    setStudioPrompt(creation.prompt);
    setAiOpen(true);
    toast.success(`"${creation.title}" chargé dans le studio IA !`);
  };

  const handleSubmit = async (data: { title: string; prompt: string; category: string; file: File | null }) => {
    // Simulate Firestore save — in production: db.communityCreations.create(...)
    await new Promise(r => setTimeout(r, 1200));
    const newCreation: Creation = {
      id: crypto.randomUUID(),
      title: data.title,
      thumbnail: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=400&fit=crop',
      type: data.file?.type.startsWith('video') ? 'video' : 'text',
      category: 'text_ai',
      creator: `@${user?.email?.split('@')[0] ?? 'vous'}`,
      creatorAvatar: user?.avatarUrl ?? `https://i.pravatar.cc/40?u=${user?.id}`,
      prompt: data.prompt,
      likes: 0,
      liked: false,
      tags: [data.category.toLowerCase()],
    };
    setCreations(prev => [newCreation, ...prev]);
    toast.success('Votre création a été soumise ! Elle sera publiée après modération.');
  };

  return (
    <Page>
      <PageHeader>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <PageTitle>Creative Studio Hub</PageTitle>
              <PageDescription>
                Taguez-nous ou partagez vos créations pour être mis en avant ! Inspirez et soyez inspirés.
              </PageDescription>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" onClick={() => setAiOpen(true)} className="gap-2 text-sm">
              <Sparkles size={15} />
              Générer avec l'IA
            </Button>
            <Button onClick={() => setSubmitOpen(true)} className="gap-2 text-sm">
              <Plus size={15} />
              Soumettre une création
            </Button>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* Stats strip */}
        <div className="flex flex-wrap gap-4 mb-6 rounded-2xl border border-border bg-gradient-to-r from-primary/5 to-violet-500/5 p-4">
          {[
            { label: 'Créations publiées', value: '1 247', emoji: '🎨' },
            { label: 'Prompts partagés',   value: '3 891', emoji: '💡' },
            { label: 'Votes de la comm.',  value: '18 k',  emoji: '🔥' },
            { label: 'Créateurs actifs',   value: '432',   emoji: '👥' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-xl">{s.emoji}</span>
              <div>
                <p className="text-base font-extrabold text-foreground leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1.5 shrink-0 text-xs font-bold rounded-full px-4 py-2 border-2 transition-all duration-150 ${
                activeFilter === f.id
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span className="text-base">{f.emoji}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(creation => (
            <CreationCard
              key={creation.id}
              creation={creation}
              onVote={handleVote}
              onCopyPrompt={handleCopyPrompt}
              onOpenInStudio={handleOpenInStudio}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎨</p>
            <p className="text-base font-semibold text-foreground">Aucune création dans cette catégorie</p>
            <p className="text-sm text-muted-foreground mt-1">Soyez le premier à en soumettre une !</p>
          </div>
        )}
      </PageBody>

      {/* Modals */}
      <SubmitModal open={submitOpen} onClose={() => setSubmitOpen(false)} onSubmit={handleSubmit} />
      <AIContentGeneratorModal
        open={aiOpen}
        onClose={() => { setAiOpen(false); setStudioPrompt(''); }}
        initialTopic={studioPrompt}
      />
    </Page>
  );
}
