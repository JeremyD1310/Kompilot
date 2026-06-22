/**
 * SmsComposer — AI SMS generator section.
 */
import { Zap, Loader2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { cn } from '../../../lib/utils';
import { NoShowBadge, VariableChip } from './RetentionAtoms';
import type { GeneratedSms } from './RetentionTypes';
import { SMS_COST_PER_UNIT, SMS_DEFAULT_AUDIENCE } from './RetentionTypes';

interface Props {
  goal: string;
  onGoalChange: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
  result: GeneratedSms | null;
}

export function SmsComposer({ goal, onGoalChange, onGenerate, loading, result }: Props) {
  const cost = (SMS_COST_PER_UNIT * SMS_DEFAULT_AUDIENCE).toFixed(2);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center shrink-0">
          <MessageCircle size={13} className="text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground">Compositeur SMS IA</p>
          <p className="text-[11px] text-muted-foreground">Décrivez votre objectif, l'IA génère le SMS parfait</p>
        </div>
      </div>

      {/* Goal input */}
      <textarea
        className="w-full resize-none rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        rows={2}
        placeholder="Ex: Relancer mes clients absents depuis 2 mois avec une offre printemps -15%"
        value={goal}
        onChange={e => onGoalChange(e.target.value)}
      />

      <Button
        className="w-full gap-2 text-xs"
        disabled={loading || !goal.trim()}
        onClick={onGenerate}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
        🤖 Générer le SMS parfait avec l'IA
      </Button>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            <div className="rounded-xl bg-muted/40 border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">SMS généré</span>
                <div className="flex items-center gap-2">
                  <NoShowBadge />
                  <span className={cn(
                    'text-[10px] font-bold tabular-nums',
                    result.sms.length > 140 ? 'text-red-500' : 'text-emerald-600'
                  )}>
                    {result.sms.length}/160
                  </span>
                </div>
              </div>
              <p className="text-xs text-foreground leading-relaxed font-mono">{result.sms}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {result.variables.map(v => <VariableChip key={v} label={v} />)}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              💶 Coût estimé :{' '}
              <strong className="text-foreground">
                {SMS_COST_PER_UNIT}€/SMS × {SMS_DEFAULT_AUDIENCE} = {cost}€
              </strong>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
