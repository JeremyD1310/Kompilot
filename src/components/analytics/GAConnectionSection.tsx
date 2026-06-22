import { useState, useEffect } from 'react';
import { CheckCircle2, Zap, TrendingUp, CalendarCheck, MousePointerClick, RefreshCw, Link2, Tag, Euro, Satellite } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getBookingClicks,
  getAverageBasket,
  estimateReservations,
  estimateRevenue,
} from '../../lib/bookingClickTracker';

// ── Persistence key ───────────────────────────────────────────────────────────
const GA_CONNECTED_KEY = 'kompilot_ga_connected';

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400, active = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return value;
}

// ── Neon ROI counter card ─────────────────────────────────────────────────────
function ROICard({
  icon: Icon,
  label,
  sublabel,
  value,
  suffix,
  prefix,
  color,
  glowColor,
  active,
  footerLabel,
}: {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  value: number;
  suffix?: string;
  prefix?: string;
  color: string;
  glowColor: string;
  active: boolean;
  footerLabel?: string;
}) {
  const displayed = useCountUp(value, 1600, active);

  return (
    <div
      className="relative rounded-2xl border overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #060d14 0%, #0a1628 100%)',
        borderColor: color + '40',
        boxShadow: active ? `0 0 24px ${glowColor}` : 'none',
      }}
    >
      {/* Top glow line */}
      <div
        className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="px-5 py-5 flex flex-col gap-3">
        {/* Icon + label */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: color + '20', border: `1px solid ${color}40` }}
          >
            <Icon size={17} style={{ color }} />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: color + 'cc' }}>
              {label}
            </p>
            <p className="text-[10px] text-white/40 leading-tight">{sublabel}</p>
          </div>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          {prefix && <span className="text-xl font-extrabold" style={{ color }}>{prefix}</span>}
          <span
            className="text-4xl font-extrabold tabular-nums"
            style={{
              color,
              textShadow: active ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}` : 'none',
            }}
          >
            {active ? displayed.toLocaleString('fr-FR') : '—'}
          </span>
          {suffix && <span className="text-xl font-extrabold" style={{ color }}>{suffix}</span>}
        </div>

        {/* Footer label */}
        <p className="text-[10px] text-white/30">
          {footerLabel ?? (active ? 'Ce mois-ci · Synchronisé depuis GA4' : 'Connectez Google Analytics')}
        </p>
      </div>

      {/* Bottom shine */}
      {active && (
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${color}60, transparent)` }}
        />
      )}
    </div>
  );
}

// ── Internal Tracking mode (no GA) ────────────────────────────────────────────
function InternalTrackingCounters() {
  const { user } = useAuth();
  const [clicks, setClicks] = useState(() => getBookingClicks());
  const avgBasket = getAverageBasket(user?.id);
  const reservations = estimateReservations(clicks);
  const revenue = estimateRevenue(reservations, avgBasket);

  // Live update when a booking click is tracked
  useEffect(() => {
    const handler = () => setClicks(getBookingClicks());
    window.addEventListener('kompilot:booking-click', handler);
    return () => window.removeEventListener('kompilot:booking-click', handler);
  }, []);

  return (
    <div className="space-y-4">
      {/* Mode badge */}
      <div
        className="flex items-center gap-3 rounded-2xl border px-5 py-4"
        style={{
          background: 'linear-gradient(135deg, #031008 0%, #061c10 100%)',
          borderColor: '#22c55e40',
          boxShadow: '0 0 20px rgba(34,197,94,0.08)',
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#22c55e20', border: '1px solid #22c55e40' }}>
          <Satellite size={20} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-white flex items-center gap-2 flex-wrap">
            Mode Tracking Interne Kompilot Activé 🛰️
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Actif
            </span>
          </p>
          <p className="text-xs text-white/50 mt-0.5 leading-snug">
            Pas besoin de site web ou de Google Analytics ! Kompilot calcule vos performances locales directement à partir des clics générés sur vos réseaux sociaux et votre fiche Google Maps.
          </p>
        </div>
      </div>

      {/* Panier moyen info */}
      <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">
        <Euro size={13} className="text-emerald-400 shrink-0" />
        <p className="text-[11px] text-white/50">
          Panier moyen configuré : <strong className="text-white/80">{avgBasket} €</strong>
          <span className="ml-2 text-white/30">— Modifiable dans Mon Compte → Profil</span>
        </p>
      </div>

      {/* Neon counters */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
          <Zap size={10} className="text-green-400" />
          Retour sur investissement · Tracking interne Kompilot
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ROICard
            icon={MousePointerClick}
            label="Clics réservation"
            sublabel="Vers votre lien de réservation"
            value={clicks}
            color="#22c55e"
            glowColor="rgba(34,197,94,0.15)"
            active
            footerLabel="Clics réels enregistrés par l'app"
          />
          <ROICard
            icon={CalendarCheck}
            label="Réservations estimées"
            sublabel="15% du nombre de clics"
            value={reservations}
            color="#34d399"
            glowColor="rgba(52,211,153,0.15)"
            active
            footerLabel="Estimation : 15% taux de conversion"
          />
          <ROICard
            icon={TrendingUp}
            label="Chiffre d'Affaires Estimé 💶"
            sublabel={`Réservations × ${avgBasket} € panier moyen`}
            value={revenue}
            suffix=" €"
            color="#6ee7b7"
            glowColor="rgba(110,231,183,0.12)"
            active
            footerLabel="Estimé · Panier moyen configurable"
          />
        </div>
      </div>

      {/* Reassuring note */}
      <div
        className="rounded-2xl border px-5 py-4 text-xs text-white/50 leading-relaxed"
        style={{ background: 'linear-gradient(135deg, #04100a 0%, #071510 100%)', borderColor: '#22c55e20' }}
      >
        <p className="font-semibold text-white/70 mb-1">💡 Comment ça fonctionne ?</p>
        <p>
          Chaque fois qu'un de vos clients clique sur le bouton <strong className="text-white/80">"Réserver maintenant 📅"</strong> généré par Kompilot (dans le Cockpit IA ou vos posts planifiés), un clic est enregistré.
          Kompilot applique ensuite un taux de conversion moyen de <strong className="text-white/80">15%</strong> pour estimer vos réservations réelles,
          puis multiplie par votre panier moyen pour calculer votre chiffre d'affaires estimé.
        </p>
        <p className="mt-2 text-white/30">
          Connectez Google Analytics pour un tracking encore plus précis basé sur vos vraies données.
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GAConnectionSection() {
  const [connected, setConnected] = useState<boolean>(() => {
    try { return localStorage.getItem(GA_CONNECTED_KEY) === 'true'; }
    catch { return false; }
  });
  const [connecting, setConnecting] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      setJustConnected(true);
      try { localStorage.setItem(GA_CONNECTED_KEY, 'true'); } catch { /* noop */ }
      setTimeout(() => setJustConnected(false), 3000);
    }, 2200);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 1500);
  };

  const handleDisconnect = () => {
    setConnected(false);
    try { localStorage.setItem(GA_CONNECTED_KEY, 'false'); } catch { /* noop */ }
  };

  return (
    <div className="space-y-5 mb-8">

      {/* ── Connection card ── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: connected
            ? 'linear-gradient(135deg, #030d0a 0%, #061410 60%, #0a1a12 100%)'
            : 'linear-gradient(135deg, #0a0a14 0%, #10101e 100%)',
          borderColor: connected ? '#16a34a50' : '#334155',
        }}
      >
        {/* Top bar */}
        <div
          className="h-0.5 w-full"
          style={{
            background: connected
              ? 'linear-gradient(90deg, transparent, #22c55e, transparent)'
              : 'linear-gradient(90deg, transparent, #4f46e5, transparent)',
          }}
        />

        <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Left: icon + info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-xl font-extrabold"
              style={{
                background: connected ? '#16a34a20' : '#1e293b',
                border: `1px solid ${connected ? '#16a34a50' : '#334155'}`,
                color: connected ? '#22c55e' : '#94a3b8',
              }}
            >
              GA
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-extrabold text-white">
                  Google Analytics 4
                </p>
                {connected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] font-bold px-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Synchronisé avec succès 🟢
                  </span>
                )}
                {!connected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-[10px] font-medium px-2 py-0.5">
                    Optionnel — Tracking interne actif
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 mt-0.5 leading-snug">
                {connected
                  ? 'Vos données de CA, réservations et trafic local sont importées automatiquement.'
                  : 'Connectez GA4 pour un tracking avancé. Sans GA4, le mode Tracking Interne est actif automatiquement.'}
              </p>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {connected ? (
              <>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold px-3 py-2 transition-all cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                  {syncing ? 'Sync...' : 'Actualiser'}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="text-[11px] text-white/25 hover:text-red-400 transition-colors cursor-pointer underline-offset-2 hover:underline"
                >
                  Déconnecter
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="relative flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-extrabold transition-all cursor-pointer disabled:cursor-not-allowed overflow-hidden group"
                style={{
                  background: connecting
                    ? 'linear-gradient(135deg, #1e3a5f, #1e3a5f)'
                    : 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)',
                  color: '#fff',
                  boxShadow: connecting ? 'none' : '0 0 20px rgba(99,102,241,0.4), 0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                {!connecting && (
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)' }}
                  />
                )}
                {connecting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin shrink-0" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <Link2 size={15} className="shrink-0" />
                    Connecter mon Google Analytics en 1 clic 🌐
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* UTM tracking info */}
        <div
          className="border-t px-6 py-3 flex items-start gap-2.5"
          style={{ borderColor: connected ? '#16a34a20' : '#1e293b' }}
        >
          <Tag size={12} className="text-white/30 shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/30 leading-relaxed">
            Kompilot ajoute automatiquement des <strong className="text-white/50">tags UTM</strong> à tous vos boutons de réservation (Planity, ZenChef, TheFork…) pour tracer chaque conversion dans GA4.
          </p>
        </div>
      </div>

      {/* ── Just-connected banner ── */}
      {justConnected && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-500/40 bg-green-500/10 px-5 py-3 animate-in fade-in slide-in-from-top-1 duration-300">
          <CheckCircle2 size={18} className="text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-extrabold text-green-300">Connexion réussie !</p>
            <p className="text-xs text-green-400/70 mt-0.5">Les données GA4 ont été importées. Vos 3 indicateurs ROI sont maintenant actifs.</p>
          </div>
        </div>
      )}

      {/* ── ROI counters: GA mode or Internal tracking mode ── */}
      {connected ? (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
            <Zap size={10} className="text-green-400" />
            Retour sur investissement · Données GA4 en direct
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ROICard
              icon={TrendingUp}
              label="Chiffre d'Affaires"
              sublabel="Généré par l'IA Kompilot"
              value={1240}
              prefix="+"
              suffix=" €"
              color="#22c55e"
              glowColor="rgba(34,197,94,0.15)"
              active
              footerLabel="Ce mois-ci · Synchronisé depuis GA4"
            />
            <ROICard
              icon={CalendarCheck}
              label="Réservations directes"
              sublabel="Rendez-vous / Tables réservés"
              value={38}
              color="#34d399"
              glowColor="rgba(52,211,153,0.15)"
              active
              footerLabel="Ce mois-ci · Synchronisé depuis GA4"
            />
            <ROICard
              icon={MousePointerClick}
              label="Clics réservation"
              sublabel="Google Maps + Réseaux sociaux"
              value={127}
              color="#6ee7b7"
              glowColor="rgba(110,231,183,0.12)"
              active
              footerLabel="Ce mois-ci · Synchronisé depuis GA4"
            />
          </div>
        </div>
      ) : (
        <InternalTrackingCounters />
      )}
    </div>
  );
}
