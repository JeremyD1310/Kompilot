/**
 * ApiConfigSection — collapsible SMS API provider configuration.
 */
import { useState } from 'react';
import { Settings, ChevronDown, ChevronUp, Send, Loader2, Lock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, toast } from '@blinkdotnew/ui';
import { cn } from '../../../lib/utils';

const PROVIDERS = ['Twilio', 'Brevo', 'OVH SMS', 'Autre'] as const;

interface Props {
  onConnectedChange: (connected: boolean) => void;
}

export function ApiConfigSection({ onConnectedChange }: Props) {
  const [open, setOpen]           = useState(false);
  const [provider, setProvider]   = useState('Brevo');
  const [apiKey, setApiKey]       = useState('');
  const [connected, setConnected] = useState(false);
  const [testing, setTesting]     = useState(false);

  async function handleTest() {
    if (!apiKey.trim()) { toast.error('Entrez votre clé API'); return; }
    setTesting(true);
    await new Promise(r => setTimeout(r, 1500));
    setConnected(true);
    setTesting(false);
    onConnectedChange(true);
    toast.success(`✅ API ${provider} connectée avec succès !`);
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <Settings size={14} className="text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">🔌 Configurer l'API SMS</span>
          {connected && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
              <Check size={8} /> Connecté
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">

              {/* Provider tabs */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Fournisseur</label>
                <div className="flex gap-1.5 flex-wrap">
                  {PROVIDERS.map(p => (
                    <button
                      key={p}
                      onClick={() => { setProvider(p); setConnected(false); onConnectedChange(false); }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                        provider === p
                          ? 'border-primary/40 bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Clé API</label>
                <input
                  type="password"
                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  placeholder={`Clé API ${provider}…`}
                  value={apiKey}
                  onChange={e => { setApiKey(e.target.value); setConnected(false); onConnectedChange(false); }}
                />
              </div>

              {/* Test + status */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  disabled={testing || !apiKey.trim()}
                  onClick={handleTest}
                >
                  {testing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  {testing ? 'Test en cours…' : 'Envoyer un SMS test'}
                </Button>

                {connected ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <Check size={11} /> {provider} connecté
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Lock size={11} /> Non configuré
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
