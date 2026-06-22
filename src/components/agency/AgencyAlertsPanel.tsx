/**
 * AgencyAlertsPanel — Priority alert cards for the agency dashboard.
 * Surfaces clients with unhandled reviews, critical GEO score, or inactivity.
 */
import { useState } from 'react';
import type { MockClient } from './ClientCard';
import type { ClientSnapshot } from '../../hooks/useAgencyRealTimeKPIs';

/* ── Types ───────────────────────────────────────────────────────────────── */
type AlertSeverity = 'critical' | 'warning' | 'info';

interface Alert {
  id: string;
  clientId: string;
  clientName: string;
  emoji: string;
  icon: string;
  message: string;
  severity: AlertSeverity;
}

/* ── Style maps ──────────────────────────────────────────────────────────── */
const SEVERITY_STYLES: Record<AlertSeverity, {
  bg: string; border: string; badge: string; badgeText: string; label: string;
}> = {
  critical: {
    bg: 'rgba(239,68,68,.06)',
    border: 'rgba(239,68,68,.28)',
    badge: 'rgba(239,68,68,.18)',
    badgeText: '#EF4444',
    label: 'CRITIQUE',
  },
  warning: {
    bg: 'rgba(245,158,11,.06)',
    border: 'rgba(245,158,11,.28)',
    badge: 'rgba(245,158,11,.18)',
    badgeText: '#F59E0B',
    label: 'ALERTE',
  },
  info: {
    bg: 'rgba(99,89,248,.06)',
    border: 'rgba(99,89,248,.28)',
    badge: 'rgba(99,89,248,.18)',
    badgeText: '#6359F8',
    label: 'INFO',
  },
};

/* ── Build alert list from clients + snapshots ───────────────────────────── */
function buildAlerts(clients: MockClient[], snapshots: ClientSnapshot[]): Alert[] {
  const alerts: Alert[] = [];
  const snapshotMap = new Map(snapshots.map(s => [s.userId, s]));

  for (const client of clients) {
    const snap = snapshotMap.get(client.id);

    // 1. Unhandled reviews > 3 (use realtime snapshot if available, else client data)
    const unhandled = snap?.totalUnhandledReviews ?? client.reviewsUnread;
    if (unhandled > 3) {
      alerts.push({
        id: `rev-${client.id}`,
        clientId: client.id,
        clientName: client.name,
        emoji: client.emoji,
        icon: '📢',
        message: `${unhandled} avis sans réponse`,
        severity: unhandled > 6 ? 'critical' : 'warning',
      });
    }

    // 2. GEO score < 40
    const geoScore = snap?.latestGeoScore ?? client.geoScore;
    if (geoScore < 40) {
      alerts.push({
        id: `geo-${client.id}`,
        clientId: client.id,
        clientName: client.name,
        emoji: client.emoji,
        icon: '⚠️',
        message: `Score GEO critique : ${geoScore}%`,
        severity: 'critical',
      });
    }

    // 3. Inactive for 7+ days (snapshot-based only)
    if (snap && snap.daysSinceLastActivity >= 7) {
      alerts.push({
        id: `idle-${client.id}`,
        clientId: client.id,
        clientName: client.name,
        emoji: client.emoji,
        icon: '😴',
        message: `Inactif depuis ${snap.daysSinceLastActivity}j`,
        severity: 'info',
      });
    }

    // 4. Client status alert from mock/DB (catch-all for status === 'alert' without other triggers)
    if (client.status === 'alert' && unhandled <= 3 && geoScore >= 40) {
      alerts.push({
        id: `status-${client.id}`,
        clientId: client.id,
        clientName: client.name,
        emoji: client.emoji,
        icon: '🔔',
        message: `Attention requise`,
        severity: 'warning',
      });
    }
  }

  // Sort: critical first, then warning, then info
  const ORDER: AlertSeverity[] = ['critical', 'warning', 'info'];
  alerts.sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));

  return alerts;
}

/* ── Individual alert card ───────────────────────────────────────────────── */
function AlertCard({ alert, onPilot }: { alert: Alert; onPilot: (clientId: string) => void }) {
  const s = SEVERITY_STYLES[alert.severity];
  return (
    <div
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 12,
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Emoji + icon */}
      <div style={{ fontSize: '1.15rem', flexShrink: 0, lineHeight: 1 }}>
        {alert.emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '.8rem', color: 'hsl(var(--foreground))' }}>
            {alert.clientName}
          </span>
          <span
            style={{
              fontSize: '.6rem',
              fontWeight: 800,
              letterSpacing: '.05em',
              background: s.badge,
              color: s.badgeText,
              borderRadius: 99,
              padding: '1px 7px',
            }}
          >
            {s.label}
          </span>
        </div>
        <p style={{ fontSize: '.72rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
          {alert.icon} {alert.message}
        </p>
      </div>

      {/* Pilot CTA */}
      <button
        onClick={() => onPilot(alert.clientId)}
        style={{
          flexShrink: 0,
          background: s.badge,
          color: s.badgeText,
          border: `1px solid ${s.border}`,
          borderRadius: 8,
          padding: '5px 11px',
          fontSize: '.7rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'opacity .15s',
          whiteSpace: 'nowrap',
        }}
        className="hover:opacity-80"
      >
        Piloter
      </button>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
export interface AgencyAlertsPanelProps {
  clients: MockClient[];
  clientSnapshots?: ClientSnapshot[];
  onPilot: (clientId: string) => void;
  maxVisible?: number;
}

export function AgencyAlertsPanel({
  clients,
  clientSnapshots = [],
  onPilot,
  maxVisible = 5,
}: AgencyAlertsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const alerts = buildAlerts(clients, clientSnapshots);

  if (alerts.length === 0) return null;

  const visible = showAll ? alerts : alerts.slice(0, maxVisible);
  const hiddenCount = alerts.length - maxVisible;

  return (
    <div
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'rgba(239,68,68,.12)',
            border: '1px solid rgba(239,68,68,.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '.9rem',
            flexShrink: 0,
          }}
        >
          🚨
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '.85rem', fontWeight: 700, margin: 0, color: 'hsl(var(--foreground))' }}>
            Alertes prioritaires
          </p>
          <p style={{ fontSize: '.68rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>
            {alerts.length} client{alerts.length > 1 ? 's' : ''} nécessitent votre attention
          </p>
        </div>
        {alerts.filter(a => a.severity === 'critical').length > 0 && (
          <span
            style={{
              fontSize: '.65rem',
              fontWeight: 800,
              background: 'rgba(239,68,68,.18)',
              color: '#EF4444',
              borderRadius: 99,
              padding: '2px 9px',
              animation: 'kpi-pulse-ring 1.8s ease-out infinite',
            }}
          >
            {alerts.filter(a => a.severity === 'critical').length} critique{alerts.filter(a => a.severity === 'critical').length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Alert list */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {visible.map(alert => (
          <AlertCard key={alert.id} alert={alert} onPilot={onPilot} />
        ))}

        {/* "See all" toggle */}
        {!showAll && hiddenCount > 0 && (
          <button
            onClick={() => setShowAll(true)}
            style={{
              background: 'transparent',
              border: '1px dashed hsl(var(--border))',
              borderRadius: 10,
              padding: '8px',
              fontSize: '.75rem',
              fontWeight: 600,
              color: 'hsl(var(--muted-foreground))',
              cursor: 'pointer',
              transition: 'color .15s',
              width: '100%',
              textAlign: 'center',
            }}
            className="hover:text-foreground"
          >
            Voir les {hiddenCount} autre{hiddenCount > 1 ? 's' : ''} alerte{hiddenCount > 1 ? 's' : ''}…
          </button>
        )}
        {showAll && alerts.length > maxVisible && (
          <button
            onClick={() => setShowAll(false)}
            style={{
              background: 'transparent',
              border: '1px dashed hsl(var(--border))',
              borderRadius: 10,
              padding: '8px',
              fontSize: '.75rem',
              fontWeight: 600,
              color: 'hsl(var(--muted-foreground))',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'center',
            }}
          >
            Réduire ↑
          </button>
        )}
      </div>
    </div>
  );
}
