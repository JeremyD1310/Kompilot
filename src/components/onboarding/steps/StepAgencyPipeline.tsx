/**
 * StepAgencyPipeline — Onboarding Agence : Pipeline de prospects IA
 * Montre comment l'IA identifie et prospecte des commerces locaux automatiquement.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, TrendingUp, ArrowRight, CheckCircle2, Zap, Building2 } from 'lucide-react';

interface Props { onComplete: () => void }

interface Lead {
  name: string;
  sector: string;
  city: string;
  score: number;
  issue: string;
  potential: string;
}

const SAMPLE_LEADS: Lead[] = [
  { name: 'Boulangerie Martin', sector: '🥖 Boulangerie', city: 'Lyon 3e', score: 22, issue: 'Pas de fiche Google optimisée', potential: '+320€/m' },
  { name: 'Coiffeur Style & Co', sector: '✂️ Coiffure', city: 'Bordeaux', score: 18, issue: 'Aucun avis Google répondu depuis 6 mois', potential: '+280€/m' },
  { name: 'Restaurant Le Bistrot', sector: '🍽️ Restauration', city: 'Nantes', score: 31, issue: 'Visible IA : 18/100 — concurrents captent trafic', potential: '+450€/m' },
  { name: 'Pharmacie Centrale', sector: '💊 Santé', city: 'Paris 15e', score: 25, issue: 'Pas de calendrier contenu — inactif réseaux', potential: '+390€/m' },
];

export function StepAgencyPipeline({ onComplete }: Props) {
  const [city, setCity] = useState('');
  const [sector, setSector] = useState('');
  const [scanning, setScanning] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [contacting, setContacting] = useState(false);
  const [done, setDone] = useState(false);

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setLeads(SAMPLE_LEADS);
      setScanning(false);
    }, 2200);
  };

  const toggleLead = (i: number) => {
    setSelectedLeads(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleContact = () => {
    setContacting(true);
    setTimeout(() => {
      setDone(true);
      setTimeout(onComplete, 800);
    }, 1800);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/20 border border-violet-200 dark:border-violet-800 px-3.5 py-3 flex items-start gap-2.5">
        <Search size={16} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
          <strong>PROSPECTION IA :</strong> L'IA scanne votre ville et détecte les commerces avec une
          visibilité faible — vos futurs clients. Email de prospection personnalisé en 1 clic.
        </p>
      </div>

      {!leads.length ? (
        <>
          {/* Search form */}
          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Ville cible
              </label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Ex : Lyon, Bordeaux, Paris 15e…"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Secteur (optionnel)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['🍽️ Resto', '✂️ Coiffure', '💆 Beauté', '🥖 Boulangerie', '💊 Santé'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSector(sector === s ? '' : s)}
                    className={`text-[10px] font-bold rounded-full border px-2.5 py-1 transition-all ${
                      sector === s ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleScan}
            disabled={!city.trim() || scanning}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {scanning ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Scan en cours…
              </>
            ) : (
              <>
                <Search size={14} />
                Scanner les prospects à {city || 'votre ville'}
                <Zap size={13} />
              </>
            )}
          </button>
        </>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                {leads.length} prospects détectés
              </p>
              <span className="text-[10px] text-muted-foreground">
                {selectedLeads.size} sélectionné{selectedLeads.size > 1 ? 's' : ''}
              </span>
            </div>

            {leads.map((lead, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => toggleLead(i)}
                className={`w-full text-left rounded-xl border-2 p-3 transition-all ${
                  selectedLeads.has(i) ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-foreground">{lead.name}</p>
                      <span className="text-[9px] text-muted-foreground">{lead.sector} · {lead.city}</span>
                    </div>
                    <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5">{lead.issue}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{lead.potential}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star size={9} className="text-amber-400" />
                      <span className="text-[9px] text-muted-foreground">Score {lead.score}/100</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}

            <AnimatePresence mode="wait">
              {!done ? (
                <motion.button
                  key="cta"
                  onClick={handleContact}
                  disabled={selectedLeads.size === 0 || contacting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-bold py-2.5 shadow-md disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {contacting ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Envoi des emails IA…
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Contacter {selectedLeads.size || ''} prospect{selectedLeads.size > 1 ? 's' : ''} par IA
                      <ArrowRight size={14} />
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3.5 py-3 flex items-center gap-3"
                >
                  <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {selectedLeads.size} emails personnalisés envoyés !
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Suivi automatique dans Agence → Pipeline
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
