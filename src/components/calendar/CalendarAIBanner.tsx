import React from 'react';
import { Lightbulb, X, ArrowRight, Sparkles } from 'lucide-react';
import { Button, cn } from '@blinkdotnew/ui';

interface CalendarAIBannerProps {
  sector?: string;
  onCreatePost: (content: string) => void;
  onDismiss: () => void;
}

export function CalendarAIBanner({ sector, onCreatePost, onDismiss }: CalendarAIBannerProps) {
  const getSuggestion = () => {
    const day = new Date().getDay(); // 0 is Sunday, 1 is Monday...
    if (day === 1) return "🌟 Début de semaine — Partagez votre offre du moment avec vos clients !";
    if (day === 3) return "📸 Mercredis photos — Publiez une photo de votre équipe ou de vos créations !";
    if (day >= 5 || day === 0) return "🎉 Ce week-end — Annoncez vos horaires et offres spéciales du week-end !";
    return "✨ Post du jour — L'IA a généré un contenu optimisé pour votre secteur";
  };

  const getHashtags = () => {
    if (sector?.toLowerCase().includes('restaurant')) {
      return "#restaurant #gastronomie #foodie";
    }
    if (sector?.toLowerCase().includes('immobilier') || sector?.toLowerCase().includes('immo')) {
      return "#immobilier #investissement #maison";
    }
    return "#business #communication #socialmedia";
  };

  const suggestion = getSuggestion();
  const hashtags = getHashtags();

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-teal-500/20 shadow-sm">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent pointer-events-none" />
      
      <div className="relative px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600">
            <Lightbulb className="h-5 w-5" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-teal-900 flex items-center gap-1.5">
              💡 Suggestion de l'IA basée sur votre actualité locale
            </h3>
            <p className="text-sm text-slate-600 font-medium">
              {suggestion}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-teal-600/70">
                {hashtags}
              </span>
              <Sparkles className="h-3 w-3 text-teal-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-center">
          <Button
            onClick={() => onCreatePost(`${suggestion}\n\n${hashtags}`)}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-9 px-4 rounded-lg shadow-sm"
          >
            Publier ce post
            <ArrowRight className="h-4 w-4" />
          </Button>
          
          <button
            onClick={onDismiss}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
