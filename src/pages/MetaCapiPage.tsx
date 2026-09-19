import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * MetaCapiPage — Pixel de conversion
 * Configuration du tracking publicitaire automatisé des conversions.
 * Agency-only feature. Never mention "Meta" or "Facebook" — use "Pixel de conversion" / "Tracking publicitaire".
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Card, CardHeader, CardTitle, CardContent,
  Button, Input, Badge, Separator, Skeleton, toast,
  EmptyState,
} from '@blinkdotnew/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Eye, EyeOff, Check, X, AlertTriangle, Info,
  Zap, Shield, BarChart3, Clock, Loader2, ChevronDown, ChevronUp,
  TestTube2, Save, RefreshCw,
} from 'lucide-react';
import { blink } from '../blink/client';

// ── API Helper ─────────────────────────────────────────────────────────────

const BACKEND_URL = KOMPILOT_BACKEND_URL;

async function capiApi(path: string, options: RequestInit = {}) {
  const token = await blink.auth.getValidToken().catch(() => null);
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 403 && data.code === 'UPGRADE_REQUIRED') {
      throw { code: 'UPGRADE_REQUIRED', message: data.message } as { code: string; message: string };
    }
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface CapiConfig {
  pixelId: string;
  accessToken: string;
  testEventCode?: string;
  isActive: boolean;
  lastTestAt?: string;
}

interface CapiEvent {
  id: string;
  date: string;
  event: string;
  lead: string;
  status: 'success' | 'error';
  result: string;
}

// ── Section animation ──────────────────────────────────────────────────────

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// ── FAQ Data ───────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: 'Comment obtenir mon Pixel ID ?',
    answer:
      'Connectez-vous à votre gestionnaire de publicités, accédez à la section « Outils de mesure » puis « Pixels ». Votre Pixel ID est un nombre à 15 chiffres visible en haut de la page de configuration du pixel. Copiez-le et collez-le dans le champ ci-dessus.',
  },
  {
    question: 'Comment générer une clé d\'accès API ?',
    answer:
      'Dans votre gestionnaire de publicités, allez dans « Paramètres » → « Accès au système » → « Générer un jeton d\'accès ». Sélectionnez votre pixel et accordez les permissions « Envoyer des événements de conversion ». Copiez le jeton généré et collez-le dans le champ « Clé d\'accès API ».',
  },
  {
    question: 'Comment utiliser le code de test ?',
    answer:
      'Le code de test permet de vérifier vos événements de conversion sans impasser vos données réelles. Dans votre gestionnaire de publicités, ouvrez l\'outil « Test d\'événements » dans la section Pixel. Un code de test (ex : TEST12345) sera affiché. Collez-le ci-dessus pour activer le mode test. Retirez-le une fois vos tests terminés pour revenir en mode production.',
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          active ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400'
        }`}
      />
      <span className={`text-xs font-semibold ${active ? 'text-emerald-400' : 'text-red-400'}`}>
        {active ? 'Actif' : 'Inactif'}
      </span>
    </span>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
      <Info size={16} className="text-teal-400 shrink-0 mt-0.5" />
      <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">{children}</div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden transition-colors hover:border-slate-600/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left min-h-[44px] transition-colors hover:bg-slate-800/40"
      >
        <span className="text-sm font-semibold text-slate-200">{question}</span>
        {open ? (
          <ChevronUp size={16} className="text-teal-400 shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-slate-500 shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-700/30 pt-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MetaCapiPage() {
  const queryClient = useQueryClient();

  // ── Form state ──
  const [pixelId, setPixelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [testCode, setTestCode] = useState('');
  const [showToken, setShowToken] = useState(false);

  // ── Load existing config ──
  const {
    data: config,
    isLoading: configLoading,
  } = useQuery({
    queryKey: ['capi-config'],
    staleTime: 5 * 60 * 1000,
    queryFn: () => capiApi('/api/meta-capi/config') as Promise<CapiConfig>,
  });

  // Hydrate form from server config
  useEffect(() => {
    if (config) {
      setPixelId(config.pixelId || '');
      setAccessToken(config.accessToken || '');
      setTestCode(config.testEventCode || '');
    }
  }, [config]);

  // ── Load events ──
  const {
    data: eventsData,
    isLoading: eventsLoading,
  } = useQuery({
    queryKey: ['capi-events'],
    staleTime: 60 * 1000,
    queryFn: () => capiApi('/api/meta-capi/events') as Promise<{ events: CapiEvent[] }>,
  });

  const events: CapiEvent[] = eventsData?.events ?? [];

  // ── Save config mutation ──
  const saveMutation = useMutation({
    mutationFn: () =>
      capiApi('/api/meta-capi/config', {
        method: 'POST',
        body: JSON.stringify({ pixelId, accessToken, testEventCode: testCode || undefined }),
      }),
    onSuccess: () => {
      toast.success('Configuration sauvegardée', {
        description: 'Votre pixel de conversion est maintenant configuré.',
      });
      queryClient.invalidateQueries({ queryKey: ['capi-config'] });
    },
    onError: (err: Error) => {
      toast.error('Erreur de sauvegarde', { description: err.message });
    },
  });

  // ── Test connection mutation ──
  const testMutation = useMutation({
    mutationFn: () =>
      capiApi('/api/meta-capi/test', { method: 'POST' }),
    onSuccess: (data: { success: boolean; message?: string }) => {
      if (data.success) {
        toast.success('Connexion réussie', {
          description: 'Le pixel de conversion est correctement configuré.',
        });
      } else {
        toast.error('Échec de la connexion', {
          description: data.message || 'Vérifiez vos identifiants.',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['capi-config'] });
    },
    onError: (err: unknown) => {
      if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === 'UPGRADE_REQUIRED') {
        toast.error('Offre requise', {
          description: 'message' in err && typeof err.message === 'string' ? err.message : 'Cette fonctionnalité nécessite un forfait supérieur.',
        });
      } else {
        const msg = err instanceof Error ? err.message : 'Impossible de tester la connexion.';
        toast.error('Erreur', { description: msg });
      }
    },
  });

  const isActive = config?.isActive ?? false;
  const isProcessing = saveMutation.isPending || testMutation.isPending;

  return (
    <Page className="page-enter">
      {/* ── Header ── */}
      <PageHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #0D9488, #06B6D4)' }}
          >
            <BarChart3 size={18} className="text-white" />
          </div>
          <div>
            <PageTitle className="text-xl">Pixel de conversion</PageTitle>
            <PageDescription>
              Suivi automatisé des conversions publicitaires
            </PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* ── Upgrade-required guard ── */}
        {config === undefined && !configLoading && (
          <motion.div custom={0} variants={sectionVariants} initial="hidden" animate="visible">
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Fonctionnalité réservée aux agences</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Le suivi des conversions publicitaires est disponible pour les comptes agences.
                      Contactez-nous pour activer cette fonctionnalité.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 1 — Configuration
           ═══════════════════════════════════════════════════════════════════ */}
        <motion.div custom={1} variants={sectionVariants} initial="hidden" animate="visible">
          <Card className="border-slate-700/50 bg-[#0F1629]">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <Settings size={16} className="text-teal-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Configuration</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">Paramètres de connexion au pixel</p>
                  </div>
                </div>
                {config && <StatusDot active={isActive} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {configLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full bg-slate-800" />
                  <Skeleton className="h-10 w-full bg-slate-800" />
                  <Skeleton className="h-10 w-1/2 bg-slate-800" />
                </div>
              ) : (
                <>
                  {/* Pixel ID */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 size={12} className="text-teal-400" />
                      Pixel ID
                    </label>
                    <Input
                      value={pixelId}
                      onChange={(e) => setPixelId(e.target.value)}
                      placeholder="123456789012345"
                      className="h-11 bg-slate-800/60 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20 font-mono"
                    />
                  </div>

                  {/* Access Token */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield size={12} className="text-teal-400" />
                      Clé d'accès API
                    </label>
                    <div className="relative">
                      <Input
                        type={showToken ? 'text' : 'password'}
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="EAAxxxxxxxxxxxxxxxx..."
                        className="h-11 bg-slate-800/60 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20 font-mono pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={showToken ? 'Masquer' : 'Afficher'}
                      >
                        {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Test Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <TestTube2 size={12} className="text-teal-400" />
                      Code de test
                      <Badge variant="outline" className="text-[9px] font-normal border-slate-600 text-slate-500 px-1.5 py-0">
                        optionnel
                      </Badge>
                    </label>
                    <Input
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value)}
                      placeholder="TEST12345"
                      className="h-11 bg-slate-800/60 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-teal-500 focus:ring-teal-500/20 font-mono"
                    />
                  </div>

                  {/* Info Box */}
                  <InfoBox>
                    <p>
                      <strong className="text-slate-200">Pixel ID</strong> — Identifiant unique à 15 chiffres de votre pixel de conversion. Trouvable dans les paramètres de votre gestionnaire de publicités, section « Outils de mesure ».
                    </p>
                    <p>
                      <strong className="text-slate-200">Clé d'accès API</strong> — Jeton d'accès système avec permission « Envoyer des événements de conversion ». Générable dans « Paramètres → Accès au système ».
                    </p>
                    <p>
                      <strong className="text-slate-200">Code de test</strong> — Permet de tester l'envoi d'événements sans impasser vos données réelles. L'outil « Test d'événements » de votre gestionnaire fournit ce code.
                    </p>
                  </InfoBox>

                  {/* Last test info */}
                  {config?.lastTestAt && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} />
                      Dernier test : {new Date(config.lastTestAt).toLocaleString('fr-FR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  )}

                  <Separator className="bg-slate-700/50" />

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      onClick={() => testMutation.mutate()}
                      disabled={isProcessing || !pixelId || !accessToken}
                      variant="outline"
                      className="h-11 gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-teal-400 hover:border-teal-500/30"
                    >
                      {testMutation.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Zap size={15} />
                      )}
                      {testMutation.isPending ? 'Test en cours...' : 'Tester la connexion'}
                    </Button>

                    <Button
                      onClick={() => saveMutation.mutate()}
                      disabled={isProcessing || !pixelId || !accessToken}
                      className="h-11 gap-2 bg-teal-600 hover:bg-teal-500 text-white shadow-lg shadow-teal-500/20"
                    >
                      {saveMutation.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Save size={15} />
                      )}
                      {saveMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 2 — Journal des conversions
           ═══════════════════════════════════════════════════════════════════ */}
        <motion.div custom={2} variants={sectionVariants} initial="hidden" animate="visible">
          <Card className="border-slate-700/50 bg-[#0F1629]">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <Clock size={16} className="text-teal-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Journal des conversions</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">Historique des événements envoyés</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['capi-events'] })}
                  className="h-8 gap-1.5 text-slate-400 hover:text-teal-400"
                >
                  <RefreshCw size={13} />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full bg-slate-800" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={<BarChart3 size={32} className="text-slate-600" />}
                    title="Aucun événement"
                    description="Les événements de conversion envoyés apparaîtront ici une fois votre pixel configuré et actif."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Événement</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Lead</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Statut</th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Résultat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((evt, idx) => (
                        <motion.tr
                          key={evt.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04, duration: 0.3 }}
                          className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                            {new Date(evt.date).toLocaleString('fr-FR', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="px-6 py-3">
                            <Badge variant="outline" className="text-xs font-medium border-teal-500/30 text-teal-400 bg-teal-500/5">
                              {evt.event}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-slate-300 text-xs truncate max-w-[200px]">{evt.lead}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                evt.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {evt.status === 'success' ? <Check size={11} /> : <X size={11} />}
                              {evt.status === 'success' ? 'Succès' : 'Échec'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-slate-400 text-xs">{evt.result}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            SECTION 3 — Aide
           ═══════════════════════════════════════════════════════════════════ */}
        <motion.div custom={3} variants={sectionVariants} initial="hidden" animate="visible">
          <Card className="border-slate-700/50 bg-[#0F1629]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Info size={16} className="text-teal-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Aide</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Questions fréquentes sur la configuration</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </PageBody>
    </Page>
  );
}
