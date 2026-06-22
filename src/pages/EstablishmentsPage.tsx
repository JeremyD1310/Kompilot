import { useState } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions, Button, toast,
} from '@blinkdotnew/ui';
import { Plus, Store, AlertTriangle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useUserProfile } from '../context/UserProfileContext';
import { useEstablishments, type Establishment, type EstablishmentCreate } from '../hooks/useEstablishments';
import { EstablishmentCard } from '../components/establishments/EstablishmentCard';
import { EstablishmentModal } from '../components/establishments/EstablishmentModal';

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-muted rounded-lg w-3/4" />
          <div className="h-4 bg-muted rounded-md w-1/3" />
        </div>
        <div className="h-6 w-16 bg-muted rounded-full" />
      </div>
      <div className="h-3 bg-muted rounded-full w-2/4" />
      <div className="space-y-1.5">
        <div className="h-2 bg-muted rounded-full w-full" />
        <div className="h-1.5 bg-muted rounded-full w-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-8 w-8 bg-muted rounded-lg" />
        <div className="h-8 w-8 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export default function EstablishmentsPage() {
  const { user } = useAuth();
  const { isB2C } = useUserProfile();
  const userId = user?.id ?? '';

  const { establishments, isLoading, createEstablishment, updateEstablishment, deleteEstablishment } = useEstablishments(userId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Establishment | null>(null);

  const handleOpenCreate = () => { setEditTarget(null); setModalOpen(true); };
  const handleOpenEdit = (e: Establishment) => { setEditTarget(e); setModalOpen(true); };
  const handleClose = () => { setModalOpen(false); setEditTarget(null); };

  const handleSubmit = async (data: EstablishmentCreate) => {
    if (editTarget) {
      await updateEstablishment.mutateAsync(
        { id: editTarget.id, patch: data },
        {
          onSuccess: () => { toast.success('Établissement mis à jour'); handleClose(); },
          onError: () => toast.error('Erreur lors de la mise à jour'),
        }
      );
    } else {
      await createEstablishment.mutateAsync(data, {
        onSuccess: () => { toast.success('Établissement créé avec succès'); handleClose(); },
        onError: () => toast.error('Erreur lors de la création'),
      });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteEstablishment.mutateAsync(id, {
      onSuccess: () => toast.success('Établissement supprimé'),
      onError: () => toast.error('Erreur lors de la suppression'),
    });
  };

  const isSubmitting = createEstablishment.isPending || updateEstablishment.isPending;

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Store size={20} className="text-primary" />
          </div>
          <div>
            <PageTitle>🏪 Mes Établissements</PageTitle>
            <PageDescription>Gérez vos établissements, crédits IA et liens de réservation</PageDescription>
          </div>
        </div>
        <PageActions>
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus size={16} /> Ajouter un établissement
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody>
        {/* B2C restriction notice */}
        {isB2C && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-amber-200/50 bg-amber-50/30 dark:border-amber-500/20 dark:bg-amber-500/5 p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground mb-1">
                Fonctionnalité multi-établissements réservée aux profils B2B 💼
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                En tant que créateur indépendant (B2C), vous gérez un seul espace.
                Pour gérer plusieurs établissements, passez à une offre Starter Pro ou supérieure.
              </p>
              <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" onClick={() => window.location.href = '/subscription'}>
                Voir les offres B2B →
              </Button>
            </div>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && establishments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/8 border border-primary/20 flex items-center justify-center mb-6">
              <Store size={36} className="text-primary/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Aucun établissement</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Ajoutez votre premier établissement pour commencer à gérer votre présence en ligne avec Kompilot.
            </p>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus size={16} /> Ajouter un établissement
            </Button>
          </motion.div>
        )}

        {/* Grid */}
        {!isLoading && establishments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {establishments.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                >
                  <EstablishmentCard
                    establishment={e}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    isDeleting={deleteEstablishment.isPending}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Summary chip */}
        {!isLoading && establishments.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 flex items-center gap-2">
            <AlertTriangle size={13} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {establishments.length} établissement{establishments.length > 1 ? 's' : ''} ·{' '}
              {establishments.reduce((sum, e) => sum + (e.aiCreditsUsed ?? 0), 0)} crédits IA consommés
            </span>
          </motion.div>
        )}
      </PageBody>

      <EstablishmentModal
        open={modalOpen} onClose={handleClose}
        onSubmit={handleSubmit} isSubmitting={isSubmitting}
        initial={editTarget ?? undefined}
      />
    </Page>
  );
}
