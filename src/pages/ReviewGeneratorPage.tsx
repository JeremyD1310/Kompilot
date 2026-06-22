import { useState, useCallback } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, Button, Badge, toast,
} from '@blinkdotnew/ui';
import { Star, Send, RefreshCw, MessageSquare, Mail, Clock, Zap, CheckCircle2, Eye, TrendingUp, Copy, Pencil, CalendarDays, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEstablishment } from '../context/EstablishmentContext';
import { ReviewCalendar, type ReviewRecord } from '../components/reviews/ReviewCalendar';
import type { NewEventData } from '../components/reviews/NewEventModal';
import { expandRecurrenceDates } from '../components/reviews/NewEventModal';

// ── Types ──────────────────────────────────────────────────────────────────────

type SendChannel = 'sms' | 'email';
type SendDelay = '1h' | '4h' | 'tomorrow10';
type ReviewStatus = 'sent' | 'opened' | 'reviewed' | 'scheduled';

interface SendRecord {
  id: string;
  clientName: string;
  clientContact: string;
  sentAt: string;
  channel: SendChannel;
  status: ReviewStatus;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DELAY_OPTIONS: { value: SendDelay; label: string; desc: string }[] = [
  { value: '1h', label: '1 heure après', desc: 'Le client reçoit le message 1h après son passage' },
  { value: '4h', label: '4 heures après', desc: 'Délai idéal pour la plupart des secteurs' },
  { value: 'tomorrow10', label: 'Le lendemain à 10h', desc: 'Plus de recul, taux d\'ouverture maximal' },
];

const STATUS_STYLES: Record<ReviewStatus, { label: string; className: string; icon: React.ReactNode }> = {
  scheduled: {
    label: 'Programmé',
    className: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: <Clock size={11} />,
  },
  sent: {
    label: 'Envoyé',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: <Send size={11} />,
  },
  opened: {
    label: 'Ouvert',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Eye size={11} />,
  },
  reviewed: {
    label: 'Avis déposé 🎉',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 size={11} />,
  },
};

const MOCK_HISTORY: SendRecord[] = [
  // Past sends
  { id: '1',  clientName: 'Marie D.',    clientContact: '06 12 34 56 78',        sentAt: '31/05/2026 14h30', channel: 'sms',   status: 'reviewed' },
  { id: '2',  clientName: 'Thomas B.',   clientContact: 'thomas.b@email.fr',     sentAt: '31/05/2026 11h00', channel: 'email', status: 'opened' },
  { id: '3',  clientName: 'Sophie M.',   clientContact: '06 98 76 54 32',        sentAt: '30/05/2026 16h45', channel: 'sms',   status: 'sent' },
  { id: '4',  clientName: 'Lucas R.',    clientContact: 'lucas.r@gmail.com',     sentAt: '30/05/2026 10h15', channel: 'email', status: 'reviewed' },
  { id: '5',  clientName: 'Camille F.',  clientContact: '07 45 23 11 89',        sentAt: '29/05/2026 18h00', channel: 'sms',   status: 'reviewed' },
  { id: '6',  clientName: 'Julien P.',   clientContact: 'julien.p@outlook.fr',   sentAt: '29/05/2026 09h30', channel: 'email', status: 'opened' },
  { id: '7',  clientName: 'Nathalie K.', clientContact: '06 11 22 33 44',        sentAt: '27/05/2026 15h00', channel: 'sms',   status: 'reviewed' },
  { id: '8',  clientName: 'Pierre V.',   clientContact: 'pierre.v@gmail.com',    sentAt: '26/05/2026 10h30', channel: 'email', status: 'sent' },
  // Upcoming scheduled
  { id: '9',  clientName: 'Amandine T.', clientContact: '06 77 88 99 00',        sentAt: '02/06/2026 10h00', channel: 'sms',   status: 'scheduled' },
  { id: '10', clientName: 'Rémi C.',     clientContact: 'remi.c@gmail.com',      sentAt: '03/06/2026 10h00', channel: 'email', status: 'scheduled' },
  { id: '11', clientName: 'Laure M.',    clientContact: '07 55 66 77 88',        sentAt: '05/06/2026 10h00', channel: 'sms',   status: 'scheduled' },
  { id: '12', clientName: 'Axel D.',     clientContact: 'axel.d@outlook.fr',     sentAt: '07/06/2026 10h00', channel: 'email', status: 'scheduled' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 flex items-start gap-3 ${color}`}>
      <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold text-foreground leading-tight">{value}</p>
        <p className="text-xs font-semibold text-foreground/80 leading-tight">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

function DelayOption({ opt, selected, onSelect }: { opt: typeof DELAY_OPTIONS[0]; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all cursor-pointer w-full',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/40 hover:bg-muted/40'
      )}
    >
      <div className={cn(
        'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-all',
        selected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
      )}>
        {selected && <div className="w-full h-full flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-white" /></div>}
      </div>
      <div>
        <p className={cn('text-sm font-bold leading-tight', selected ? 'text-primary' : 'text-foreground')}>{opt.label}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{opt.desc}</p>
      </div>
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ReviewGeneratorPage() {
  const { activeEstablishment } = useEstablishment();
  const shopName = activeEstablishment?.name || 'votre commerce';
  const category = activeEstablishment?.category || 'commerce';

  // ── State
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [delay, setDelay] = useState<SendDelay>('4h');
  const [channel, setChannel] = useState<SendChannel>('sms');
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState<SendRecord[]>(MOCK_HISTORY);
  const [manualClient, setManualClient] = useState('');
  const [manualContact, setManualContact] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<'list' | 'calendar'>('list');

  // ── Generated templates
  const smsTemplate = `Bonjour [Prénom_Client], toute l'équipe de ${shopName} espère que vous avez passé un agréable moment ! 😊 Votre avis compte énormément pour nous. Laissez-nous une note en 5 secondes ici 👉 [Lien_Google_Maps]`;

  const emailSubject = `Votre avis compte pour l'équipe de ${shopName} !`;
  const emailBody = `Bonjour [Prénom_Client],\n\nMerci de votre visite chez ${shopName} ! Nous espérons que vous avez été pleinement satisfait(e) de votre ${category === 'Restaurant' ? 'repas' : 'prestation'}.\n\nSi vous avez quelques secondes, votre avis Google nous aide énormément à nous améliorer et à aider de nouveaux clients à nous découvrir :\n\n👉 [Lien_Google_Maps]\n\nMerci du fond du cœur ! 🙏\n\nL'équipe ${shopName}`;

  const [smsText, setSmsText] = useState(smsTemplate);
  const [emailSubjectText, setEmailSubjectText] = useState(emailSubject);
  const [emailBodyText, setEmailBodyText] = useState(emailBody);

  // ── Handlers
  const handleCopyMessage = useCallback(() => {
    const text = channel === 'sms' ? smsText : `Objet : ${emailSubjectText}\n\n${emailBodyText}`;
    navigator.clipboard.writeText(text);
    toast.success('Message copié dans le presse-papier 📋');
  }, [channel, smsText, emailSubjectText, emailBodyText]);

  const handleManualSend = () => {
    if (!manualClient.trim() || !manualContact.trim()) {
      toast.error('Veuillez renseigner le nom et le contact du client.');
      return;
    }
    const newRecord: SendRecord = {
      id: Date.now().toString(),
      clientName: manualClient.trim(),
      clientContact: manualContact.trim(),
      sentAt: new Date().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ''),
      channel,
      status: 'sent',
    };
    setHistory(prev => [newRecord, ...prev]);
    setManualClient('');
    setManualContact('');
    toast.success(`✅ Demande d'avis envoyée à ${newRecord.clientName} par ${channel === 'sms' ? 'SMS' : 'E-mail'} !`);
  };

  const handleRetry = (id: string) => {
    setSendingId(id);
    setTimeout(() => {
      setHistory(prev => prev.map(r => r.id === id ? { ...r, status: 'sent' as ReviewStatus } : r));
      setSendingId(null);
      toast.success('✅ Relance envoyée avec succès !');
    }, 1200);
  };

  // ── Stats
  const totalSent = history.length;
  const totalOpened = history.filter(r => r.status === 'opened' || r.status === 'reviewed').length;
  const totalReviewed = history.filter(r => r.status === 'reviewed').length;
  const conversionRate = totalSent > 0 ? Math.round((totalReviewed / totalSent) * 100) : 0;

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-xl shadow-sm">⭐</div>
          <div>
            <PageTitle>Générateur d'Avis Google 🌟</PageTitle>
            <PageDescription>Automatisez vos demandes d'avis Google Maps après chaque passage client</PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <div className="space-y-8 max-w-4xl">

          {/* ── KPI Cards ───────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              label="Envois totaux"
              value={String(totalSent)}
              sub="ce mois-ci"
              icon={<Send size={16} className="text-blue-600" />}
              color="bg-blue-50 border-blue-200"
            />
            <KpiCard
              label="Messages ouverts"
              value={String(totalOpened)}
              sub={`${totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0}% d'ouverture`}
              icon={<Eye size={16} className="text-amber-600" />}
              color="bg-amber-50 border-amber-200"
            />
            <KpiCard
              label="Avis déposés"
              value={String(totalReviewed)}
              icon={<Star size={16} className="text-emerald-600" />}
              color="bg-emerald-50 border-emerald-200"
            />
            <KpiCard
              label="Taux de conversion"
              value={`${conversionRate}%`}
              sub="avis / envois"
              icon={<TrendingUp size={16} className="text-primary" />}
              color="bg-primary/5 border-primary/20"
            />
          </div>

          {/* ── Section 1: Automation Toggle ────────────────────────── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <Zap size={16} className="text-primary shrink-0" />
              <h2 className="text-sm font-bold text-foreground">Configuration de l'automatisation</h2>
            </div>
            <div className="px-6 py-5 space-y-5">

              {/* Toggle */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">
                    Automatiser les demandes d'avis après un rendez-vous / service ⚡
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Chaque client reçoit automatiquement un message d'invitation après son passage, sans action de votre part.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAutoEnabled(v => !v);
                    toast(autoEnabled ? 'Automatisation désactivée' : '✅ Automatisation activée !');
                  }}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-all duration-200 shrink-0 mt-0.5',
                    autoEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200',
                    autoEnabled ? 'left-[26px]' : 'left-0.5'
                  )} />
                </button>
              </div>

              {/* Active badge */}
              {autoEnabled && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <p className="text-xs font-bold text-emerald-700">
                    Automatisation active — Vos clients recevront une invitation {delay === '1h' ? '1 heure' : delay === '4h' ? '4 heures' : 'le lendemain à 10h'} après leur passage.
                  </p>
                </div>
              )}

              {/* Delay selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Clock size={12} /> Envoyer l'invitation...
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DELAY_OPTIONS.map(opt => (
                    <DelayOption
                      key={opt.value}
                      opt={opt}
                      selected={delay === opt.value}
                      onSelect={() => setDelay(opt.value)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 2: Channel + Message Preview ────────────────── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <MessageSquare size={16} className="text-primary shrink-0" />
              <h2 className="text-sm font-bold text-foreground">Canal d'envoi & Aperçu du message IA</h2>
            </div>
            <div className="px-6 py-5 space-y-5">

              {/* Channel tabs */}
              <div className="flex gap-2">
                {[
                  { id: 'sms', label: 'Option SMS 📱', icon: <MessageSquare size={14} /> },
                  { id: 'email', label: 'Option E-mail ✉️', icon: <Mail size={14} /> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setChannel(tab.id as SendChannel); setEditing(false); }}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all cursor-pointer',
                      channel === tab.id
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Message preview */}
              {channel === 'sms' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wide">Aperçu du SMS</label>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-semibold',
                        smsText.length <= 160 ? 'text-emerald-600' : 'text-amber-600'
                      )}>
                        {smsText.length}/160 car.
                      </span>
                      <button
                        onClick={() => setEditing(v => !v)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <Pencil size={11} /> {editing ? 'Fermer' : 'Modifier'}
                      </button>
                    </div>
                  </div>
                  {editing ? (
                    <textarea
                      value={smsText}
                      onChange={e => setSmsText(e.target.value)}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                    />
                  ) : (
                    <div className="flex gap-3 items-start">
                      {/* Phone bubble */}
                      <div className="flex-1 rounded-2xl rounded-tl-sm border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                        {smsText}
                      </div>
                      <div className="shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquare size={14} className="text-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wide">Aperçu de l'E-mail</label>
                  <div className="rounded-xl border border-border overflow-hidden">
                    {/* Email header */}
                    <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Objet :</span>
                        {editing ? (
                          <input
                            value={emailSubjectText}
                            onChange={e => setEmailSubjectText(e.target.value)}
                            className="flex-1 text-sm font-semibold bg-transparent border-b border-primary/40 focus:outline-none py-0.5"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-foreground">{emailSubjectText}</span>
                        )}
                        <button
                          onClick={() => setEditing(v => !v)}
                          className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 shrink-0"
                        >
                          <Pencil size={11} /> {editing ? 'Fermer' : 'Modifier'}
                        </button>
                      </div>
                    </div>
                    {/* Email body */}
                    <div className="px-4 py-4">
                      {editing ? (
                        <textarea
                          value={emailBodyText}
                          onChange={e => setEmailBodyText(e.target.value)}
                          rows={8}
                          className="w-full text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap bg-transparent border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      ) : (
                        <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{emailBodyText}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button onClick={handleCopyMessage} variant="outline" className="gap-2 text-xs">
                  <Copy size={13} /> Copier le message
                </Button>
                <p className="text-[11px] text-muted-foreground">
                  💡 Remplacez <code className="bg-muted px-1 rounded text-[10px]">[Prénom_Client]</code> et <code className="bg-muted px-1 rounded text-[10px]">[Lien_Google_Maps]</code> par les vraies valeurs lors de l'envoi manuel.
                </p>
              </div>

              {/* Manual send */}
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-4 space-y-3">
                <p className="text-xs font-bold text-foreground">Envoi manuel ponctuel 🚀</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualClient}
                    onChange={e => setManualClient(e.target.value)}
                    placeholder="Nom du client (ex: Marie D.)"
                    className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                  />
                  <input
                    type="text"
                    value={manualContact}
                    onChange={e => setManualContact(e.target.value)}
                    placeholder={channel === 'sms' ? 'Numéro de téléphone' : 'Adresse e-mail'}
                    className="rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
                  />
                </div>
                <Button onClick={handleManualSend} className="gap-2 text-sm font-bold">
                  <Send size={14} /> Envoyer la demande d'avis
                </Button>
              </div>
            </div>
          </div>

          {/* ── Section 3: History (List or Calendar) ───────────────── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-primary shrink-0" />
                <h2 className="text-sm font-bold text-foreground">Campagnes de demandes d'avis</h2>
                <Badge variant="secondary" className="text-[10px]">{history.length} envois</Badge>
              </div>
              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setHistoryView('list')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors',
                    historyView === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  <List size={12} /> Liste
                </button>
                <button
                  onClick={() => setHistoryView('calendar')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors border-l border-border',
                    historyView === 'calendar'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  )}
                >
                  <CalendarDays size={12} /> Calendrier
                </button>
              </div>
            </div>

            {/* Calendar view */}
            {historyView === 'calendar' && (
              <div className="p-4">
                <ReviewCalendar
                  records={history}
                  onAddEvent={(event: NewEventData) => {
                    const [h, mi] = event.time.split(':');
                    const dates = expandRecurrenceDates(event.date, event.recurrence);
                    const newRecords: ReviewRecord[] = dates.map((dateStr, i) => {
                      const [y, mo, d] = dateStr.split('-');
                      return {
                        id: `${event.id}-${i}`,
                        clientName: event.clientName,
                        clientContact: event.clientContact,
                        sentAt: `${d}/${mo}/${y} ${h}h${mi}`,
                        channel: event.channel,
                        status: 'scheduled',
                      };
                    });
                    setHistory(prev => [...newRecords, ...prev]);
                  }}
                />
              </div>
            )}

            {/* Table view */}
            <div className={cn('overflow-x-auto', historyView === 'calendar' && 'hidden')}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Client</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Contact</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Canal</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Date d'envoi</th>
                    <th className="text-left px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Statut</th>
                    <th className="text-right px-5 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record, idx) => {
                    const st = STATUS_STYLES[record.status];
                    return (
                      <tr
                        key={record.id}
                        className={cn(
                          'border-b border-border/50 transition-colors hover:bg-muted/20',
                          idx % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                        )}
                      >
                        {/* Client */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                              {record.clientName.charAt(0)}
                            </div>
                            <span className="font-semibold text-foreground text-sm">{record.clientName}</span>
                          </div>
                        </td>
                        {/* Contact */}
                        <td className="px-5 py-3 text-muted-foreground text-xs hidden sm:table-cell">
                          {record.clientContact}
                        </td>
                        {/* Canal */}
                        <td className="px-5 py-3 hidden md:table-cell">
                          <span className={cn(
                            'flex items-center gap-1.5 w-fit rounded-full px-2 py-1 text-[10px] font-bold border',
                            record.channel === 'sms'
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          )}>
                            {record.channel === 'sms' ? <MessageSquare size={10} /> : <Mail size={10} />}
                            {record.channel === 'sms' ? 'SMS' : 'E-mail'}
                          </span>
                        </td>
                        {/* Date */}
                        <td className="px-5 py-3 text-muted-foreground text-xs">{record.sentAt}</td>
                        {/* Status */}
                        <td className="px-5 py-3">
                          <span className={cn(
                            'flex items-center gap-1 w-fit rounded-full px-2.5 py-1 text-[10px] font-bold border',
                            st.className
                          )}>
                            {st.icon}
                            {st.label}
                          </span>
                        </td>
                        {/* Action */}
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleRetry(record.id)}
                            disabled={sendingId === record.id}
                            className="flex items-center gap-1.5 ml-auto rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <RefreshCw size={11} className={sendingId === record.id ? 'animate-spin' : ''} />
                            Relancer 🚀
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {history.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-2xl">⭐</div>
                  <p className="text-sm font-bold text-foreground">Aucun envoi pour l'instant</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Activez l'automatisation ou envoyez votre première demande manuellement.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </PageBody>
    </Page>
  );
}
