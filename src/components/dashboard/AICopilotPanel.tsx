import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, Button } from '@blinkdotnew/ui';
import { ChevronDown, RefreshCw, Sparkles } from 'lucide-react';

const SESSION_KEY = 'kompilot_copilot_panel_collapsed';

const ALL_TIPS = [
  { emoji: '📸', text: 'Instagram : postez entre 7h–9h et 19h–21h pour 2× plus d\'engagement sur votre audience locale.' },
  { emoji: '📘', text: 'Facebook : les posts avec une photo de votre équipe obtiennent 3× plus de partages que les visuels produits.' },
  { emoji: '⭐', text: 'Répondre aux avis Google sous 24h augmente votre note perçue de +0.3 étoile en moyenne.' },
  { emoji: '🗺️', text: 'Mettre à jour vos horaires sur Google My Business avant les fêtes réduit les appels perdus de 40%.' },
  { emoji: '💬', text: 'Les stories Instagram avec un sticker question génèrent 2× plus de DMs entrants.' },
  { emoji: '🎯', text: 'Un post de coulisses (behind-the-scenes) booste la confiance client — idéal le jeudi.' },
  { emoji: '🔄', text: 'Réutilisez vos meilleurs avis Google en tant que visuels Instagram : +35% de crédibilité sociale.' },
  { emoji: '📅', text: 'Planifiez vos posts 3 jours à l\'avance pour maintenir un rythme régulier sans stress.' },
  { emoji: '🚀', text: 'Un emojis bien placé dans votre bio Google augmente le taux de clics de 12%.' },
  { emoji: '🤝', text: 'Répondre aux commentaires négatifs de façon empathique convertit 70% des détracteurs en clients fidèles.' },
  { emoji: '📊', text: 'Les Reels courts (< 15s) obtiennent 40% de portée organique en plus sur Instagram.' },
  { emoji: '🌟', text: 'Demander un avis Google juste après un achat (SMS + lien) triple le taux de réponse.' },
  { emoji: '🏷️', text: 'Taguez votre localisation dans chaque post social : +22% de visibilité locale.' },
  { emoji: '💡', text: 'Un conseil pratique hebdomadaire lié à votre secteur fidélise votre audience mieux que la promo.' },
  { emoji: '🎬', text: 'Les vidéos de transformation (avant/après) sont les contenus les plus partagés dans le commerce local.' },
  { emoji: '📣', text: 'Utilisez les mots-clés de votre activité dans vos réponses d\'avis Google pour le SEO local.' },
  { emoji: '🕐', text: 'Le meilleur moment pour poster sur LinkedIn est le mardi et mercredi entre 8h et 10h.' },
  { emoji: '🌍', text: 'Une fiche Google complète (photos + horaires + description) reçoit 7× plus de visites.' },
  { emoji: '📱', text: 'Publiez une histoire Instagram quotidienne : la régularité bat l\'algorithme.' },
  { emoji: '💎', text: 'Les clients qui reçoivent une réponse personnalisée à leur avis reviennent 2× plus souvent.' },
];

function pickThree(seed: number): typeof ALL_TIPS {
  const shuffled = [...ALL_TIPS].sort(() => Math.sin(seed + ALL_TIPS.indexOf(ALL_TIPS[0])) - 0.5);
  return shuffled.slice(0, 3);
}

export function AICopilotPanel() {
  const [collapsed, setCollapsed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1',
  );
  const [seed, setSeed] = useState(() => Date.now());
  const [spinning, setSpinning] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup timer on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const tips = pickThree(seed);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    sessionStorage.setItem(SESSION_KEY, next ? '1' : '0');
  };

  const refresh = useCallback(() => {
    if (spinning) return; // Anti-spam-click: block rapid refresh
    setSpinning(true);
    refreshTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      setSeed(Date.now());
      setSpinning(false);
    }, 500);
  }, [spinning]);

  return (
    <div className="rounded-2xl border border-[#0D9488]/25 bg-gradient-to-br from-[#0D9488]/8 to-[#0B1120] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#0D9488]/15 flex items-center justify-center">
            <Sparkles size={13} className="text-[#0D9488]" />
          </div>
          <Badge className="text-[10px] font-bold bg-[#0D9488]/15 text-[#0D9488] border-[#0D9488]/25 rounded-full px-2.5">
            ✨ Conseil IA du moment
          </Badge>
          <span className="text-[11px] text-[#64748b] hidden sm:block">mis à jour à la demande</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#0D9488] hover:bg-[#0D9488]/10"
            onClick={refresh}
            aria-label="Rafraîchir les conseils"
          >
            <RefreshCw size={13} className={spinning ? 'animate-spin' : ''} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#94a3b8] hover:bg-white/5"
            onClick={toggleCollapse}
            aria-label={collapsed ? 'Développer' : 'Réduire'}
          >
            <motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={14} />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="copilot-tips"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 pb-4">
              {tips.map((tip, i) => (
                <motion.div
                  key={`${seed}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex gap-2.5 rounded-xl border border-[#0D9488]/15 bg-[#0D9488]/5 p-3"
                >
                  <span className="text-base shrink-0 mt-0.5">{tip.emoji}</span>
                  <p className="text-[12px] text-[#cbd5e1] leading-relaxed">{tip.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
