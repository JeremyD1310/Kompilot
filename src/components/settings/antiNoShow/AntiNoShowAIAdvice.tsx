/** AI Copilot recommendations panel for AntiNoShowShield */
import { useState, useCallback } from 'react';
import { Sparkles, RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react';
import { aiGenerate } from '../../../lib/aiRouterClient';
import { STATIC_ADVICE, COLOR_MAP, type AIAdviceCard } from './antiNoShowData';

interface Props {
  penaltyPct: number;
  sector?: string;
  city?: string;
}

export function AntiNoShowAIAdvice({ penaltyPct, sector = 'commerce', city = 'votre ville' }: Props) {
  const [advice, setAdvice] = useState<AIAdviceCard[]>(STATIC_ADVICE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const prompt = `Tu es le Copilote IA de Kompilot. L'utilisateur exploite un(e) "${sector}" à "${city}".
Il configure son Bouclier Anti-No-Show Stripe avec une pénalité de ${penaltyPct}%.
Donne-lui 3 recommandations ultra-concrètes et personnalisées sous forme de JSON array :
[{ "icon": "emoji", "title": "titre court", "text": "conseil actionnable (1-2 phrases)", "color": "amber|teal|violet" }]
Recommandation 1 : saisonnalité / événements. Recommandation 2 : analyse concurrentielle. Recommandation 3 : historique interne.
Réponds UNIQUEMENT avec le JSON valide, sans markdown ni backticks.`;
    try {
      const res = await aiGenerate({ taskType: 'QUICK_REPLY', prompt });
      const cleaned = res.content.trim().replace(/```json\n?|```\n?/g, '');
      const parsed = JSON.parse(cleaned) as AIAdviceCard[];
      if (Array.isArray(parsed) && parsed.length >= 3) {
        setAdvice(parsed.slice(0, 3));
      } else {
        setAdvice(STATIC_ADVICE);
      }
    } catch {
      setError('IA momentanément indisponible — recommandations par défaut affichées.');
      setAdvice(STATIC_ADVICE);
    } finally {
      setLoading(false);
    }
  }, [penaltyPct, sector, city]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex items-center justify-center">
            <Sparkles size={16} className="text-violet-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-foreground">✨ Conseil de votre Copilote IA</h3>
            <p className="text-xs text-muted-foreground">Recommandations personnalisées en temps réel</p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Analyse en cours…' : 'Rafraîchir l\'IA'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      <div className="space-y-3">
        {advice.map((card, i) => {
          const c = COLOR_MAP[card.color] ?? COLOR_MAP.teal;
          return (
            <div key={i} className={`rounded-xl border ${c.bg} ${c.border} px-4 py-3`}>
              <div className="flex items-start gap-3">
                <span className="text-lg leading-none mt-0.5 shrink-0">{card.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-extrabold ${c.text} mb-1`}>{card.title}</p>
                  <p className={`text-xs ${c.text} opacity-90 leading-relaxed`}>{card.text}</p>
                </div>
                <ChevronRight size={14} className={`${c.text} opacity-50 shrink-0 mt-0.5`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
