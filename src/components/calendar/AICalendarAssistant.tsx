/**
 * AICalendarAssistant — Weekly AI content idea suggestions for the Calendar page.
 * Shows 4 rotating post ideas based on the current week number.
 */
import { useState } from 'react';
import { Button } from '@blinkdotnew/ui';
import { ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';
import { getWeek, getMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

interface IdeaCard {
  emoji: string;
  title: string;
  description: string;
}

// ── Idea pool ─────────────────────────────────────────────────────────────────

function getMonthName(): string {
  return format(new Date(), 'MMMM', { locale: fr });
}

function buildIdeaPool(): IdeaCard[][] {
  const monthName = getMonthName();
  return [
    // Pool A
    [
      { emoji: '🍂', title: 'Offre Saisonnière', description: `Publiez une offre saisonnière liée à ${monthName} — profitez du moment pour attirer de nouveaux clients.` },
      { emoji: '⭐', title: 'Témoignage Client', description: 'Partagez un témoignage client récent sur Instagram — la preuve sociale booste votre crédibilité.' },
      { emoji: '🎯', title: 'Promotion Flash', description: 'Créez une promotion flash valable ce week-end uniquement — urgence = conversions.' },
      { emoji: '📸', title: 'Behind the Scenes', description: "Montrez les coulisses de votre établissement — l'authenticité crée de l'engagement." },
    ],
    // Pool B
    [
      { emoji: '🏆', title: 'Résultats & Chiffres', description: 'Partagez un chiffre marquant de votre activité ce mois-ci — transparence et crédibilité.' },
      { emoji: '💡', title: 'Conseil Pratique', description: 'Publiez un conseil utile pour vos clients — le contenu pédagogique génère des sauvegardes.' },
      { emoji: '🎁', title: 'Offre Fidélité', description: 'Récompensez vos clients fidèles avec une offre exclusive — réactivez vos anciens clients.' },
      { emoji: '🤝', title: 'Partenariat Local', description: 'Présentez un partenaire ou fournisseur local — cross-promotion et ancrage communautaire.' },
    ],
    // Pool C
    [
      { emoji: '📅', title: 'Événement à venir', description: `Annoncez un événement ou temps fort de ${monthName} — créez de l'anticipation.` },
      { emoji: '🌟', title: 'Produit Vedette', description: 'Mettez en avant votre service ou produit le plus populaire cette semaine.' },
      { emoji: '🔔', title: 'Rappel Horaires', description: 'Rappelez vos horaires et informations pratiques — utile et visible sur Google.' },
      { emoji: '💬', title: 'Question à la Communauté', description: "Posez une question à votre audience — l'engagement monte et l'algo vous récompense." },
    ],
    // Pool D
    [
      { emoji: '🚀', title: 'Nouveauté', description: 'Annoncez une nouveauté dans votre établissement — curiosité = portée organique.' },
      { emoji: '📰', title: 'Actualité Secteur', description: 'Commentez une actualité de votre secteur — positionnez-vous comme expert local.' },
      { emoji: '❤️', title: 'Story Personnelle', description: 'Partagez une anecdote ou histoire de votre parcours — la proximité fidélise.' },
      { emoji: '🎓', title: 'FAQ Client', description: 'Répondez à la question la plus fréquente de vos clients — contenu utile et SEO.' },
    ],
  ];
}

// ── Main component ─────────────────────────────────────────────────────────────

interface AICalendarAssistantProps {
  onUseIdea?: (text: string) => void;
}

export function AICalendarAssistant({ onUseIdea }: AICalendarAssistantProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [refresh, setRefresh] = useState(0);

  const weekNumber = getWeek(new Date());
  const pool = buildIdeaPool();
  const poolIndex = (weekNumber + refresh) % pool.length;
  const ideas = pool[poolIndex];

  const handleRefresh = () => setRefresh(r => r + 1);

  const handleUseIdea = (idea: IdeaCard) => {
    const text = `${idea.emoji} ${idea.title} — ${idea.description}`;
    onUseIdea?.(text);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Teal accent top stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-primary to-teal-400" />

      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">💡 Idées de contenu IA — Cette semaine</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Semaine {weekNumber} · 4 idées personnalisées</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs h-7 px-2.5"
            onClick={e => { e.stopPropagation(); handleRefresh(); }}
          >
            <RefreshCw size={12} /> Nouvelles idées
          </Button>
          {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Ideas grid */}
      {isOpen && (
        <div className="px-5 pb-5 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ideas.map((idea) => (
              <div
                key={idea.title}
                className="rounded-xl border border-border/60 bg-muted/20 p-3.5 flex flex-col gap-2 hover:border-primary/30 hover:bg-primary/[0.03] transition-all group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{idea.emoji}</span>
                  <span className="text-xs font-bold text-foreground">{idea.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">
                  {idea.description}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-[11px] font-semibold mt-1 gap-1 group-hover:border-primary/40 group-hover:text-primary transition-colors"
                  onClick={() => handleUseIdea(idea)}
                >
                  <Sparkles size={10} /> Utiliser cette idée
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
