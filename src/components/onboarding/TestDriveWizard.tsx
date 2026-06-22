import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge } from '@blinkdotnew/ui';
import {
  X,
  Sparkles,
  Gauge,
  Calendar,
  Inbox,
  Star,
  Check,
  Rocket,
  ArrowRight,
  Zap,
  Gift,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useEstablishment } from '../../context/EstablishmentContext';
import { useSubscription } from '../../context/SubscriptionContext';

interface TestDriveWizardProps {
  open: boolean;
  onClose: () => void;
}

interface FeatureCard {
  id: string;
  icon: any;
  title: string;
  description: string;
  color: string;
  route: string;
}

const STORAGE_KEY = 'kompilot_testdrive_progress';

const FEATURES: FeatureCard[] = [
  {
    id: 'cockpit',
    icon: Gauge,
    title: 'Cockpit IA',
    description: 'Votre tableau de bord intelligent avec KPIs en temps réel et alertes proactives',
    color: 'from-blue-500 to-cyan-500',
    route: '/dashboard',
  },
  {
    id: 'calendar',
    icon: Calendar,
    title: 'Calendrier',
    description: 'Planifiez et automatisez vos publications sur tous vos réseaux',
    color: 'from-purple-500 to-pink-500',
    route: '/calendar',
  },
  {
    id: 'inbox',
    icon: Inbox,
    title: 'Inbox',
    description: 'Centralisez tous vos messages clients et répondez en un clic',
    color: 'from-green-500 to-emerald-500',
    route: '/inbox',
  },
  {
    id: 'reviews',
    icon: Star,
    title: 'Avis Google',
    description: 'Gérez vos avis Google et améliorez votre réputation en ligne',
    color: 'from-yellow-500 to-orange-500',
    route: '/reviews',
  },
];

export function TestDriveWizard({ open, onClose }: TestDriveWizardProps) {
  const { activeEstablishment } = useEstablishment();
  const { currentPlan } = useSubscription();
  const [step, setStep] = useState(0);
  const [discoveredFeatures, setDiscoveredFeatures] = useState<string[]>([]);
  const [sector, setSector] = useState('');
  const [objectives, setObjectives] = useState<string[]>([]);

  useEffect(() => {
    if (open && activeEstablishment) {
      setSector(activeEstablishment.category || 'Commerce');
      setObjectives(['Augmenter ma visibilité locale', 'Fidéliser mes clients']);
    }
  }, [open, activeEstablishment]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.discoveredFeatures) {
          setDiscoveredFeatures(data.discoveredFeatures);
        }
      } catch (e) {
        console.error('Error loading test drive progress:', e);
      }
    }
  }, []);

  const saveProgress = (features: string[]) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        discoveredFeatures: features,
        lastUpdated: new Date().toISOString(),
      })
    );
  };

  const handleDiscoverFeature = (featureId: string) => {
    if (!discoveredFeatures.includes(featureId)) {
      const updated = [...discoveredFeatures, featureId];
      setDiscoveredFeatures(updated);
      saveProgress(updated);
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Progress indicator */}
          <div className="flex gap-2 px-6 pt-6 pb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="px-6 pb-6"
            >
              {/* Step 1: Welcome */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                        <Rocket className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">
                          Bienvenue dans votre essai Kompilot !
                        </h2>
                        <Badge variant="outline" className="mt-1">
                          14 jours gratuits
                        </Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Découvrez comment Kompilot peut transformer votre communication locale avec
                      l'IA. En quelques minutes, vous aurez accès à tous les outils pour booster
                      votre visibilité et fidéliser vos clients.
                    </p>
                  </div>

                  <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                    <div className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-primary mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">Ce qui vous attend :</p>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>✓ Configuration automatique basée sur votre établissement</li>
                          <li>✓ 50 crédits IA offerts pour tester toutes les fonctionnalités</li>
                          <li>✓ Accès complet à toutes les fonctionnalités Pro</li>
                        </ul>
                      </div>
                    </div>
                  </Card>

                  <Button onClick={handleNext} className="w-full" size="lg">
                    Commencer le Test Drive
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {/* Step 2: Quick Setup */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h2 className="text-2xl font-bold text-foreground">
                        Configuration automatique
                      </h2>
                    </div>
                    <p className="text-muted-foreground">
                      Nous avons détecté votre type d'entreprise et préparé une configuration
                      personnalisée pour vous.
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    <Card className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Secteur</span>
                        <Badge variant="secondary">{sector}</Badge>
                      </div>
                      <div className="space-y-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Objectifs recommandés
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {objectives.map((obj, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Target className="w-3 h-3 mr-1" />
                              {obj}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">
                            ✨ Configuration automatique
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Kompilot a analysé votre établissement "{activeEstablishment?.name}" et
                            optimisé les paramètres pour maximiser votre impact local.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBack} className="flex-1">
                      Retour
                    </Button>
                    <Button onClick={handleNext} className="flex-1">
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Feature Preview */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">
                      Découvrez vos fonctionnalités
                    </h2>
                    <p className="text-muted-foreground">
                      Cliquez sur chaque fonctionnalité pour en savoir plus. Découvrez les 4 pour
                      débloquer votre cockpit !
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {discoveredFeatures.length}/4 découvertes
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {FEATURES.map((feature) => {
                      const isDiscovered = discoveredFeatures.includes(feature.id);
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={feature.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className={`p-4 cursor-pointer transition-all ${
                              isDiscovered
                                ? 'bg-primary/5 border-primary/30'
                                : 'hover:border-primary/30'
                            }`}
                            onClick={() => handleDiscoverFeature(feature.id)}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div
                                  className={`p-2 rounded-lg bg-gradient-to-br ${feature.color}`}
                                >
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                {isDiscovered && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="p-1 rounded-full bg-primary"
                                  >
                                    <Check className="w-3 h-3 text-primary-foreground" />
                                  </motion.div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground mb-1">
                                  {feature.title}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBack} className="flex-1">
                      Retour
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={discoveredFeatures.length < 4}
                      className="flex-1"
                    >
                      Terminer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Ready */}
              {step === 3 && (
                <div className="space-y-6">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center space-y-4"
                  >
                    <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                      <Rocket className="w-12 h-12 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">
                        Votre cockpit est prêt !
                      </h2>
                      <p className="text-muted-foreground">
                        Tout est configuré pour {activeEstablishment?.name}. Vous êtes prêt à
                        booster votre visibilité locale.
                      </p>
                    </div>
                  </motion.div>

                  <Card className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Secteur</span>
                      <Badge variant="secondary">{sector}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Fonctionnalités découvertes
                      </span>
                      <Badge variant="secondary">{discoveredFeatures.length}/4</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Plan actuel</span>
                      <Badge variant="outline">{currentPlan.name}</Badge>
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Gift className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">50 crédits IA offerts</p>
                        <p className="text-xs text-muted-foreground">
                          Utilisez-les pour générer du contenu, analyser vos performances et
                          automatiser vos réponses
                        </p>
                      </div>
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                  </Card>

                  <Button
                    onClick={() => {
                      handleClose();
                    }}
                    className="w-full"
                    size="lg"
                  >
                    Accéder à mon tableau de bord
                    <Rocket className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
