/**
 * StepAgencyClients — Onboarding step Agence : Ajout premiers clients
 * Permet à l'agence d'ajouter ses premiers comptes clients dès l'onboarding.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, ArrowRight, Trash2, Building2 } from 'lucide-react';

interface Props { onComplete: () => void }

interface Client {
  id: string;
  name: string;
  sector: string;
}

const SECTOR_OPTIONS = [
  { id: 'restauration', label: 'Restauration', emoji: '🍽️' },
  { id: 'beaute', label: 'Beauté', emoji: '💇' },
  { id: 'medical', label: 'Médical', emoji: '🩺' },
  { id: 'commerce', label: 'Commerce', emoji: '🏪' },
  { id: 'artisan', label: 'Artisan', emoji: '🔨' },
  { id: 'autre', label: 'Autre', emoji: '✨' },
];

export function StepAgencyClients({ onComplete }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [newName, setNewName] = useState('');
  const [newSector, setNewSector] = useState('');
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);

  const handleAdd = () => {
    if (!newName.trim() || !newSector) return;
    const client: Client = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      sector: newSector,
    };
    setClients(prev => [...prev, client]);
    setNewName('');
    setNewSector('');
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const handleActivate = () => {
    setDone(true);
    setTimeout(onComplete, 700);
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 px-3.5 py-3 flex items-start gap-2.5">
        <Building2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
          <strong>GESTION MULTI-CLIENTS :</strong> Chaque client a son propre espace isolé.
          Tableau de bord unifié, alertes centralisées, facturation automatique.
        </p>
      </div>

      {/* Client list */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Vos clients ({clients.length})
        </p>

        <AnimatePresence>
          {clients.map((client, i) => {
            const sector = SECTOR_OPTIONS.find(s => s.id === client.sector);
            return (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm shrink-0">
                  {sector?.emoji ?? '🏢'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{client.name}</p>
                  <p className="text-[10px] text-muted-foreground">{sector?.label}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 rounded-full px-2 py-0.5">
                    Actif
                  </span>
                  <button
                    onClick={() => handleRemove(client.id)}
                    className="w-6 h-6 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={11} className="text-red-500" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add client form */}
        <AnimatePresence>
          {adding ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl border-2 border-primary/30 bg-primary/3 p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Nom du client (ex : Salon de Marie)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoFocus
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <select
                  value={newSector}
                  onChange={e => setNewSector(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="">Secteur d'activité…</option>
                  {SECTOR_OPTIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim() || !newSector}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold py-2 disabled:opacity-50 transition-all"
                  >
                    <Check size={12} />
                    Ajouter
                  </button>
                  <button
                    onClick={() => { setAdding(false); setNewName(''); setNewSector(''); }}
                    className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setAdding(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 py-2.5 text-xs font-bold text-muted-foreground hover:text-primary transition-all"
            >
              <Plus size={13} />
              Ajouter un client
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* CTA */}
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="cta" className="space-y-2 pt-1">
            {clients.length === 0 && (
              <p className="text-[10px] text-center text-muted-foreground">
                Vous pourrez ajouter des clients depuis votre tableau de bord agence.
              </p>
            )}
            <button
              onClick={handleActivate}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold py-2.5 shadow-md transition-all active:scale-[0.98]"
            >
              {clients.length > 0 ? (
                <>Activer {clients.length} compte{clients.length > 1 ? 's' : ''} client</>
              ) : (
                <>Continuer sans client</>
              )}
              <ArrowRight size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-center gap-3"
          >
            <Check size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {clients.length > 0 ? `${clients.length} client${clients.length > 1 ? 's' : ''} configuré${clients.length > 1 ? 's' : ''} !` : 'Espace agence prêt !'}
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                Votre tableau de bord multi-clients est activé.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
