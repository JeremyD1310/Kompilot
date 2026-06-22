/**
 * EmailMarketingPage — Mailchimp & SendGrid integration
 * Tabs: Connexions · Contacts importés · Composer une campagne · Statistiques
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Users, BarChart2, Link2, CheckCircle2, AlertTriangle,
  RefreshCw, Send, Eye, MousePointer, Ban, XCircle, Loader2, Plus, Trash2, FlaskConical,
} from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import { apiFetch } from '../config/api';
import { useAuth } from '../hooks/useAuth';
import { ABTestModal } from '../components/emailing/ABTestModal';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Contact {
  id: string;
  email: string;
  name: string;
  status: string;
  source: string;
  createdAt?: string;
}

interface MailchimpList {
  id: string;
  name: string;
  stats: { member_count: number; unsubscribe_count: number };
}

interface SendGridStats {
  requests: number;
  delivered: number;
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
}

// ── Storage helpers ────────────────────────────────────────────────────────────

function saveKeys(keys: { mailchimp?: string; sendgrid?: string }) {
  if (keys.mailchimp !== undefined) localStorage.setItem('nc_mailchimp_key', keys.mailchimp);
  if (keys.sendgrid !== undefined) localStorage.setItem('nc_sendgrid_key', keys.sendgrid);
}

function loadKeys() {
  return {
    mailchimp: localStorage.getItem('nc_mailchimp_key') ?? '',
    sendgrid: localStorage.getItem('nc_sendgrid_key') ?? '',
  };
}

// ── Small components ───────────────────────────────────────────────────────────

function ConnectionBadge({ connected, label }: { connected: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${connected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/50'}`} />
      {connected ? `${label} connecté` : `${label} non connecté`}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0`} style={{ background: color + '20' }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-xl font-black text-foreground">{value.toLocaleString('fr-FR')}</p>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

function TabBtn({ id, active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/60'}`}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = 'connexions' | 'contacts' | 'composer' | 'stats';

export default function EmailMarketingPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('connexions');
  const [showAbTest, setShowAbTest] = useState(false);

  // ── Keys state ──────────────────────────────────────────────────────────────
  const [keys, setKeys] = useState(loadKeys);
  const [mailchimpInput, setMailchimpInput] = useState(() => loadKeys().mailchimp);
  const [sendgridInput, setSendgridInput] = useState(() => loadKeys().sendgrid);

  const [mcStatus, setMcStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [sgStatus, setSgStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [mcError, setMcError] = useState('');
  const [sgError, setSgError] = useState('');

  // ── Contacts state ──────────────────────────────────────────────────────────
  const [mcLists, setMcLists] = useState<MailchimpList[]>([]);
  const [selectedList, setSelectedList] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');

  // ── Campaign state ──────────────────────────────────────────────────────────
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  // ── Stats state ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<SendGridStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState('');

  const token = (user as any)?.access_token ?? (user as any)?.token ?? '';

  // ── Test Mailchimp connection ───────────────────────────────────────────────
  const testMailchimp = useCallback(async () => {
    if (!mailchimpInput) return;
    setMcStatus('loading');
    setMcError('');
    try {
      await apiFetch('/api/email-marketing/mailchimp/test-connection', {
        method: 'POST',
        token,
        body: JSON.stringify({ apiKey: mailchimpInput }),
      });
      setKeys(k => ({ ...k, mailchimp: mailchimpInput }));
      saveKeys({ mailchimp: mailchimpInput });
      setMcStatus('ok');
      toast.success('Mailchimp connecté avec succès !');
      // Auto-load lists
      loadMailchimpLists(mailchimpInput);
    } catch (e: any) {
      setMcStatus('error');
      setMcError(e.message ?? 'Clé invalide');
      toast.error('Clé Mailchimp invalide');
    }
  }, [mailchimpInput, token]);

  // ── Test SendGrid connection ────────────────────────────────────────────────
  const testSendGrid = useCallback(async () => {
    if (!sendgridInput) return;
    setSgStatus('loading');
    setSgError('');
    try {
      const res = await apiFetch<{ username?: string }>('/api/email-marketing/sendgrid/test-connection', {
        method: 'POST',
        token,
        body: JSON.stringify({ apiKey: sendgridInput }),
      });
      setKeys(k => ({ ...k, sendgrid: sendgridInput }));
      saveKeys({ sendgrid: sendgridInput });
      setSgStatus('ok');
      toast.success(`SendGrid connecté${(res as any).username ? ` (${(res as any).username})` : ''} !`);
    } catch (e: any) {
      setSgStatus('error');
      setSgError(e.message ?? 'Clé invalide');
      toast.error('Clé SendGrid invalide');
    }
  }, [sendgridInput, token]);

  // ── Load Mailchimp lists ────────────────────────────────────────────────────
  const loadMailchimpLists = useCallback(async (apiKey: string) => {
    try {
      const res = await apiFetch<{ lists: MailchimpList[] }>('/api/email-marketing/mailchimp/lists', {
        method: 'POST',
        token,
        body: JSON.stringify({ apiKey }),
      });
      setMcLists((res as any).lists ?? []);
    } catch { /* silent */ }
  }, [token]);

  // Auto-load if key already saved
  useEffect(() => {
    const saved = loadKeys();
    if (saved.mailchimp) {
      setMcStatus('ok');
      loadMailchimpLists(saved.mailchimp);
    }
    if (saved.sendgrid) setSgStatus('ok');
  }, []);

  // ── Load contacts from list ─────────────────────────────────────────────────
  const loadContacts = useCallback(async (listId: string) => {
    if (!keys.mailchimp || !listId) return;
    setContactsLoading(true);
    setContactsError('');
    try {
      const res = await apiFetch<{ contacts: Contact[]; total: number }>(
        '/api/email-marketing/mailchimp/contacts',
        {
          method: 'POST',
          token,
          body: JSON.stringify({ apiKey: keys.mailchimp, listId }),
        }
      );
      setContacts((res as any).contacts ?? []);
      toast.success(`${(res as any).contacts?.length ?? 0} contacts importés`);
    } catch (e: any) {
      setContactsError(e.message ?? 'Erreur de chargement');
    } finally {
      setContactsLoading(false);
    }
  }, [keys.mailchimp, token]);

  // ── Send campaign ───────────────────────────────────────────────────────────
  const sendCampaign = useCallback(async () => {
    if (!keys.sendgrid || !fromEmail || !subject || !htmlContent || selectedContacts.length === 0) {
      toast.error('Remplissez tous les champs et sélectionnez des destinataires');
      return;
    }
    setSending(true);
    try {
      const recipients = contacts
        .filter(c => selectedContacts.includes(c.id))
        .map(c => ({ email: c.email, name: c.name }));

      const res = await apiFetch<{ sent: number }>('/api/email-marketing/sendgrid/send', {
        method: 'POST',
        token,
        body: JSON.stringify({
          apiKey: keys.sendgrid,
          fromEmail, fromName, subject, htmlContent,
          recipients,
        }),
      });
      toast.success(`Campagne envoyée à ${(res as any).sent} destinataires !`);
      // Reset
      setSelectedContacts([]);
      setSubject('');
      setHtmlContent('');
    } catch (e: any) {
      toast.error(e.message ?? 'Echec d\'envoi');
    } finally {
      setSending(false);
    }
  }, [keys.sendgrid, fromEmail, fromName, subject, htmlContent, selectedContacts, contacts, token]);

  // ── Load stats ──────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    if (!keys.sendgrid) return;
    setStatsLoading(true);
    try {
      const res = await apiFetch<{ stats: SendGridStats; period: string }>(
        '/api/email-marketing/sendgrid/stats',
        {
          method: 'POST',
          token,
          body: JSON.stringify({ apiKey: keys.sendgrid }),
        }
      );
      setStats((res as any).stats);
      setStatsPeriod((res as any).period ?? '');
    } catch (e: any) {
      toast.error(e.message ?? 'Erreur statistiques');
    } finally {
      setStatsLoading(false);
    }
  }, [keys.sendgrid, token]);

  useEffect(() => {
    if (tab === 'stats' && !stats && keys.sendgrid) loadStats();
  }, [tab]);

  const mcConnected = mcStatus === 'ok';
  const sgConnected = sgStatus === 'ok';

  const selectedContactObjects = contacts.filter(c => selectedContacts.includes(c.id));

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">Email Marketing</h1>
              <p className="text-sm text-muted-foreground">Synchronisez vos contacts et envoyez des campagnes ciblées</p>
            </div>
          </div>
          <div className="sm:ml-auto flex items-center gap-2 flex-wrap">
            <ConnectionBadge connected={mcConnected} label="Mailchimp" />
            <ConnectionBadge connected={sgConnected} label="SendGrid" />
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <TabBtn id="connexions" active={tab === 'connexions'} onClick={setTab} icon={Link2} label="Connexions" />
          <TabBtn id="contacts" active={tab === 'contacts'} onClick={setTab} icon={Users} label={`Contacts${contacts.length ? ` (${contacts.length})` : ''}`} />
          <TabBtn id="composer" active={tab === 'composer'} onClick={setTab} icon={Send} label="Composer" />
          <TabBtn id="stats" active={tab === 'stats'} onClick={setTab} icon={BarChart2} label="Statistiques" />
        </div>

        {/* ── Tab: Connexions ──────────────────────────────────────── */}
        {tab === 'connexions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Mailchimp card */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFE01B]/20 flex items-center justify-center text-xl shrink-0">🐒</div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Mailchimp</h3>
                  <p className="text-xs text-muted-foreground">Importez vos listes de contacts</p>
                </div>
                {mcConnected && <CheckCircle2 size={18} className="ml-auto text-emerald-500 shrink-0" />}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Clé API Mailchimp</label>
                <input
                  type="password"
                  value={mailchimpInput}
                  onChange={e => setMailchimpInput(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-us1"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Trouvez votre clé dans <strong>Profile → Extras → API Keys</strong>
                </p>
              </div>

              {mcError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{mcError}</p>
                </div>
              )}

              <button
                onClick={testMailchimp}
                disabled={!mailchimpInput || mcStatus === 'loading'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mcStatus === 'loading'
                  ? <><Loader2 size={14} className="animate-spin" /> Connexion...</>
                  : mcConnected
                    ? <><RefreshCw size={14} /> Reconnecter</>
                    : <><Link2 size={14} /> Connecter Mailchimp</>}
              </button>

              {mcConnected && mcLists.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">{mcLists.length} audience{mcLists.length > 1 ? 's' : ''} disponible{mcLists.length > 1 ? 's' : ''}</p>
                  <div className="space-y-1.5">
                    {mcLists.slice(0, 5).map(list => (
                      <div key={list.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-xs">
                        <span className="font-medium text-foreground truncate">{list.name}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">{list.stats?.member_count ?? 0} contacts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SendGrid card */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1A82E2]/20 flex items-center justify-center text-xl shrink-0">✉️</div>
                <div>
                  <h3 className="font-bold text-base text-foreground">SendGrid</h3>
                  <p className="text-xs text-muted-foreground">Envoyez vos campagnes transactionnelles</p>
                </div>
                {sgConnected && <CheckCircle2 size={18} className="ml-auto text-emerald-500 shrink-0" />}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Clé API SendGrid</label>
                <input
                  type="password"
                  value={sendgridInput}
                  onChange={e => setSendgridInput(e.target.value)}
                  placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Créez votre clé dans <strong>Settings → API Keys → Create</strong>
                </p>
              </div>

              {sgError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
                  <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400">{sgError}</p>
                </div>
              )}

              <button
                onClick={testSendGrid}
                disabled={!sendgridInput || sgStatus === 'loading'}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1A82E2] text-white font-semibold py-2.5 text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sgStatus === 'loading'
                  ? <><Loader2 size={14} className="animate-spin" /> Connexion...</>
                  : sgConnected
                    ? <><RefreshCw size={14} /> Reconnecter</>
                    : <><Link2 size={14} /> Connecter SendGrid</>}
              </button>

              {sgConnected && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    ✅ SendGrid prêt — vous pouvez envoyer des campagnes depuis l'onglet Composer
                  </p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ <strong>Vérification de domaine requise</strong> — Pour éviter le spam, vérifiez votre domaine d'envoi dans SendGrid → Settings → Sender Authentication.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Contacts ────────────────────────────────────────── */}
        {tab === 'contacts' && (
          <div className="space-y-4">
            {!mcConnected ? (
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">🐒</div>
                <h3 className="font-bold text-foreground">Mailchimp non connecté</h3>
                <p className="text-sm text-muted-foreground">Connectez votre compte Mailchimp pour importer vos contacts</p>
                <button onClick={() => setTab('connexions')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">
                  Configurer la connexion
                </button>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <select
                    value={selectedList}
                    onChange={e => setSelectedList(e.target.value)}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Sélectionnez une audience Mailchimp...</option>
                    {mcLists.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.stats?.member_count ?? 0} contacts)</option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadContacts(selectedList)}
                    disabled={!selectedList || contactsLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 transition-all"
                  >
                    {contactsLoading
                      ? <><Loader2 size={14} className="animate-spin" /> Import...</>
                      : <><RefreshCw size={14} /> Importer</>}
                  </button>
                </div>

                {contactsError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40">
                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-400">{contactsError}</p>
                  </div>
                )}

                {contacts.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="font-bold text-sm text-foreground">{contacts.length} contacts importés</p>
                      <button
                        onClick={() => setSelectedContacts(
                          selectedContacts.length === contacts.length ? [] : contacts.map(c => c.id)
                        )}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        {selectedContacts.length === contacts.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    </div>
                    <div className="divide-y divide-border max-h-80 overflow-y-auto">
                      {contacts.map(contact => (
                        <label key={contact.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={e => {
                              if (e.target.checked) setSelectedContacts(prev => [...prev, contact.id]);
                              else setSelectedContacts(prev => prev.filter(id => id !== contact.id));
                            }}
                            className="w-4 h-4 rounded accent-primary"
                          />
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${contact.status === 'subscribed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                            {contact.status}
                          </span>
                        </label>
                      ))}
                    </div>
                    {selectedContacts.length > 0 && (
                      <div className="px-4 py-3 bg-primary/5 border-t border-border flex items-center justify-between">
                        <p className="text-xs font-semibold text-primary">{selectedContacts.length} sélectionné{selectedContacts.length > 1 ? 's' : ''}</p>
                        <button onClick={() => setTab('composer')} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                          <Send size={11} /> Composer une campagne →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Composer ────────────────────────────────────────── */}
        {tab === 'composer' && (
          <div className="space-y-4">
            {!sgConnected ? (
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">✉️</div>
                <h3 className="font-bold text-foreground">SendGrid non connecté</h3>
                <p className="text-sm text-muted-foreground">Connectez votre compte SendGrid pour envoyer des emails</p>
                <button onClick={() => setTab('connexions')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">
                  Configurer SendGrid
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-bold text-base text-foreground">Nouvelle campagne email</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Email expéditeur *</label>
                    <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="hello@votredomaine.com"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Nom affiché</label>
                    <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Votre entreprise"
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Objet de l'email *</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="🎉 Offre exclusive réservée à nos clients fidèles"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground">Contenu HTML *</label>
                    <button onClick={() => setHtmlContent(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px}h1{color:#0D9488}p{color:#333;line-height:1.6}.cta{background:#0D9488;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px}</style></head>
<body>
  <h1>Bonjour !</h1>
  <p>Nous avons une offre exclusive pour vous aujourd'hui.</p>
  <p>En tant que client fidèle, bénéficiez de <strong>20% de réduction</strong> sur votre prochaine visite.</p>
  <a href="https://votresite.com" class="cta">Profitez de l'offre</a>
</body>
</html>`)}
                      className="text-[11px] text-primary font-semibold hover:underline">
                      + Template par défaut
                    </button>
                  </div>
                  <textarea value={htmlContent} onChange={e => setHtmlContent(e.target.value)} rows={8}
                    placeholder="Votre contenu HTML ici..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono resize-y" />
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  {selectedContacts.length === 0 ? (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Aucun destinataire sélectionné</p>
                      <button onClick={() => setTab('contacts')} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                        <Plus size={11} /> Sélectionner des contacts
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">
                        <Users size={13} className="inline mr-1.5 text-primary" />
                        {selectedContacts.length} destinataire{selectedContacts.length > 1 ? 's' : ''} sélectionné{selectedContacts.length > 1 ? 's' : ''}
                      </p>
                      <button onClick={() => setSelectedContacts([])} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                        <Trash2 size={11} /> Vider
                      </button>
                    </div>
                  )}
                </div>

                {/* A/B Test banner */}
                {selectedContacts.length >= 2 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40">
                    <div className="flex items-center gap-2">
                      <FlaskConical size={14} className="text-violet-600 dark:text-violet-400 shrink-0" />
                      <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">
                        Vous avez {selectedContacts.length} destinataires — testez deux versions pour maximiser les ouvertures.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAbTest(true)}
                      className="ml-3 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:opacity-90 transition-all"
                    >
                      <FlaskConical size={11} /> Test A/B
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={sendCampaign}
                    disabled={sending || !fromEmail || !subject || !htmlContent || selectedContacts.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-bold py-3 text-sm hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending
                      ? <><Loader2 size={16} className="animate-spin" /> Envoi...</>
                      : <><Send size={16} /> Envoyer ({selectedContacts.length})</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Stats ───────────────────────────────────────────── */}
        {tab === 'stats' && (
          <div className="space-y-4">
            {!sgConnected ? (
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <BarChart2 size={32} className="text-muted-foreground" />
                <h3 className="font-bold text-foreground">Statistiques SendGrid</h3>
                <p className="text-sm text-muted-foreground">Connectez SendGrid pour voir vos statistiques d'envoi</p>
                <button onClick={() => setTab('connexions')} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">
                  Configurer SendGrid
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {statsPeriod ? `Période : ${statsPeriod}` : 'Statistiques des 7 derniers jours'}
                  </p>
                  <button onClick={loadStats} disabled={statsLoading} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                    <RefreshCw size={12} className={statsLoading ? 'animate-spin' : ''} /> Actualiser
                  </button>
                </div>

                {statsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <StatCard icon={Send} label="Emails envoyés" value={stats.requests} color="#0D9488" />
                      <StatCard icon={CheckCircle2} label="Délivrés" value={stats.delivered} color="#10B981" />
                      <StatCard icon={Eye} label="Ouvertures" value={stats.opens} color="#6366F1" />
                      <StatCard icon={MousePointer} label="Clics" value={stats.clicks} color="#F59E0B" />
                      <StatCard icon={XCircle} label="Bounces" value={stats.bounces} color="#EF4444" />
                      <StatCard icon={Ban} label="Désabonnements" value={stats.unsubscribes} color="#6B7280" />
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                      <h3 className="font-bold text-sm text-foreground">Taux de performance</h3>
                      {[
                        { label: 'Taux de délivrabilité', value: stats.requests > 0 ? (stats.delivered / stats.requests * 100) : 0, color: '#10B981', good: 95 },
                        { label: "Taux d'ouverture", value: stats.delivered > 0 ? (stats.opens / stats.delivered * 100) : 0, color: '#6366F1', good: 25 },
                        { label: 'Taux de clic (CTR)', value: stats.opens > 0 ? (stats.clicks / stats.opens * 100) : 0, color: '#F59E0B', good: 10 },
                      ].map(item => (
                        <div key={item.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">{item.label}</span>
                            <span className="font-black text-foreground">{item.value.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(item.value, 100)}%`, background: item.color }} />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Référence secteur : {item.good}%{item.value >= item.good ? ' ✅ Au-dessus de la moyenne' : ' — à améliorer'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-12">
                    <BarChart2 size={32} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Cliquez sur Actualiser pour charger les statistiques</p>
                    <button onClick={loadStats} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all">
                      Charger les statistiques
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      {/* ── A/B Test Modal ───────────────────────────────────────────── */}
      {showAbTest && (
        <ABTestModal
          onClose={() => setShowAbTest(false)}
          contacts={selectedContactObjects}
          fromEmail={fromEmail}
          fromName={fromName}
          baseSubject={subject}
          baseHtml={htmlContent}
          sendgridKey={keys.sendgrid}
        />
      )}
    </div>
  );
}