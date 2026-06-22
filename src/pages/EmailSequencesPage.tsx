/**
 * EmailSequencesPage — Build automated email sequences
 * Create sequences with steps, configure triggers, enroll contacts, process sends.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Plus, Trash2, Play, Users, ChevronRight, Loader2,
  Clock, RefreshCw, CheckCircle2, AlertTriangle, Zap,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { apiFetch } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { SequenceEditor } from '../components/emailing/SequenceEditor';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EmailSequence {
  id: string;
  name: string;
  triggerType: string;
  status: string;
  fromEmail: string;
  fromName: string;
  sendgridKey: string;
  totalEnrolled: number;
  totalSent: number;
  createdAt: string;
}

// ── Trigger label ──────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, { label: string; emoji: string }> = {
  signup: { label: 'Inscription', emoji: '👋' },
  date: { label: 'Date spécifique', emoji: '📅' },
  manual: { label: 'Manuel', emoji: '▶️' },
  purchase: { label: 'Après achat', emoji: '🛒' },
  inactivity: { label: 'Ré-engagement', emoji: '😴' },
};

function TriggerBadge({ type }: { type: string }) {
  const meta = TRIGGER_LABELS[type] ?? { label: type, emoji: '⚡' };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
      {meta.emoji} {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/40'}`} />
      {active ? 'Active' : 'Pause'}
    </span>
  );
}

// ── Sequence card ──────────────────────────────────────────────────────────────

function SequenceCard({
  seq, onSelect, onDelete, onProcess, processing,
}: {
  seq: EmailSequence;
  onSelect: () => void;
  onDelete: () => void;
  onProcess: () => void;
  processing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h3 className="font-bold text-sm text-foreground truncate">{seq.name}</h3>
            <StatusBadge status={seq.status} />
            <TriggerBadge type={seq.triggerType} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            De : {seq.fromName ? `${seq.fromName} <${seq.fromEmail}>` : seq.fromEmail}
          </p>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={11} /> {seq.totalEnrolled} inscrit{seq.totalEnrolled !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail size={11} /> {seq.totalSent} envoyé{seq.totalSent !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onProcess}
            disabled={processing || seq.status !== 'active'}
            title="Traiter les envois en attente"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
          >
            {processing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
          </button>
          <button
            onClick={onSelect}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight size={13} />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function EmailSequencesPage() {
  const { user } = useAuth();
  const token = (user as any)?.access_token ?? (user as any)?.token ?? '';

  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadSequences = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/sequences', { method: 'GET', token });
      setSequences((res as any).sequences ?? res ?? []);
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadSequences(); }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette séquence et toutes ses étapes ?')) return;
    try {
      await apiFetch(`/api/sequences/${id}`, { method: 'DELETE', token });
      setSequences(prev => prev.filter(s => s.id !== id));
      toast.success('Séquence supprimée');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur de suppression');
    }
  }, [token]);

  const handleProcess = useCallback(async (id: string) => {
    setProcessingId(id);
    try {
      const res = await apiFetch<{ sent: number; errors: string[] }>('/api/sequences/process', {
        method: 'POST', token,
      });
      const r = res as any;
      if (r.sent > 0) toast.success(`${r.sent} email${r.sent > 1 ? 's' : ''} envoyé${r.sent > 1 ? 's' : ''} !`);
      else toast.success('Aucun envoi en attente');
      if (r.errors?.length) toast.error(`${r.errors.length} erreur(s) : ${r.errors[0]}`);
      await loadSequences();
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur de traitement');
    } finally {
      setProcessingId(null);
    }
  }, [token, loadSequences]);

  // Editor open
  if (creating || selectedId !== null) {
    return (
      <SequenceEditor
        sequenceId={selectedId}
        token={token}
        onBack={() => { setSelectedId(null); setCreating(false); loadSequences(); }}
        onDeleted={() => { setSelectedId(null); setCreating(false); loadSequences(); }}
      />
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Zap size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">Séquences Email</h1>
              <p className="text-sm text-muted-foreground">Automatisez vos emails de bienvenue, relances et suivis</p>
            </div>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="sm:ml-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all shrink-0"
          >
            <Plus size={15} /> Nouvelle séquence
          </button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary/5 border border-primary/20">
          <Clock size={14} className="text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Comment ça marche :</strong> Créez une séquence avec des étapes espacées dans le temps.
            Inscrivez vos contacts, puis cliquez <strong className="text-foreground">▶ Traiter</strong> pour envoyer les emails du moment.
            Les emails à venir seront envoyés lors de vos prochaines sessions.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : sequences.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">📧</div>
            <h3 className="font-bold text-lg text-foreground">Aucune séquence</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Créez votre première séquence — email de bienvenue, relance à J+3, rappel à J+7...
            </p>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
            >
              <Plus size={15} /> Créer une séquence
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{sequences.length} séquence{sequences.length > 1 ? 's' : ''}</p>
              <button
                onClick={loadSequences}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
              >
                <RefreshCw size={11} /> Actualiser
              </button>
            </div>
            {sequences.map(seq => (
              <SequenceCard
                key={seq.id}
                seq={seq}
                onSelect={() => setSelectedId(seq.id)}
                onDelete={() => handleDelete(seq.id)}
                onProcess={() => handleProcess(seq.id)}
                processing={processingId === seq.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
