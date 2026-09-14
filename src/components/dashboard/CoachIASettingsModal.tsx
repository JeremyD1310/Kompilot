/**
 * CoachIASettingsModal — allows users to customize Coach IA tips
 * - Toggle categories (Followers, Engagement, Visibilité, Contenu)
 * - Adjust cycling frequency (3s to 15s)
 * - Enable/disable tips entirely
 */

import { useState, useEffect } from 'react';
import { X, Settings, Users, Heart, Eye, Sparkles, Zap, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTipSettings, useUpdateTipSettings } from '../../hooks/useCoachTips';

const CATEGORIES = [
  { value: 'Followers', label: 'Followers', icon: Users, color: '#E4405F', desc: 'Conseils pour augmenter votre audience' },
  { value: 'Engagement', label: 'Engagement', icon: Heart, color: '#818CF8', desc: 'Boostez vos interactions' },
  { value: 'Visibilite', label: 'Visibilité', icon: Eye, color: '#2DD4BF', desc: 'Augmentez votre portée organique' },
  { value: 'Contenu', label: 'Contenu', icon: Sparkles, color: '#FBBF24', desc: 'Créez du contenu performant' },
];

const FREQUENCIES = [
  { value: 3, label: '3s' },
  { value: 5, label: '5s' },
  { value: 8, label: '8s' },
  { value: 15, label: '15s' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CoachIASettingsModal({ open, onClose }: Props) {
  const { data: settings, isLoading } = useTipSettings();
  const updateSettings = useUpdateTipSettings();

  const [enabled, setEnabled] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [frequency, setFrequency] = useState(4);

  // Sync from backend
  useEffect(() => {
    if (settings) {
      setEnabled(settings.isEnabled);
      setCategories(settings.enabledCategories || []);
      setFrequency(settings.frequencySeconds || 4);
    }
  }, [settings]);

  if (!open) return null;

  const toggleCategory = (cat: string) => {
    setCategories(prev => {
      if (prev.includes(cat)) {
        // Don't allow removing the last one
        if (prev.length <= 1) return prev;
        return prev.filter(c => c !== cat);
      }
      return [...prev, cat];
    });
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        isEnabled: enabled,
        enabledCategories: categories,
        frequencySeconds: frequency,
      });
      toast.success('Paramètres sauvegardés');
      onClose();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Settings size={16} className="text-violet-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Paramètres Coach IA</h3>
              <p className="text-[10px] text-muted-foreground">Personnalisez vos conseils</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Master toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
            <div className="flex items-center gap-2">
              <Zap size={14} className={enabled ? 'text-primary' : 'text-muted-foreground'} />
              <span className="text-sm font-medium text-foreground">Coach IA actif</span>
            </div>
            <button
              onClick={() => setEnabled(e => !e)}
              className="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
              style={{ background: enabled ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ left: enabled ? '22px' : '2px' }}
              />
            </button>
          </div>

          {/* Categories */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">Catégories de conseils</label>
            <div className="space-y-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon;
                const isActive = categories.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleCategory(c.value)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left cursor-pointer"
                    style={{
                      background: isActive ? `${c.color}08` : 'transparent',
                      borderColor: isActive ? `${c.color}30` : 'hsl(var(--border))',
                      opacity: enabled ? 1 : 0.5,
                    }}
                    disabled={!enabled}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${c.color}15` }}
                    >
                      <Icon size={13} style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-foreground">{c.label}</span>
                      <p className="text-[10px] text-muted-foreground">{c.desc}</p>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                      style={{
                        borderColor: isActive ? c.color : 'hsl(var(--border))',
                        background: isActive ? c.color : 'transparent',
                      }}
                    >
                      {isActive && (
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Clock size={12} className="text-muted-foreground" />
              Vitesse de rotation
            </label>
            <div className="flex gap-2">
              {FREQUENCIES.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer"
                  style={{
                    background: frequency === f.value ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                    borderColor: frequency === f.value ? 'hsl(var(--primary) / 0.4)' : 'hsl(var(--border))',
                    color: frequency === f.value ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                  }}
                  disabled={!enabled}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {updateSettings.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}
