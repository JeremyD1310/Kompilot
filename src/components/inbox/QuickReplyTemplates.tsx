import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { ChevronDown, ChevronUp, Zap, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

interface Template {
  id: string;
  label: string;
  content: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  { id: 'tpl-1', label: '📅 Prise de RDV', content: 'Bonjour ! Merci pour votre message. Nous serions ravis de vous accueillir. Retrouvez nos disponibilités et réservez directement en ligne : [LIEN_RESERVATION]. À très bientôt !' },
  { id: 'tpl-2', label: '💰 Demande de tarif', content: 'Bonjour ! Merci de votre intérêt. Nos tarifs varient selon vos besoins spécifiques. Je vous invite à nous appeler directement ou à passer en boutique pour un devis personnalisé gratuit. Bonne journée !' },
  { id: 'tpl-3', label: '🕐 Horaires', content: 'Bonjour ! Nous sommes ouverts du lundi au samedi, de 9h à 19h. Le dimanche, nous accueillons sur rendez-vous. N\'hésitez pas à nous appeler si vous avez d\'autres questions !' },
  { id: 'tpl-4', label: '⚠️ Réclamation', content: 'Bonjour, nous sommes vraiment désolés de cette situation. Votre satisfaction est notre priorité absolue. Nous allons immédiatement prendre les mesures nécessaires pour corriger cela. Merci de nous avoir contactés.' },
  { id: 'tpl-5', label: '🤝 Partenariat', content: 'Bonjour, merci pour votre proposition ! Cela semble effectivement intéressant. Je vous propose d\'en discuter plus en détail — pourriez-vous me contacter directement pour planifier un échange ?' },
];

interface QuickReplyTemplatesProps {
  onSelect: (content: string) => void;
}

export function QuickReplyTemplates({ onSelect }: QuickReplyTemplatesProps) {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newContent, setNewContent] = useState('');
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dbTemplates } = useQuery({
    queryKey: ['quick-reply-templates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return blink.db.quickReplyTemplates.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      }) as Promise<Template[]>;
    },
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: async ({ label, content }: { label: string; content: string }) => {
      if (!user?.id) return;
      await blink.db.quickReplyTemplates.create({
        id: `tpl_${Date.now()}`,
        userId: user.id,
        label,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-reply-templates', user?.id] });
      setNewLabel('');
      setNewContent('');
      setAdding(false);
      toast.success('Modèle ajouté !');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await blink.db.quickReplyTemplates.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quick-reply-templates', user?.id] });
    },
  });

  const allTemplates = [...DEFAULT_TEMPLATES, ...(dbTemplates ?? [])];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Zap size={12} className="text-primary" />
          Réponses rapides
        </span>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-2 space-y-1 max-h-52 overflow-y-auto">
          {allTemplates.map(tpl => (
            <div key={tpl.id} className="group flex items-start gap-1">
              <button
                type="button"
                onClick={() => { onSelect(tpl.content); setOpen(false); }}
                className="flex-1 text-left rounded-lg px-2.5 py-2 hover:bg-muted transition-colors"
              >
                <p className="text-[11px] font-semibold text-foreground">{tpl.label}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{tpl.content}</p>
              </button>
              {!tpl.id.startsWith('tpl-') && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(tpl.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-50 hover:text-red-500 transition-all shrink-0 mt-1"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}

          {/* Add new template */}
          {adding ? (
            <div className="border border-border rounded-lg p-2 space-y-1.5 mt-2">
              <input
                autoFocus
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="Nom du modèle (ex: 🎉 Promo)"
                className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Contenu de la réponse..."
                rows={2}
                className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-1.5 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setAdding(false)} className="h-6 text-xs px-2">Annuler</Button>
                <Button size="sm" onClick={() => addMutation.mutate({ label: newLabel, content: newContent })}
                  disabled={!newLabel.trim() || !newContent.trim()} className="h-6 text-xs px-2">
                  Sauvegarder
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="w-full flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <Plus size={11} /> Créer un modèle personnalisé
            </button>
          )}
        </div>
      )}
    </div>
  );
}
