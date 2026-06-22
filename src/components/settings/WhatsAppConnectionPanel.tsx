/**
 * WhatsAppConnectionPanel — WhatsApp Business API connection card.
 * Displayed alongside the Meta connection panel in Settings.
 * Phases: idle → consent → connected
 */
import { useState } from 'react';
import { Check, Lock, RefreshCw, Unlink, ExternalLink } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

type Phase = 'idle' | 'connecting' | 'connected';

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function WhatsAppConnectionPanel() {
  const [phase, setPhase] = useState<Phase>('idle');

  const handleConnect = () => {
    setPhase('connecting');
    setTimeout(() => {
      setPhase('connected');
      toast.success('WhatsApp Business connecté ! 🎉', {
        description: 'Vos messages WhatsApp arrivent maintenant dans la Messagerie Unique.',
      });
    }, 1800);
  };

  const handleDisconnect = () => {
    setPhase('idle');
    toast('WhatsApp Business déconnecté', { description: 'Vous pouvez le reconnecter à tout moment.' });
  };

  if (phase === 'connected') {
    return (
      <div className="rounded-2xl border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-50/80 to-card dark:from-emerald-950/20 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-200/60 bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-md text-white">
            <WhatsAppIcon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-foreground">WhatsApp Business connecté ✅</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Messages centralisés dans la Messagerie Unique</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Actif
          </span>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 px-4 py-3 space-y-2">
            <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Fonctionnalités actives</p>
            {[
              '💬 Messages clients reçus dans la Messagerie Unique',
              '🤖 Réponses IA suggérées pour chaque message',
              '📣 Campagnes Flash WhatsApp (98% ouverture)',
              '📅 Notifications de rendez-vous automatiques',
            ].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check size={11} className="text-emerald-600 shrink-0" strokeWidth={3} />
                <span className="text-[11px] text-foreground/80">{f}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toast.success('Synchronisation WhatsApp lancée…')}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-2 transition-colors"
            >
              <RefreshCw size={12} /> Synchroniser maintenant
            </button>
            <button
              onClick={() => window.open('https://business.whatsapp.com/', '_blank')}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
            >
              <ExternalLink size={12} /> WhatsApp Business Manager
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-2 transition-colors ml-auto"
            >
              <Unlink size={12} /> Déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Green top bar */}
      <div className="h-2 bg-[#25D366]" />

      <div className="px-5 py-5 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg text-white">
            <WhatsAppIcon size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-foreground">WhatsApp Business</h3>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">Offre Business & Franchise</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">
              Activez les notifications de rendez-vous et la centralisation des messages WhatsApp. Répondez en 1 clic grâce à l'IA.
            </p>
          </div>
        </div>

        {/* What it unlocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { emoji: '💬', label: 'Messagerie unifiée', desc: 'WA + IG + Facebook' },
            { emoji: '🤖', label: 'Réponses IA', desc: 'Répondre en 1 clic' },
            { emoji: '📣', label: 'Campagnes Flash', desc: '98% taux d\'ouverture' },
          ].map(f => (
            <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
              <span className="text-lg shrink-0">{f.emoji}</span>
              <div>
                <p className="text-xs font-bold text-foreground leading-tight">{f.label}</p>
                <p className="text-[10px] text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleConnect}
          disabled={phase === 'connecting'}
          className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-sm font-extrabold text-white shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
        >
          {phase === 'connecting' ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Connexion en cours…
            </>
          ) : (
            <>
              <WhatsAppIcon size={20} />
              Associer mon compte WhatsApp Business 💬
            </>
          )}
        </button>

        {/* Reassurance */}
        <div className="flex items-start gap-2.5">
          <Lock size={13} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-snug">
            <span className="font-semibold text-foreground">Connexion sécurisée via l'API officielle WhatsApp Business.</span>{' '}
            Kompilot ne stocke jamais vos messages. Conforme RGPD. Révoquez l'accès à tout moment.
          </p>
        </div>
      </div>
    </div>
  );
}
