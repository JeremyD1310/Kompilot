/**
 * CRMCard — connect / disconnect tile for a single CRM integration.
 * Includes an expandable form for entering the API key or webhook URL.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import type { CRMIntegration } from './WebhookTypes';

// ── Props ─────────────────────────────────────────────────────────────────────

interface CRMCardProps {
  integration: CRMIntegration;
  onConnect: (id: CRMIntegration['id'], key: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlaceholder(id: CRMIntegration['id']): string {
  if (id === 'hubspot') return 'pat-eu1-xxxxxxxx-...';
  if (id === 'custom')  return 'https://your-endpoint.com/webhook';
  return 'https://hook.make.com/xxxxx...';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CRMCard({ integration, onConnect }: CRMCardProps) {
  const [editing,        setEditing]        = useState(false);
  const [key,            setKey]            = useState('');
  const [connecting,     setConnecting]     = useState(false);
  const [showKey,        setShowKey]        = useState(false);
  const [localConnected, setLocalConnected] = useState(integration.connected);

  const handleSave = () => {
    if (!key.trim()) return;
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setLocalConnected(true);
      setEditing(false);
      onConnect(integration.id, key);
      toast.success(`${integration.label} connecté !`, {
        description: 'Les leads qualifiés seront envoyés automatiquement.',
      });
    }, 1600);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        background:   'hsl(var(--card))',
        borderColor:  localConnected ? `${integration.color}40` : 'hsl(var(--border))',
      }}
    >
      {/* ── Header row ── */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{
            background: `${integration.color}15`,
            border:     `1px solid ${integration.color}30`,
          }}
        >
          {integration.logo}
        </div>

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{integration.label}</p>
            {localConnected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Actif
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{integration.description}</p>
        </div>

        {/* Toggle expand */}
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer shrink-0"
        >
          {editing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {localConnected ? 'Configurer' : 'Connecter'}
        </button>
      </div>

      {/* ── Expandable form ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-3 border-t border-border">
              <p className="text-[11px] text-muted-foreground font-medium">
                {integration.apiKeyLabel}
              </p>

              {/* Key input */}
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={e => setKey(e.target.value)}
                  placeholder={getPlaceholder(integration.id)}
                  className="w-full h-10 pl-3 pr-10 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!key.trim() || connecting}
                  className="gap-1.5 text-xs"
                  style={{ background: integration.color }}
                >
                  {connecting ? (
                    <><Loader2 size={12} className="animate-spin" /> Connexion…</>
                  ) : (
                    <><CheckCircle2 size={12} /> Sauvegarder</>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="text-xs">
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
