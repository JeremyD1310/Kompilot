import { useState, useRef, useEffect } from 'react';
import { Check, X, Trash2, Pencil, Clock, CalendarDays, Tag, UploadCloud } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import type { ScheduledPost, PostStatus } from './CreatePostModal';
import { MetaCampaignExportPanel } from './MetaCampaignExportPanel';

// ── Channel config ─────────────────────────────────────────────────────────
const CHANNELS = [
  { id: 'linkedin',        label: 'LinkedIn',  color: 'bg-blue-600' },
  { id: 'instagram',       label: 'Instagram', color: 'bg-pink-500' },
  { id: 'facebook',        label: 'Facebook',  color: 'bg-blue-500' },
  { id: 'google_business', label: 'Google',    color: 'bg-orange-500' },
  { id: 'website',         label: 'Blog',      color: 'bg-teal-600' },
  { id: 'tiktok',          label: 'TikTok',    color: 'bg-foreground' },
];

const STATUS_OPTIONS: { value: PostStatus; label: string; classes: string }[] = [
  { value: 'draft',    label: 'Brouillon', classes: 'bg-muted text-muted-foreground border-border' },
  { value: 'pending',  label: 'En attente', classes: 'bg-orange-50 text-orange-700 border-orange-300' },
  { value: 'approved', label: 'Approuvé',  classes: 'bg-green-50 text-green-700 border-green-300' },
];

interface InlinePostEditorProps {
  post: ScheduledPost;
  anchorRef: React.RefObject<HTMLElement | null>;
  onSave: (updated: ScheduledPost) => void;
  onDelete: (postId: string) => void;
  onClose: () => void;
  onOpenFull: (post: ScheduledPost) => void;
}

export function InlinePostEditor({
  post,
  anchorRef,
  onSave,
  onDelete,
  onClose,
  onOpenFull,
}: InlinePostEditorProps) {
  const [text, setText] = useState(post.text);
  const [time, setTime] = useState(post.time);
  const [channels, setChannels] = useState<string[]>(post.channels);
  const [status, setStatus] = useState<PostStatus>(post.status);
  const [isDirty, setIsDirty] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position the popover relative to the anchor element
  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popoverW = 320;
    const margin = 6;

    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + margin;

    // Ensure it doesn't overflow right edge
    if (left + popoverW > window.innerWidth - 12) {
      left = window.innerWidth - popoverW - 12;
    }
    // Ensure it doesn't overflow bottom
    const estimatedH = 360;
    if (top + estimatedH > window.scrollY + window.innerHeight - 12) {
      top = rect.top + window.scrollY - estimatedH - margin;
    }

    setPosition({ top: Math.max(8, top), left: Math.max(8, left) });
  }, [anchorRef]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        if (isDirty) {
          handleSave();
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isDirty, text, time, channels, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = () => {
    if (!text.trim()) {
      toast.error('Le texte ne peut pas être vide.');
      return;
    }
    onSave({ ...post, text: text.trim(), time, channels, status });
    onClose();
  };

  const toggleChannel = (ch: string) => {
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    );
    setIsDirty(true);
  };

  return (
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: 320,
        zIndex: 9999,
      }}
      className="bg-card border border-border rounded-2xl shadow-2xl shadow-black/15 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Pencil size={12} className="text-primary" />
          Modifier le post
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenFull(post)}
            className="text-[10px] font-medium text-primary hover:underline px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors"
          >
            Modifier en détail
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Text editor */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
            Texte du post
          </label>
          <textarea
            autoFocus
            value={text}
            onChange={e => { setText(e.target.value); setIsDirty(true); }}
            className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground leading-relaxed"
            rows={4}
            maxLength={500}
            placeholder="Texte de votre publication..."
          />
          <div className="text-right text-[10px] text-muted-foreground mt-0.5">{text.length}/500</div>
        </div>

        {/* Time + Status row */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
              <Clock size={9} /> Heure
            </label>
            <input
              type="time"
              value={time}
              onChange={e => { setTime(e.target.value); setIsDirty(true); }}
              className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
              <Tag size={9} /> Statut
            </label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value as PostStatus); setIsDirty(true); }}
              className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Channels */}
        <div>
          <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
            <CalendarDays size={9} /> Canaux
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CHANNELS.map(ch => {
              const active = channels.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-all ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/50 text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ch.color}`} />
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bouton Exporter sur Meta ────────────────────────────────────── */}
      {/* Visible uniquement si le post est sur facebook ou instagram */}
      {(post.channels.includes('facebook') || post.channels.includes('instagram')) && (
        <div className="px-3 pb-2">
          <MetaCampaignExportPanel
            post={{ id: post.id, text: post.text, date: post.date, channels: post.channels }}
            trigger={
              <button className="w-full flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 bg-blue-50/60 hover:bg-blue-50 rounded-lg px-3 py-1.5 transition-all">
                <UploadCloud size={12} /> Exporter sur Meta Ads
              </button>
            }
          />
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-border bg-muted/20">
        <button
          onClick={() => {
            if (window.confirm('Supprimer cette publication ?')) {
              onDelete(post.id);
              onClose();
            }
          }}
          className="flex items-center gap-1 text-[11px] font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 px-2 py-1.5 rounded-lg transition-colors"
        >
          <Trash2 size={12} /> Supprimer
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all ${
              isDirty
                ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                : 'bg-muted text-muted-foreground cursor-default'
            }`}
          >
            <Check size={12} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
