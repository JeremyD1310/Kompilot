/**
 * ROIPushEngine — Moteur de notifications push exclusivement financières.
 *
 * 3 types d'alertes :
 *   1. Anti No-Show  — empreinte Stripe manquante sur RDV imminent
 *   2. CRM Relance   — note client arrivant à échéance
 *   3. Lead Social   — coordonnée capturée via Comment-to-DM
 *
 * Chaque notification inclut un deep link + message IA pré-rédigé.
 * Ton : premium, élégant, NON casino. Aucune notification publicitaire.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Bell, MessageSquare, ChevronRight, Send } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { useNavigate } from '@tanstack/react-router';

// ── Types ────────────────────────────────────────────────────────────────────

type PushAlertType = 'noshow' | 'crm' | 'social';

interface PushAlert {
  id: string;
  type: PushAlertType;
  title: string;
  body: string;
  aiMessage: string;     // Message pré-rédigé par l'IA
  deepLink: string;      // Route vers fiche/action
  amount?: number;       // Euros en jeu (si applicable)
  timestamp: Date;
}

// ── Alert catalog (simulated triggers) ────────────────────────────────────────

const ALERT_TEMPLATES: Omit<PushAlert, 'id' | 'timestamp'>[] = [
  {
    type: 'noshow',
    title: '⚠️ Rendez-vous sans garantie — 45 min',
    body: 'Marie Dupont | RDV Coupe + Couleur | 14h30. Aucune empreinte Stripe enregistrée.',
    aiMessage: 'Bonjour Marie, pour confirmer votre rendez-vous de demain à 14h30, une empreinte de garantie est requise. Cela vous prend 30 secondes et sécurise votre créneau. Lien sécurisé : [lien Stripe]',
    deepLink: '/inbox',
    amount: 65,
  },
  {
    type: 'crm',
    title: '📋 Relance contrat à échéance aujourd\'hui',
    body: 'Pierre Martin | Fin de chantier prévu le 09/06. Note client enregistrée il y a 14 jours.',
    aiMessage: 'Bonjour Pierre, nous approchons de la fin de votre chantier de rénovation. Un bilan final s\'impose — souhaitez-vous convenir d\'une date de réception des travaux cette semaine ?',
    deepLink: '/inbox',
    amount: 2400,
  },
  {
    type: 'social',
    title: '✅ Lead capturé via Comment-to-DM',
    body: 'Nouveau contact : @sophie.b.nantes | Email : sophie.b@gmail.com | Mot-clé : MENU',
    aiMessage: 'Bonjour Sophie, merci pour votre intérêt ! Voici notre carte du moment avec nos formules du jour. Souhaitez-vous réserver votre table pour cette semaine ?',
    deepLink: '/inbox',
  },
];

// ── Deep Link Action Card ─────────────────────────────────────────────────────

interface AlertCardProps {
  alert: PushAlert;
  onDismiss: (id: string) => void;
  onAction: (alert: PushAlert) => void;
}

function AlertCard({ alert, onDismiss, onAction }: AlertCardProps) {
  const iconMap: Record<PushAlertType, { Icon: typeof ShieldCheck; color: string; bg: string }> = {
    noshow: { Icon: ShieldCheck, color: '#F87171', bg: 'rgba(239,68,68,0.12)' },
    crm:    { Icon: Bell,        color: '#FCD34D', bg: 'rgba(245,158,11,0.12)' },
    social: { Icon: MessageSquare, color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
  };

  const { Icon, color, bg } = iconMap[alert.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 320, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 320, scale: 0.96 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #0F1629 0%, #1a2235 100%)',
        border: `1px solid ${color}30`,
        maxWidth: 340,
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: bg, border: `1px solid ${color}25` }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white leading-tight">{alert.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{alert.body}</p>
          </div>
          <button
            onClick={() => onDismiss(alert.id)}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Amount badge */}
        {alert.amount && (
          <div
            className="flex items-center gap-1.5 text-[10px] font-bold rounded-lg px-2.5 py-1 w-fit"
            style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}
          >
            💰 {alert.amount.toLocaleString('fr-FR')} € en jeu
          </div>
        )}

        {/* AI pre-written message preview */}
        <div
          className="rounded-xl p-3 text-[11px] text-slate-300 leading-relaxed italic"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5 not-italic">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Message IA pré-rédigé</span>
          </div>
          "{alert.aiMessage.slice(0, 90)}{alert.aiMessage.length > 90 ? '…' : ''}"
        </div>

        {/* Deep link action */}
        <Button
          onClick={() => onAction(alert)}
          className="w-full h-9 text-xs font-bold gap-2"
          style={{ background: `linear-gradient(135deg, ${color}20, ${color}15)`, color, border: `1px solid ${color}30` }}
        >
          <Send size={13} />
          Validé par l'IA : Envoyer
          <ChevronRight size={12} className="ml-auto" />
        </Button>
      </div>
    </motion.div>
  );
}

// ── Permission Request Banner ─────────────────────────────────────────────────

interface PermissionBannerProps {
  onAllow: () => void;
  onDismiss: () => void;
}

function PermissionBanner({ onAllow, onDismiss }: PermissionBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-6 left-1/2 z-[9000] w-[calc(100vw-2rem)] max-w-sm"
      style={{ x: '-50%' } as React.CSSProperties}
    >
      <div
        className="rounded-2xl p-5 space-y-3"
        style={{
          background: 'linear-gradient(135deg, #0F1629 0%, #0D1F3C 100%)',
          border: '1px solid rgba(13,148,136,0.35)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,148,136,0.1)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D9488]/15 border border-[#0D9488]/25 flex items-center justify-center shrink-0">
            <Bell size={20} className="text-[#0D9488]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Activez votre radar de trésorerie</p>
            <p className="text-xs text-slate-400 mt-1 leading-snug">
              Autorisez Kompilot à vous alerter dès qu'une opportunité de chiffre d'affaires est détectée sur votre zone. Aucune notification publicitaire — uniquement des alertes financières concrètes.
            </p>
          </div>
          <button onClick={onDismiss} className="text-slate-500 hover:text-slate-300 shrink-0">
            <X size={14} />
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onAllow}
            className="flex-1 h-9 text-xs font-bold bg-[#0D9488] hover:bg-[#0B7A6F] text-white gap-1.5"
          >
            <Bell size={13} />
            Autoriser les alertes
          </Button>
          <Button
            onClick={onDismiss}
            variant="ghost"
            className="text-xs text-slate-500 hover:text-slate-300 h-9 px-3"
          >
            Plus tard
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Provider ─────────────────────────────────────────────────────────────

const PERMISSION_KEY = 'kompilot_push_permission';
const PERMISSION_ASKED_KEY = 'kompilot_push_asked';

export function ROIPushEngine() {
  const [alerts, setAlerts] = useState<PushAlert[]>([]);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const navigate = useNavigate();

  // Show permission banner once (after 4s on first visit)
  useEffect(() => {
    const alreadyAsked = localStorage.getItem(PERMISSION_ASKED_KEY);
    const alreadyAllowed = localStorage.getItem(PERMISSION_KEY) === 'granted';
    if (alreadyAllowed) { setPushEnabled(true); return; }
    if (alreadyAsked) return;
    const timer = setTimeout(() => setShowPermissionBanner(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleAllowPush = useCallback(async () => {
    setShowPermissionBanner(false);
    localStorage.setItem(PERMISSION_ASKED_KEY, '1');

    // Request browser permission
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          localStorage.setItem(PERMISSION_KEY, 'granted');
          setPushEnabled(true);
          // Simulate first alert (onboarding demo)
          setTimeout(() => triggerDemoAlert('social'), 1500);
        }
      } catch {
        // silently fail
      }
    } else if (Notification.permission === 'granted') {
      localStorage.setItem(PERMISSION_KEY, 'granted');
      setPushEnabled(true);
    }
  }, []);

  const handleDismissPermission = useCallback(() => {
    setShowPermissionBanner(false);
    localStorage.setItem(PERMISSION_ASKED_KEY, '1');
  }, []);

  const triggerDemoAlert = useCallback((type: PushAlertType) => {
    const template = ALERT_TEMPLATES.find(t => t.type === type) ?? ALERT_TEMPLATES[0];
    const alert: PushAlert = {
      ...template,
      id: `${type}-${Date.now()}`,
      timestamp: new Date(),
    };
    setAlerts(prev => [alert, ...prev].slice(0, 3)); // max 3 stacked
  }, []);

  // Register trigger for external callers (useROIPush hook + custom event)
  useEffect(() => {
    _triggerAlert = triggerDemoAlert;
    return () => { _triggerAlert = null; };
  }, [triggerDemoAlert]);

  // Listen for external push trigger events
  useEffect(() => {
    const handler = (e: Event) => {
      const type = (e as CustomEvent<{ type: PushAlertType }>).detail?.type;
      if (type) triggerDemoAlert(type);
    };
    window.addEventListener('kompilot:push-alert', handler);
    return () => window.removeEventListener('kompilot:push-alert', handler);
  }, [triggerDemoAlert]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleAction = useCallback((alert: PushAlert) => {
    dismissAlert(alert.id);
    navigate({ to: alert.deepLink as '/inbox' });
  }, [dismissAlert, navigate]);

  // Simulate periodic financial alerts when push is enabled
  useEffect(() => {
    if (!pushEnabled) return;
    const delays = [8000, 25000, 50000];
    const types: PushAlertType[] = ['noshow', 'crm', 'social'];
    const timers = delays.map((delay, i) =>
      setTimeout(() => triggerDemoAlert(types[i]), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [pushEnabled, triggerDemoAlert]);

  return (
    <>
      {/* Permission banner */}
      <AnimatePresence>
        {showPermissionBanner && !alerts.length && (
          <PermissionBanner
            key="perm-banner"
            onAllow={handleAllowPush}
            onDismiss={handleDismissPermission}
          />
        )}
      </AnimatePresence>

      {/* Stacked alert cards — bottom right */}
      <div className="fixed bottom-6 right-4 z-[9000] flex flex-col gap-2 items-end">
        <AnimatePresence mode="popLayout">
          {alerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDismiss={dismissAlert}
              onAction={handleAction}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

/**
 * Hook to manually trigger a financial push alert from any component.
 * Used by no-show, CRM, and social modules.
 */
let _triggerAlert: ((type: PushAlertType) => void) | null = null;

export function useROIPush() {
  return {
    triggerAlert: (type: PushAlertType) => _triggerAlert?.(type),
  };
}

export default ROIPushEngine;
