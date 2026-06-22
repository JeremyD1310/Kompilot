/**
 * SectorConnectorsPanel — Affiche les boutons de connexion API sectoriels.
 * Utilisé dans OnboardingPage entre la sélection du secteur et les objectifs.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Check, Plug2 } from 'lucide-react';
import {
  SECTOR_CONNECTORS,
  mapOnboardingSectorToConnectorKey,
  type PlatformConnector,
} from '../../lib/sectors/connectors';

interface Props {
  /** Secteur sélectionné dans l'OnboardingPage (ex: 'beaute', 'sante', 'restauration'...) */
  onboardingSector: string;
}

function ConnectorPill({ connector, connected, onConnect }: {
  connector: PlatformConnector;
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={connected ? undefined : onConnect}
      className={`w-full flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all duration-200 ${
        connected
          ? 'border-emerald-300 bg-emerald-50 cursor-default'
          : 'border-border bg-card hover:border-primary/40 hover:shadow-sm cursor-pointer active:scale-[0.98]'
      }`}
    >
      <span className="text-2xl shrink-0">{connector.emoji}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-bold ${connected ? 'text-emerald-700' : 'text-foreground'}`}>
            {connector.name}
          </span>
          {connector.primary && !connected && (
            <span className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full px-1.5 py-0.5">
              Recommandé
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
          {connector.description}
        </p>
      </div>

      {connected ? (
        <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check size={13} className="text-white" />
        </div>
      ) : (
        <div className="shrink-0 flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/5 text-primary px-3 py-1.5 text-[11px] font-bold hover:bg-primary/15 transition-colors">
          🔗 Connecter
          <ExternalLink size={9} className="ml-0.5" />
        </div>
      )}
    </motion.button>
  );
}

export function SectorConnectorsPanel({ onboardingSector }: Props) {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const connectorKey = mapOnboardingSectorToConnectorKey(onboardingSector);
  const config = SECTOR_CONNECTORS[connectorKey] ?? SECTOR_CONNECTORS.autre;

  if (!onboardingSector || connectorKey === 'autre') return null;

  const handleConnect = (id: string) => {
    setConnected(prev => new Set([...prev, id]));
  };

  const anyConnected = connected.size > 0;

  return (
    <AnimatePresence>
      <motion.div
        key={onboardingSector}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className="pt-6 pb-2 space-y-4">
          {/* Section header */}
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
              <Plug2 size={13} />
            </span>
            <h2 className="text-base font-bold text-foreground">
              Connectez vos plateformes {config.emoji} {config.label}
            </h2>
          </div>

          <p className="text-sm text-muted-foreground ml-10">
            Centralisez vos avis et messages depuis vos outils métier directement dans Kompilot.
          </p>

          {/* Connectors */}
          <div className="ml-0 space-y-2.5">
            {config.platforms.map((connector, i) => (
              <motion.div
                key={connector.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <ConnectorPill
                  connector={connector}
                  connected={connected.has(connector.id)}
                  onConnect={() => handleConnect(connector.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Success message */}
          <AnimatePresence>
            {anyConnected && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <span className="relative flex shrink-0 mt-0.5">
                  <span className="animate-ping absolute w-2 h-2 rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
                </span>
                <p className="text-[11px] text-emerald-800 font-semibold leading-relaxed">
                  {connected.size} canal{connected.size > 1 ? 'x' : ''} connecté{connected.size > 1 ? 's' : ''} — vos avis et évaluations seront centralisés dans votre inbox Kompilot.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!anyConnected && (
            <p className="text-[11px] text-muted-foreground ml-1">
              Optionnel — vous pourrez connecter vos canaux plus tard depuis <strong>Paramètres → Intégrations</strong>.
            </p>
          )}
        </div>

        <div className="mx-0 border-t border-border" />
      </motion.div>
    </AnimatePresence>
  );
}
