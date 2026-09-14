/**
 * TipSubmitModal — allows users to submit their own Coach IA tips
 */

import { useState } from 'react';
import { X, Send, Lightbulb, Users, Heart, Eye, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSubmitTip } from '../../hooks/useCoachTips';

const CATEGORIES = [
  { value: 'Followers', label: 'Followers', icon: Users, color: '#E4405F' },
  { value: 'Engagement', label: 'Engagement', icon: Heart, color: '#818CF8' },
  { value: 'Visibilite', label: 'Visibilité', icon: Eye, color: '#2DD4BF' },
  { value: 'Contenu', label: 'Contenu', icon: Sparkles, color: '#FBBF24' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TipSubmitModal({ open, onClose }: Props) {
  const submitTip = useSubmitTip();
  const [category, setCategory] = useState('Followers');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      await submitTip.mutateAsync({ category, title: title.trim(), content: content.trim() });
      toast.success('Conseil soumis ! Il sera examiné par notre équipe.');
      setTitle('');
      setContent('');
      onClose();
    } catch {
      toast.error('Erreur lors de la soumission');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Lightbulb size={16} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Proposer un conseil</h3>
              <p className="text-[10px] text-muted-foreground">Partagez votre expertise avec la communauté</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">Catégorie</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon;
                const isActive = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer"
                    style={{
                      background: isActive ? `${c.color}12` : 'transparent',
                      borderColor: isActive ? `${c.color}40` : 'hsl(var(--border))',
                      color: isActive ? c.color : 'hsl(var(--muted-foreground))',
                    }}
                  >
                    <Icon size={13} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Titre du conseil</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Publiez vos Stories entre 18h et 21h"
              maxLength={120}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">Description</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Expliquez votre conseil en détail..."
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
            <p className="text-[10px] text-muted-foreground/50 mt-1 text-right">{content.length}/500</p>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitTip.isPending || !title.trim() || !content.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitTip.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={13} />
                  Soumettre
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
