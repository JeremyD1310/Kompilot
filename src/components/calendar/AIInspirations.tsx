import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { Sparkles, RefreshCw, ChevronRight, Lightbulb } from 'lucide-react';
import { blink } from '../../blink/client';

const SECTORS = [
  'Restaurant & Alimentation',
  'Commerce & Retail',
  'Beauté & Bien-être',
  'BTP & Artisanat',
  'Santé & Médical',
  'Formation & Coaching',
  'Immobilier',
  'Tech & Digital',
  'Mode & Textile',
  'Sport & Fitness',
  'Tourisme & Hôtellerie',
  'Finance & Comptabilité',
];

interface PostIdea {
  title: string;
  text: string;
  hashtags: string;
  platform: string;
  visualType?: string;
  seoKeywords?: string;
}

interface AIInspirationsProps {
  onUseIdea: (text: string) => void;
}

const FALLBACK_IDEAS: Record<string, PostIdea[]> = {
  default: [
    {
      title: "Astuce du jour",
      text: "💡 Saviez-vous que 78% des consommateurs consultent les avis en ligne avant d'acheter ? Pensez à demander à vos clients satisfaits de partager leur expérience !",
      hashtags: "#ConseilMarketing #TPE #DigitalMarketing",
      platform: "LinkedIn & Instagram",
    },
    {
      title: "Coulisses de l'entreprise",
      text: "Dans les coulisses chez nous aujourd'hui 👀 Notre équipe travaille dur pour vous offrir la meilleure expérience possible. On adore ce que l'on fait ! ❤️",
      hashtags: "#BehindTheScenes #Équipe #Passion",
      platform: "Instagram",
    },
    {
      title: "Témoignage client",
      text: "⭐⭐⭐⭐⭐ \"Service impeccable, équipe réactive et résultats au rendez-vous !\" — Merci pour votre confiance, c'est ce genre de retour qui nous motive chaque jour.",
      hashtags: "#Témoignage #Satisfaction #Avis",
      platform: "Google & Facebook",
    },
  ],
};

export function AIInspirations({ onUseIdea }: AIInspirationsProps) {
  const [sector, setSector] = useState('');
  const [ideas, setIdeas] = useState<PostIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!sector) {
      toast.error('Choisissez un secteur d\'activité');
      return;
    }
    setLoading(true);
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `Tu es un expert en marketing pour les TPE/PME françaises.
Génère 3 idées de publications originales et engageantes pour une entreprise du secteur : "${sector}".
Chaque idée doit être prête à publier, en français, avec des emojis et des hashtags.
Les posts doivent être variés : 1 éducatif, 1 humain/coulisses, 1 promotionnel ou témoignage.
Pour chaque idée, ajoute aussi : le type de visuel recommandé (photo, vidéo courte, carrousel, story, texte seul) et 3 mots-clés SEO locaux pertinents.`,
        schema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: {
                type: 'object',
                properties: {
                  title:       { type: 'string', description: 'Titre court de l\'idée (3-5 mots)' },
                  text:        { type: 'string', description: 'Texte complet prêt à publier (80-200 caractères)' },
                  hashtags:    { type: 'string', description: '3-5 hashtags pertinents' },
                  platform:    { type: 'string', description: 'Plateformes recommandées (ex: LinkedIn & Instagram)' },
                  visualType:  { type: 'string', description: 'Type de visuel recommandé (ex: Photo produit, Vidéo 15s, Carrousel 3 slides, Story animée, Texte seul)' },
                  seoKeywords: { type: 'string', description: '3 mots-clés SEO locaux séparés par virgule (ex: restaurant Paris, bistronomie, cuisine maison)' },
                },
                required: ['title', 'text', 'hashtags', 'platform', 'visualType', 'seoKeywords'],
              },
            },
          },
          required: ['ideas'],
        },
      });
      const result = object as { ideas: PostIdea[] };
      setIdeas(result.ideas);
      setGenerated(true);
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        blink.auth.login(window.location.href);
        return;
      }
      setIdeas(FALLBACK_IDEAS.default);
      setGenerated(true);
      toast('Idées exemples affichées', { description: 'Connectez-vous pour des idées IA personnalisées.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Lightbulb size={16} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">Inspirations IA</p>
            <p className="text-[11px] text-muted-foreground">3 idées prêtes à planifier</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Secteur d'activité</label>
          <select
            value={sector}
            onChange={e => { setSector(e.target.value); setGenerated(false); setIdeas([]); }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          >
            <option value="">Choisir un secteur...</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading || !sector}
          className="w-full gap-2 text-sm"
          size="sm"
        >
          {loading
            ? <><RefreshCw size={13} className="animate-spin" /> Génération...</>
            : <><Sparkles size={13} /> {generated ? 'Régénérer' : 'Générer les idées'}</>
          }
        </Button>
      </div>

      {/* Ideas */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2 animate-pulse">
              <div className="h-3.5 rounded bg-muted w-1/2" />
              <div className="h-2.5 rounded bg-muted/60 w-full" />
              <div className="h-2.5 rounded bg-muted/60 w-4/5" />
              <div className="h-2.5 rounded bg-muted/40 w-3/5" />
            </div>
          ))}
        </div>
      )}

      {!loading && ideas.length > 0 && (
        <div className="space-y-3">
          {ideas.map((idea, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2 hover:border-primary/40 transition-colors group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-xs font-semibold text-foreground">{idea.title}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0 bg-muted/50 rounded px-1.5 py-0.5">
                  {idea.platform.split('&')[0].trim()}
                </span>
              </div>

              <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">{idea.text}</p>
              <p className="text-[10px] text-primary/60">{idea.hashtags}</p>
              {(idea.visualType || idea.seoKeywords) && (
                <div className="flex flex-col gap-1 pt-1 border-t border-border/50">
                  {idea.visualType && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/60">📸 Visuel</span>
                      <span className="text-[10px] font-semibold text-primary/80 bg-primary/8 rounded px-1.5 py-0.5">
                        {idea.visualType}
                      </span>
                    </div>
                  )}
                  {idea.seoKeywords && (
                    <div className="flex items-start gap-1.5">
                      <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground/60 shrink-0 mt-0.5">🔍 SEO</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        {idea.seoKeywords}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                className="w-full gap-1.5 h-7 text-xs group-hover:border-primary/60 group-hover:text-primary transition-colors"
                onClick={() => {
                  onUseIdea(`${idea.text}\n\n${idea.hashtags}`);
                  toast.success('Idée ajoutée !', { description: 'Le texte a été copié dans la fenêtre de création.' });
                }}
              >
                Planifier cette idée
                <ChevronRight size={11} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {!loading && !generated && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-5 text-center space-y-2">
          <Sparkles size={22} className="mx-auto text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">Sélectionnez votre secteur puis laissez l'IA vous inspirer.</p>
        </div>
      )}
    </div>
  );
}
