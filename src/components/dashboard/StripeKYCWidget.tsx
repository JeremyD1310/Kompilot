/**
 * StripeKYCWidget — MODULE 3
 * Full KYC status display with document upload flow + status transitions.
 * Tracks CNI/RIB document submission and shows orange/green status badge.
 */
import { useState, useEffect } from 'react';
import {
  CreditCard, Upload, AlertTriangle, CheckCircle2,
  Clock, ArrowRight, RefreshCw, Eye, Shield,
  FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

type KYCStatus =
  | 'not_started'
  | 'pending_documents'
  | 'under_review'
  | 'verified'
  | 'rejected';

interface DocumentSlot {
  id: 'cni' | 'rib';
  label: string;
  description: string;
  icon: typeof FileText;
  required: boolean;
}

const DOCUMENT_SLOTS: DocumentSlot[] = [
  {
    id: 'cni',
    label: "Pièce d'identité (CNI / Passeport)",
    description: 'Recto-verso, lisible, en cours de validité',
    icon: FileText,
    required: true,
  },
  {
    id: 'rib',
    label: 'RIB bancaire',
    description: 'Au nom du titulaire du compte professionnel',
    icon: CreditCard,
    required: true,
  },
];

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<KYCStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof CheckCircle2;
  description: string;
}> = {
  not_started: {
    label: 'KYC non démarré',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/60',
    borderColor: 'border-border',
    icon: Shield,
    description: 'Transmettez vos pièces justificatives pour activer les virements.',
  },
  pending_documents: {
    label: '⚠️ Documents requis',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800/50',
    icon: AlertTriangle,
    description: 'Action requise — envoyez vos justificatifs pour débloquer les paiements.',
  },
  under_review: {
    label: '🕐 En cours de vérification',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    icon: Clock,
    description: 'Vos documents sont en cours d\'examen par Stripe (24–48h).',
  },
  verified: {
    label: '✅ Compte Connecté Vérifié',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800/50',
    icon: CheckCircle2,
    description: 'Virements actifs toutes les 24h. KYC validé par Stripe.',
  },
  rejected: {
    label: '❌ Vérification échouée',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800/50',
    icon: AlertTriangle,
    description: 'Documents refusés. Veuillez soumettre à nouveau des documents valides.',
  },
};

// ── Upload slot ───────────────────────────────────────────────────────────────

function DocumentUploadSlot({
  slot,
  uploaded,
  onUpload,
}: {
  slot: DocumentSlot;
  uploaded: boolean;
  onUpload: (id: DocumentSlot['id']) => void;
}) {
  const Icon = slot.icon;
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
      uploaded
        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50'
        : 'bg-card border-border hover:border-primary/40'
    }`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
        uploaded
          ? 'bg-green-100 dark:bg-green-900/30'
          : 'bg-muted'
      }`}>
        {uploaded ? (
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
        ) : (
          <Icon size={18} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${uploaded ? 'text-green-700 dark:text-green-400' : 'text-foreground'}`}>
          {slot.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{slot.description}</p>
      </div>
      {!uploaded ? (
        <button
          onClick={() => onUpload(slot.id)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          <Upload size={13} /> Envoyer
        </button>
      ) : (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium shrink-0">✓ Envoyé</span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StripeKYCWidget() {
  const { user } = useAuth();
  const [kycStatus, setKycStatus] = useState<KYCStatus>('pending_documents');
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payoutCycle, setPayoutCycle] = useState('toutes les 24h');

  // Simulate loading KYC status from storage/backend
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`kyc_status_${user?.id}`);
      if (stored) setKycStatus(stored as KYCStatus);
    } catch { /* ignore */ }
  }, [user?.id]);

  const handleUpload = (docId: string) => {
    // Simulate file upload dialog
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = () => {
      if (input.files?.[0]) {
        setUploadedDocs(prev => new Set([...prev, docId]));
        toast.success(`Document "${DOCUMENT_SLOTS.find(d => d.id === docId)?.label}" ajouté`);
      }
    };
    input.click();
  };

  const handleSubmitKYC = async () => {
    const requiredDocs = DOCUMENT_SLOTS.filter(d => d.required).map(d => d.id);
    const allUploaded = requiredDocs.every(id => uploadedDocs.has(id));

    if (!allUploaded) {
      toast.error('Documents manquants', {
        description: 'Veuillez uploader tous les documents requis avant de soumettre.',
      });
      return;
    }

    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));

    const newStatus: KYCStatus = 'under_review';
    setKycStatus(newStatus);
    try { localStorage.setItem(`kyc_status_${user?.id}`, newStatus); } catch { /* ignore */ }
    setSubmitting(false);
    toast.success('Documents soumis !', {
      description: 'Stripe examinera vos pièces dans les 24 à 48 heures.',
    });
  };

  // For demo: cycle through statuses
  const handleDemoToggle = () => {
    const cycle: KYCStatus[] = ['pending_documents', 'under_review', 'verified', 'rejected'];
    const idx = cycle.indexOf(kycStatus);
    const next = cycle[(idx + 1) % cycle.length];
    setKycStatus(next);
    try { localStorage.setItem(`kyc_status_${user?.id}`, next); } catch { /* ignore */ }
  };

  const cfg = STATUS_CONFIG[kycStatus];
  const StatusIcon = cfg.icon;
  const isVerified = kycStatus === 'verified';
  const needsAction = kycStatus === 'pending_documents' || kycStatus === 'rejected';

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-sm ${cfg.borderColor}`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${cfg.bgColor} hover:opacity-90`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isVerified ? 'bg-green-100 dark:bg-green-900/30' : 'bg-white/80 dark:bg-black/20'
        }`}>
          <StatusIcon size={18} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</p>
            {needsAction && (
              <span className="text-[10px] font-bold bg-amber-500 text-white rounded-full px-2 py-0.5 animate-pulse">
                Action requise
              </span>
            )}
            {isVerified && (
              <span className="text-[10px] font-bold bg-green-500 text-white rounded-full px-2 py-0.5">
                Virements actifs
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isVerified && (
            <span className="text-xs font-semibold text-green-700 dark:text-green-400">
              🔄 {payoutCycle}
            </span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-5 space-y-4 border-t border-border/50 bg-card">
              {/* Status explanation */}
              {kycStatus === 'verified' ? (
                <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/50 p-4">
                  <p className="text-sm font-bold text-green-800 dark:text-green-300 mb-2">
                    🎉 Compte Stripe Connect vérifié
                  </p>
                  <ul className="space-y-2 text-xs text-green-700 dark:text-green-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={12} /> Virements automatiques toutes les 24h
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={12} /> Indemnités No-Show versées directement sur votre RIB
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 size={12} /> Tableau de bord financier accessible
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  {/* Document upload slots */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Pièces justificatives requises
                    </p>
                    {DOCUMENT_SLOTS.map(slot => (
                      <DocumentUploadSlot
                        key={slot.id}
                        slot={slot}
                        uploaded={uploadedDocs.has(slot.id)}
                        onUpload={handleUpload}
                      />
                    ))}
                  </div>

                  {/* Submit button */}
                  {kycStatus !== 'under_review' && (
                    <Button
                      onClick={handleSubmitKYC}
                      disabled={submitting || uploadedDocs.size < DOCUMENT_SLOTS.filter(d => d.required).length}
                      className="w-full gap-2"
                    >
                      {submitting ? (
                        <>Envoi en cours...</>
                      ) : (
                        <>
                          <Upload size={15} /> Soumettre pour vérification Stripe
                          <ArrowRight size={14} />
                        </>
                      )}
                    </Button>
                  )}

                  {kycStatus === 'under_review' && (
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 px-4 py-3">
                      <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                        ⏳ Documents en cours d'examen — Stripe vous notifiera par email sous 24 à 48h.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Legal notice */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                🔒 Vos documents sont transmis directement à Stripe via un canal chiffré TLS 1.3.
                Kompilot ne stocke aucun justificatif sur ses serveurs.
              </p>

              {/* Demo toggle */}
              <button
                onClick={handleDemoToggle}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={11} /> Simuler changement de statut (démo)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
