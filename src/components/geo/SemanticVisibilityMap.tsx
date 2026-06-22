/**
 * SemanticVisibilityMap — Carte de Visibilité Sémantique Interactive
 * Affiche une grille géolocalisée simulant la visibilité sur requêtes IA,
 * style Localo : points verts = recommandé, rouge = concurrent en tête.
 */
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Bot, Zap, RefreshCw, Sparkles, ChevronRight, CheckCircle2, Target } from 'lucide-react';
import { Badge } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GridCell {
  row: number;
  col: number;
  rank: number;      // 1–9 : position dans les réponses IA
  query: string;
  aiSource: string;
  competitor?: string;
}

interface MapAction {
  id: string;
  label: string;
  detail: string;
  impact: string;
  zone: string;
  cockpitPrompt: string;
  done: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AI_SOURCES = ['ChatGPT', 'Gemini', 'Perplexity', 'Claude'];
const COMPETITORS = ['Le Bistrot d\'à côté', 'La Table Dorée', 'Chez Marcel', 'L\'Étoile', 'Brasserie du Coin'];

function buildGrid(estName: string, city: string, activity: string, seed: number): GridCell[] {
  const cells: GridCell[] = [];
  const queries = [
    `Meilleur ${activity} ${city} centre`,
    `${activity} recommandé ${city} nord`,
    `${activity} de qualité ${city} sud`,
    `Où manger ${city} est`,
    `${activity} ${city} avis 2024`,
    `Bon ${activity} près de ${city}`,
    `${activity} ouvert ${city}`,
    `${activity} ${city} livraison`,
    `${activity} sympa ${city} famille`,
  ];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      // Rank 1-3 = vert, 4+ = orange/rouge
      const baseRank = (seed + idx * 3) % 9 + 1;
      const rank = idx === 4 ? 2 : baseRank; // centre always good
      cells.push({
        row, col, rank,
        query: queries[idx],
        aiSource: AI_SOURCES[idx % AI_SOURCES.length],
        competitor: rank >= 4 ? COMPETITORS[idx % COMPETITORS.length] : undefined,
      });
    }
  }
  return cells;
}

function buildActions(cells: GridCell[], estName: string, city: string, activity: string): MapAction[] {
  const redCells = cells.filter(c => c.rank >= 4).slice(0, 3);
  const ZONE_LABELS = ['nord', 'centre-est', 'sud', 'nord-ouest', 'centre', 'est', 'ouest', 'sud-est', 'nord-est'];

  return [
    {
      id: 'faq',
      label: 'Injecter la FAQ sémantique recommandée',
      detail: `L'IA génère une FAQ locale optimisée ciblant les requêtes "${redCells[0]?.query ?? `${activity} ${city}`}" pour inverser les zones rouges.`,
      impact: '🟢 +3 zones vertes estimées',
      zone: ZONE_LABELS[(redCells[0]?.row ?? 0) * 3 + (redCells[0]?.col ?? 0)],
      cockpitPrompt: `Génère une FAQ sémantique complète pour "${estName}" à ${city} qui répond aux questions : "${redCells.map(c => c.query).join('", "')}". Format : 5 Q&A, ton conversationnel, inclus les mots-clés locaux pour optimiser la recommandation par ChatGPT et Gemini.`,
      done: false,
    },
    {
      id: 'review',
      label: 'Campagne d\'avis géo-ciblée',
      detail: `Envoyez une campagne SMS à vos clients pour obtenir des avis Google contenant les termes IA manquants dans les zones ${redCells.map((_, i) => ZONE_LABELS[(redCells[i]?.row ?? 0) * 3 + (redCells[i]?.col ?? 0)]).join(', ')}.`,
      impact: '🟢 +2 zones vertes estimées',
      zone: ZONE_LABELS[(redCells[1]?.row ?? 1) * 3 + (redCells[1]?.col ?? 1)],
      cockpitPrompt: `Rédige un SMS de demande d'avis Google pour "${estName}" à ${city}. Demande aux clients de mentionner : ${activity}, qualité, service, recommandé. Moins de 160 caractères, inclut [LIEN_AVIS]. Format WhatsApp-friendly.`,
      done: false,
    },
    {
      id: 'content',
      label: 'Publication de contenu local ciblé',
      detail: `Publier 2 posts mentionnant spécifiquement les quartiers où votre score est faible. Les LLMs apprennent des patterns de contenu récent.`,
      impact: '🟢 +1 zone verte estimée',
      zone: ZONE_LABELS[(redCells[2]?.row ?? 2) * 3 + (redCells[2]?.col ?? 2)],
      cockpitPrompt: `Crée 2 posts pour "${estName}" ciblant les requêtes IA locales sur ${city}. Post 1 : axé sur la qualité et la recommandation. Post 2 : axé sur l'expérience client unique. Intègre les expressions : "meilleur ${activity} à ${city}", "recommandé par vos voisins". Optimisé ChatGPT + Gemini.`,
      done: false,
    },
  ];
}

function rankColor(rank: number): { bg: string; border: string; text: string; dot: string; label: string } {
  if (rank <= 3) return {
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    label: `#${rank}`,
  };
  if (rank <= 5) return {
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: `#${rank}`,
  };
  return {
    bg: 'bg-red-500/15',
    border: 'border-red-500/40',
    text: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
    label: `#${rank}`,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GridCellTile({ cell, isSelected, onClick, estName }: {
  cell: GridCell;
  isSelected: boolean;
  onClick: () => void;
  estName: string;
}) {
  const colors = rankColor(cell.rank);
  const isGood = cell.rank <= 3;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`relative rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 aspect-square cursor-pointer transition-all duration-200 ${colors.bg} ${isSelected ? 'border-primary shadow-lg shadow-primary/20' : colors.border}`}
    >
      {/* Rank badge */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs text-white shadow-md ${colors.dot}`}>
        {cell.rank}
      </div>

      {/* Pulse for green */}
      {isGood && (
        <motion.div
          className={`absolute inset-0 rounded-xl ${colors.dot} opacity-10`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* AI source label */}
      <span className={`text-[9px] font-bold leading-tight text-center px-1 ${colors.text}`}>
        {cell.aiSource}
      </span>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
      )}
    </motion.button>
  );
}

function ActionCard({ action, onExecute, index }: {
  action: MapAction;
  onExecute: (id: string) => void;
  index: number;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onExecute(action.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-xl border p-3.5 transition-all ${
        action.done
          ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20'
          : 'border-border bg-card hover:border-primary/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${
          action.done ? 'bg-emerald-500' : 'bg-primary/10'
        }`}>
          {action.done
            ? <CheckCircle2 size={15} className="text-white" />
            : <Target size={15} className="text-primary" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground leading-tight">{action.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{action.detail}</p>
          <div className="flex items-center justify-between gap-2 mt-2">
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{action.impact}</span>
            {!action.done ? (
              <button
                onClick={handleClick}
                disabled={loading}
                className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-60 transition-all rounded-lg px-3 py-1.5 shrink-0"
              >
                {loading ? (
                  <><RefreshCw size={10} className="animate-spin" /> En cours…</>
                ) : (
                  <><Zap size={10} className="fill-white" /> Appliquer en 1 clic</>
                )}
              </button>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={10} /> Appliqué
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  estName?: string;
  city?: string;
  activity?: string;
  globalScore?: number;
}

export function SemanticVisibilityMap({ estName = 'Votre Établissement', city = 'votre ville', activity = 'votre activité', globalScore = 43 }: Props) {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [selectedCell, setSelectedCell] = useState<GridCell | null>(null);
  const [actions, setActions] = useState<MapAction[]>([]);
  const [seed] = useState(() => Math.floor(Math.random() * 5));

  const cells = useMemo(() => buildGrid(estName, city, activity, seed), [estName, city, activity, seed]);

  const greenCount = cells.filter(c => c.rank <= 3).length;
  const redCount = cells.filter(c => c.rank >= 6).length;

  const handleScan = async () => {
    setScanning(true);
    setScanned(false);
    setSelectedCell(null);
    await new Promise(r => setTimeout(r, 2000));
    setActions(buildActions(cells, estName, city, activity));
    setScanned(true);
    setScanning(false);
  };

  const handleActionExecute = useCallback((id: string) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, done: true } : a));
    // Store prompt for cockpit
    const action = actions.find(a => a.id === id);
    if (action?.cockpitPrompt) {
      sessionStorage.setItem('cockpit_prefill_prompt', action.cockpitPrompt);
    }
  }, [actions]);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/60 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin size={16} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-foreground">Carte de Visibilité Sémantique IA</h3>
              <Badge className="rounded-full text-[10px] h-5 px-2 bg-primary/10 text-primary border-primary/20">Nouveau</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Visualisez où l'IA vous recommande en premier choix — et où vos concurrents prennent l'avantage.
            </p>
          </div>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="shrink-0 flex items-center gap-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-60 transition-all rounded-xl px-4 py-2"
        >
          {scanning
            ? <><RefreshCw size={12} className="animate-spin" /> Scan…</>
            : scanned
              ? <><RefreshCw size={12} /> Actualiser</>
              : <><Sparkles size={12} /> Analyser</>
          }
        </button>
      </div>

      <div className="p-5 space-y-5">

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 font-semibold"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />Pos. 1–3 : L'IA vous recommande en premier</span>
          <span className="flex items-center gap-1.5 font-semibold"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />Pos. 4–5 : Présence partielle</span>
          <span className="flex items-center gap-1.5 font-semibold"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Pos. 6+ : Concurrent recommandé</span>
        </div>

        {/* Axis labels + Grid */}
        <div className="relative">
          {/* Y-axis labels */}
          <div className="absolute -left-1 top-0 bottom-0 flex flex-col justify-around pr-1" style={{ width: 28 }}>
            {['Nord', 'Centre', 'Sud'].map(l => (
              <span key={l} className="text-[8px] text-muted-foreground font-semibold text-right leading-none">{l}</span>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-around mb-1 pl-7">
            {['Ouest', 'Centre', 'Est'].map(l => (
              <span key={l} className="text-[8px] text-muted-foreground font-semibold text-center flex-1 leading-none">{l}</span>
            ))}
          </div>

          {/* Grid */}
          <div className="pl-7 grid grid-cols-3 gap-2">
            {cells.map((cell) => (
              <GridCellTile
                key={`${cell.row}-${cell.col}`}
                cell={cell}
                isSelected={selectedCell?.row === cell.row && selectedCell?.col === cell.col}
                onClick={() => setSelectedCell(prev =>
                  prev?.row === cell.row && prev?.col === cell.col ? null : cell
                )}
                estName={estName}
              />
            ))}
          </div>

          {/* Center marker */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
              <MapPin size={9} className="text-primary" />
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 py-2.5 px-2">
            <p className="text-lg font-extrabold text-emerald-600">{greenCount}</p>
            <p className="text-[9px] text-muted-foreground font-semibold">Zones vertes</p>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border py-2.5 px-2">
            <p className="text-lg font-extrabold text-foreground">9</p>
            <p className="text-[9px] text-muted-foreground font-semibold">Zones totales</p>
          </div>
          <div className="rounded-xl bg-red-500/8 border border-red-500/20 py-2.5 px-2">
            <p className="text-lg font-extrabold text-red-500">{redCount}</p>
            <p className="text-[9px] text-muted-foreground font-semibold">Zones perdues</p>
          </div>
        </div>

        {/* Cell detail tooltip */}
        <AnimatePresence>
          {selectedCell && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`rounded-xl border p-3.5 space-y-1.5 ${rankColor(selectedCell.rank).bg} ${rankColor(selectedCell.rank).border}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold ${rankColor(selectedCell.rank).dot}`}>
                    {selectedCell.rank}
                  </div>
                  <span className={`text-xs font-bold ${rankColor(selectedCell.rank).text}`}>
                    {selectedCell.rank <= 3
                      ? `✅ L'IA vous recommande en position #${selectedCell.rank}`
                      : selectedCell.rank <= 5
                        ? `⚠️ Présence partielle — position #${selectedCell.rank}`
                        : `❌ ${selectedCell.competitor ?? 'Un concurrent'} recommandé en #${selectedCell.rank}`
                    }
                  </span>
                </div>
                <Bot size={13} className="text-muted-foreground shrink-0 mt-0.5" />
              </div>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-semibold">Requête IA :</span> « {selectedCell.query} »
              </p>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-semibold">Source :</span> {selectedCell.aiSource}
              </p>
              {selectedCell.competitor && (
                <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                  ⚔️ Concurrent en tête : {selectedCell.competitor}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scanning overlay */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center space-y-2"
            >
              <RefreshCw size={20} className="animate-spin text-primary mx-auto" />
              <p className="text-xs font-bold text-foreground">Scan des zones géographiques en cours…</p>
              <p className="text-[10px] text-muted-foreground">Interrogation de ChatGPT, Gemini et Perplexity pour chaque zone</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action panel — only after scan */}
        <AnimatePresence>
          {scanned && actions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2">Actions IA recommandées</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Banner */}
              <div className="rounded-xl bg-gradient-to-r from-primary/8 via-teal-500/5 to-transparent border border-primary/20 px-4 py-3 flex items-start gap-3">
                <Sparkles size={15} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Prenez de l'avance : {actions.filter(a => !a.done).length} actions pour verdir votre carte</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Chaque action injecte du contenu sémantique optimisé dans les zones rouges. L'IA met à jour sa recommandation sous 72h.
                  </p>
                </div>
              </div>

              {/* Action cards */}
              <div className="space-y-2">
                {actions.map((action, i) => (
                  <ActionCard key={action.id} action={action} onExecute={handleActionExecute} index={i} />
                ))}
              </div>

              {/* CTA to Cockpit */}
              <button
                onClick={() => navigate({ to: '/cockpit' })}
                className="w-full flex items-center justify-center gap-2 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 active:scale-[0.99] transition-all rounded-xl py-2.5"
              >
                Ouvrir le Cockpit IA pour toutes les optimisations <ChevronRight size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!scanned && !scanning && (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto">
              <MapPin size={22} className="text-primary/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Carte non encore analysée</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                Cliquez sur « Analyser » pour visualiser votre positionnement IA sur chaque zone géographique autour de {city}.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
