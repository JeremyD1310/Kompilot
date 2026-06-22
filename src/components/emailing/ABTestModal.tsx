/**
 * ABTestModal — Create & launch A/B email campaign tests
 * Tests subject lines, sender names, or full HTML content.
 */
import { useState } from 'react';
import { X, FlaskConical, ChevronDown, ChevronUp, Send, Loader2, CheckCircle2, Trophy } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { apiFetch } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';

type TestType = 'subject' | 'sender' | 'content';

interface ABTestModalProps {
  onClose: () => void;
  contacts: { email: string; name: string }[];
  fromEmail: string;
  fromName: string;
  baseSubject: string;
  baseHtml: string;
  sendgridKey: string;
}

const TEST_TYPE_META: Record<TestType, { label: string; emoji: string; desc: string }> = {
  subject: {
    label: "Ligne d'objet",
    emoji: '✉️',
    desc: 'Testez deux objets différents pour maximiser le taux d\'ouverture',
  },
  sender: {
    label: 'Nom expéditeur',
    emoji: '👤',
    desc: 'Testez quel nom d\'expéditeur génère le plus de confiance',
  },
  content: {
    label: 'Contenu HTML',
    emoji: '📄',
    desc: 'Testez deux versions de l\'email pour maximiser le CTR',
  },
};

function Pill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );
}

function VariantBlock({
  label,
  color,
  testType,
  subject,
  onSubjectChange,
  senderName,
  onSenderChange,
  html,
  onHtmlChange,
  baseHtml,
  baseSubject,
  baseSender,
}: any) {
  const [showHtml, setShowHtml] = useState(false);

  return (
    <div
      className="rounded-2xl border-2 p-4 space-y-3 transition-all"
      style={{ borderColor: color + '60', background: color + '08' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ background: color }}>
          {label}
        </div>
        <span className="font-bold text-sm text-foreground">Variante {label}</span>
      </div>

      {testType === 'subject' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Objet de l'email</label>
          <input
            type="text"
            value={subject}
            onChange={e => onSubjectChange(e.target.value)}
            placeholder={baseSubject || `Objet variante ${label}…`}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[10px] text-muted-foreground">Le contenu HTML reste identique entre A et B</p>
        </div>
      )}

      {testType === 'sender' && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Nom affiché de l'expéditeur</label>
          <input
            type="text"
            value={senderName}
            onChange={e => onSenderChange(e.target.value)}
            placeholder={baseSender || `Nom variante ${label}…`}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[10px] text-muted-foreground">
            Ex. : "Jean Martin" vs "L'équipe Salon Beauté"
          </p>
        </div>
      )}

      {testType === 'content' && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowHtml(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
          >
            {showHtml ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showHtml ? 'Masquer' : 'Modifier'} le contenu HTML
          </button>
          {showHtml ? (
            <textarea
              value={html}
              onChange={e => onHtmlChange(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              placeholder="Collez votre code HTML ici..."
            />
          ) : (
            <div className="text-[11px] text-muted-foreground italic">
              {html ? `${html.slice(0, 80)}…` : baseHtml ? `(base) ${baseHtml.slice(0, 80)}…` : 'Contenu non défini'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ABTestModal({
  onClose,
  contacts,
  fromEmail,
  fromName,
  baseSubject,
  baseHtml,
  sendgridKey,
}: ABTestModalProps) {
  const { user } = useAuth();
  const token = (user as any)?.access_token ?? (user as any)?.token ?? '';

  const [testType, setTestType] = useState<TestType>('subject');
  const [name, setName] = useState('');

  // Variant A
  const [subjectA, setSubjectA] = useState(baseSubject);
  const [senderA, setSenderA] = useState(fromName);
  const [htmlA, setHtmlA] = useState(baseHtml);

  // Variant B
  const [subjectB, setSubjectB] = useState('');
  const [senderB, setSenderB] = useState('');
  const [htmlB, setHtmlB] = useState('');

  const [step, setStep] = useState<'config' | 'preview' | 'done'>('config');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ sentA: number; sentB: number } | null>(null);
  const [winner, setWinner] = useState<'A' | 'B' | null>(null);
  const [testId, setTestId] = useState('');

  const half = Math.ceil(contacts.length / 2);

  const canSend = !!sendgridKey && contacts.length >= 2 && (
    testType === 'subject' ? (subjectA.trim() && subjectB.trim()) :
    testType === 'sender' ? (senderA.trim() && senderB.trim()) :
    (htmlA.trim() && htmlB.trim())
  );

  const buildVariant = (label: string, sub: string, snd: string, html: string) => ({
    label,
    subject: testType === 'subject' ? sub : baseSubject,
    fromName: testType === 'sender' ? snd : fromName,
    htmlContent: testType === 'content' ? html : baseHtml,
  });

  const handleCreate = async () => {
    if (!canSend) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ test: { id: string } }>('/api/ab-tests/create', {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: name || `Test A/B – ${TEST_TYPE_META[testType].label}`,
          testType,
          fromEmail,
          fromName,
          htmlContent: baseHtml,
          variantA: buildVariant('A', subjectA, senderA, htmlA),
          variantB: buildVariant('B', subjectB, senderB, htmlB),
          recipientEmails: contacts.map(c => c.email),
        }),
      });
      setTestId((res as any).test.id);
      setStep('preview');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur de création');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!testId) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ sentA: number; sentB: number }>('/api/ab-tests/send', {
        method: 'POST',
        token,
        body: JSON.stringify({ testId, sendgridApiKey: sendgridKey }),
      });
      setResults(res as any);
      setStep('done');
      toast.success('Test A/B lancé avec succès !');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur d\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleWinner = async (v: 'A' | 'B') => {
    try {
      await apiFetch(`/api/ab-tests/${testId}/winner`, {
        method: 'POST',
        token,
        body: JSON.stringify({ variant: v }),
      });
      setWinner(v);
      toast.success(`Variante ${v} désignée gagnante !`);
    } catch {
      toast.error('Erreur lors de la sélection');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto border border-border">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <FlaskConical size={16} className="text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Test A/B Email</h2>
              <p className="text-xs text-muted-foreground">
                {contacts.length} contacts · ~{half} par variante
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Step: Config ─────────────────────────────────────────── */}
          {step === 'config' && (
            <>
              {/* Test name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Nom du test (optionnel)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex. : Test objet – Offre été 2026"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* What to test */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Qu'est-ce que vous testez ?</label>
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(TEST_TYPE_META) as [TestType, any][]).map(([type, meta]) => (
                    <Pill key={type} active={testType === type} onClick={() => setTestType(type)} label={`${meta.emoji} ${meta.label}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{TEST_TYPE_META[testType].desc}</p>
              </div>

              {/* Split preview */}
              <div className="rounded-xl bg-muted/40 border border-border p-3 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex-1 text-center">
                  <div className="h-2 rounded-full bg-blue-500 mb-1" />
                  <span className="font-semibold text-foreground">{half}</span> contacts · Variante A
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="flex-1 text-center">
                  <div className="h-2 rounded-full bg-violet-500 mb-1" />
                  <span className="font-semibold text-foreground">{contacts.length - half}</span> contacts · Variante B
                </div>
              </div>

              {/* Variants */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <VariantBlock
                  label="A" color="#3B82F6" testType={testType}
                  subject={subjectA} onSubjectChange={setSubjectA}
                  senderName={senderA} onSenderChange={setSenderA}
                  html={htmlA} onHtmlChange={setHtmlA}
                  baseHtml={baseHtml} baseSubject={baseSubject} baseSender={fromName}
                />
                <VariantBlock
                  label="B" color="#8B5CF6" testType={testType}
                  subject={subjectB} onSubjectChange={setSubjectB}
                  senderName={senderB} onSenderChange={setSenderB}
                  html={htmlB} onHtmlChange={setHtmlB}
                  baseHtml={baseHtml} baseSubject={baseSubject} baseSender={fromName}
                />
              </div>

              {!sendgridKey && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ Connectez SendGrid dans l'onglet "Connexions" pour envoyer les emails.
                </div>
              )}

              <button
                onClick={handleCreate}
                disabled={!canSend || loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold py-3 text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Création…</>
                  : <>Prévisualiser le test →</>}
              </button>
            </>
          )}

          {/* ── Step: Preview ─────────────────────────────────────────── */}
          {step === 'preview' && (
            <>
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-start gap-3">
                <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Test A/B configuré avec succès</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Prêt à envoyer aux {contacts.length} contacts sélectionnés</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'A', color: '#3B82F6', sub: testType === 'subject' ? subjectA : baseSubject, snd: testType === 'sender' ? senderA : fromName, count: half },
                  { label: 'B', color: '#8B5CF6', sub: testType === 'subject' ? subjectB : baseSubject, snd: testType === 'sender' ? senderB : fromName, count: contacts.length - half },
                ].map(v => (
                  <div key={v.label} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center" style={{ background: v.color }}>
                        {v.label}
                      </div>
                      <span className="font-bold text-xs text-foreground">Variante {v.label}</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      <p><span className="font-medium">Objet :</span> {v.sub || '—'}</p>
                      <p><span className="font-medium">Expéditeur :</span> {v.snd || fromName}</p>
                      <p><span className="font-medium">Destinataires :</span> {v.count}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('config')}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-all"
                >
                  ← Modifier
                </button>
                <button
                  onClick={handleSend}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold py-2.5 text-sm hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Envoi…</>
                    : <><Send size={14} /> Lancer le test A/B</>}
                </button>
              </div>
            </>
          )}

          {/* ── Step: Done ────────────────────────────────────────────── */}
          {step === 'done' && results && (
            <div className="space-y-5">
              <div className="text-center space-y-2 py-4">
                <div className="text-4xl">🚀</div>
                <h3 className="font-black text-xl text-foreground">Test A/B lancé !</h3>
                <p className="text-sm text-muted-foreground">
                  {results.sentA} emails variante A · {results.sentB} emails variante B
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Désigner le gagnant</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Après avoir analysé vos statistiques SendGrid (taux d'ouverture, clics), désignez la variante gagnante.
                </p>
                {winner ? (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <Trophy size={16} />
                    Variante {winner} désignée gagnante !
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(['A', 'B'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => handleWinner(v)}
                        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold border transition-all hover:opacity-90 ${
                          v === 'A'
                            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800/50 dark:text-blue-400'
                            : 'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:border-violet-800/50 dark:text-violet-400'
                        }`}
                      >
                        <Trophy size={13} /> Variante {v} gagne
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={onClose} className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted/50 transition-all">
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
