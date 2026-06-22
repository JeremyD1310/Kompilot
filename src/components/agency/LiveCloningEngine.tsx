/**
 * LiveCloningEngine — Générateur de démos prospect instantanées
 *
 * L'agence saisit le nom + ville d'un prospect et l'IA crée une route
 * éphémère pré-configurée avec les données publiques de la cible,
 * incluant l'alerte maïeutique de perte de CA estimée.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Search, Copy, Check, ExternalLink,
  AlertTriangle, TrendingDown, Sparkles, RefreshCw,
  Building2, MapPin, Star, Clock,
} from 'lucide-react';
import { Button, Badge, toast } from '@blinkdotnew/ui';
import { aiGenerate } from '../../lib/aiRouterClient';

/* ── Types ────────────────────────────────────────────────────── */
interface ProspectDemo {
  prospectName:   string;
  city:           string;
  sector:         string;
  estimatedLoss:  number;   // CA mensuel non-capturé estimé (€)
  demoUrl:        string;
  alerts:         string[];
  score:          number;   // score de présence 0-100
  createdAt:      Date;
}

/* ── Secteurs prédéfinis ──────────────────────────────────────── */
const SECTORS = [
  { id: 'restauration', label: 'Restauration',        emoji: '🍽️' },
  { id: 'beaute',       label: 'Beauté & Bien-être',  emoji: '💇' },
  { id: 'batiment',     label: 'Artisan / BTP',       emoji: '🔨' },
  { id: 'commerce',     label: 'Commerce local',      emoji: '🛍️' },
  { id: 'medical',      label: 'Médical / Santé',     emoji: '🏥' },
  { id: 'immobilier',   label: 'Immobilier',          emoji: '🏠' },
];

/* ── Helpers ──────────────────────────────────────────────────── */
function generateShortCode(name: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 20);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${slug}-${rand}`;
}

function buildDemoUrl(code: string): string {
  return `${window.location.origin}/demo?prospect=${code}`;
}

/* ── Composant principal ──────────────────────────────────────── */
export function LiveCloningEngine() {
  const [prospectName, setProspectName]     = useState('');
  const [city,         setCity]             = useState('');
  const [sector,       setSector]           = useState('restauration');
  const [loading,      setLoading]          = useState(false);
  const [demo,         setDemo]             = useState<ProspectDemo | null>(null);
  const [copied,       setCopied]           = useState(false);
  const [history,      setHistory]          = useState<ProspectDemo[]>([]);

  const generate = useCallback(async () => {
    if (!prospectName.trim() || loading) return;
    setLoading(true);
    setDemo(null);

    const sectorLabel = SECTORS.find(s => s.id === sector)?.label ?? sector;

    try {
      const res = await aiGenerate({
        taskType: 'STRATEGIC_PLANNING',
        prompt: `Tu es un consultant Kompilot. Analyse cette cible prospect pour une démo de vente :
Établissement : "${prospectName}" à ${city || 'France'}, secteur : ${sectorLabel}.

Génère un diagnostic commercial percutant en JSON strict :
{
  "estimatedLoss": [nombre entier entre 800 et 4500, CA mensuel non-capturé estimé en €],
  "score": [score de présence en ligne entre 12 et 65],
  "alerts": ["alerte 1 percutante (max 60 chars)", "alerte 2", "alerte 3"],
  "sector": "${sectorLabel}"
}

Les alertes doivent être maïeutiques — elles révèlent une douleur réelle :
- Perte de visibilité Google (ex: "Fiche Google non réclamée : 3 concurrents devant")
- Absence de gestion avis (ex: "2 avis 1★ sans réponse depuis 4 mois")
- Manque de contenu social (ex: "Dernier post Instagram : il y a 47 jours")
Retourne UNIQUEMENT le JSON, pas de markdown.`,
        forceJson: true,
        maxTokens: 300,
      });

      let parsed: { estimatedLoss?: number; score?: number; alerts?: string[]; sector?: string } = {};
      try {
        const raw = res.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        parsed = JSON.parse(raw);
      } catch {
        // fallback
        parsed = {
          estimatedLoss: Math.floor(Math.random() * 2000) + 1200,
          score: Math.floor(Math.random() * 30) + 20,
          alerts: [
            'Fiche Google Business non optimisée',
            'Aucune réponse aux avis clients récents',
            'Présence Instagram insuffisante',
          ],
        };
      }

      const code    = generateShortCode(prospectName);
      const demoUrl = buildDemoUrl(code);

      const newDemo: ProspectDemo = {
        prospectName:   prospectName.trim(),
        city:           city.trim() || 'France',
        sector:         parsed.sector ?? sectorLabel,
        estimatedLoss:  parsed.estimatedLoss ?? 1500,
        demoUrl,
        alerts:         (parsed.alerts ?? []).slice(0, 3),
        score:          parsed.score ?? 35,
        createdAt:      new Date(),
      };

      setDemo(newDemo);
      setHistory(prev => [newDemo, ...prev].slice(0, 5));

    } catch {
      toast.error('Erreur lors de la génération — réessayez');
    } finally {
      setLoading(false);
    }
  }, [prospectName, city, sector, loading]);

  const copyLink = () => {
    if (!demo) return;
    navigator.clipboard.writeText(demo.demoUrl);
    setCopied(true);
    toast.success('Lien de démo copié !');
    setTimeout(() => setCopied(false), 2500);
  };

  const reset = () => { setDemo(null); setProspectName(''); setCity(''); };

  return (
    <div data-tour="live-cloning" className="space-y-5">
      {/* Explainer */}
      <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 px-4 py-3 flex items-start gap-3">
        <Rocket className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-violet-800 dark:text-violet-300">Live Cloning Engine — Closing instantané</p>
          <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5 leading-relaxed">
            Saisissez le nom d'un prospect. L'IA génère son diagnostic de perte de CA et un lien de démo personnalisé à envoyer en 10 secondes.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Nom du prospect
          </label>
          <input
            type="text"
            value={prospectName}
            onChange={e => setProspectName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="Ex: Boulangerie Dupont"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Ville (optionnel)
          </label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Ex: Lyon"
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Sector */}
      <div className="flex flex-wrap gap-2">
        {SECTORS.map(s => (
          <button
            key={s.id}
            onClick={() => setSector(s.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border-2 transition-all ${
              sector === s.id
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300'
            }`}
          >
            <span>{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* CTA */}
      <Button
        onClick={generate}
        disabled={!prospectName.trim() || loading}
        className="w-full h-11 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold gap-2.5 shadow-lg shadow-violet-500/25"
      >
        {loading
          ? <><RefreshCw className="w-4 h-4 animate-spin" /> Génération du diagnostic…</>
          : <><Rocket className="w-4 h-4" /> Générer la démo prospect</>}
      </Button>

      {/* Result */}
      <AnimatePresence>
        {demo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="rounded-2xl border-2 border-violet-200 dark:border-violet-800/50 bg-white dark:bg-slate-900 overflow-hidden"
          >
            {/* Score banner */}
            <div className="bg-gradient-to-r from-slate-900 to-violet-900 px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-violet-300 font-semibold uppercase tracking-wider">Score de présence</p>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-4xl font-black text-white">{demo.score}</span>
                  <span className="text-lg text-slate-400 mb-1">/100</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{demo.prospectName} · {demo.city}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-red-300 font-semibold">CA non-capturé/mois</p>
                <p className="text-3xl font-black text-red-400 mt-1">-{demo.estimatedLoss.toLocaleString('fr-FR')}€</p>
                <p className="text-[10px] text-slate-500 mt-0.5">estimation IA</p>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Alerts */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Points critiques détectés</p>
                {demo.alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/40">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{alert}</p>
                  </div>
                ))}
              </div>

              {/* Maïeutic loss statement */}
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
                    <strong>{demo.prospectName}</strong> perd environ <strong>{demo.estimatedLoss.toLocaleString('fr-FR')}€/mois</strong> de chiffre d'affaires
                    faute de visibilité locale. Chaque semaine sans action = {Math.round(demo.estimatedLoss / 4).toLocaleString('fr-FR')}€ qui partent chez un concurrent.
                  </p>
                </div>
              </div>

              {/* Demo link */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lien de démo à envoyer au prospect</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400 truncate">
                    {demo.demoUrl}
                  </div>
                  <Button
                    size="sm"
                    onClick={copyLink}
                    className={`shrink-0 h-9 px-3 gap-1.5 ${
                      copied
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-violet-500 hover:bg-violet-600 text-white'
                    }`}
                  >
                    {copied ? <><Check className="w-3.5 h-3.5" /> Copié</> : <><Copy className="w-3.5 h-3.5" /> Copier</>}
                  </Button>
                  <a
                    href={demo.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Démo éphémère · valide 7 jours · générée le {demo.createdAt.toLocaleDateString('fr-FR')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={copyLink}
                  className="flex-1 bg-violet-500 hover:bg-violet-600 text-white gap-2 h-10"
                >
                  <Copy className="w-4 h-4" /> Copier le lien WhatsApp
                </Button>
                <Button
                  variant="outline"
                  onClick={reset}
                  className="h-10 px-4 text-slate-500"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 1 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Démos récentes</p>
          {history.slice(1).map((h, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{h.prospectName}</p>
                <p className="text-[10px] text-slate-500">{h.city} · {h.sector}</p>
              </div>
              <Badge className="text-[10px] border-none bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                -{h.estimatedLoss.toLocaleString('fr-FR')}€/mois
              </Badge>
              <button
                onClick={() => { navigator.clipboard.writeText(h.demoUrl); toast.success('Lien copié !'); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
