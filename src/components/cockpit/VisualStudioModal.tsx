import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Smartphone, Square, Image as ImageIcon, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { Button, Badge } from '@blinkdotnew/ui';
import { useUserProfile } from '../../context/UserProfileContext';
import { usePlan } from '../../hooks/usePlan';

interface VisualStudioModalProps {
  open: boolean;
  onClose: () => void;
  context?: {
    eventName?: string;
    suggestion?: string;
  };
}

type Format = 'story' | 'square' | 'banner';

export function VisualStudioModal({ open, onClose, context }: VisualStudioModalProps) {
  const { masterProfile } = useUserProfile();
  const { tier, isBusiness, isFranchise } = usePlan();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [format, setFormat] = useState<Format>('square');

  const isPremium = isBusiness || isFranchise;

  useEffect(() => {
    if (open) {
      setIsGenerating(false);
      setShowResult(false);
    }
  }, [open]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
    }, 2000);
  };

  const getProfileContent = () => {
    switch (masterProfile) {
      case 'flux':
        return {
          title: "Template Restauration & Flux",
          fields: ["Offre Spéciale", "Remise %", "CTA (Réserver/Commander)"],
          colors: "from-orange-500/20 to-rose-500/20",
          previewText: "Réservez votre table pour l'événement !"
        };
      case 'chantier':
        return {
          title: "Template Bâtiment & Artisans",
          fields: ["Avant / Après", "Certifications", "CTA (Dépannage Urgent)"],
          colors: "from-blue-600/20 to-orange-600/20",
          previewText: "Intervention rapide 24h/24"
        };
      case 'agence':
        return {
          title: "Template Premium Agence",
          fields: ["Palette de marque", "Sélecteur de police", "Upload Logo"],
          colors: "from-purple-600/20 to-indigo-600/20",
          previewText: "Identité visuelle haute performance"
        };
      default:
        return {
          title: "Template Standard",
          fields: ["Titre", "Message", "CTA"],
          colors: "from-teal-500/20 to-emerald-500/20",
          previewText: "Optimisez votre présence locale"
        };
    }
  };

  const content = getProfileContent();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Studio Visuel Express</h2>
              <p className="text-xs text-slate-400">Générez des visuels optimisés pour vos réseaux</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Context Info */}
          {context?.eventName && (
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1">Événement détecté :</p>
              <p className="text-sm text-slate-200">{context.eventName}</p>
              {context.suggestion && <p className="text-xs text-slate-400 mt-2">💡 {context.suggestion}</p>}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Form Side */}
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
                  Configuration {content.title}
                </label>
                <div className="space-y-4">
                  {content.fields.map((field, i) => (
                    <div key={i} className="space-y-1.5">
                      <p className="text-[11px] font-medium text-slate-500">{field}</p>
                      <div className="h-10 px-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-300 flex items-center italic">
                        Valeur pré-remplie IA...
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">
                  Format du visuel
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'story', icon: Smartphone, label: 'Story' },
                    { id: 'square', icon: Square, label: 'Carré' },
                    { id: 'banner', icon: ImageIcon, label: 'Bannière' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id as Format)}
                      className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all ${
                        format === f.id 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:bg-slate-800/50'
                      }`}
                    >
                      <f.icon size={18} />
                      <span className="text-[10px] font-bold">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview Side */}
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Aperçu en direct
              </label>
              <div className={`aspect-square rounded-2xl border border-slate-700 bg-gradient-to-br ${content.colors} flex items-center justify-center relative overflow-hidden group`}>
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="generating"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-xs font-bold text-slate-300">Génération par l'IA...</p>
                    </motion.div>
                  ) : showResult ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center gap-4 text-center p-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-2">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-sm font-bold text-white leading-tight">{content.previewText}</p>
                      <p className="text-[10px] text-slate-400 italic">Visuel optimisé prêt pour publication</p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600 group-hover:text-slate-500 transition-colors">
                      <ImageIcon size={48} strokeWidth={1} />
                      <p className="text-[10px] font-medium uppercase tracking-widest">En attente</p>
                    </div>
                  )}
                </AnimatePresence>
                
                {/* Format Indicator */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/40 backdrop-blur-sm border border-white/10 text-[9px] font-bold text-white uppercase">
                  {format === 'story' ? '9:16' : format === 'square' ? '1:1' : '16:9'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPremium ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] py-1 px-3 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 size={12} />
                  ✓ Inclus dans votre plan {tier === 'business' ? 'Business' : 'Franchise'}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-1 px-3 rounded-full flex items-center gap-1.5">
                  <Lock size={12} />
                  🔒 Réservé Plan Agence pour l'export HD
                </Badge>
              )}
            </div>
            
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              {isPremium ? 'Générer le visuel HD + Carrousel' : 'Générer le visuel'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
