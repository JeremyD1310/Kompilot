/**
 * KompilotROIDashboard — Premium B2B ROI & automated campaign dashboard.
 * High-contrast slate/gray tones. Financial/operations grade UI.
 */
import { useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, ExternalLink, ChevronDown, RefreshCw } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ── Mock data ─────────────────────────────────────────────────────────────────

const CHART_DATA_7D = [
  { date: '10 Jun', ca: 4200, campagnes: 3 },
  { date: '11 Jun', ca: 5100, campagnes: 4 },
  { date: '12 Jun', ca: 4700, campagnes: 3 },
  { date: '13 Jun', ca: 6300, campagnes: 5 },
  { date: '14 Jun', ca: 5800, campagnes: 4 },
  { date: '15 Jun', ca: 7400, campagnes: 6 },
  { date: '16 Jun', ca: 8200, campagnes: 7 },
];

const CHART_DATA_30D = [
  { date: '18 Mai', ca: 2800, campagnes: 2 },
  { date: '22 Mai', ca: 3900, campagnes: 3 },
  { date: '26 Mai', ca: 4100, campagnes: 3 },
  { date: '30 Mai', ca: 5600, campagnes: 5 },
  { date: '03 Jun', ca: 4900, campagnes: 4 },
  { date: '07 Jun', ca: 6200, campagnes: 5 },
  { date: '11 Jun', ca: 5800, campagnes: 4 },
  { date: '16 Jun', ca: 8200, campagnes: 7 },
];

const CHART_DATA_Q = [
  { date: 'Avr S1', ca: 18000, campagnes: 12 },
  { date: 'Avr S2', ca: 22000, campagnes: 15 },
  { date: 'Mai S1', ca: 27000, campagnes: 18 },
  { date: 'Mai S2', ca: 31000, campagnes: 22 },
  { date: 'Jun S1', ca: 35000, campagnes: 26 },
  { date: 'Jun S2', ca: 41800, campagnes: 31 },
];

const CHART_MAP: Record<string, typeof CHART_DATA_7D> = {
  '7j': CHART_DATA_7D,
  '30j': CHART_DATA_30D,
  trim: CHART_DATA_Q,
};

const COPILOT_ACTIONS = [
  { id: 1, action: 'Optimisation SEO AIO', statut: 'Succès', impact: '+14% clics', ts: 'Il y a 2h', type: 'seo' },
  { id: 2, action: 'Push Campagne LinkedIn', statut: 'Succès', impact: '+6 leads', ts: 'Il y a 4h', type: 'ads' },
  { id: 3, action: 'Réponse IA — 3 avis Google', statut: 'Succès', impact: '+0.2★ moy.', ts: 'Il y a 5h', type: 'reviews' },
  { id: 4, action: 'Sync Tunnel de paiement', statut: 'Succès', impact: '+3 conv.', ts: 'Il y a 8h', type: 'conv' },
  { id: 5, action: 'Génération fiche produit × 4', statut: 'Succès', impact: '+18% CTR', ts: 'Hier', type: 'content' },
  { id: 6, action: 'Rapport mensuel PDF envoyé', statut: 'Succès', impact: '1 client notifié', ts: 'Hier', type: 'report' },
];

type Period = '7j' | '30j' | 'trim';
const PERIOD_LABELS: Record<Period, string> = {
  '7j': '7 derniers jours',
  '30j': '30 derniers jours',
  'trim': 'Ce trimestre',
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  suffix?: string;
  slot?: React.ReactNode;
}

function KPICard({ label, value, trend, trendLabel, suffix, slot }: KPICardProps) {
  const positive = trend >= 0;
  return (
    <div className="krd-kpi-card">
      <div className="krd-kpi-label">{label}</div>
      <div className="krd-kpi-row">
        <span className="krd-kpi-value">{value}</span>
        {suffix && <span className="krd-kpi-suffix">{suffix}</span>}
      </div>
      {slot || (
        <div className={`krd-kpi-trend ${positive ? 'pos' : 'neg'}`}>
          {positive
            ? <TrendingUp size={12} />
            : <TrendingDown size={12} />
          }
          {positive ? '+' : ''}{trend}% {trendLabel}
        </div>
      )}
    </div>
  );
}

// Quota bar for "Flux Synchronisés"
function QuotaBar({ used, total }: { used: number; total: number }) {
  const pct = Math.round((used / total) * 100);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '.72rem', color: '#475569', fontWeight: 600 }}>{used} / {total} flux actifs</span>
        <span style={{ fontSize: '.7rem', color: '#334155' }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(51,65,85,.7)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99, width: `${pct}%`,
          background: 'linear-gradient(90deg, #2563EB, #4F46E5)',
          transition: 'width .5s ease',
        }} />
      </div>
    </div>
  );
}

// Custom recharts tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0D1626', border: '1px solid rgba(51,65,85,.9)',
      borderRadius: 10, padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,.5)',
    }}>
      <p style={{ fontSize: '.72rem', color: '#475569', fontWeight: 600, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: '.82rem', color: p.color, fontWeight: 700, margin: '2px 0' }}>
          {p.name === 'ca' ? '€ ' : ''}{p.value.toLocaleString('fr-FR')}{p.name === 'ca' ? '' : ' camps.'}
        </p>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function KompilotROIDashboard() {
  const [period, setPeriod] = useState<Period>('7j');
  const [dropOpen, setDropOpen] = useState(false);

  const chartData = CHART_MAP[period];

  return (
    <div className="krd-root">
      <style>{`
        .krd-root {
          background: #080D1A; min-height: 100vh;
          padding: clamp(24px,4vw,40px) clamp(16px,3vw,32px);
          font-family: 'Inter', system-ui, sans-serif; color: #E2E8F0;
        }
        .krd-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 32px; flex-wrap: wrap; gap: 12px;
        }
        .krd-header-left h1 {
          font-size: 1.25rem; font-weight: 800; color: #F1F5F9;
          letter-spacing: -.025em; margin-bottom: 3px;
        }
        .krd-header-left p { font-size: .78rem; color: #334155; }
        .krd-refresh-btn {
          display: flex; align-items: center; gap: 7px;
          background: rgba(51,65,85,.4); border: 1px solid rgba(51,65,85,.7);
          border-radius: 9px; padding: 9px 16px;
          color: #64748B; font-size: .78rem; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: all .2s;
        }
        .krd-refresh-btn:hover { color: #94A3B8; border-color: rgba(100,116,139,.5); }

        /* KPI grid */
        .krd-kpi-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
          margin-bottom: 28px;
        }
        .krd-kpi-card {
          background: rgba(10,18,36,.8);
          border: 1px solid rgba(30,41,59,.9);
          border-radius: 14px; padding: 22px 20px;
          transition: border-color .2s;
        }
        .krd-kpi-card:hover { border-color: rgba(51,65,85,.9); }
        .krd-kpi-label {
          font-size: .7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .07em; color: #334155; margin-bottom: 14px;
        }
        .krd-kpi-row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; }
        .krd-kpi-value {
          font-size: 2rem; font-weight: 800; letter-spacing: -.04em;
          color: #F1F5F9; line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .krd-kpi-suffix { font-size: .95rem; color: #475569; font-weight: 600; }
        .krd-kpi-trend {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: .72rem; font-weight: 700; border-radius: 9999px;
          padding: 3px 9px;
        }
        .krd-kpi-trend.pos { background: rgba(34,197,94,.08); color: #4ADE80; }
        .krd-kpi-trend.neg { background: rgba(239,68,68,.08); color: #F87171; }

        /* Chart section */
        .krd-chart-section {
          background: rgba(10,18,36,.8); border: 1px solid rgba(30,41,59,.9);
          border-radius: 16px; padding: 28px 24px 20px; margin-bottom: 28px;
        }
        .krd-chart-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px; gap: 12px; flex-wrap: wrap;
        }
        .krd-chart-title {
          font-size: .95rem; font-weight: 700; color: #CBD5E1;
          letter-spacing: -.015em;
        }
        .krd-chart-sub { font-size: .73rem; color: #334155; margin-top: 2px; }
        .krd-period-drop { position: relative; }
        .krd-period-btn {
          display: flex; align-items: center; gap: 8px;
          background: rgba(15,23,42,.9); border: 1px solid rgba(51,65,85,.8);
          border-radius: 9px; padding: 9px 14px;
          color: #64748B; font-size: .78rem; font-weight: 600;
          cursor: pointer; font-family: inherit; white-space: nowrap;
          transition: border-color .2s, color .2s;
        }
        .krd-period-btn:hover { color: #94A3B8; border-color: rgba(100,116,139,.5); }
        .krd-period-menu {
          position: absolute; right: 0; top: calc(100% + 6px);
          background: #0D1626; border: 1px solid rgba(51,65,85,.9);
          border-radius: 10px; padding: 6px; z-index: 50;
          box-shadow: 0 8px 32px rgba(0,0,0,.6);
          min-width: 170px;
        }
        .krd-period-item {
          padding: 9px 12px; border-radius: 7px; font-size: .8rem;
          color: #64748B; cursor: pointer; transition: all .15s; font-weight: 600;
        }
        .krd-period-item:hover { background: rgba(51,65,85,.5); color: #94A3B8; }
        .krd-period-item.active { color: #93C5FD; background: rgba(37,99,235,.08); }

        /* Actions table */
        .krd-table-section {
          background: rgba(10,18,36,.8); border: 1px solid rgba(30,41,59,.9);
          border-radius: 16px; overflow: hidden;
        }
        .krd-table-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 24px 16px; border-bottom: 1px solid rgba(30,41,59,.9);
          flex-wrap: wrap; gap: 10px;
        }
        .krd-table-title { font-size: .9rem; font-weight: 700; color: #CBD5E1; }
        .krd-table-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(37,99,235,.08); border: 1px solid rgba(37,99,235,.2);
          border-radius: 9999px; padding: 4px 11px;
          font-size: .66rem; font-weight: 700; color: #93C5FD;
          text-transform: uppercase; letter-spacing: .07em;
        }
        .krd-table { width: 100%; border-collapse: collapse; }
        .krd-th {
          font-size: .65rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: .08em; color: #1E293B;
          padding: 11px 16px; text-align: left;
          background: rgba(15,23,42,.5); border-bottom: 1px solid rgba(30,41,59,.9);
        }
        .krd-th:first-child { padding-left: 24px; }
        .krd-th:last-child { padding-right: 24px; text-align: right; }
        .krd-td {
          padding: 15px 16px; font-size: .83rem; color: #94A3B8;
          border-bottom: 1px solid rgba(255,255,255,.03);
          vertical-align: middle;
        }
        .krd-td:first-child { padding-left: 24px; }
        .krd-td:last-child { padding-right: 24px; text-align: right; }
        .krd-tr:last-child .krd-td { border-bottom: none; }
        .krd-tr:hover .krd-td { background: rgba(255,255,255,.015); }
        .krd-action-name { font-weight: 600; color: #CBD5E1; }
        .krd-badge-success {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.2);
          border-radius: 9999px; padding: 3px 10px;
          font-size: .68rem; font-weight: 700; color: #4ADE80;
        }
        .krd-impact {
          font-size: .8rem; font-weight: 700;
          color: #38BDF8;
        }
        .krd-ts { font-size: .72rem; color: #1E293B; }
        .krd-link-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(37,99,235,.08); border: 1px solid rgba(37,99,235,.18);
          border-radius: 7px; padding: 5px 10px;
          font-size: .7rem; font-weight: 700; color: #60A5FA;
          cursor: pointer; text-decoration: none; transition: all .15s;
        }
        .krd-link-btn:hover { background: rgba(37,99,235,.15); color: #93C5FD; }

        @media (max-width: 1024px) { .krd-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .krd-kpi-grid { grid-template-columns: 1fr; } }
        @media (max-width: 720px) { .krd-table-section { overflow-x: auto; } .krd-table { min-width: 560px; } }
      `}</style>

      {/* Header */}
      <div className="krd-header">
        <div className="krd-header-left">
          <h1>Tableau de bord ROI</h1>
          <p>Pilotage automatisé des campagnes — mise à jour en temps réel</p>
        </div>
        <button className="krd-refresh-btn">
          <RefreshCw size={13} />
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="krd-kpi-grid">
        <KPICard
          label="Chiffre d'Affaires Généré"
          value="41 800 €"
          trend={12.4}
          trendLabel="vs période préc."
        />
        <KPICard
          label="Taux de Conversion Global"
          value="3,4"
          suffix="%"
          trend={0.6}
          trendLabel="pts gagnés"
        />
        <KPICard
          label="Campagnes Actives"
          value="7"
          trend={2}
          trendLabel="nouvelles ce mois"
          slot={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <div className="krd-kpi-trend pos" style={{ fontSize: '.68rem' }}>
                <TrendingUp size={11} />
                +2 ce mois
              </div>
              <a className="krd-link-btn" href="#">
                Voir <ExternalLink size={9} />
              </a>
            </div>
          }
        />
        <KPICard
          label="Flux Synchronisés · Sync AIO"
          value="9"
          suffix="/12"
          trend={0}
          trendLabel=""
          slot={<QuotaBar used={9} total={12} />}
        />
      </div>

      {/* Chart */}
      <div className="krd-chart-section">
        <div className="krd-chart-header">
          <div>
            <div className="krd-chart-title">Évolution du CA vs Campagnes Pilotées</div>
            <div className="krd-chart-sub">Chiffre d'affaires généré · Nombre de campagnes actives</div>
          </div>
          <div className="krd-period-drop">
            <button className="krd-period-btn" onClick={() => setDropOpen(o => !o)}>
              {PERIOD_LABELS[period]}
              <ChevronDown size={13} style={{ transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }} />
            </button>
            {dropOpen && (
              <div className="krd-period-menu">
                {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                  <div
                    key={p}
                    className={`krd-period-item${period === p ? ' active' : ''}`}
                    onClick={() => { setPeriod(p); setDropOpen(false); }}
                  >
                    {PERIOD_LABELS[p]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCamp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,.3)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#334155', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="ca" tick={{ fill: '#334155', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k€`} />
            <YAxis yAxisId="camp" orientation="right" tick={{ fill: '#334155', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span style={{ color: '#475569', fontSize: '.74rem', fontWeight: 600 }}>
                  {value === 'ca' ? 'CA Généré (€)' : 'Campagnes pilotées'}
                </span>
              )}
            />
            <Area yAxisId="ca" type="monotone" dataKey="ca" stroke="#3B82F6" strokeWidth={2} fill="url(#gradCA)" dot={false} activeDot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }} />
            <Area yAxisId="camp" type="monotone" dataKey="campagnes" stroke="#818CF8" strokeWidth={2} fill="url(#gradCamp)" dot={false} activeDot={{ r: 4, fill: '#818CF8', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Actions Table */}
      <div className="krd-table-section">
        <div className="krd-table-header">
          <div>
            <div className="krd-table-title">Dernières Actions du Copilote</div>
          </div>
          <div className="krd-table-badge">
            <Zap size={9} />
            Exécution automatique
          </div>
        </div>

        <table className="krd-table">
          <thead>
            <tr>
              <th className="krd-th">Action</th>
              <th className="krd-th">Statut</th>
              <th className="krd-th">Impact Mesuré</th>
              <th className="krd-th">Date</th>
            </tr>
          </thead>
          <tbody>
            {COPILOT_ACTIONS.map(row => (
              <tr key={row.id} className="krd-tr">
                <td className="krd-td">
                  <div className="krd-action-name">{row.action}</div>
                </td>
                <td className="krd-td">
                  <span className="krd-badge-success">
                    <Activity size={9} />
                    {row.statut}
                  </span>
                </td>
                <td className="krd-td">
                  <span className="krd-impact">{row.impact}</span>
                </td>
                <td className="krd-td">
                  <span className="krd-ts">{row.ts}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
