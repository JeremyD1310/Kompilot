/**
 * StepAPIConnectors — Étape "Connexion des canaux" de l'onboarding.
 * Affiche dynamiquement les boutons de connexion API selon le secteur sélectionné.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ExternalLink, Plug } from 'lucide-react';
import { SECTOR_CONNECTORS, type SectorKey, type PlatformConnector } from '../../../lib/sectors/connectors';

interface Props {
  sectorKey: SectorKey;
  onComplete: () => void;
}

function ConnectorButton({
  connector,
  connected,
  onConnect,
}: {
  connector: PlatformConnector;
  connected: boolean;
  onConnect: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative flex items-center gap-3 rounded-xl border-2 px-3.5 py-3 transition-all duration-200 ${
        connected
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-700'
          : 'border-border bg-card hover:border-primary/40'
      }`}
    >
      {/* Icon */}
      <span className="text-xl shrink-0 w-8 text-center">{connector.emoji}</span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold leading-tight ${connected ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground'}`}>
          {connector.name}
          {connector.primary && (
            <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
              Recommandé
            </span>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{connector.description}</p>
      </div>

      {/* Action */}
      {connected ? (
        <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
          <Check size={13} className="text-white" />
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="shrink-0 flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/5 text-primary px-2.5 py-1.5 text-[10px] font-bold hover:bg-primary/15 transition-colors"
        >
          🔗 Connecter
          <ExternalLink size={9} />
        </button>
      )}
    </motion.div>
  );
}

export function StepAPIConnectors({ sectorKey, onComplete }: Props) {
  const [connected, setConnected] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState(false);

  const config = SECTOR_CONNECTORS[sectorKey] ?? SECTOR_CONNECTORS.autre;

  const handleConnect = (id: string) => {
    // In real implementation: open OAuth flow / redirect
    setConnected(prev => new Set([...prev, id]));
    // Check if at least one primary connector is connected → enable continue
  };

  const primaryConnected = config.platforms.some(p => p.primary && connected.has(p.id));
  const anyConnected = connected.size > 0;
  const canContinue = anyConnected || skipped;

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3.5 py-3 flex items-start gap-2.5">
        <Plug size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>CONNEXION DES CANAUX :</strong> Centralisez vos avis, évaluations et messages
          issus de <strong>{config.label}</strong> directement dans votre inbox Kompilot.
        </p>
      </div>

      {/* Sector badge */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{config.emoji}</span>
        <span className="text-xs font-bold text-foreground">{config.label}</span>
        <span className="ml-auto text-[10px] text-muted-foreground font-medium">
          {connected.size}/{config.platforms.length} connecté{connected.size > 1 ? 's' : ''}
        </span>
      </div>

      {/* Connectors list */}
      <AnimatePresence>
        <div className="space-y-2">
          {config.platforms.map((connector, i) => (
            <motion.div
              key={connector.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <ConnectorButton
                connector={connector}
                connected={connected.has(connector.id)}
                onConnect={() => handleConnect(connector.id)}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {primaryConnected && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-center gap-2.5"
          >
            <span className="relative flex shrink-0">
              <span className="animate-ping absolute w-2 h-2 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
              ✅ Connexion activée ! Vos avis et évaluations seront centralisés automatiquement dans votre inbox.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="space-y-2 pt-1">
        {anyConnected ? (
          <button
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold py-2.5 shadow-md active:scale-[0.98] transition-all"
          >
            Continuer avec {connected.size} canal{connected.size > 1 ? 'x' : ''} connecté{connected.size > 1 ? 's' : ''} →
          </button>
        ) : (
          <button
            onClick={() => { setSkipped(true); onComplete(); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2 font-medium"
          >
            Passer — je connecterai mes canaux depuis les Paramètres
          </button>
        )}
      </div>
    </div>
  );
}
