/**
 * ReferralLinkCreator
 * Handles: new positive review input → AI message generation → unique link creation
 * RGPD compliance: instead of direct WhatsApp/SMS sending, creates a priority
 * inbox task so the merchant initiates sending from their own device.
 */
import { useState } from 'react';
import { Sparkles, Zap, Copy, Check, MessageSquare, Star, ShieldCheck, Smartphone, Bell } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { useEstablishment } from '../../context/EstablishmentContext';
import { blink } from '../../blink/client';
import type { ReferralCampaign } from '../../hooks/useReferral';

interface Props {
  campaign: ReferralCampaign | null | undefined;
  discountPercent: number;
  sponsorDiscountPercent: number;
  sector: string;
  sectorLabel: string;
  getSectorTemplate: (sector: string) => string;
  getReferralUrl: (code: string) => string;
  createLink: (name: string, rating: number) => Promise<any>;
  markThankYouSent: (id: string) => Promise<void>;
  saveCampaign: (patch: any) => Promise<void>;
  isSaving: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a WhatsApp deep-link so the merchant opens WA with the pre-filled msg */
function buildWhatsAppDeepLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/** Build a SMS deep-link (tel: sms: scheme) for "send from device" */
function buildSMSDeepLink(message: string): string {
  return `sms:?body=${encodeURIComponent(message)}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ReferralLinkCreator({
  campaign, discountPercent, sponsorDiscountPercent, sector, sectorLabel,
  getSectorTemplate, getReferralUrl, createLink, markThankYouSent, saveCampaign, isSaving,
}: Props) {
  const { activeEstablishment } = useEstablishment();
  const [sponsorName, setSponsorName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // RGPD task state — after link created
  const [rgpdTask, setRgpdTask] = useState<{
    clientName: string;
    message: string;
    channel: 'whatsapp' | 'sms';
  } | null>(null);
  const [taskDismissed, setTaskDismissed] = useState(false);

  const handleGenerateMessage = async () => {
    if (!sponsorName.trim()) { toast.error('Entrez d\'abord le nom du client'); return; }
    setIsGenerating(true);
    try {
      const tempUrl = `${window.location.origin}/r/PREVIEW`;
      let msg = '';
      try {
        const result = await blink.ai.generateText({
          model: 'gpt-4.1-mini',
          prompt: `Génère un message de parrainage WhatsApp/SMS court, chaleureux pour un commerce de "${sectorLabel}". Client: ${sponsorName}, Note: ${reviewRating}/5, Remise filleul: ${discountPercent}%, Avantage parrain: ${sponsorDiscountPercent}%, Lien: ${tempUrl}, Enseigne: ${activeEstablishment?.name}. Max 3 phrases, 1-2 emojis, français convivial. Répondre uniquement avec le message.`,
          maxTokens: 200,
        });
        msg = result.text?.trim() || '';
      } catch {
        const template = campaign?.messageTemplate || getSectorTemplate(sector);
        msg = template
          .replace('{client.name}', sponsorName)
          .replace('{link}', tempUrl)
          .replace('{discount}', String(discountPercent))
          .replace('{sponsorDiscount}', String(sponsorDiscountPercent));
      }
      setGeneratedMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateLink = async () => {
    if (!sponsorName.trim()) { toast.error('Entrez d\'abord le nom du client'); return; }
    if (!campaign?.id) {
      await saveCampaign({
        isActive: 1,
        discountPercent,
        sponsorDiscountPercent,
        avgBasketAmount: 50,
        messageTemplate: getSectorTemplate(sector),
        channel: 'whatsapp',
      });
    }
    const link = await createLink(sponsorName, reviewRating);
    if (link) {
      const url = getReferralUrl(link.shortCode);
      const template = campaign?.messageTemplate || getSectorTemplate(sector);
      const finalMsg = template
        .replace('{client.name}', sponsorName)
        .replace('{link}', url)
        .replace('{discount}', String(discountPercent))
        .replace('{sponsorDiscount}', String(sponsorDiscountPercent));

      setGeneratedMessage(finalMsg);

      // ── RGPD compliance: create priority inbox task instead of auto-sending ──
      const clientName = sponsorName;
      const channel = (campaign?.channel ?? 'whatsapp') as 'whatsapp' | 'sms';
      setRgpdTask({ clientName, message: finalMsg, channel });
      setTaskDismissed(false);

      // Toast notification mimicking the inbox task
      toast.success(`📬 Tâche créée dans votre Inbox pour ${clientName}`, {
        description: 'Message de fidélisation prêt — validez l\'envoi depuis votre appareil.',
      });

      await markThankYouSent(link.id);
      setSponsorName('');
    } else {
      toast.error('Erreur lors de la création du lien');
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copié !');
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <Star size={16} className="text-amber-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground">Nouvel avis positif reçu</h4>
          <p className="text-xs text-muted-foreground">Génère un message de remerciement + lien unique en 1 clic</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nom du client</label>
          <input
            type="text" placeholder="Ex : Marie Dupont"
            value={sponsorName} onChange={e => setSponsorName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Note laissée</label>
          <div className="flex gap-1.5">
            {[4, 5].map(r => (
              <button key={r} onClick={() => setReviewRating(r)}
                className={`flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-sm font-bold transition-all ${
                  reviewRating === r ? 'bg-amber-50 border-amber-300 text-amber-700' : 'border-border text-muted-foreground hover:bg-muted/40'
                }`}
              >
                {'⭐'.repeat(r)} {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={handleGenerateMessage} disabled={isGenerating || !sponsorName.trim()}
          className="flex items-center gap-2 rounded-xl bg-violet-600 text-white px-4 py-2 text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {isGenerating
            ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Sparkles size={13} />}
          Générer message IA
        </button>
        <button onClick={handleCreateLink} disabled={!sponsorName.trim() || isSaving}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <Zap size={13} />
          Créer lien unique
        </button>
      </div>

      {/* Message preview (editable) */}
      {generatedMessage && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <MessageSquare size={12} /> Aperçu du message
          </p>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{generatedMessage}</p>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copié !' : 'Copier le message'}
          </button>
        </div>
      )}

      {/* ── RGPD Priority Inbox Task ─────────────────────────────────────────── */}
      {rgpdTask && !taskDismissed && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-950/20 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <Bell size={15} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-extrabold text-blue-800 dark:text-blue-300 leading-tight">
                    Tâche prioritaire dans votre Inbox
                  </p>
                  <span className="text-[9px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 uppercase tracking-wide">
                    Prioritaire
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                  Nouveau message de fidélisation prêt pour{' '}
                  <strong className="text-blue-800 dark:text-blue-300">{rgpdTask.clientName}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* RGPD notice */}
          <div className="flex items-start gap-2 rounded-xl bg-white/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 px-3 py-2.5">
            <ShieldCheck size={13} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 dark:text-blue-400 leading-relaxed">
              <strong>Conformité RGPD :</strong> L'envoi automatique direct est non autorisé. Vous
              initiez vous-même l'envoi depuis votre appareil, ce qui garantit le consentement
              du destinataire et votre conformité légale.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={
                rgpdTask.channel === 'whatsapp'
                  ? buildWhatsAppDeepLink(rgpdTask.message)
                  : buildSMSDeepLink(rgpdTask.message)
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 transition-colors shadow-sm"
            >
              <Smartphone size={13} />
              Valider et envoyer depuis mon appareil
              {rgpdTask.channel === 'whatsapp' ? ' (WhatsApp)' : ' (SMS)'}
            </a>
            <button
              onClick={() => setTaskDismissed(true)}
              className="rounded-xl border border-blue-200 dark:border-blue-700 bg-white dark:bg-card text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shrink-0"
            >
              Reporter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
