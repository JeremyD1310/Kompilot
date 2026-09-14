/**
 * SocialDMsTab — Messages directs des réseaux sociaux natifs (Instagram / Facebook / TikTok)
 * avec réponse IA personnalisable (ton, objectif, langue).
 */
import { useState } from 'react';
import { useInboxMessages } from '../../hooks/useInboxMessages';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { MessageSquare, Sparkles, Send, Reply, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { generateQuickReply } from '../../lib/aiRouterClient';
import { blink } from '../../blink/client';
import { BACKEND_URL } from '../../lib/backend';
import { useDemoMode } from '../../context/DemoModeContext';
import { useSendTiktokMessage } from '../../hooks/useSocialPublish';
import { QuickReplyTemplates } from './QuickReplyTemplates';

type SocialPlatform = 'instagram' | 'facebook' | 'tiktok';

interface SocialDM {
  id: string;
  remoteId?: string;
  platform: SocialPlatform;
  authorName: string;
  authorHandle: string;
  avatar: string;
  content: string;
  time: string;
  isRead: boolean;
  replied: boolean;
}

const MOCK_DMS: SocialDM[] = [
  {
    id: 'dm1',
    platform: 'instagram',
    authorName: 'laure_makeup',
    authorHandle: '@laure_makeup',
    avatar: 'LM',
    content: 'Bonjour ! Je voudrais savoir si vous proposez des sessions pour les petits business. J\'ai une marque de cosmétiques et j\'adore votre style ! 💄',
    time: 'Il y a 12 min',
    isRead: false,
    replied: false,
  },
  {
    id: 'dm2',
    platform: 'facebook',
    authorName: 'Pierre-Henri Dupont',
    authorHandle: 'Pierre-Henri Dupont',
    avatar: 'PD',
    content: 'Bonsoir, je suis intéressé par votre offre du mois. Est-ce que la réduction s\'applique aussi aux commandes en gros ? Merci d\'avance.',
    time: 'Il y a 35 min',
    isRead: false,
    replied: false,
  },
  {
    id: 'dm3',
    platform: 'instagram',
    authorName: 'resto_benoit',
    authorHandle: '@resto_benoit',
    avatar: 'RB',
    content: 'Super contenu ! On serait intéressés par un partenariat 🙌 Vous pouvez nous DM pour en discuter ?',
    time: 'Il y a 1h',
    isRead: true,
    replied: false,
  },
  {
    id: 'dm5',
    platform: 'facebook',
    authorName: 'Amandine Torres',
    authorHandle: 'Amandine Torres',
    avatar: 'AT',
    content: 'Merci pour votre réponse rapide hier 😊 Pouvez-vous me préciser les horaires d\'ouverture du samedi ?',
    time: 'Il y a 3h',
    isRead: true,
    replied: false,
  },
];

// ── Platform badge ─────────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: SocialPlatform }) {
  if (platform === 'instagram') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-pink-600 bg-pink-50 border border-pink-200 rounded-full px-2 py-0.5">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
        Instagram
      </span>
    );
  }
  if (platform === 'facebook') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
        Facebook
      </span>
    );
  }
  return <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-full px-2 py-0.5">♪ TikTok</span>;
}

// ── DM Card ──────────────────────────────────────────────────────────────────

function DMCard({ dm, onReply, onSend }: { dm: SocialDM; onReply: (id: string) => void; onSend?: (dm: SocialDM, text: string) => Promise<void> }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [replied, setReplied] = useState(dm.replied);
  const [tone, setTone] = useState('chaleureux');
  const [goal, setGoal] = useState('répondre et convertir');
  const [language, setLanguage] = useState('français');
  const [showControls, setShowControls] = useState(false);

  const handleAIReply = async () => {
    setAiLoading(true);
    setShowReply(true);
    try {
      const platformName = dm.platform === 'instagram' ? 'Instagram' : dm.platform === 'facebook' ? 'Facebook' : 'TikTok';
      const prompt = `Rédige une réponse en ${language}, courte (2-3 phrases max), avec un ton ${tone}, pour atteindre l'objectif "${goal}" à ce message privé ${platformName} :\n\n"${dm.content}"\n\nAuteur : ${dm.authorName}\n\nRéponds directement sans guillemets ni préambule. Utilise un émoji si pertinent.`;
      const res = await generateQuickReply(prompt, { platform: dm.platform, authorName: dm.authorName });
      setReplyText(res.content.trim());
      setAiGenerated(true);
    } catch {
      setReplyText(`Bonjour ${dm.authorName.split(' ')[0]} ! Merci pour votre message. Nous revenons vers vous très rapidement. À bientôt !`);
      setAiGenerated(true);
      toast.error('IA momentanément indisponible — réponse de secours utilisée.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      if (onSend) await onSend(dm, replyText);
      setReplied(true);
      setShowReply(false);
      onReply(dm.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible d’envoyer la réponse.');
      return;
    }
    const platformName = dm.platform === 'instagram' ? 'Instagram' : dm.platform === 'facebook' ? 'Facebook' : dm.platform === 'tiktok' ? 'TikTok' : 'LinkedIn';
    toast.success('Réponse envoyée !', {
      description: `Message publié sur ${platformName}`,
    });
  };

  return (
    <div className={`bg-card border rounded-2xl p-4 space-y-3 transition-all duration-200 ${
      replied
        ? 'opacity-60 border-border'
        : !dm.isRead
          ? 'border-l-4 border-l-primary border-border hover:shadow-sm'
          : 'border-border hover:shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary">
              {dm.avatar}
            </div>
            {!dm.isRead && !replied && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{dm.authorName}</span>
              <PlatformBadge platform={dm.platform} />
              {replied && (
                <span className="text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  ✓ Répondu
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{dm.authorHandle}</p>
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">{dm.time}</span>
      </div>

      {/* Message content */}
      <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-sm text-foreground leading-relaxed border-l-4 border-primary/30">
        {dm.content}
      </div>

      {/* Actions */}
      {!replied && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowControls(v => !v)}
            className="flex items-center gap-1 h-7 rounded-md border border-border px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <SlidersHorizontal size={11} /> Réglages IA
          </button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowReply(v => !v)} className="h-7 text-xs gap-1.5">
              <Reply size={12} /> Répondre
            </Button>
            <Button
              size="sm"
              onClick={handleAIReply}
              disabled={aiLoading}
              className="h-7 text-xs gap-1.5 bg-gradient-to-r from-primary to-teal-400 hover:opacity-90 border-0"
            >
              {aiLoading
                ? <RefreshCw size={12} className="animate-spin" />
                : <Sparkles size={12} />}
              {aiLoading ? 'IA rédige...' : '✨ Réponse IA'}
            </Button>
          </div>
        </div>
      )}

      {/* AI Settings */}
      {showControls && !replied && (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-primary/15 bg-muted/20 p-3 sm:grid-cols-3">
          <label className="text-[10px] font-semibold text-muted-foreground">Ton
            <select value={tone} onChange={e => setTone(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              <option>chaleureux</option><option>professionnel</option><option>direct</option><option>empathique</option><option>humoristique</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold text-muted-foreground">Objectif
            <select value={goal} onChange={e => setGoal(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              <option>répondre et convertir</option><option>rassurer</option><option>obtenir un rendez-vous</option><option>fidéliser</option><option>qualifier le prospect</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold text-muted-foreground">Langue
            <select value={language} onChange={e => setLanguage(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground">
              <option>français</option><option>anglais</option><option>espagnol</option><option>allemand</option><option>italien</option>
            </select>
          </label>
        </div>
      )}

      {/* Reply panel */}
      {showReply && !replied && (
        <div className="space-y-2 border-t border-border pt-3">
          <QuickReplyTemplates onSelect={setReplyText} />
          {aiGenerated && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1">
              <Sparkles size={11} />
              Réponse générée par l'IA — modifiable avant envoi
            </div>
          )}
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Votre réponse..."
            rows={3}
            className="w-full text-sm border border-border rounded-xl px-3 py-2 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowReply(false)} className="h-8 text-xs">
              Annuler
            </Button>
            <Button size="sm" onClick={handleSend} disabled={!replyText.trim()} className="h-8 text-xs gap-1.5">
              <Send size={12} /> Envoyer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SocialDMsTab() {
  const { isDemoActive } = useDemoMode();
  const { messages: inboxMessages, refresh: refreshInbox } = useInboxMessages();
  const sendTiktok = useSendTiktokMessage();
  const [dms, setDms] = useState<SocialDM[]>(MOCK_DMS);
  const [platformFilter, setPlatformFilter] = useState<SocialPlatform | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const persistedDms: SocialDM[] = inboxMessages
    .filter(message => ['instagram', 'facebook', 'tiktok'].includes(message.channel))
    .map(message => ({
      id: message.id,
      remoteId: message.senderHandle,
      platform: message.channel as SocialPlatform,
      authorName: message.senderName,
      authorHandle: message.senderHandle ?? '',
      avatar: message.senderName.slice(0, 2).toUpperCase(),
      content: message.body || message.preview,
      time: message.date,
      isRead: message.isRead,
      replied: message.replies.length > 0,
    }));
  // TikTok rows are normalized into the same `messages` collection by the backend;
  // the demo-only cards remain local and are never mixed into production data.
  const displayedDms = [...persistedDms, ...(isDemoActive ? dms : [])].filter((dm, index, list) => list.findIndex(candidate => candidate.id === dm.id) === index);
  const filtered = displayedDms.filter(dm => {
    if (platformFilter !== 'all' && dm.platform !== platformFilter) return false;
    if (showUnreadOnly && (dm.isRead || dm.replied)) return false;
    return true;
  });

  const unreadCount = displayedDms.filter(d => !d.isRead && !d.replied).length;
  const pendingCount = displayedDms.filter(d => !d.replied).length;

  const handleReply = (id: string) => {
    setDms(prev => prev.map(d => d.id === id ? { ...d, replied: true, isRead: true } : d));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Messages directs — Réseaux sociaux</h3>
          {unreadCount > 0 && (
            <Badge variant="default" className="rounded-full text-[10px] h-5 px-2">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <button
          onClick={() => setShowUnreadOnly(v => !v)}
          className={`text-[11px] font-medium px-3 py-1 rounded-full border transition-colors ${
            showUnreadOnly
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          {showUnreadOnly ? '✓ Non lus seulement' : 'Non lus seulement'}
        </button>
      </div>

      <div className="flex justify-end"><button onClick={() => refreshInbox()} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"><RefreshCw size={12} /> Actualiser les messages</button></div>

      {/* Platform filter */}
      <div className="flex items-center gap-1 bg-muted rounded-full p-0.5 w-fit overflow-x-auto">
        {(['all', 'instagram', 'facebook', 'tiktok'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
              platformFilter === p
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p === 'all' ? 'Tous' : p === 'instagram' ? '📸 Instagram' : p === 'facebook' ? '👥 Facebook' : '♪ TikTok'}
          </button>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-primary/5 to-teal-500/5 border border-primary/15 rounded-xl px-4 py-3 flex items-center gap-3">
        <Sparkles size={16} className="text-primary shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">IA disponible :</span>{' '}
          Générez des réponses personnalisées à tous vos DMs en un clic.{' '}
          {pendingCount > 0 && <span className="text-primary font-medium">{pendingCount} message{pendingCount > 1 ? 's' : ''} en attente.</span>}
        </p>
      </div>

      {/* DMs list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <MessageSquare size={36} className="opacity-20" />
            <p className="text-sm">Aucun message dans cette catégorie</p>
          </div>
        ) : (
          filtered.map(dm => <DMCard key={dm.id} dm={dm} onReply={handleReply} onSend={async (message, text) => {
            if (message.platform === 'tiktok') {
              await sendTiktok.mutateAsync({ messageId: message.id, toOpenId: message.remoteId ?? message.id.replace('tiktok-', ''), messageText: text });
              return;
            }
            const current = inboxMessages.find(item => item.id === message.id);
            if (!current) throw new Error('Ce message social doit être synchronisé avant de pouvoir recevoir une réponse.');
            const token = await blink.auth.getValidToken();
            const response = await fetch(`${BACKEND_URL}/api/inbox/reply`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ messageId: message.id, text, channel: message.platform, senderHandle: message.remoteId }),
            });
            const body = await response.json().catch(() => ({})) as { error?: string };
            if (!response.ok) throw new Error(body.error || 'Impossible d’envoyer la réponse sociale.');
            refreshInbox();
          }} />)
        )}
      </div>
    </div>
  );
}
