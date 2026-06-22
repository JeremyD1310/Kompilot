/**
 * DomainReputationMonitor
 * Affiche la santé de délivrabilité du domaine personnalisé de l'agence
 * avec warm-up automatique et recommandations.
 */
import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, TrendingUp, Mail, BarChart3, ChevronDown, ChevronUp, Info, Zap } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type HealthStatus = 'excellent' | 'warning' | 'risk';

interface DomainMetrics {
  status: HealthStatus;
  score: number;            // 0-100
  daysActive: number;
  dailyQuota: number;       // current warm-up quota
  maxQuota: number;         // full quota once warmed
  spfOk: boolean;
  dkimOk: boolean;
  dmarcOk: boolean;
  blacklisted: boolean;
  openRate: number;         // %
  bounceRate: number;       // %
  spamRate: number;         // %
  warmupPhase: 1 | 2 | 3 | 'complete';
}

// ── Mock data (replace with real DNS/SMTP checks) ────────────────────────────
function mockMetrics(domain: string): DomainMetrics {
  const seed = domain.length % 3;
  if (seed === 0) return {
    status: 'excellent', score: 96, daysActive: 45, dailyQuota: 500, maxQuota: 500,
    spfOk: true, dkimOk: true, dmarcOk: true, blacklisted: false,
    openRate: 32, bounceRate: 0.8, spamRate: 0.02, warmupPhase: 'complete',
  };
  if (seed === 1) return {
    status: 'warning', score: 67, daysActive: 8, dailyQuota: 80, maxQuota: 500,
    spfOk: true, dkimOk: false, dmarcOk: false, blacklisted: false,
    openRate: 24, bounceRate: 3.2, spamRate: 0.4, warmupPhase: 2,
  };
  return {
    status: 'risk', score: 31, daysActive: 2, dailyQuota: 20, maxQuota: 500,
    spfOk: false, dkimOk: false, dmarcOk: false, blacklisted: false,
    openRate: 14, bounceRate: 8.1, spamRate: 1.8, warmupPhase: 1,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<HealthStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  excellent: {
    label: 'Excellent', color: '#16A34A', bg: 'rgba(22,163,74,.1)', border: 'rgba(22,163,74,.25)',
    icon: <ShieldCheck size={15} />,
  },
  warning: {
    label: 'Warning', color: '#D97706', bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)',
    icon: <AlertTriangle size={15} />,
  },
  risk: {
    label: 'Risque', color: '#DC2626', bg: 'rgba(220,38,38,.1)', border: 'rgba(220,38,38,.25)',
    icon: <XCircle size={15} />,
  },
};

function StatusPill({ status }: { status: HealthStatus }) {
  const c = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.color, borderRadius: 20, padding: '4px 12px',
      fontSize: '.78rem', fontWeight: 800,
    }}>
      {c.icon}
      {c.label}
    </span>
  );
}

function ScoreArc({ score }: { score: number }) {
  const color = score >= 80 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626';
  const circumference = 2 * Math.PI * 30;
  const offset = circumference * (1 - score / 100);
  return (
    <div style={{ position: 'relative', width: 80, height: 80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" />
        <circle
          cx="40" cy="40" r="30" fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <span style={{ fontWeight: 900, fontSize: '1.1rem', color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '.6rem', color: 'hsl(var(--muted-foreground))', marginTop: 1 }}>/ 100</span>
      </div>
    </div>
  );
}

function WarmupProgress({ phase, daysActive, dailyQuota, maxQuota }: Pick<DomainMetrics, 'warmupPhase' | 'daysActive' | 'dailyQuota' | 'maxQuota'>) {
  const phases = [
    { label: 'Démarrage', quota: '20/j', days: '0-3j', active: phase === 1 || phase === 2 || phase === 3 || phase === 'complete' },
    { label: 'Montée', quota: '80/j', days: '4-14j', active: phase === 2 || phase === 3 || phase === 'complete' },
    { label: 'Accélération', quota: '200/j', days: '15-30j', active: phase === 3 || phase === 'complete' },
    { label: 'Plein régime', quota: '500+/j', days: '30j+', active: phase === 'complete' },
  ];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Zap size={14} style={{ color: '#F59E0B' }} />
        <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          Warm-up automatique
        </span>
        <span style={{
          background: 'rgba(245,158,11,.12)', color: '#D97706',
          border: '1px solid rgba(245,158,11,.25)',
          borderRadius: 20, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700,
        }}>
          Jour {daysActive} · {dailyQuota}/{maxQuota} emails/j
        </span>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {phases.map((p, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              height: 6, borderRadius: 3,
              background: p.active ? '#6359F8' : 'hsl(var(--muted))',
              transition: 'background .3s',
            }} />
            <p style={{ fontSize: '.6rem', color: p.active ? '#6359F8' : 'hsl(var(--muted-foreground))', marginTop: 4, fontWeight: p.active ? 700 : 400, textAlign: 'center' }}>
              {p.label}
            </p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '.72rem', color: 'hsl(var(--muted-foreground))', marginTop: 8 }}>
        Le quota d'envoi est bridé automatiquement pour protéger la réputation de votre domaine.
      </p>
    </div>
  );
}

function DnsRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid hsl(var(--border))' }}>
      <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'hsl(var(--foreground))' }}>{label}</span>
      {ok
        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16A34A', fontSize: '.75rem', fontWeight: 700 }}><ShieldCheck size={13} /> Configuré</span>
        : <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#DC2626', fontSize: '.75rem', fontWeight: 700 }}><XCircle size={13} /> Manquant</span>
      }
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface DomainReputationMonitorProps {
  domain?: string;
}

export function DomainReputationMonitor({ domain = 'app.mon-agence.fr' }: DomainReputationMonitorProps) {
  const [metrics, setMetrics] = useState<DomainMetrics | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Simulate async DNS/reputation check
    const t = setTimeout(() => setMetrics(mockMetrics(domain)), 800);
    return () => clearTimeout(t);
  }, [domain]);

  if (!metrics) {
    return (
      <div style={{
        background: 'hsl(var(--card))', border: '1.5px solid hsl(var(--border))',
        borderRadius: 16, padding: '18px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'hsl(var(--muted))', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div>
          <div style={{ width: 160, height: 12, background: 'hsl(var(--muted))', borderRadius: 6, marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <div style={{ width: 100, height: 10, background: 'hsl(var(--muted))', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[metrics.status];

  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 16, overflow: 'hidden',
    }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', cursor: 'pointer',
          background: `linear-gradient(135deg, ${cfg.bg} 0%, transparent 100%)`,
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Mail size={18} style={{ color: cfg.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontWeight: 800, fontSize: '.88rem', color: 'hsl(var(--foreground))' }}>
              📈 Santé de délivrabilité de vos emails
            </span>
            <StatusPill status={metrics.status} />
          </div>
          <code style={{ fontSize: '.72rem', color: 'hsl(var(--muted-foreground))' }}>{domain}</code>
        </div>
        <ScoreArc score={metrics.score} />
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-foreground))' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 20, borderTop: '1px solid hsl(var(--border))' }}>

          {/* Metrics strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Taux d\'ouverture', value: `${metrics.openRate}%`, good: metrics.openRate >= 20, icon: <TrendingUp size={13} /> },
              { label: 'Taux de rebond', value: `${metrics.bounceRate}%`, good: metrics.bounceRate < 2, icon: <BarChart3 size={13} /> },
              { label: 'Taux spam', value: `${metrics.spamRate}%`, good: metrics.spamRate < 0.1, icon: <AlertTriangle size={13} /> },
            ].map(m => (
              <div key={m.label} style={{
                background: 'hsl(var(--muted))', borderRadius: 12, padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                  <span style={{ color: m.good ? '#16A34A' : '#DC2626' }}>{m.icon}</span>
                  <span style={{ fontSize: '.65rem', color: 'hsl(var(--muted-foreground))', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{m.label}</span>
                </div>
                <p style={{ fontWeight: 900, fontSize: '1.1rem', color: m.good ? '#16A34A' : '#DC2626', lineHeight: 1 }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* DNS config */}
          <div>
            <p style={{ fontSize: '.72rem', fontWeight: 700, color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>Configuration DNS</p>
            <DnsRow label="SPF" ok={metrics.spfOk} />
            <DnsRow label="DKIM" ok={metrics.dkimOk} />
            <DnsRow label="DMARC" ok={metrics.dmarcOk} />
          </div>

          {/* Warm-up */}
          <div style={{ background: 'hsl(var(--muted))', borderRadius: 14, padding: '14px 16px' }}>
            <WarmupProgress
              phase={metrics.warmupPhase}
              daysActive={metrics.daysActive}
              dailyQuota={metrics.dailyQuota}
              maxQuota={metrics.maxQuota}
            />
          </div>

          {/* Recommendations */}
          {metrics.status !== 'excellent' && (
            <div style={{
              background: 'rgba(99,89,248,.05)',
              border: '1px solid rgba(99,89,248,.15)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Info size={14} style={{ color: '#6359F8' }} />
                <span style={{ fontWeight: 700, fontSize: '.8rem', color: '#6359F8' }}>Actions recommandées</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                {!metrics.spfOk && <li style={{ fontSize: '.78rem', color: 'hsl(var(--foreground))' }}>• Configurer l'enregistrement SPF dans votre DNS</li>}
                {!metrics.dkimOk && <li style={{ fontSize: '.78rem', color: 'hsl(var(--foreground))' }}>• Activer la signature DKIM pour authentifier vos emails</li>}
                {!metrics.dmarcOk && <li style={{ fontSize: '.78rem', color: 'hsl(var(--foreground))' }}>• Ajouter une politique DMARC pour protéger votre domaine</li>}
                {metrics.bounceRate > 2 && <li style={{ fontSize: '.78rem', color: 'hsl(var(--foreground))' }}>• Nettoyer votre liste de contacts (taux de rebond élevé)</li>}
                {metrics.spamRate > 0.1 && <li style={{ fontSize: '.78rem', color: 'hsl(var(--foreground))' }}>• Réviser le contenu de vos emails (trop de signaux spam)</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
