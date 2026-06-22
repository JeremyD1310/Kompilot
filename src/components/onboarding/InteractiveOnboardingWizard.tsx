import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, Shield, Calendar, Sparkles, X, MessageSquare, MapPin } from 'lucide-react';
import { Button, Card, Slider, Badge, cn } from '@blinkdotnew/ui';

interface InteractiveOnboardingWizardProps {
  userId: string;
  userSector?: string;
  onComplete: () => void;
  /** When true, bypasses localStorage check and forces the wizard open */
  forceOpen?: boolean;
}

const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let currentIndex = 0;
    
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(prev => prev + text[currentIndex]);
          currentIndex++;
        } else {
          clearInterval(interval);
        }
      }, 30);
      
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [text, delay]);
  
  return <span>{displayedText}</span>;
};

export const InteractiveOnboardingWizard: React.FC<InteractiveOnboardingWizardProps> = ({
  userId,
  userSector = 'votre secteur',
  onComplete,
  forceOpen = false,
}) => {
  const [step, setStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [shieldValue, setShieldValue] = useState(25);

  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      return;
    }
    const isDone = localStorage.getItem(`interactive_wizard_done_${userId}`);
    if (!isDone) {
      setIsVisible(true);
    }
  }, [userId, forceOpen]);

  const handleComplete = () => {
    localStorage.setItem(`interactive_wizard_done_${userId}`, 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(`interactive_wizard_done_${userId}`, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const steps = [
    {
      title: "L'Avis",
      icon: <Star className="h-5 w-5" />,
    },
    {
      title: "Le Bouclier No-Show",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: "Planifier la semaine",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Campagne SMS",
      icon: <MessageSquare className="h-5 w-5" />,
    },
    {
      title: "Scan G.E.O.",
      icon: <MapPin className="h-5 w-5" />,
    },
  ];

  const demoPosts = [
    { day: 'Lun', title: `Top 5 astuces pour ${userSector}` },
    { day: 'Mer', title: `Pourquoi nous choisir ? ✨` },
    { day: 'Ven', title: 'Bon week-end à tous ! 🎉' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg"
      >
        <Card className="overflow-hidden border-border bg-card/50 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "h-1.5 w-8 rounded-full transition-colors",
                    step > i ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <button 
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ignorer
            </button>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Répondez à vos avis en un clic</h2>
                    <p className="text-muted-foreground">L'IA de Kompilot rédige des réponses personnalisées pour booster votre SEO local.</p>
                  </div>

                  <Card className="p-4 bg-muted/30 border-dashed border-muted-foreground/20 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        M
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Marie D.</span>
                          <div className="flex text-orange-400">
                            {[1, 2, 3, 4].map(i => <Star key={i} className="h-3 w-3 fill-current" />)}
                            <Star className="h-3 w-3" />
                          </div>
                        </div>
                        <p className="text-sm italic">"Très bon service mais j'aurais aimé plus de rapidité."</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-background border border-primary/20 relative">
                      <div className="absolute -top-2 left-4 px-2 py-0.5 bg-primary/10 text-[10px] font-medium text-primary rounded-full flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> Brouillon IA
                      </div>
                      <p className="text-sm pt-2 leading-relaxed">
                        <TypewriterText 
                          delay={1000}
                          text="Merci beaucoup Marie pour votre retour ! Nous travaillons continuellement à améliorer nos délais. À très bientôt ! — L'équipe" 
                        />
                      </p>
                    </div>
                  </Card>

                  <Button className="w-full h-12 text-base font-semibold" onClick={() => setStep(2)}>
                    <Check className="mr-2 h-5 w-5" /> Valider et envoyer
                  </Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Le Bouclier No-Show</h2>
                    <p className="text-muted-foreground">Protégez votre trésorerie et recevez les pénalités directement sur votre compte bancaire.</p>
                  </div>

                  <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Taux de protection</span>
                      <span className="text-2xl font-bold text-primary">{shieldValue}%</span>
                    </div>
                    <Slider 
                      value={[shieldValue]} 
                      onValueChange={(v) => setShieldValue(v[0])}
                      max={50}
                      step={5}
                      className="py-2"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                      <span>Prudent (5%)</span>
                      <span>Sécure (25%)</span>
                      <span>Maximal (50%)</span>
                    </div>

                    <Badge variant="outline" className="w-full justify-center py-2 bg-primary/5 text-primary border-primary/20 gap-2">
                      <Sparkles className="h-4 w-4" /> 
                      💡 L'IA vous recommande 25% pour {userSector}
                    </Badge>
                  </div>

                  {/* KYC info block */}
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1.5">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      🔗 Étape suivante : configurer votre compte bancaire
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Pour recevoir les pénalités No-Show, vous devrez lier votre IBAN via Stripe Connect (vérification d'identité sécurisée — 2 min). Aucune donnée bancaire n'est stockée par Kompilot.
                    </p>
                  </div>

                  <Button className="w-full h-12 text-base font-semibold" onClick={() => setStep(3)}>
                    Continuer <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Planifiez la semaine</h2>
                    <p className="text-muted-foreground">Nous avons généré 3 publications optimisées pour votre visibilité cette semaine.</p>
                  </div>

                  <div className="grid gap-3">
                    {demoPosts.map((post, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-4 p-3 rounded-xl bg-muted/40 border border-border"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                          {post.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{post.title}</p>
                          <p className="text-[10px] text-muted-foreground">Optimisé pour Instagram & Google</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      </motion.div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <Button className="w-full h-12 text-base font-semibold" onClick={() => setStep(4)}>
                      <MessageSquare className="mr-2 h-5 w-5" /> Voir les SMS
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h2 className="text-2xl font-bold">Campagne SMS</h2>
                    </div>
                    <p className="text-muted-foreground">Réactivez vos clients silencieux et générez des revenus supplémentaires grâce aux campagnes SMS personnalisées.</p>
                  </div>

                  {/* Key stat */}
                  <div className="rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 p-5 text-center space-y-1">
                    <p className="text-4xl font-extrabold text-green-600 dark:text-green-400">82%</p>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">des clients reviennent après un SMS personnalisé</p>
                  </div>

                  {/* Stat cards row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: '95%', label: 'Taux de lecture', color: 'text-primary' },
                      { value: '3×', label: 'Plus efficace que l\'email', color: 'text-primary' },
                      { value: '2 min', label: 'Pour créer une campagne', color: 'text-primary' },
                    ].map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        className="rounded-xl bg-muted/40 border border-border p-3 text-center space-y-0.5"
                      >
                        <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Example SMS preview */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Exemple de SMS</p>
                    <div className="flex gap-2 items-start">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-background border border-border px-3 py-2">
                        <p className="text-sm leading-relaxed">
                          Bonjour Sophie ! 👋 Ça fait un moment… Revenez cette semaine et profitez de <span className="font-semibold text-primary">-15% sur votre prochain rendez-vous</span>. Réservez ici 👉 netcop.io/rdv
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full h-12 text-base font-semibold" onClick={() => setStep(5)}>
                    Activer mes SMS <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <h2 className="text-2xl font-bold">Scan G.E.O.</h2>
                    </div>
                    <p className="text-muted-foreground">Découvrez si vous apparaissez sur <span className="font-medium text-foreground">ChatGPT</span>, <span className="font-medium text-foreground">Perplexity</span> et <span className="font-medium text-foreground">Google IA</span> quand vos clients vous cherchent.</p>
                  </div>

                  {/* Animated scan bars */}
                  <div className="space-y-3">
                    {[
                      { platform: 'Google IA', icon: '🔍', score: 78, color: 'bg-blue-500' },
                      { platform: 'ChatGPT', icon: '🤖', score: 45, color: 'bg-emerald-500' },
                      { platform: 'Perplexity', icon: '⚡', score: 32, color: 'bg-violet-500' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.12 }}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 font-medium">
                            <span>{item.icon}</span> {item.platform}
                          </span>
                          <span className="font-semibold tabular-nums text-muted-foreground">
                            {item.score}<span className="text-xs">/100</span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${item.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.score}%` }}
                            transition={{ duration: 0.9, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Info callout */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-900/20 px-4 py-3 space-y-1"
                  >
                    <p className="text-xs font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Votre score GEO simulé : 52/100
                    </p>
                    <p className="text-[11px] text-violet-600 dark:text-violet-400 leading-relaxed">
                      Lancez un vrai scan pour obtenir votre rapport complet et les actions prioritaires pour apparaître en premier sur l'IA.
                    </p>
                  </motion.div>

                  <Button className="w-full h-12 text-base font-semibold" onClick={handleComplete}>
                    <MapPin className="mr-2 h-5 w-5" /> Lancer mon scan →
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);
