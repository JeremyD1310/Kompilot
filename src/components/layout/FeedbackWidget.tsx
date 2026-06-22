import { useState } from 'react';
import { X, Star, Send, MessageSquarePlus, CheckCircle, ChevronRight } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

export function FeedbackWidget() {
  const { addFeedback } = useAdmin();
  const [open, setOpen]         = useState(false);
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [comment, setComment]   = useState('');
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  const canSend = rating > 0 || comment.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));

    addFeedback({
      id: `fb-${Date.now()}`,
      rating,
      comment: comment.trim(),
      date: new Date().toLocaleString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
      submittedAt: new Date().toISOString(),
    });

    setSending(false);
    setSent(true);
  };

  const handleClose = () => {
    setOpen(false);
    // Reset after close animation
    setTimeout(() => {
      setSent(false);
      setRating(0);
      setHovered(0);
      setComment('');
    }, 300);
  };

  const starLabel = ['', 'Mauvais 😕', 'Passable 😐', 'Bien 🙂', 'Très bien 😊', 'Excellent ! 🤩'];

  return (
    <>
      {/* ── Vertical tab trigger ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 rounded-l-xl px-2.5 py-4 shadow-lg transition-all duration-300 group ${
          open
            ? 'bg-primary text-primary-foreground translate-x-0'
            : 'bg-card border border-border text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary translate-x-0'
        }`}
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        aria-label="Donner mon avis"
      >
        <span className="text-xs font-bold tracking-wide" style={{ transform: 'rotate(180deg)' }}>
          💡 Votre avis
        </span>
      </button>

      {/* ── Slide-in panel ── */}
      <div
        className={`fixed right-0 top-0 h-full z-50 flex items-center justify-end transition-all duration-300 ease-in-out ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        {open && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            onClick={handleClose}
          />
        )}

        {/* Panel */}
        <div
          className={`relative z-50 w-80 h-full bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquarePlus size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Votre avis</p>
                <p className="text-[11px] text-muted-foreground">Phase de test Kompilot</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/60 text-muted-foreground transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {sent ? (
              /* ── Thank you state ── */
              <div className="h-full flex flex-col items-center justify-center gap-5 text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-foreground">Merci pour votre aide précieuse !</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Votre retour a bien été transmis à l'équipe. Chaque remarque nous aide à améliorer Kompilot. 🙏
                  </p>
                </div>
                <div className="bg-muted/40 rounded-xl px-4 py-3 w-full text-left space-y-1">
                  <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    <span className="text-sm">✅</span> Votre retour a été enregistré
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Accessible dans le panneau Admin → Retours testeurs
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 hover:opacity-90 transition-opacity"
                >
                  Fermer <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <div className="space-y-5">

                {/* Question */}
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">Que pensez-vous de Kompilot ?</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Votre avis honnête nous est précieux pour améliorer le produit.
                  </p>
                </div>

                {/* Star rating */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Votre note</p>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                        aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={28}
                          className={`transition-colors duration-150 ${
                            star <= (hovered || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {(hovered || rating) > 0 && (
                    <p className="text-xs font-medium text-amber-600">
                      {starLabel[hovered || rating]}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Une idée, un bug ou une suggestion ?
                  </label>
                  <p className="text-[11px] text-muted-foreground">Dites-nous tout...</p>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Ex : « J'adore la page calendrier, mais le bouton de planification est difficile à trouver sur mobile... »"
                    rows={5}
                    className="w-full text-sm border border-border rounded-xl px-3 py-2.5 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow leading-relaxed placeholder:text-muted-foreground/50"
                    maxLength={800}
                  />
                  <p className="text-[10px] text-muted-foreground text-right">
                    {comment.length}/800
                  </p>
                </div>

                {/* Tags rapides */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold text-muted-foreground">Sujets rapides</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['🐛 Bug', '💡 Idée', '🎨 Design', '⚡ Performance', '📱 Mobile', '👍 Super !'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setComment(prev => prev ? `${prev}\n${tag}` : tag)}
                        className="text-[11px] border border-border rounded-full px-2.5 py-1 text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer / Send button */}
          {!sent && (
            <div className="shrink-0 border-t border-border p-4">
              <button
                onClick={handleSend}
                disabled={!canSend || sending}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
                  canSend && !sending
                    ? 'bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] shadow-md'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Envoyer mon retour
                  </>
                )}
              </button>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Votre retour est visible uniquement par l'équipe Kompilot.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
