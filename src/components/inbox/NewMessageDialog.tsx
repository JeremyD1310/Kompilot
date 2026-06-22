import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, toast } from '@blinkdotnew/ui';
import { X, Send, Pencil, ChevronDown } from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import type { Channel } from './inboxData';

const CHANNELS: { id: Channel; label: string; emoji: string }[] = [
  { id: 'website', label: 'Site web', emoji: '🌐' },
  { id: 'instagram', label: 'Instagram', emoji: '📸' },
  { id: 'facebook', label: 'Facebook', emoji: '👥' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { id: 'google', label: 'Google', emoji: '📍' },
];

interface NewMessageDialogProps {
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
}

export function NewMessageDialog({ open, onClose, onSent }: NewMessageDialogProps) {
  const { user } = useAuth();
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<Channel>('website');
  const [sending, setSending] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);

  const selectedChannel = CHANNELS.find(c => c.id === channel)!;

  const handleSend = async () => {
    if (!senderName.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      await blink.db.messages.create({
        id: `msg_${Date.now()}`,
        userId: user?.id ?? 'demo',
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim() || `${senderName.toLowerCase().replace(/\s+/g, '.')}@client.fr`,
        subject: subject.trim(),
        body: body.trim(),
        isRead: false,
        channel,
        senderHandle: senderEmail.trim() || senderName.trim(),
        preview: body.trim().slice(0, 80),
      });
      toast.success('Message ajouté !', { description: 'Il apparaît maintenant dans votre boîte de réception.' });
      setSenderName('');
      setSenderEmail('');
      setSubject('');
      setBody('');
      setChannel('website');
      onSent?.();
      onClose();
    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi', { description: err?.message ?? 'Réessayez.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Pencil size={15} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-foreground">Nouveau message entrant</h2>
                    <p className="text-[11px] text-muted-foreground">Simuler la réception d'un message client</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                  <X size={15} className="text-muted-foreground" />
                </button>
              </div>

              {/* Form */}
              <div className="p-5 space-y-3">
                {/* Channel selector */}
                <div className="relative">
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Canal</label>
                  <button
                    type="button"
                    onClick={() => setShowChannelPicker(v => !v)}
                    className="w-full flex items-center justify-between gap-2 border border-border rounded-lg px-3 py-2 bg-background hover:border-primary/40 transition-colors text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span>{selectedChannel.emoji}</span>
                      <span className="font-medium">{selectedChannel.label}</span>
                    </span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </button>
                  {showChannelPicker && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                      {CHANNELS.map(ch => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => { setChannel(ch.id); setShowChannelPicker(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors text-left ${channel === ch.id ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'}`}
                        >
                          <span>{ch.emoji}</span>
                          <span>{ch.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sender info */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Nom de l'expéditeur *</label>
                    <input
                      value={senderName}
                      onChange={e => setSenderName(e.target.value)}
                      placeholder="Marie Dupont"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">Email / Handle</label>
                    <input
                      value={senderEmail}
                      onChange={e => setSenderEmail(e.target.value)}
                      placeholder="marie@email.fr"
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Sujet *</label>
                  <input
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Demande d'information sur vos services..."
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground mb-1">Message *</label>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Bonjour, je souhaiterais..."
                    rows={4}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20">
                <p className="text-[11px] text-muted-foreground">* Champs obligatoires</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={sending || !senderName.trim() || !subject.trim() || !body.trim()}
                    className="h-8 text-xs gap-2"
                  >
                    <Send size={12} />
                    {sending ? 'Ajout...' : 'Ajouter à l\'inbox'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
