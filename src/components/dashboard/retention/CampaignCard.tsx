/**
 * CampaignCard — one retention campaign row.
 */
import { AlertCircle, Star, Calendar, Send, Zap, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@blinkdotnew/ui';
import { UrgencyBar, SmsPreviewBox } from './RetentionAtoms';
import type { CampaignType, GeneratedSms } from './RetentionTypes';

const ICON_MAP: Record<string, React.ElementType> = {
  AlertCircle,
  Star,
  Calendar,
};

interface Props {
  campaign: CampaignType;
  hasApiKey: boolean;
  generatedSms: GeneratedSms | null;
  isGenerating: boolean;
  onGenerate: (id: string, description: string) => void;
  onSend: (campaign: CampaignType) => void;
}

export function CampaignCard({ campaign, hasApiKey, generatedSms, isGenerating, onGenerate, onSend }: Props) {
  const Icon = ICON_MAP[campaign.icon] ?? AlertCircle;
  const activeSms = generatedSms?.sms ?? campaign.defaultSms;
  const activeVars = generatedSms?.variables ?? campaign.variables;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-muted/60 shrink-0">
            <Icon size={16} className={campaign.iconColor} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground leading-tight">{campaign.title}</p>
            <p className="text-[11px] text-muted-foreground">{campaign.description}</p>
          </div>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted text-foreground border border-border whitespace-nowrap">
          {campaign.statsLabel}
        </span>
      </div>

      <UrgencyBar score={campaign.urgencyScore} colorClass={campaign.urgencyColor} />
      <SmsPreviewBox smsText={activeSms} variables={activeVars} />

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={isGenerating}
          onClick={() => onGenerate(campaign.id, campaign.description)}
        >
          {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
          {isGenerating ? 'Génération…' : 'IA : Régénérer'}
        </Button>

        {hasApiKey ? (
          <Button size="sm" className="gap-1.5 text-xs flex-1" onClick={() => onSend(campaign)}>
            <Send size={12} />
            📤 Envoyer à {campaign.clientCount} clients
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 text-xs flex-1 opacity-60 cursor-not-allowed"
            disabled
            title="Configurez votre API SMS"
          >
            <Lock size={12} />
            Configurez l'API SMS
          </Button>
        )}
      </div>
    </motion.div>
  );
}
