/**
 * MetaConnectionPanel — Official Meta (Facebook + Instagram) OAuth 2.0 connection flow.
 *
 * Phase 0 : CTA — "Associer mes comptes Meta"
 * Phase 1 : Permission consent popup (simulated)
 * Phase 2 : Page / account selector + final validation
 * Phase 3 : Connected state with management options
 */
import { useState } from 'react';
import { Check, X, Shield, AlertCircle, ChevronDown, RefreshCw, Unlink, ExternalLink, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from '@blinkdotnew/ui';
import { WhatsAppSupportButton } from '../shared/WhatsAppSupportButton';
import { useConnectionErrorTracker } from '../../hooks/useConnectionErrorTracker';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'consent' | 'selecting' | 'syncing' | 'connected';

interface MetaPage {
  id: string;
  name: string;
  category: string;
  fans: number;
}

interface MetaIGAccount {
  id: string;
  username: string;
  followers: number;
  linked_page: string; // page id
}

// ── Simulated Meta data ───────────────────────────────────────────────────────

const FAKE_PAGES: MetaPage[] = [
  { id: 'pg_1', name: 'Boulangerie du Marché', category: 'Boulangerie / Pâtisserie', fans: 1247 },
  { id: 'pg_2', name: 'Mon Commerce Local',   category: 'Commerce de détail',         fans: 432  },
  { id: 'pg_3', name: 'Café des Artistes',    category: 'Restaurant / Café',          fans: 2891 },
];

const FAKE_IG: MetaIGAccount[] = [
  { id: 'ig_1', username: '@boulangerie.marche',  followers: 1843, linked_page: 'pg_1' },
  { id: 'ig_2', username: '@cafe.des.artistes',   followers: 3102, linked_page: 'pg_3' },
];

// ── Permission items ──────────────────────────────────────────────────────────

const PERMISSIONS = [
  {
    scope: 'instagram_content_publish',
    title: 'Publier du contenu Instagram',
    description: "Pour que l'IA puisse publier tes posts et Reels en automatique.",
    required: true,
  },
  {
    scope: 'pages_read_engagement · instagram_manage_comments',
    title: 'Lire les messages & commentaires',
    description: "Pour alimenter ta Messagerie Unique et lire les messages/commentaires.",
    required: true,
  },
  {
    scope: 'pages_manage_posts',
    title: 'Publier sur tes Pages Facebook',
    description: "Pour planifier et publier directement sur ta Page Facebook professionnelle.",
    required: true,
  },
  {
    scope: 'ads_management',
    title: 'Gérer les Publicités Meta',
    description: "Pour faire tourner ton module de Publicité IA en 3 clics.",
    required: false,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaLogo() {
  return (
    <svg viewBox="0 0 40 24" className="h-5 w-auto" fill="none">
      <path d="M20 6c-2.2 0-4 3.6-4 8s1.8 8 4 8 4-3.6 4-8-1.8-8-4-8z" fill="url(#mg)" />
      <path d="M11.5 6C9.6 6 8 7.9 8 14c0 6.2 1.6 8 3.5 8 1.2 0 2.2-1 3-3" fill="none" stroke="url(#mg)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28.5 6c1.9 0 3.5 1.9 3.5 8 0 6.2-1.6 8-3.5 8-1.2 0-2.2-1-3-3" fill="none" stroke="url(#mg)" strokeWidth="2.5" strokeLinecap="round" />
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0064E0" />
          <stop offset="100%" stopColor="#0080FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SelectDropdown<T extends { id: string; name?: string; username?: string; category?: string; fans?: number; followers?: number }>({
  label, items, value, onChange, placeholder, renderLabel
}: {
  label: string;
  items: T[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  renderLabel: (item: T) => React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {items.map(item => (
            <option key={item.id} value={item.id}>
              {item.name ?? item.username}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {/* Preview of selected item */}
      {value && (() => {
        const item = items.find(i => i.id === value);
        if (!item) return null;
        return (
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
              <span className="text-[9px] text-white font-bold">
                {(item.name ?? item.username ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              {renderLabel(item)}
            </div>
            <Check size={12} className="text-emerald-500 shrink-0" />
          </div>
        );
      })()}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MetaConnectionPanel() {
  const [phase, setPhase]               = useState<Phase>('idle');
  const [permissions, setPermissions]   = useState<Record<string, boolean>>(
    Object.fromEntries(PERMISSIONS.map(p => [p.scope, true]))
  );
  const [selectedPage, setSelectedPage] = useState('');
  const [selectedIg,   setSelectedIg]   = useState('');
  const [connectedPage, setConnectedPage] = useState<MetaPage | null>(null);
  const [connectedIg,   setConnectedIg]   = useState<MetaIGAccount | null>(null);
  const { showWhatsApp, recordError } = useConnectionErrorTracker(2);

  // Filter IG accounts to those linked to the selected page
  const availableIg = selectedPage
    ? FAKE_IG.filter(ig => ig.linked_page === selectedPage)
    : FAKE_IG;

  const allRequiredChecked = PERMISSIONS.filter(p => p.required).every(p => permissions[p.scope]);

  const handleOAuthClick = () => setPhase('consent');

  const handleConsentAccept = () => {
    setPhase('selecting');
    // Auto-pre-select first items
    setSelectedPage(FAKE_PAGES[0].id);
    setTimeout(() => setSelectedIg(FAKE_IG[0].id), 200);
  };

  const handleSync = async () => {
    if (!selectedPage || !selectedIg) {
      toast.error('Sélectionnez une page et un compte Instagram.');
      recordError();
      return;
    }
    setPhase('syncing');
    await new Promise(r => setTimeout(r, 2200));
    setConnectedPage(FAKE_PAGES.find(p => p.id === selectedPage) ?? null);
    setConnectedIg(FAKE_IG.find(ig => ig.id === selectedIg) ?? null);
    setPhase('connected');
    toast.success('Comptes Meta synchronisés avec succès ! 🎉', {
      description: 'Vos posts seront maintenant publiés directement via l\'API Meta.',
    });
  };

  const handleDisconnect = () => {
    setPhase('idle');
    setSelectedPage('');
    setSelectedIg('');
    setConnectedPage(null);
    setConnectedIg(null);
    toast('Comptes Meta déconnectés', { description: 'Vous pouvez les reconnecter à tout moment.' });
  };

  // ── CONNECTED STATE ──────────────────────────────────────────────────────────
  if (phase === 'connected' && connectedPage && connectedIg) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400/50 bg-gradient-to-br from-emerald-50/80 to-card dark:from-emerald-950/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-200/60 bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1877F2] to-[#E1306C] flex items-center justify-center shrink-0 shadow-md">
            <MetaLogo />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold text-foreground">Comptes Meta connectés ✅</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Synchronisation active via l\'API officielle Meta</p>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Actif
          </span>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Connected accounts */}
          <div className="grid sm:grid-cols-2 gap-3">
            {/* Facebook page */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#1877F2] flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-extrabold">f</span>
                </div>
                <p className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Page Facebook</p>
              </div>
              <p className="text-sm font-bold text-foreground">{connectedPage.name}</p>
              <p className="text-[11px] text-muted-foreground">{connectedPage.category} · {connectedPage.fans.toLocaleString('fr-FR')} fans</p>
            </div>
            {/* Instagram account */}
            <div className="rounded-xl border border-pink-200 bg-gradient-to-br from-pink-50/60 to-orange-50/40 dark:from-pink-950/20 dark:to-orange-950/10 px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#833AB4] to-[#FCAF45] flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-extrabold">ig</span>
                </div>
                <p className="text-[11px] font-bold text-pink-800 dark:text-pink-300 uppercase tracking-wide">Compte Instagram</p>
              </div>
              <p className="text-sm font-bold text-foreground">{connectedIg.username}</p>
              <p className="text-[11px] text-muted-foreground">{connectedIg.followers.toLocaleString('fr-FR')} abonnés</p>
            </div>
          </div>

          {/* Active permissions */}
          <div className="rounded-xl border border-border bg-card px-4 py-3 space-y-2">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">Permissions actives</p>
            <div className="flex flex-wrap gap-1.5">
              {PERMISSIONS.filter(p => permissions[p.scope]).map(p => (
                <span key={p.scope} className="flex items-center gap-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                  <Check size={9} strokeWidth={3} /> {p.title}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toast.success('Synchronisation lancée…')}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg px-3 py-2 transition-colors"
            >
              <RefreshCw size={12} /> Synchroniser maintenant
            </button>
            <button
              onClick={() => window.open('https://business.facebook.com/settings', '_blank')}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
            >
              <ExternalLink size={12} /> Gérer sur Meta Business
            </button>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg px-3 py-2 transition-colors ml-auto"
            >
              <Unlink size={12} /> Déconnecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── IDLE STATE (CTA) ─────────────────────────────────────────────────────────
  return (
    <>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Gradient banner */}
        <div className="h-2 bg-gradient-to-r from-[#1877F2] via-[#E1306C] to-[#FCAF45]" />

        <div className="px-5 py-5 space-y-4">
          {/* Header row */}
          <div className="flex items-start gap-4">
            {/* Meta composite icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1877F2] to-[#E1306C] flex items-center justify-center shrink-0 shadow-lg">
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-foreground">Connexion Meta Officielle</h3>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">API Graph v21</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                Connectez votre Page Facebook et votre compte Instagram Professionnel pour publier en automatique, lire vos messages et activer la Publicité IA.
              </p>
            </div>
          </div>

          {/* What it unlocks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { emoji: '🤖', label: 'Publications IA', desc: 'Posts & Reels auto' },
              { emoji: '💬', label: 'Messagerie unifiée', desc: 'Messages & commentaires' },
              { emoji: '📣', label: 'Publicité IA', desc: 'Campagnes en 3 clics' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                <span className="text-lg shrink-0">{f.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA button */}
          <button
            onClick={handleOAuthClick}
            className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-[#1877F2] via-[#7B4FFF] to-[#E1306C] hover:brightness-110"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="white">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
            Associer mes comptes Meta (Facebook &amp; Instagram) 🔐
          </button>

          {/* RGPD reassurance */}
          <div className="flex items-start gap-2.5">
            <Lock size={13} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              <span className="font-semibold text-foreground">Connexion sécurisée via l'API officielle de Meta.</span>{' '}
              Kompilot ne stocke jamais vos mots de passe. Vos données sont chiffrées et conformes RGPD. Vous pouvez révoquer l'accès à tout moment depuis votre espace Meta Business.
            </p>
          </div>
        </div>
      </div>

      {/* ── CONSENT POPUP OVERLAY ── */}
      {phase === 'consent' && (
        <>
          <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              {/* Popup header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-[#1877F2]">
                <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="white">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-extrabold text-sm">Meta Login</p>
                  <p className="text-blue-100 text-[11px]">kompilot.com souhaite accéder à votre compte</p>
                </div>
                <button onClick={() => setPhase('idle')} className="text-white/70 hover:text-white transition-colors p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-5 space-y-4">
                <div>
                  <p className="text-sm font-bold text-foreground mb-0.5">Autoriser Kompilot</p>
                  <p className="text-xs text-muted-foreground">
                    Cochez les permissions que vous souhaitez accorder à l'application.
                    Les permissions requises sont nécessaires au bon fonctionnement de l'outil.
                  </p>
                </div>

                {/* Permission checkboxes */}
                <div className="space-y-2">
                  {PERMISSIONS.map(p => (
                    <label
                      key={p.scope}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all select-none',
                        permissions[p.scope]
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border hover:border-border/70',
                        p.required && 'cursor-default'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={!!permissions[p.scope]}
                        onChange={() => {
                          if (p.required) return; // required perms can't be unchecked
                          setPermissions(prev => ({ ...prev, [p.scope]: !prev[p.scope] }));
                        }}
                        className="w-4 h-4 accent-primary shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground">{p.title}</p>
                          {p.required && (
                            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">Requis</span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-muted-foreground/70 mt-0.5 truncate">{p.scope}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{p.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Warning if required not all checked */}
                {!allRequiredChecked && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <AlertCircle size={13} className="text-amber-600 shrink-0" />
                    <p className="text-[11px] text-amber-700">Certaines permissions requises sont nécessaires au bon fonctionnement.</p>
                  </div>
                )}

                {/* Footer buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setPhase('idle')}
                    className="flex-1 rounded-xl border border-border text-sm font-semibold text-foreground py-2.5 hover:bg-muted transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConsentAccept}
                    className="flex-1 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-extrabold py-2.5 transition-all active:scale-[0.98] shadow-md shadow-blue-500/20"
                  >
                    Autoriser
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <Shield size={10} /> Sécurisé par Meta · OAuth 2.0 · RGPD
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── ACCOUNT SELECTOR STATE ── */}
      {(phase === 'selecting' || phase === 'syncing') && (
        <>
          <div className="fixed inset-0 z-[60] bg-foreground/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-[#1877F2]/10 to-[#E1306C]/10">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1877F2] to-[#E1306C] flex items-center justify-center shrink-0">
                  <Check size={15} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-foreground">Authentification réussie !</p>
                  <p className="text-[11px] text-muted-foreground">Sélectionnez maintenant vos comptes à synchroniser</p>
                </div>
                {phase === 'selecting' && (
                  <button onClick={() => setPhase('idle')} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* Page selector */}
                <SelectDropdown
                  label="Sélectionnez votre Page Facebook Professionnelle"
                  items={FAKE_PAGES}
                  value={selectedPage}
                  onChange={id => { setSelectedPage(id); setSelectedIg(''); }}
                  placeholder="— Choisissez une page —"
                  renderLabel={item => (
                    <>
                      <p className="text-xs font-bold text-foreground leading-tight">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category} · {item.fans?.toLocaleString('fr-FR')} fans</p>
                    </>
                  )}
                />

                {/* Instagram selector */}
                <SelectDropdown
                  label="Sélectionnez votre Compte Instagram Professionnel lié"
                  items={availableIg}
                  value={selectedIg}
                  onChange={setSelectedIg}
                  placeholder={selectedPage ? '— Choisissez un compte Instagram —' : 'Sélectionnez d\'abord une page Facebook'}
                  renderLabel={item => (
                    <>
                      <p className="text-xs font-bold text-foreground leading-tight">{item.username}</p>
                      <p className="text-[10px] text-muted-foreground">{item.followers?.toLocaleString('fr-FR')} abonnés</p>
                    </>
                  )}
                />

                {availableIg.length === 0 && selectedPage && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
                    <AlertCircle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-700 leading-snug">
                      Aucun compte Instagram Pro lié à cette page. Assurez-vous d'avoir activé le <strong>compte professionnel Instagram</strong> et de l'avoir lié dans Meta Business Suite.
                    </p>
                  </div>
                )}

                {/* WhatsApp support — shown after repeated connection failures */}
                {showWhatsApp && (
                  <WhatsAppSupportButton
                    variant="error-banner"
                    errorContext="connecter ma page Facebook ou Instagram"
                  />
                )}

                {/* Sync button */}
                <button
                  onClick={handleSync}
                  disabled={!selectedPage || !selectedIg || phase === 'syncing'}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-sm font-extrabold py-3.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {phase === 'syncing' ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                      Synchronisation en cours…
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Valider et synchroniser mes flux Meta (Actif) ✅
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-muted-foreground">
                  🔒 Connexion chiffrée · Vos identifiants ne sont jamais stockés
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}