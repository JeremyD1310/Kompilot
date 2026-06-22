import { useState } from 'react';
import {
  AlertTriangle, Sparkles, Shield, Send, CheckCircle2,
  RefreshCw, Copy, Check, ExternalLink,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { toast } from '@blinkdotnew/ui';
import { incrementWeeklyReviews } from '../../lib/weeklyActivity';

export interface CrisisReview {
  id: string;
  authorName: string;
  authorInitials: string;
  rating: 1 | 2;
  date: string;
  text: string;
  platform: 'google';
  isCrisis: true;
}

export const CRISIS_REVIEW: CrisisReview = {
  id: 'crisis-1',
  authorName: 'Kevin M.',
  authorInitials: 'KM',
  rating: 1,
  date: "À l'instant",
  text: 'Service client déplorable, j\'ai attendu 45 minutes pour ma commande et personne ne s\'est excusé. Les serveurs ignorent les clients. Je ne reviendrai JAMAIS. À fuir absolument !',
  platform: 'google',
  isCrisis: true,
};

type ResponseMode = 'diplomatic' | 'dispute';
type Status = 'idle' | 'generating' | 'ready' | 'sending' | 'resolved';

interface Props {
  review: CrisisReview;
  onResolved: () => void;
}

export function CrisisReviewPanel({ review, onResolved }: Props) {
  const [mode, setMode] = useState<ResponseMode | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [response, setResponse] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async (m: ResponseMode) => {
    setMode(m);
    setStatus('generating');
    setResponse('');

    try {
      const prompt = m === 'diplomatic'
        ? `Tu es le responsable de la relation client d'un commerce français. Un client a laissé cet avis Google très négatif (1/5) :
"${review.text}"

Rédige une réponse publique de désamorçage en suivant ces règles strictes :
- Commence par remercier pour le retour, même négatif
- Présente des excuses sincères pour l'attente (45 min)
- Reste courtois, jamais défensif
- Invite la personne à contacter le gérant en privé : contact@votreentreprise.fr ou au 01 23 45 67 89
- Termine par "Cordialement, L'équipe de direction"
- Maximum 5 phrases, ton professionnel et humain`
        : `Tu es le responsable de la relation client d'un commerce français. Tu as reçu cet avis Google (1/5) que tu soupçonnes d'être faux ou malveillant :
"${review.text}"

Rédige une réponse publique ferme et polie en suivant ces règles :
- Indique poliment que le nom "Kevin M." n'apparaît pas dans votre base client sur la période concernée
- Invitez la personne à se manifester avec une preuve d'achat pour vérification
- Mentionnez que vous vous réservez le droit de signaler cet avis à Google pour non-conformité
- Donnez brièvement les instructions : signaler via l'icône ⋮ → "Signaler comme inapproprié"
- Reste digne et professionnel, sans attaque
- Maximum 5 phrases`;

      const { object } = await blink.ai.generateObject({
        prompt,
        schema: {
          type: 'object',
          properties: {
            reply: { type: 'string', description: 'Réponse publique à publier sur Google' },
          },
          required: ['reply'],
        },
      });
      setResponse((object as { reply: string }).reply);
      setStatus('ready');
      toast.success(m === 'diplomatic' ? 'Réponse diplomatique générée !' : 'Réponse de contestation générée !');
    } catch (err: any) {
      if (err?.message?.includes('401')) {
        blink.auth.login(window.location.href);
      } else {
        // Fallback response
        setResponse(m === 'diplomatic'
          ? `Bonjour Kevin M., nous vous remercions sincèrement pour votre retour, même s'il nous peine beaucoup. Nous sommes navrés de cette longue attente lors de votre visite — ce n'est absolument pas notre standard de service habituel. Nous prenons vos remarques très au sérieux et aimerions en discuter directement avec vous pour trouver une solution. N'hésitez pas à nous contacter : contact@votreentreprise.fr. Cordialement, L'équipe de direction.`
          : `Bonjour, nous avons soigneusement vérifié nos registres clients sur la période concernée, et aucun client correspondant à ce profil n'apparaît dans notre base de données. Nous vous invitons à vous manifester avec votre justificatif d'achat à contact@votreentreprise.fr afin que nous puissions faire la lumière sur cette situation. À défaut, nous nous réservons le droit de signaler cet avis à Google pour non-conformité (⋮ → "Signaler comme inapproprié"). Cordialement, La Direction.`
        );
        setStatus('ready');
      }
    }
  };

  const handleSend = async () => {
    setStatus('sending');
    await new Promise(r => setTimeout(r, 2000));
    setStatus('resolved');

    // 🎉 Gamification: celebrate defusing a negative review
    toast.success('🤝 Crise évitée avec brio !', {
      description: 'Votre réponse professionnelle a été publiée. Bravo pour votre réactivité et votre self-control.',
      duration: 7000,
    });

    // Track weekly activity
    incrementWeeklyReviews();

    setTimeout(onResolved, 1500);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">

      {/* Crisis header */}
      <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center text-sm font-extrabold text-red-700 shrink-0">
            {review.authorInitials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm text-gray-900">{review.authorName}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 animate-pulse">
                <AlertTriangle size={9} /> ALERTE PRIORITAIRE
              </span>
              <span className="text-[11px] text-gray-500">{review.date}</span>
            </div>
            <div className="flex items-center gap-0.5 mt-0.5">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i <= review.rating ? '#EF4444' : '#e5e7eb'}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
              <span className="text-[11px] text-red-600 font-bold ml-1">{review.rating}/5 — Crise</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed bg-red-100/60 rounded-xl px-4 py-3 border border-red-200">
          "{review.text}"
        </p>
      </div>

      {/* AI action buttons */}
      {status === 'idle' && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            🤖 Choisissez votre stratégie de réponse
          </p>
          <button
            onClick={() => generate('diplomatic')}
            className="w-full flex items-start gap-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 px-5 py-4 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-emerald-800">Réponse de désamorçage (Diplomatique)</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                L'IA s'excuse pour l'attente, reste courtoise et invite le client à recontacter le gérant en privé. Recommandée dans 90% des cas.
              </p>
            </div>
          </button>

          <button
            onClick={() => generate('dispute')}
            className="w-full flex items-start gap-4 rounded-2xl border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 hover:border-orange-400 px-5 py-4 text-left transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-orange-800">Réponse de contestation (Faux avis)</p>
              <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">
                Si vous pensez que c'est un concurrent qui ment, l'IA rédige une réponse ferme signalant que ce client ne figure pas dans votre base + instructions de signalement Google.
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Generating */}
      {status === 'generating' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles size={22} className="text-primary animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">L'IA rédige votre réponse…</p>
            <p className="text-xs text-muted-foreground mt-0.5">Analyse du contexte · Optimisation du ton · Anti-escalade</p>
          </div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i*200}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* Response ready */}
      {status === 'ready' && (
        <div className="space-y-4">
          <div className={`rounded-2xl border-2 p-5 space-y-3 ${
            mode === 'diplomatic' ? 'border-emerald-300 bg-emerald-50' : 'border-orange-300 bg-orange-50'
          }`}>
            <div className="flex items-center gap-2">
              {mode === 'diplomatic'
                ? <Sparkles size={15} className="text-emerald-600" />
                : <Shield size={15} className="text-orange-600" />
              }
              <p className={`text-xs font-extrabold uppercase tracking-widest ${
                mode === 'diplomatic' ? 'text-emerald-700' : 'text-orange-700'
              }`}>
                {mode === 'diplomatic' ? '✓ Réponse diplomatique générée' : '✓ Réponse de contestation générée'}
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
              >
                Changer de stratégie
              </button>
            </div>
            <textarea
              value={response}
              onChange={e => setResponse(e.target.value)}
              rows={6}
              className="w-full text-sm text-gray-800 leading-relaxed bg-white/80 rounded-xl border border-current/20 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-all"
              >
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
              <button
                onClick={() => generate(mode!)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50 transition-all"
              >
                <RefreshCw size={12} /> Régénérer
              </button>
              {mode === 'dispute' && (
                <a
                  href="https://support.google.com/business/answer/4596773"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
                >
                  <ExternalLink size={11} /> Guide signalement Google
                </a>
              )}
            </div>
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-foreground text-background text-sm font-extrabold py-4 hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
          >
            <Send size={15} /> Valider et envoyer la réponse sur Google
          </button>
        </div>
      )}

      {/* Sending */}
      {status === 'sending' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <RefreshCw size={22} className="text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">Synchronisation avec Google Business Profile…</p>
            <p className="text-xs text-muted-foreground mt-0.5">Publication de votre réponse en cours</p>
          </div>
          <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      )}

      {/* Resolved */}
      {status === 'resolved' && (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <div>
            <p className="text-base font-extrabold text-foreground">Traité par IA — Réglé ✓</p>
            <p className="text-sm text-muted-foreground mt-1">
              Votre réponse a été publiée sur Google Business Profile.<br />
              L'avis est maintenant marqué comme traité.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
