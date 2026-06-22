import { useState, useEffect } from 'react';
import { Phone, MapPin, CalendarCheck } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';

// ── Business conversion KPIs ──────────────────────────────────────────────────
const BUSINESS_KPIS = [
  {
    icon: Phone,
    emoji: '📞',
    label: 'Appels téléphoniques',
    sublabel: 'Clics "Appeler" depuis vos posts SEO & Google Maps',
    value: 23,
    trend: '+8 vs semaine dernière',
    gradient: 'from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/20',
    textAccent: 'text-blue-500',
  },
  {
    icon: MapPin,
    emoji: '🗺️',
    label: "Demandes d'itinéraires",
    sublabel: 'GPS lancés (Waze / Google Maps) suite à un post',
    value: 47,
    trend: '+12 vs semaine dernière',
    gradient: 'from-teal-500 to-emerald-500',
    glow: 'shadow-teal-500/20',
    textAccent: 'text-teal-500',
  },
  {
    icon: CalendarCheck,
    emoji: '📅',
    label: 'Redirections Réservations',
    sublabel: 'Clics vers votre lien Planity / Fresha / TheFork',
    value: 31,
    trend: '+5 vs semaine dernière',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'shadow-violet-500/20',
    textAccent: 'text-violet-500',
  },
];

const STORAGE_KEY = 'kompilot_panier_moyen';
const ABONNEMENT = 29; // € / month

// ── Main exported component ───────────────────────────────────────────────────
export function ROIBusinessSection() {
  const [panierMoyen, setPanierMoyen] = useState<number>(45);

  // Load persisted panier moyen
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val > 0) setPanierMoyen(val);
    }
  }, []);

  // Persist on change
  const handlePanierChange = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setPanierMoyen(num);
      localStorage.setItem(STORAGE_KEY, String(num));
    }
  };

  // Formula: (itineraires + reservations) × panierMoyen
  const itineraires = BUSINESS_KPIS[1].value; // 47
  const reservations = BUSINESS_KPIS[2].value; // 31
  const redirections = itineraires + reservations; // 78
  const caEstime = redirections * panierMoyen;
  const ratio = Math.min(Math.round((caEstime / ABONNEMENT) * 100), 999);

  const handleWhatsApp = () => {
    toast.success('🎉 Notifications WhatsApp activées !', {
      description: 'Vous recevrez votre bilan chaque vendredi à 18h.',
    });
  };

  return (
    <div className="space-y-5">
      {/* ── Section header ── */}
      <div className="flex items-center gap-2">
        <span className="text-base font-extrabold text-foreground">📈 Conversions Business</span>
        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 uppercase tracking-wide">
          Cette semaine
        </span>
      </div>

      {/* ── 3 KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BUSINESS_KPIS.map((kpi) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`relative bg-card border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg ${kpi.glow} transition-all hover:-translate-y-0.5 overflow-hidden`}
            >
              {/* subtle gradient strip on the left */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b ${kpi.gradient}`} />

              <div className="flex items-center gap-3 pl-2">
                <div className={`flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-sm`}>
                  <IconComp size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-snug">{kpi.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-snug max-w-[160px]">{kpi.sublabel}</p>
                </div>
              </div>

              <div className="pl-2 flex items-end justify-between">
                <p className={`text-4xl font-black tabular-nums leading-none ${kpi.textAccent}`}>
                  {kpi.value}
                </p>
                <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 text-right leading-snug">
                  ↑ {kpi.trend}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CA Estimator ("Score CACHA") ── */}
      <div className="relative rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 dark:from-teal-950/30 dark:to-emerald-950/20 dark:border-teal-800 p-5 overflow-hidden">
        {/* Left gradient border accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-gradient-to-b from-teal-400 to-emerald-500" />

        <div className="pl-2 space-y-4">
          <div>
            <p className="text-sm font-extrabold text-foreground">💰 Impact Kompilot estimé ce mois-ci</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Calculé à partir de vos redirections GPS + réservation
            </p>
          </div>

          {/* Panier moyen input */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
              Valeur moyenne d&apos;un panier client (€)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="9999"
                value={panierMoyen}
                onChange={(e) => handlePanierChange(e.target.value)}
                className="w-20 rounded-lg border border-border bg-background text-foreground text-sm font-bold text-center px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
              />
              <span className="text-xs font-semibold text-muted-foreground">€</span>
            </div>
          </div>

          {/* CA Result */}
          <div className="rounded-xl bg-white/70 dark:bg-white/5 border border-teal-200/60 dark:border-teal-700/40 px-4 py-3">
            <p className="text-sm font-bold text-foreground leading-relaxed">
              💰 Impact Kompilot estimé :{' '}
              <span className="text-teal-600 dark:text-teal-400">
                {redirections} redirections
              </span>
              {' × '}
              <span className="text-teal-600 dark:text-teal-400">{panierMoyen}€</span>
              {' = '}
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {caEstime.toLocaleString('fr-FR')} €
              </span>
              {' '}
              <span className="text-muted-foreground font-normal text-xs">générés ce mois-ci</span>
            </p>
          </div>

          {/* ROI ratio */}
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <p className="text-sm text-foreground">
              Votre abonnement Kompilot est rentabilisé à{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {ratio}%
              </strong>{' '}
              ce mois-ci.
            </p>
          </div>
        </div>
      </div>

      {/* ── WhatsApp Win Notification ── */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div>
          <p className="text-sm font-extrabold text-foreground">🏆 Récapitulatif victoires hebdomadaires</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Recevez chaque vendredi soir votre bilan de la semaine directement sur WhatsApp
          </p>
        </div>

        {/* Message preview */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
            Aperçu du message
          </p>
          <div className="relative">
            <textarea
              readOnly
              rows={3}
              value={`Félicitations [Votre prénom] ! Cette semaine, vos posts optimisés GEO ont généré 12 demandes d'itinéraires et 8 clics vers votre planning de réservation. Bon week-end ! 🚀`}
              className="w-full rounded-xl border border-border bg-muted/40 text-muted-foreground text-xs leading-relaxed px-3 py-2.5 resize-none focus:outline-none cursor-default"
            />
            {/* WhatsApp green bubble corner indicator */}
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#25D366] shadow-sm" />
          </div>
        </div>

        {/* CTA button */}
        <button
          onClick={handleWhatsApp}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-green-500/20 active:scale-95"
          style={{ backgroundColor: '#25D366' }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Activer les notifications WhatsApp 💬
        </button>
      </div>
    </div>
  );
}
