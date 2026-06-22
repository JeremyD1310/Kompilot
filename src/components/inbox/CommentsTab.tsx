import { useState } from 'react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { MessageCircle, ThumbsUp, Reply, Sparkles, CheckCircle } from 'lucide-react';
import { generateQuickReply } from '../../lib/aiRouterClient';

interface Comment {
  id: string;
  platform: 'facebook' | 'instagram';
  authorName: string;
  authorHandle: string;
  avatar: string;
  postTitle: string;
  content: string;
  likes: number;
  time: string;
  replied: boolean;
  aiReply?: string;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 'c1',
    platform: 'facebook',
    authorName: 'Sophie Marchand',
    authorHandle: 'Sophie Marchand',
    avatar: 'SM',
    postTitle: 'Notre nouveau plat du jour — Tajine d\'agneau',
    content: 'Bonjour, est-ce que ce plat est disponible en option végétarienne ? Mercii 🌿',
    likes: 3,
    time: 'Il y a 45 min',
    replied: false,
    aiReply: 'Bonjour ! Oui tout à fait, nous adaptons cette recette avec une alternative végétale. Au plaisir de vous accueillir ! 🌿',
  },
  {
    id: 'c2',
    platform: 'instagram',
    authorName: 'julien.chef',
    authorHandle: '@julien.chef',
    avatar: 'JC',
    postTitle: 'Nouvelle carte de printemps 🌸',
    content: 'Magnifique présentation ! C\'est possible de réserver pour 6 personnes ce samedi soir ?',
    likes: 8,
    time: 'Il y a 2h',
    replied: false,
    aiReply: 'Bonjour Julien ! Merci pour votre enthousiasme 😊 Oui, nous pouvons vous accueillir à 6 ce samedi soir. Appelez-nous au 01 XX XX XX XX ou réservez directement via notre site. À très bientôt ! 🌸',
  },
  {
    id: 'c3',
    platform: 'instagram',
    authorName: 'marie_lbd',
    authorHandle: '@marie_lbd',
    avatar: 'ML',
    postTitle: 'Notre nouveau plat du jour — Tajine d\'agneau',
    content: 'Je suis venue hier soir, le service était absolument parfait !! ❤️❤️',
    likes: 22,
    time: 'Il y a 5h',
    replied: true,
    aiReply: 'Merci infiniment Marie, votre retour nous touche vraiment ! Nous serons ravis de vous retrouver bientôt ❤️',
  },
  {
    id: 'c4',
    platform: 'facebook',
    authorName: 'Thomas Legrand',
    authorHandle: 'Thomas Legrand',
    avatar: 'TL',
    postTitle: 'Offre spéciale Weekend — -20% sur tous les desserts',
    content: 'La promotion est valable pour les commandes à emporter aussi ?',
    likes: 1,
    time: 'Il y a 1h',
    replied: false,
    aiReply: 'Bonjour Thomas ! Absolument, la promotion -20% est valable aussi bien en salle qu\'à emporter ce weekend. N\'hésitez pas si vous avez d\'autres questions ! 😊',
  },
];

function PlatformBadge({ platform }: { platform: 'facebook' | 'instagram' }) {
  if (platform === 'facebook') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        Facebook
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-pink-600 bg-pink-50 border border-pink-200 rounded-full px-2 py-0.5">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
      Instagram
    </span>
  );
}

function CommentCard({ comment, onMagicReply }: { comment: Comment; onMagicReply: (id: string) => void }) {
  const [showReply, setShowReply] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replied, setReplied] = useState(comment.replied);
  const [aiGenerated, setAiGenerated] = useState(false);

  const handleMagicReply = async () => {
    setAiLoading(true);
    setShowReply(true);
    try {
      const prompt = `Rédige une réponse chaleureuse, courte (2-3 phrases max) et professionnelle à ce commentaire ${comment.platform === 'facebook' ? 'Facebook' : 'Instagram'} :\n\n"${comment.content}"\n\nContexte du post : "${comment.postTitle}"\nAuteur : ${comment.authorName}\n\nRéponds directement sans guillemets ni préambule. Utilise un émoji pertinent.`;
      const res = await generateQuickReply(prompt, {
        platform: comment.platform,
        authorName: comment.authorName,
        postTitle: comment.postTitle,
      });
      setReplyText(res.content.trim());
      setAiGenerated(true);
    } catch {
      // Fallback to static suggestion if AI is unavailable
      if (comment.aiReply) {
        setReplyText(comment.aiReply);
        setAiGenerated(true);
      }
      toast.error('IA momentanément indisponible — suggestion de secours utilisée.');
    } finally {
      setAiLoading(false);
      onMagicReply(comment.id);
    }
  };

  const handleSendReply = () => {
    setReplied(true);
    setShowReply(false);
    toast.success('Réponse publiée !', { description: `Votre réponse a été publiée sur ${comment.platform === 'facebook' ? 'Facebook' : 'Instagram'}.` });
  };

  return (
    <div className={`bg-card border border-border rounded-2xl p-4 space-y-3 transition-all duration-200 ${replied ? 'opacity-70' : 'hover:shadow-sm'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {comment.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
              <PlatformBadge platform={comment.platform} />
              {replied && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                  <CheckCircle size={8} /> Répondu
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Sous : <span className="font-medium text-foreground/70 italic">« {comment.postTitle} »</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0">{comment.time}</span>
      </div>

      {/* Comment content */}
      <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-sm text-foreground leading-relaxed border-l-4 border-primary/30">
        {comment.content}
      </div>

      {/* Stats + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ThumbsUp size={12} className="text-primary/60" />
          <span>{comment.likes} j'aime</span>
        </div>
        {!replied && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReply(v => !v)}
              className="h-7 text-xs gap-1.5"
            >
              <Reply size={12} /> Répondre manuellement
            </Button>
            <Button
              size="sm"
              onClick={handleMagicReply}
              disabled={aiLoading}
              className="h-7 text-xs gap-1.5 bg-gradient-to-r from-primary to-teal-400 hover:opacity-90 border-0"
            >
              <Sparkles size={12} className={aiLoading ? 'animate-spin' : ''} />
              {aiLoading ? 'IA rédige...' : '✨ Réponse magique par IA'}
            </Button>
          </div>
        )}
      </div>

      {/* Reply panel */}
      {showReply && (
        <div className="space-y-2 border-t border-border pt-3">
          {aiGenerated && (
            <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-1">
              <Sparkles size={11} />
              Réponse générée par l'IA — vous pouvez la modifier
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
            <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim()} className="h-8 text-xs gap-1.5">
              <Reply size={12} /> Publier la réponse
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommentsTab() {
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');

  const filtered = comments.filter(c => {
    if (filter === 'pending') return !c.replied;
    if (filter === 'replied') return c.replied;
    return true;
  });

  const pendingCount = comments.filter(c => !c.replied).length;

  const handleMagicReply = (id: string) => {
    // Mark as having AI suggestion pending — keep in list
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Commentaires Facebook & Instagram</h3>
          {pendingCount > 0 && (
            <Badge variant="default" className="rounded-full text-[10px] h-5 px-2">
              {pendingCount} en attente
            </Badge>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-full p-0.5">
          {(['all', 'pending', 'replied'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${
                filter === f ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'pending' ? 'À répondre' : 'Répondus'}
            </button>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gradient-to-r from-blue-50 to-pink-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <Sparkles size={16} className="text-primary shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Réponse magique IA :</span>{' '}
          En un clic, notre IA rédige une réponse chaleureuse et personnalisée adaptée à chaque commentaire.
        </p>
      </div>

      {/* Comments list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <MessageCircle size={36} className="opacity-20" />
            <p className="text-sm">Aucun commentaire dans cette catégorie</p>
          </div>
        ) : (
          filtered.map(comment => (
            <CommentCard key={comment.id} comment={comment} onMagicReply={handleMagicReply} />
          ))
        )}
      </div>
    </div>
  );
}
