import { useState, useEffect } from 'react';
import {
  MessageSquare, Bell, TrendingUp, Star, Smartphone,
  Clock, Check, Zap, History, ChevronDown, ChevronUp,
  RotateCcw, Pencil, Variable, Info,
} from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useCredits } from '../../context/CreditsContext';
import { useAuth } from '../../hooks/useAuth';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { toast } from '@blinkdotnew/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SMSHistoryEntry {
  id: string;
  type: 'inactivity' | 'stats' | 'review';
  sentAt: string;
  preview: string;
  creditCost: number;
}

type AlertType = 'inactivity' | 'stats' | 'review';

interface SMSPreferences {
  phone: string;
  inactivity: boolean;
  weeklyStats: boolean;
  badReview: boolean;
  customMessages: Record<AlertType, string>;
}

const SMS_PREFS_KEY    = 'kompilot_sms_prefs';
const SMS_HISTORY_KEY  = 'kompilot_sms_history';
const SMS_MAX_CHARS    = 160;

// ── Default message templates ─────────────────────────────────────────────────

const DEFAULT_MESSAGES: Record<AlertType, string> = {
  inactivity: `Bonjour [Nom] ! Cela fait 6 jours que [Entreprise] n'a rien publié sur Instagram. L'IA vous a préparé 2 idées de posts prêtes à l'emploi. Publiez en 2 clics : kompilot.co/dashboard`,
  stats:      `📊 Vos stats de la semaine, [Nom] : vos publications ont généré 4 230 vues sur LinkedIn et +15% d'engagement sur Google Maps ! Bravo. Rapport complet : kompilot.co/stats`,
  review:     `⚠️ Alerte Avis ! Un client vient de laisser une note de 2/5 sur votre fiche Google Business. Répondez instantanément grâce à notre IA : kompilot.co/inbox`,
};

const AVAILABLE_VARIABLES = [
  { key: '[Nom]',       desc: 'Prénom de l\'utilisateur' },
  { key: '[Entreprise]',desc: 'Nom de l\'établissement'  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadPrefs(): SMSPreferences {
  try {
    const raw = localStorage.getItem(SMS_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Back-fill customMessages if missing (migration)
      if (!parsed.customMessages) {
        parsed.customMessages = { ...DEFAULT_MESSAGES };
      }
      return parsed;
    }
  } catch { /* noop */ }
  return {
    phone: '', inactivity: false, weeklyStats: false, badReview: false,
    customMessages: { ...DEFAULT_MESSAGES },
  };
}

function savePrefs(p: SMSPreferences) {
  try { localStorage.setItem(SMS_PREFS_KEY, JSON.stringify(p)); } catch { /* noop */ }
}

function loadHistory(): SMSHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SMS_HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return [];
}

function saveHistory(h: SMSHistoryEntry[]) {
  try { localStorage.setItem(SMS_HISTORY_KEY, JSON.stringify(h)); } catch { /* noop */ }
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

// ── Message editor ─────────────────────────────────────────────────────────────

function MessageEditor({
  type,
  value,
  onChange,
  onReset,
  isDefault,
}: {
  type: AlertType;
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  isDefault: boolean;
}) {
  const count   = value.length;
  const smsCount = Math.ceil(count / SMS_MAX_CHARS) || 1;
  const isOver  = count > SMS_MAX_CHARS;

  const insertVariable = (variable: string) => {
    onChange(value + variable);
  };

  return (
    <div className="mt-3 ml-14 space-y-2.5 pb-1">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Pencil size={11} className="text-primary shrink-0" />
        <span className="text-[11px] font-bold text-primary">Message personnalisé</span>
        {!isDefault && (
          <span className="text-[9px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
            Modifié
          </span>
        )}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={4}
          maxLength={SMS_MAX_CHARS * 3}
          className={`w-full text-xs rounded-xl border px-3 py-2.5 bg-background text-foreground resize-none focus:outline-none focus:ring-2 transition-all leading-relaxed font-mono ${
            isOver
              ? 'border-red-400 focus:ring-red-400/30'
              : 'border-border focus:ring-primary/30'
          }`}
          placeholder={DEFAULT_MESSAGES[type]}
        />

        {/* Char counter badge */}
        <div className={`absolute bottom-2 right-2.5 text-[10px] font-bold tabular-nums rounded-full px-1.5 py-0.5 ${
          isOver
            ? 'bg-red-100 text-red-600'
            : count > SMS_MAX_CHARS * 0.9
              ? 'bg-amber-100 text-amber-700'
              : 'bg-muted text-muted-foreground'
        }`}>
          {count}/{SMS_MAX_CHARS}
        </div>
      </div>

      {/* SMS count info */}
      {smsCount > 1 && (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          <Info size={11} className="shrink-0" />
          <span>Ce message dépasse 160 caractères — il sera envoyé en <strong>{smsCount} SMS</strong> concaténés.</span>
        </div>
      )}

      {/* Variables helper */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <Variable size={10} />
          Variables :
        </div>
        {AVAILABLE_VARIABLES.map(v => (
          <button
            key={v.key}
            onClick={() => insertVariable(v.key)}
            title={v.desc}
            className="text-[10px] font-mono font-bold rounded-md bg-primary/8 text-primary border border-primary/20 px-1.5 py-0.5 hover:bg-primary/15 transition-colors"
          >
            {v.key}
          </button>
        ))}
      </div>

      {/* Reset button */}
      {!isDefault && (
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
        >
          <RotateCcw size={11} className="group-hover:rotate-[-45deg] transition-transform" />
          Réinitialiser le message par défaut
        </button>
      )}
    </div>
  );
}

// ── Alert row with expandable message editor ───────────────────────────────────

function AlertRow({
  type,
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  checked,
  onChange,
  isPro,
  badge,
  customMessage,
  onMessageChange,
  onMessageReset,
}: {
  type: AlertType;
  icon: typeof Bell;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  isPro: boolean;
  badge?: string;
  customMessage: string;
  onMessageChange: (v: string) => void;
  onMessageReset: () => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const isDefault = customMessage === DEFAULT_MESSAGES[type];

  return (
    <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
      checked ? 'border-primary/40 bg-primary/3' : 'border-border bg-card'
    }`}>
      {/* Main row */}
      <div className="flex items-start gap-4 px-5 py-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{title}</p>
            {badge && (
              <span className="text-[10px] font-bold rounded-full bg-primary/10 text-primary px-2 py-0.5">{badge}</span>
            )}
            {!isPro && checked && (
              <span className="text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 flex items-center gap-1">
                <Zap size={9} /> −0.5 crédit par SMS
              </span>
            )}
            {!isDefault && (
              <span className="text-[10px] font-bold rounded-full bg-violet-100 text-violet-600 px-2 py-0.5 flex items-center gap-1">
                <Pencil size={8} /> Personnalisé
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Edit message button */}
          <button
            onClick={() => setEditorOpen(v => !v)}
            title="Personnaliser le message SMS"
            className={`flex items-center gap-1 text-[11px] rounded-lg border px-2 py-1.5 transition-all font-medium ${
              editorOpen
                ? 'border-primary/50 bg-primary/8 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5'
            }`}
          >
            <Pencil size={11} />
            <span className="hidden sm:inline">{editorOpen ? 'Fermer' : 'Message'}</span>
            {editorOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <Toggle checked={checked} onChange={onChange} />
        </div>
      </div>

      {/* Expandable message editor */}
      {editorOpen && (
        <div className="border-t border-border/60 bg-muted/20 px-5 py-4">
          <MessageEditor
            type={type}
            value={customMessage}
            onChange={onMessageChange}
            onReset={onMessageReset}
            isDefault={isDefault}
          />
        </div>
      )}
    </div>
  );
}

// ── iPhone lock screen SMS preview ───────────────────────────────────────────

interface SMSBubble {
  type: AlertType;
  label: string;
  icon: typeof Bell;
  iconColor: string;
  time: string;
  message: string;
  urgency?: 'normal' | 'warning' | 'success';
}

function LockScreenPreview({ bubbles, firstName, company }: {
  bubbles: SMSBubble[];
  firstName: string;
  company: string;
}) {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    if (visibleCount >= bubbles.length) return;
    const t = setTimeout(() => setVisibleCount(v => v + 1), 900);
    return () => clearTimeout(t);
  }, [visibleCount, bubbles.length]);

  // Reset visible count when bubbles change
  useEffect(() => { setVisibleCount(1); }, [bubbles.length]);

  const urgencyBg: Record<string, string> = {
    normal:  'bg-white/90',
    warning: 'bg-red-50/95',
    success: 'bg-green-50/95',
  };
  const urgencyBorder: Record<string, string> = {
    normal:  'border-white/60',
    warning: 'border-red-300/60',
    success: 'border-green-300/60',
  };

  const resolveMessage = (msg: string) =>
    msg
      .replace(/\[Nom\]/g, firstName || 'vous')
      .replace(/\[Entreprise\]/g, company || 'votre page');

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative rounded-[36px] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden"
        style={{ width: 230, minHeight: 440 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-violet-600/20" />
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-900 rounded-full z-30" />

        <div className="relative z-10 pt-8 px-3 pb-4 flex flex-col gap-2 min-h-[440px]">
          <div className="text-center mt-2 mb-3">
            <p className="text-white text-3xl font-extralight tabular-nums">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-white/70 text-xs mt-0.5">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          <div className="space-y-2">
            {bubbles.slice(0, visibleCount).map((bubble, i) => {
              const Icon = bubble.icon;
              return (
                <div
                  key={`${bubble.type}-${i}`}
                  className={`rounded-2xl border ${urgencyBorder[bubble.urgency ?? 'normal']} ${urgencyBg[bubble.urgency ?? 'normal']} backdrop-blur-md px-3 py-2.5 shadow-sm`}
                  style={{ animation: i === visibleCount - 1 ? 'slideInDown 0.4s ease-out' : undefined }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                      bubble.urgency === 'warning' ? 'bg-red-500' :
                      bubble.urgency === 'success' ? 'bg-green-500' : 'bg-primary'
                    }`}>
                      <Icon size={11} className="text-white" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-800 flex-1">Kompilot</span>
                    <span className="text-[9px] text-gray-500">{bubble.time}</span>
                  </div>
                  <p className="text-[10px] text-gray-700 leading-relaxed line-clamp-4">
                    {resolveMessage(bubble.message)}
                  </p>
                </div>
              );
            })}

            {visibleCount < bubbles.length && (
              <div className="flex items-center gap-1.5 pl-2">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-white/40" />
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground text-center">Aperçu en temps réel</p>
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────

export function SMSAlertsSection() {
  const { currentPlan } = useSubscription();
  const { credits, addCredits } = useCredits();
  const { user } = useAuth();
  const profile = useOnboardingProfile();

  const [prefs, setPrefs]     = useState<SMSPreferences>(loadPrefs);
  const [history, setHistory] = useState<SMSHistoryEntry[]>(loadHistory);
  const [phoneError, setPhoneError] = useState('');
  const [testSent, setTestSent]     = useState(false);

  const isPro      = currentPlan.id === 'pro' || currentPlan.id === 'expert';
  const firstName  = user?.displayName?.split(' ')[0] ?? 'vous';
  const company    = (profile as any)?.companyName ?? 'votre page';

  useEffect(() => { savePrefs(prefs); }, [prefs]);
  useEffect(() => { saveHistory(history); }, [history]);

  const update = (key: keyof SMSPreferences, val: boolean | string) => {
    setPrefs(p => ({ ...p, [key]: val }));
  };

  const updateMessage = (type: AlertType, msg: string) => {
    setPrefs(p => ({
      ...p,
      customMessages: { ...p.customMessages, [type]: msg },
    }));
  };

  const resetMessage = (type: AlertType) => {
    updateMessage(type, DEFAULT_MESSAGES[type]);
    toast('Message réinitialisé', { description: 'Le message par défaut a été restauré.' });
  };

  const validatePhone = (phone: string) => {
    const clean = phone.replace(/\s/g, '');
    return /^(\+33|0)[67][0-9]{8}$/.test(clean);
  };

  const handleTestSMS = async () => {
    if (!prefs.phone || !validatePhone(prefs.phone)) {
      setPhoneError('Veuillez saisir un numéro valide avant d\'envoyer un test.');
      return;
    }
    setPhoneError('');

    if (!isPro) {
      const canDeduct = typeof credits === 'number' && credits >= 1;
      if (!canDeduct) {
        toast.error('Crédit insuffisant pour envoyer un SMS test.', {
          description: 'Passez à l\'offre Pro pour les SMS illimités.',
        });
        return;
      }
      addCredits(-1);
    }

    setTestSent(true);

    const entry: SMSHistoryEntry = {
      id: Date.now().toString(),
      type: 'stats',
      sentAt: new Date().toLocaleString('fr-FR'),
      preview: prefs.customMessages.stats.replace('[Nom]', firstName).replace('[Entreprise]', company).slice(0, 60) + '…',
      creditCost: isPro ? 0 : 0.5,
    };
    setHistory(prev => [entry, ...prev.slice(0, 9)]);

    toast.success('SMS test envoyé ! (simulation)', {
      description: `Message envoyé au ${prefs.phone}`,
    });

    setTimeout(() => setTestSent(false), 3000);
  };

  // Build preview bubbles using custom messages
  const allBubbles: SMSBubble[] = [
    {
      type: 'inactivity',
      label: 'Inactivité',
      icon: Bell,
      iconColor: 'text-amber-600',
      time: 'hier',
      urgency: 'normal',
      message: prefs.customMessages.inactivity,
    },
    {
      type: 'stats',
      label: 'Stats hebdo',
      icon: TrendingUp,
      iconColor: 'text-green-600',
      time: 'lun. 08:00',
      urgency: 'success',
      message: prefs.customMessages.stats,
    },
    {
      type: 'review',
      label: 'Avis urgent',
      icon: Star,
      iconColor: 'text-red-600',
      time: 'à l\'instant',
      urgency: 'warning',
      message: prefs.customMessages.review,
    },
  ];

  const activeBubbles = allBubbles.filter(b => {
    if (b.type === 'inactivity') return prefs.inactivity;
    if (b.type === 'stats')      return prefs.weeklyStats;
    if (b.type === 'review')     return prefs.badReview;
    return false;
  });

  const previewBubbles = activeBubbles.length > 0 ? activeBubbles : allBubbles;

  const typeLabel: Record<string, string> = {
    inactivity: '💤 Inactivité',
    stats: '📊 Stats hebdo',
    review: '⚠️ Avis urgent',
  };

  // Count how many messages have been customized
  const customizedCount = (Object.keys(DEFAULT_MESSAGES) as AlertType[])
    .filter(t => prefs.customMessages[t] !== DEFAULT_MESSAGES[t]).length;

  return (
    <div className="flex gap-8 flex-wrap lg:flex-nowrap">

      {/* ── Left panel ── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* Phone field */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Numéro de téléphone</h3>
          </div>

          <div className="relative max-w-sm">
            <input
              type="tel"
              value={prefs.phone}
              onChange={e => { update('phone', e.target.value); setPhoneError(''); }}
              placeholder="+33 6 12 34 56 78"
              className={`w-full rounded-2xl border px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${
                phoneError
                  ? 'border-red-400'
                  : prefs.phone && validatePhone(prefs.phone)
                    ? 'border-primary/60 bg-primary/3'
                    : 'border-border bg-background'
              }`}
            />
            {prefs.phone && validatePhone(prefs.phone) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}

          {prefs.phone && validatePhone(prefs.phone) && (
            <button
              onClick={handleTestSMS}
              className={`flex items-center gap-2 rounded-xl border text-sm font-medium px-4 py-2.5 transition-all ${
                testSent
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'hover:border-primary/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground border-border'
              }`}
            >
              {testSent
                ? <><Check size={13} className="text-green-600" /> SMS test envoyé !</>
                : <><MessageSquare size={13} /> Envoyer un SMS test</>
              }
            </button>
          )}
        </div>

        {/* Plan info */}
        <div className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${
          isPro ? 'border-green-300/50 bg-green-50/60' : 'border-amber-300/50 bg-amber-50/60'
        }`}>
          <Zap size={16} className={`shrink-0 mt-0.5 ${isPro ? 'text-green-600' : 'text-amber-600'}`} />
          <p className="text-xs leading-relaxed">
            {isPro ? (
              <>
                <strong>✅ SMS illimités inclus</strong> dans votre offre <strong>{currentPlan.name}</strong>.
                Activez autant d'alertes que vous voulez sans frais supplémentaires.
              </>
            ) : (
              <>
                💡 <strong>Les SMS de rappels sont inclus en illimité dans l'offre Pro et Expert.</strong>
                {' '}En version Free, chaque SMS envoyé consomme <strong>0.5 crédit</strong>.{' '}
                Solde actuel : <strong>{credits === 'unlimited' ? '∞' : credits} crédit{typeof credits === 'number' && credits !== 1 ? 's' : ''}</strong>.
              </>
            )}
          </p>
        </div>

        {/* Alert toggles with message editors */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Types d'alertes
            </h3>
            {customizedCount > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-violet-600 font-semibold bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
                <Pencil size={9} />
                {customizedCount} message{customizedCount > 1 ? 's' : ''} personnalisé{customizedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <AlertRow
            type="inactivity"
            icon={Bell}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            title="Alerte d'inactivité"
            description="M'alerter si je n'ai rien publié depuis plus de 5 jours."
            checked={prefs.inactivity}
            onChange={v => update('inactivity', v)}
            isPro={isPro}
            customMessage={prefs.customMessages.inactivity}
            onMessageChange={v => updateMessage('inactivity', v)}
            onMessageReset={() => resetMessage('inactivity')}
          />

          <AlertRow
            type="stats"
            icon={TrendingUp}
            iconBg="bg-green-100"
            iconColor="text-green-600"
            title="Rapport de performance"
            description="Recevoir mes statistiques de la semaine chaque lundi matin."
            checked={prefs.weeklyStats}
            onChange={v => update('weeklyStats', v)}
            isPro={isPro}
            badge="Chaque lundi"
            customMessage={prefs.customMessages.stats}
            onMessageChange={v => updateMessage('stats', v)}
            onMessageReset={() => resetMessage('stats')}
          />

          <AlertRow
            type="review"
            icon={Star}
            iconBg="bg-red-100"
            iconColor="text-red-500"
            title="Alertes d'avis clients"
            description="M'envoyer un SMS urgent si un avis Google 1 ou 2 étoiles est reçu."
            checked={prefs.badReview}
            onChange={v => update('badReview', v)}
            isPro={isPro}
            badge="Prioritaire"
            customMessage={prefs.customMessages.review}
            onMessageChange={v => updateMessage('review', v)}
            onMessageReset={() => resetMessage('review')}
          />
        </div>

        {/* Variables legend */}
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Variable size={12} />
            Variables disponibles dans vos messages
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {AVAILABLE_VARIABLES.map(v => (
              <div key={v.key} className="flex items-center gap-2 text-[11px]">
                <code className="font-mono font-bold bg-background border border-border rounded px-1.5 py-0.5 text-primary">{v.key}</code>
                <span className="text-muted-foreground">{v.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SMS History */}
        {history.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History size={14} className="text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Historique des SMS envoyés
              </h3>
            </div>
            <div className="rounded-2xl border border-border overflow-hidden">
              {history.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 px-4 py-3 text-sm ${
                    i < history.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <MessageSquare size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{typeLabel[entry.type]}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{entry.preview}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-muted-foreground">{entry.sentAt}</p>
                    {entry.creditCost > 0 ? (
                      <p className="text-[10px] text-amber-600 font-medium">−{entry.creditCost} crédit</p>
                    ) : (
                      <p className="text-[10px] text-green-600 font-medium">Inclus Pro</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel: Lock screen preview ── */}
      <div className="shrink-0 flex flex-col items-center gap-4 lg:w-[260px]">
        <div className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={14} className="text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Aperçu en direct</p>
          </div>
          <LockScreenPreview
            bubbles={previewBubbles}
            firstName={firstName}
            company={company}
          />
        </div>

        {/* Bubble legend */}
        <div className="w-full space-y-1.5">
          {previewBubbles.map(b => {
            const Icon = b.icon;
            const isCustom = prefs.customMessages[b.type] !== DEFAULT_MESSAGES[b.type];
            return (
              <div key={b.type} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                  b.urgency === 'warning' ? 'bg-red-500' :
                  b.urgency === 'success' ? 'bg-green-500' : 'bg-primary'
                }`}>
                  <Icon size={9} className="text-white" />
                </div>
                <span>{b.label}</span>
                {isCustom && (
                  <span className="flex items-center gap-0.5 text-violet-500 font-medium">
                    <Pencil size={8} /> perso.
                  </span>
                )}
                {!isPro ? (
                  <span className="text-amber-500 ml-auto">−0.5 crédit</span>
                ) : (
                  <span className="text-green-600 ml-auto">Inclus</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Hint */}
        <div className="w-full rounded-xl bg-primary/5 border border-primary/20 px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Astuce :</strong> Cliquez sur{' '}
          <span className="font-mono font-bold text-primary">✏ Message</span>{' '}
          sur chaque type d'alerte pour rédiger votre texte personnalisé. L'aperçu se met à jour en temps réel.
        </div>
      </div>
    </div>
  );
}
