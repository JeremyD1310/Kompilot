/**
 * AppearanceTab — Gestion de l'apparence dans Paramètres Compte.
 * Inclut le thème Obsidian & Gold (Élite).
 */
import { motion } from 'framer-motion';
import { Monitor, Moon, Sparkles, CheckCircle2, Zap, BatteryCharging, ShieldCheck } from 'lucide-react';
import { useDarkMode, type ThemeMode } from '../../context/DarkModeContext';
import { useObsidianTheme } from '../../context/ObsidianThemeContext';
import { Switch } from '@blinkdotnew/ui';
import { BrandTypographySection } from '../settings/BrandTypographySection';
import { useAuth } from '../../hooks/useAuth';

function isAgency(role?: string | null) {
  return role === 'agency' || role === 'agency_owner' || role === 'freelance_agency';
}

interface ThemeOption {
  id: ThemeMode;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  preview: string;     // CSS bg
  badge?: string;
  badgeColor?: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'light',
    label: 'Clair',
    sublabel: 'Interface lumineuse standard',
    icon: Monitor,
    preview: 'bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200',
  },
  {
    id: 'dark',
    label: 'Sombre',
    sublabel: 'Fond Navy + accents Teal',
    icon: Moon,
    preview: 'bg-gradient-to-br from-slate-900 to-[#0F172A] border border-slate-700',
  },
  {
    id: 'obsidian',
    label: 'Obsidian & Gold',
    sublabel: 'Élite — Fond noir + accents or mat',
    icon: Sparkles,
    preview: 'bg-gradient-to-br from-[#0a0a0a] to-[#111007] border border-yellow-800/40',
    badge: 'ÉLITE',
    badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
  },
];

export function AppearanceTab() {
  const { themeMode, setThemeMode } = useDarkMode();
  const { obsidianEnabled, toggleObsidian } = useObsidianTheme();
  const { user } = useAuth();

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Thème de l'interface</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Choisissez l'apparence de votre espace Kompilot. Le thème Obsidian & Gold 
          économise la batterie sur les écrans OLED et améliore la lisibilité sur le terrain.
        </p>

        <div className="grid gap-3">
          {THEMES.map(theme => {
            const Icon = theme.icon;
            const isActive = themeMode === theme.id;
            return (
              <motion.button
                key={theme.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setThemeMode(theme.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                  ${isActive
                    ? theme.id === 'obsidian'
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : 'border-primary/60 bg-primary/5'
                    : 'border-border hover:border-border/80 bg-card'
                  }`}
              >
                {/* Color preview swatch */}
                <div className={`w-10 h-10 rounded-lg shrink-0 ${theme.preview}`}>
                  {theme.id === 'obsidian' && (
                    <div className="w-full h-full rounded-lg flex items-center justify-center">
                      <span className="text-amber-400 text-sm">✦</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Icon className={`h-3.5 w-3.5 ${theme.id === 'obsidian' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-semibold text-foreground">{theme.label}</span>
                    {theme.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${theme.badgeColor}`}>
                        {theme.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{theme.sublabel}</p>
                </div>

                {isActive && (
                  <CheckCircle2 className={`h-5 w-5 shrink-0 ${theme.id === 'obsidian' ? 'text-amber-400' : 'text-primary'}`} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Obsidian benefits */}
      {themeMode === 'obsidian' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <p className="text-sm font-bold text-amber-400">Thème Obsidian & Gold activé</p>
          </div>
          <div className="space-y-2">
            {[
              { icon: BatteryCharging, text: 'Économie de batterie sur écrans OLED (jusqu\'à -35% de consommation écran)' },
              { icon: Zap, text: 'Lisibilité optimisée en extérieur (fort contraste fond noir / texte doré)' },
              { icon: Sparkles, text: 'Design exclusif Élite — identité visuelle premium pour les agences' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-start gap-2">
                <Icon className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Elite Obsidian Toggle */}
      <div className="pt-6 border-t border-border">
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-amber-500/30">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Thème Élite — Obsidian & Gold</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mode ultra-sombre pour économiser la batterie sur le terrain. Accents dorés pour une interface premium.
            </p>
          </div>
          <Switch 
            checked={obsidianEnabled} 
            onCheckedChange={toggleObsidian}
          />
        </div>
      </div>

      {/* ── Brand Typography (agency only) ─────────────────────────────── */}
      {isAgency(user?.role) && (
        <div>
          <h2 className="text-base font-semibold text-foreground mb-1">
            Typographie de la marque
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Définissez la police par défaut pour toutes les publications de vos clients.
          </p>
          <BrandTypographySection />
        </div>
      )}
    </div>
  );
}
