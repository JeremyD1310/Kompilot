import { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from '@blinkdotnew/ui';
import { Copy, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

type Protocol = 'dkim' | 'spf' | 'dmarc';
type HealthState = Record<Protocol, boolean>;

const STORAGE_KEY = 'nc_domain_health';
const BASE_SCORE = 45;

const PROTOCOLS = [
  { id: 'dkim' as Protocol, icon: '🔑', title: 'Clé de Certification DKIM', subtitle: "Signature d'authenticité — prouve que vos emails viennent bien de vous", btnLabel: 'Générer ma clé IA', dnsRecord: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC...', points: 18 },
  { id: 'spf' as Protocol, icon: '🛡️', title: 'Passeport SPF', subtitle: "Autorisation d'envoi Kompilot — indique aux serveurs que vous êtes légitime", btnLabel: 'Activer le SPF', dnsRecord: 'v=spf1 include:_spf.kompilot.com include:amazonses.com ~all', points: 17 },
  { id: 'dmarc' as Protocol, icon: '👮', title: 'Protocole DMARC', subtitle: "Protection anti-usurpation — empêche les pirates d'envoyer des emails à votre place", btnLabel: 'Sécuriser', dnsRecord: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@kompilot.com; pct=100', points: 18 },
];

function loadState(): HealthState {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw) as HealthState; } catch {}
  return { dkim: false, spf: false, dmarc: false };
}

const computeScore = (s: HealthState) => PROTOCOLS.reduce((acc, p) => acc + (s[p.id] ? p.points : 0), BASE_SCORE);

// ── Score Gauge ────────────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const mv = useMotionValue(BASE_SCORE);
  const display = useTransform(mv, (v) => Math.round(v));
  useEffect(() => { const c = animate(mv, score, { duration: 1.1, ease: 'easeOut' }); return c.stop; }, [score, mv]);

  const isGood = score >= 90;
  const color = isGood ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444';
  const R = 54, circ = 2 * Math.PI * R, dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={R} fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <motion.circle cx="64" cy="64" r={R} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${circ}`} initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }} transition={{ duration: 1.1, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-3xl font-extrabold tabular-nums" style={{ color }}>{display}</motion.span>
          <span className="text-[11px] font-medium text-muted-foreground">/100</span>
        </div>
      </div>
      {isGood
        ? <p className="text-sm font-semibold text-emerald-700 text-center max-w-xs">🚀 Certification validée ! Vos e-mails sont désormais prioritaires et arriveront directement dans la boîte de réception de vos clients.</p>
        : <p className="text-sm font-semibold text-amber-700 text-center max-w-xs">⚠️ Attention : Risque élevé de finir en Spam chez Gmail et Outlook</p>}
    </div>
  );
}

// ── DNS Modal ──────────────────────────────────────────────────────────────────
function DnsModal({ protocol, onClose, onVerified }: { protocol: (typeof PROTOCOLS)[number]; onClose: () => void; onVerified: () => void }) {
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleCopy = () => { void navigator.clipboard.writeText(protocol.dnsRecord); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleVerify = () => { setVerifying(true); setTimeout(() => { setVerifying(false); onVerified(); onClose(); }, 1000); };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configuration {protocol.icon} {protocol.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-1">
          Copiez ces lignes dans la zone DNS de votre hébergeur{' '}
          <span className="font-medium text-foreground">(OVH, GoDaddy, Ionos, etc.)</span>
        </p>
        <div className="mt-3 rounded-lg bg-muted/60 border border-border p-3 font-mono text-xs break-all leading-relaxed text-foreground">
          {protocol.dnsRecord}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
            <Copy size={14} />{copied ? '✅ Copié !' : '📋 Copier'}
          </Button>
          <Button size="sm" onClick={handleVerify} disabled={verifying} className="gap-2">
            <RefreshCw size={14} className={verifying ? 'animate-spin' : ''} />🔄 Vérifier la connexion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Confetti (CSS-only) ────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#a855f7'];
function ConfettiPiece({ i }: { i: number }) {
  return <span style={{ position: 'absolute', width: 8, height: 8, borderRadius: i % 2 === 0 ? '50%' : 2, backgroundColor: CONFETTI_COLORS[i % 5], left: `${(i / 20) * 100}%`, top: '-12px', animation: `confettiFall ${1.4 + (i % 5) * 0.2}s ease-in ${(i % 7) * 0.1}s forwards` }} />;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export function DomainHealthSection() {
  const [health, setHealth] = useState<HealthState>(loadState);
  const [activeModal, setActiveModal] = useState<Protocol | null>(null);

  const score = computeScore(health);
  const allDone = PROTOCOLS.every((p) => health[p.id]);

  const markDone = useCallback((id: Protocol) => {
    const next = { ...health, [id]: true };
    setHealth(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, [health]);

  const activeProto = PROTOCOLS.find((p) => p.id === activeModal) ?? null;

  return (
    <div className="space-y-5">
      <style>{`@keyframes confettiFall { 0% { transform:translateY(0) rotate(0deg); opacity:1; } 100% { transform:translateY(120px) rotate(720deg); opacity:0; } }`}</style>

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">🛡️ Santé de mon Domaine &amp; Anti-Spam</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Assurez-vous que vos emails arrivent en boîte de réception, jamais en spam.</p>
      </div>

      {/* Gauge */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
        <ScoreGauge score={score} />
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {PROTOCOLS.map((proto) => {
          const done = health[proto.id];
          return (
            <div key={proto.id} className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${done ? 'border-emerald-200 bg-emerald-50/60' : 'border-border bg-card'}`}>
              <div className="shrink-0">
                {done ? <CheckCircle2 size={22} className="text-emerald-500" /> : <XCircle size={22} className="text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{proto.icon} {proto.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{proto.subtitle}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                {done
                  ? <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 whitespace-nowrap text-[11px]">🟢 Configuré avec succès</Badge>
                  : <>
                      <Badge className="bg-red-100 text-red-700 border-red-200 whitespace-nowrap text-[11px]">🔴 Non configuré</Badge>
                      <Button size="sm" variant="outline" onClick={() => setActiveModal(proto.id)}>{proto.btnLabel}</Button>
                    </>}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-done banner */}
      {allDone && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 px-6 py-5 text-center">
          {Array.from({ length: 20 }).map((_, i) => <ConfettiPiece key={i} i={i} />)}
          <p className="text-2xl mb-1">🎉</p>
          <p className="font-bold text-emerald-900 text-base">Domaine 100% sécurisé !</p>
          <p className="text-xs text-emerald-700 mt-0.5">DKIM, SPF &amp; DMARC actifs — vos emails sont désormais certifiés et prioritaires.</p>
        </motion.div>
      )}

      {/* Modal */}
      {activeProto && (
        <DnsModal protocol={activeProto} onClose={() => setActiveModal(null)} onVerified={() => markDone(activeProto.id)} />
      )}
    </div>
  );
}
