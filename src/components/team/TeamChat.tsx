import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, SmilePlus, MessageSquare } from 'lucide-react';
import { Button, EmptyState } from '@blinkdotnew/ui';
import { cn } from '@/lib/utils';
import { useTeamMessages, type TeamMessage } from '../../hooks/useTeamMessages';
import { useAuth } from '../../hooks/useAuth';

const QUICK_EMOJIS = ['👍', '❤️', '🎉', '✅', '🚀', '👀'];

function getInitials(name: string) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'; }
function timeLabel(dateStr: string) { const d = new Date(dateStr); const now = new Date(); const isToday = d.toDateString() === now.toDateString(); if (isToday) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

function AvatarBubble({ name, avatarUrl, size = 'sm' }: { name: string; avatarUrl?: string; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  if (avatarUrl) return <img src={avatarUrl} alt={name} className={cn('rounded-full object-cover shrink-0', dim)} />;
  return <div className={cn('rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0', dim)}>{getInitials(name)}</div>;
}

function ReactionBar({ message, onReact, currentUserId }: { message: TeamMessage; onReact: (emoji: string) => void; currentUserId: string }) {
  const entries = Object.entries(message.reactions).filter(([, users]) => users.length > 0);
  if (!entries.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {entries.map(([emoji, users]) => (
        <button key={emoji} onClick={() => onReact(emoji)} className={cn('flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border transition-colors', users.includes(currentUserId) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted')}>
          <span>{emoji}</span><span className="font-semibold">{users.length}</span>
        </button>
      ))}
    </div>
  );
}

function MessageBubble({ message, isOwn, onReact, onDelete, currentUserId }: { message: TeamMessage; isOwn: boolean; onReact: (emoji: string) => void; onDelete: () => void; currentUserId: string }) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  if (message.messageType === 'system') return <div className="flex justify-center py-1"><span className="text-[11px] text-muted-foreground bg-muted/40 px-3 py-0.5 rounded-full">{message.content}</span></div>;
  return (
    <div className={cn('flex gap-2 group', isOwn ? 'flex-row-reverse' : 'flex-row')} onMouseEnter={() => setShowActions(true)} onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}>
      {!isOwn && <AvatarBubble name={message.senderName} avatarUrl={message.senderAvatar} />}
      <div className={cn('flex flex-col max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && <span className="text-[11px] font-semibold text-muted-foreground mb-0.5 ml-1">{message.senderName}</span>}
        <div className={cn('px-3 py-2 rounded-2xl text-sm leading-relaxed break-words', isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted/60 text-foreground rounded-bl-sm border border-border/50')}>{message.content}</div>
        <ReactionBar message={message} onReact={onReact} currentUserId={currentUserId} />
        <span className="text-[10px] text-muted-foreground mt-0.5 px-1">{timeLabel(message.createdAt)}</span>
      </div>
      {showActions && (
        <div className={cn('flex items-center gap-0.5 self-center', isOwn ? 'flex-row' : 'flex-row-reverse')}>
          <div className="relative">
            <button onClick={() => setShowEmojiPicker(v => !v)} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><SmilePlus size={13} /></button>
            {showEmojiPicker && (
              <div className={cn('absolute top-full mt-1 z-20 flex gap-1 bg-popover border border-border rounded-xl p-1.5 shadow-lg', isOwn ? 'right-0' : 'left-0')}>
                {QUICK_EMOJIS.map(emoji => <button key={emoji} onClick={() => { onReact(emoji); setShowEmojiPicker(false); }} className="text-base hover:scale-110 transition-transform p-0.5">{emoji}</button>)}
              </div>
            )}
          </div>
          {isOwn && <button onClick={onDelete} className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={13} /></button>}
        </div>
      )}
    </div>
  );
}

interface TeamChatProps { workspaceOwnerId: string; className?: string; }

export function TeamChat({ workspaceOwnerId, className }: TeamChatProps) {
  const { user } = useAuth();
  const { messages, isLoading, send, sending, addReaction, deleteMessage } = useTeamMessages(workspaceOwnerId);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);
  const handleSend = () => { if (!input.trim() || sending) return; send(input.trim()); setInput(''); inputRef.current?.focus(); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  return (
    <div className={cn('flex flex-col h-full min-h-0', className)}>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading && [1,2,3].map(i => <div key={i} className={cn('flex gap-2', i%2===0 && 'flex-row-reverse')}><div className="w-7 h-7 rounded-full bg-muted animate-pulse" /><div className={cn('h-10 rounded-2xl bg-muted animate-pulse', i%2===0 ? 'w-40' : 'w-52')} /></div>)}
        {!isLoading && messages.length === 0 && <div className="flex flex-col items-center justify-center h-full py-12"><EmptyState icon={<MessageSquare />} title="Aucun message pour l'instant" description="Commencez la conversation avec votre équipe !" /></div>}
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id} currentUserId={user?.id ?? ''} onReact={emoji => addReaction({ messageId: msg.id, emoji })} onDelete={() => deleteMessage(msg.id)} />)}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-end gap-2">
          <AvatarBubble name={user?.displayName ?? user?.email ?? 'Moi'} size="sm" />
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Message à l'équipe… (Entrée pour envoyer)" rows={1} className="flex-1 resize-none rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground min-h-[38px] max-h-28 overflow-y-auto" onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 112)}px`; }} />
          <Button size="sm" onClick={handleSend} disabled={!input.trim() || sending} className="shrink-0 h-9 w-9 p-0 rounded-xl"><Send size={15} /></Button>
        </div>
      </div>
    </div>
  );
}
