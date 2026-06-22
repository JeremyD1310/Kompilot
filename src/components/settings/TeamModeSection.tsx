import { useState, useEffect } from 'react';
import {
  Users, Crown, UserCheck, Plus, X, Mail, User,
  ShieldCheck, CheckCircle2, Clock, ChevronRight, PartyPopper,
} from 'lucide-react';
import { useTeamMode, type Collaborator } from '../../context/TeamModeContext';

// ── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

// ── Add Collaborator Modal ────────────────────────────────────────────────────

function AddCollaboratorModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, email: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (value: string): string => {
    if (!value.trim()) return "L'adresse email est requise.";
    if (!EMAIL_REGEX.test(value.trim())) return 'Format invalide. Ex : sophie@restaurant.com';
    return '';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(validateEmail(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    if (name.trim()) {
      onAdd(name.trim(), email.trim());
      // Show in-modal confirmation for 1.4 s then close
      setConfirmed(true);
      setTimeout(onClose, 1400);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !confirmed) onClose(); }}
    >
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md mx-4 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* ── Confirmation screen ── */}
        {confirmed ? (
          <div className="flex flex-col items-center justify-center py-4 gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-green-100 border-2 border-green-300 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-base font-extrabold text-foreground flex items-center justify-center gap-2">
                <PartyPopper size={16} className="text-amber-500" />
                Collaborateur ajouté !
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{name}</span> a bien été ajouté à votre équipe.
              </p>
              <p className="text-xs text-muted-foreground">
                Ses posts seront soumis à validation avant publication.
              </p>
            </div>
            <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full"
                style={{ animation: 'shrinkBar 1.4s linear forwards' }}
              />
            </div>
            <style>{`@keyframes shrinkBar { from { width: 100%; } to { width: 0%; } }`}</style>
          </div>
        ) : (
          <>
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-muted/60 flex items-center justify-center text-muted-foreground transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Users size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">Ajouter un collaborateur</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Ce membre créera des posts en attente de validation</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Nom de l'employé
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex : Sophie Dupont"
                    required
                    autoFocus
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                  />
                </div>
              </div>

              {/* Email field */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Adresse Email
                </label>
                <div className="relative">
                  <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${emailError ? 'text-red-400' : 'text-muted-foreground'}`} />
                  <input
                    type="text"
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    onBlur={() => setEmailError(validateEmail(email))}
                    placeholder="Ex : sophie@restaurant.com"
                    className={`w-full pl-8 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 transition-shadow ${
                      emailError
                        ? 'border-red-400 focus:ring-red-400/30 text-red-700'
                        : 'border-border focus:ring-primary/30'
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-100 text-red-600 shrink-0 text-[10px] font-extrabold leading-none">!</span>
                    {emailError}
                  </p>
                )}
              </div>

              {/* Warning notice */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  ⚠️ Les posts de ce collaborateur seront automatiquement bloqués avec le statut{' '}
                  <strong>"En attente de validation"</strong> jusqu'à approbation par le Patron.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-border bg-muted/40 hover:bg-muted/60 text-sm font-semibold py-2.5 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !email.trim() || !!emailError}
                  className="flex-1 rounded-xl bg-primary text-primary-foreground text-sm font-bold py-2.5 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Plus size={14} className="inline -mt-0.5 mr-1" />
                  Ajouter
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Concurrent Session Modal ──────────────────────────────────────────────────

function ConcurrentSessionModal({
  onActivate,
  onDismiss,
}: {
  onActivate: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-[420px] mx-4 p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users size={32} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-foreground">👥 Connexion simultanée détectée</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Nous avons détecté que votre compte est ouvert dans plusieurs onglets ou appareils simultanément. Pour sécuriser vos accès et permettre à chaque membre de travailler indépendamment, activez le Mode Équipe collaboratif.
            </p>
          </div>
          
          <div className="w-full space-y-2 py-2">
            {[
              'Accès individuels sécurisés',
              'Posts soumis à validation',
              'Aucune interférence entre membres'
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="text-green-500">✅</span> {benefit}
              </div>
            ))}
          </div>

          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              onClick={onActivate}
              className="w-full rounded-xl bg-primary text-primary-foreground font-bold py-3.5 hover:opacity-90 transition-all shadow-lg"
            >
              Activer le Mode Équipe
            </button>
            <button
              onClick={onDismiss}
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuer en solo
            </button>
            <p className="text-[10px] text-muted-foreground/60 italic">
              Attention : les accès simultanés non autorisés peuvent causer des conflits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Member row (dark card item) ───────────────────────────────────────────────

function CreatorRow({
  name,
  email,
  isDefault,
  onRemove,
}: {
  name: string;
  email?: string;
  isDefault?: boolean;
  onRemove?: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
      <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0">
        <span className="text-xs font-extrabold text-amber-300">{name.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white truncate">{name}</p>
        {email && <p className="text-[10px] text-white/50 truncate">{email}</p>}
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-full px-1.5 py-0.5 mt-0.5">
          <Clock size={8} /> En attente de validation
        </span>
      </div>
      {!isDefault && onRemove && (
        <button
          onClick={onRemove}
          className="w-6 h-6 rounded-full hover:bg-red-500/25 text-white/40 hover:text-red-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          title="Retirer ce collaborateur"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TeamModeSection() {
  const {
    teamModeEnabled, setTeamModeEnabled,
    creatorName, setCreatorName,
    validatorName, setValidatorName,
    collaborators, addCollaborator, removeCollaborator,
    pendingPosts, validatePost, rejectPost,
  } = useTeamMode();

  const [showAddModal, setShowAddModal]     = useState(false);
  const [showConcurrentModal, setShowConcurrentModal] = useState(false);
  const [editingCreator, setEditingCreator]     = useState(false);
  const [editingValidator, setEditingValidator] = useState(false);
  const [tmpCreator, setTmpCreator]   = useState(creatorName);
  const [tmpValidator, setTmpValidator] = useState(validatorName);

  const pending  = pendingPosts.filter(p => p.status === 'pending');
  const approved = pendingPosts.filter(p => p.status === 'approved');

  useEffect(() => {
    const key = 'nc_session_count';
    const current = parseInt(localStorage.getItem(key) ?? '0', 10);
    const next = current + 1;
    localStorage.setItem(key, String(next));

    // Show modal if concurrent session detected and team mode is off
    if (next > 1 && !teamModeEnabled) {
      // Small delay to let page render
      const t = setTimeout(() => setShowConcurrentModal(true), 1500);
      return () => {
        clearTimeout(t);
        const c = parseInt(localStorage.getItem(key) ?? '1', 10);
        localStorage.setItem(key, String(Math.max(0, c - 1)));
      };
    }

    const handleUnload = () => {
      const c = parseInt(localStorage.getItem(key) ?? '1', 10);
      localStorage.setItem(key, String(Math.max(0, c - 1)));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      const c = parseInt(localStorage.getItem(key) ?? '1', 10);
      localStorage.setItem(key, String(Math.max(0, c - 1)));
    };
  }, [teamModeEnabled]);

  return (
    <div className="space-y-5">

      {/* ── Master toggle ──────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between rounded-2xl border px-6 py-5 transition-all duration-300 ${
        teamModeEnabled
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            teamModeEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            <Users size={20} />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">Mode Équipe</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {teamModeEnabled
                ? 'Activé — Soumission obligatoire des collaborateurs au validateur désigné. 👥'
                : 'Désactivé — Publication directe pour tous les utilisateurs.'}
            </p>
          </div>
        </div>
        <Toggle checked={teamModeEnabled} onChange={setTeamModeEnabled} />
      </div>

      {/* ── SOLO MODE (team disabled) ──────────────────────────────────────── */}
      {!teamModeEnabled && (
        <div className="rounded-2xl border border-[#2a1a4a]/60 overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-1">
          {/* Dark gradient header */}
          <div
            className="px-6 py-5 flex items-center gap-4"
            style={{ background: 'linear-gradient(135deg, #150d2e 0%, #1e1040 100%)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0">
              <Crown size={20} className="text-violet-300" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-400/80">Administrateur Unique</span>
              <p className="text-base font-extrabold text-white mt-0.5 truncate">{validatorName}</p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 border border-violet-400/25 px-3 py-1 text-[11px] font-bold text-violet-300">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Solo
            </span>
          </div>

          {/* Body */}
          <div className="bg-[#0f0820]/50 border-t border-[#2a1a4a]/60 px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-base mr-2">🧑‍💼</span>
              <strong className="text-foreground">Mode solo actif.</strong>{' '}
              Vous créez et publiez directement vos posts sans étape de validation intermédiaire.
            </p>

            <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 border border-border/60 px-4 py-3">
              <ShieldCheck size={14} className="text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                Activez le <strong>Mode Équipe</strong> pour ajouter des collaborateurs et un processus de validation obligatoire avant publication.
              </p>
            </div>

            {/* Modifier le nom du patron */}
            {editingValidator ? (
              <div className="flex gap-2">
                <input
                  value={tmpValidator}
                  onChange={e => setTmpValidator(e.target.value)}
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={() => { setValidatorName(tmpValidator); setEditingValidator(false); }}
                  className="rounded-xl bg-primary text-primary-foreground text-xs font-bold px-3 py-2 cursor-pointer"
                >OK</button>
                <button
                  onClick={() => setEditingValidator(false)}
                  className="rounded-xl border border-border text-xs px-2 py-2 cursor-pointer"
                >✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setTmpValidator(validatorName); setEditingValidator(true); }}
                className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
              >
                Modifier le nom de l'administrateur
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TEAM MODE (team enabled) ───────────────────────────────────────── */}
      {teamModeEnabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">

          {/* ── LEFT: Créateur de contenu ── */}
          <div className="rounded-2xl border border-[#1e3a5f] overflow-hidden flex flex-col">
            {/* Dark blue header */}
            <div
              className="px-5 py-4 flex-1"
              style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0c1f3a 100%)' }}
            >
              {/* Role label */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <UserCheck size={15} className="text-amber-300" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                  Créateur de Contenu
                </span>
              </div>

              {/* Members list */}
              <div className="space-y-2">
                {/* Default creator */}
                <CreatorRow
                  name={creatorName}
                  isDefault
                />

                {/* Added collaborators */}
                {collaborators.map((c: Collaborator) => (
                  <CreatorRow
                    key={c.id}
                    name={c.name}
                    email={c.email}
                    onRemove={() => removeCollaborator(c.id)}
                  />
                ))}
              </div>

              {/* Edit default creator name */}
              <div className="mt-3">
                {editingCreator ? (
                  <div className="flex gap-2">
                    <input
                      value={tmpCreator}
                      onChange={e => setTmpCreator(e.target.value)}
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 text-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400/40 placeholder-white/30"
                    />
                    <button
                      onClick={() => { setCreatorName(tmpCreator); setEditingCreator(false); }}
                      className="rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 text-[11px] font-bold px-2.5 py-1.5 transition-colors cursor-pointer"
                    >OK</button>
                    <button
                      onClick={() => setEditingCreator(false)}
                      className="rounded-lg border border-white/20 text-white/60 text-[11px] px-2 py-1.5 cursor-pointer"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTmpCreator(creatorName); setEditingCreator(true); }}
                    className="text-[11px] text-amber-400/70 hover:text-amber-300 hover:underline transition-colors cursor-pointer"
                  >
                    Modifier le nom de {creatorName}
                  </button>
                )}
              </div>
            </div>

            {/* Add collaborator CTA */}
            <div className="bg-[#0a1628] border-t border-[#1e3a5f] px-4 py-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/28 border border-amber-400/30 hover:border-amber-400/50 text-amber-300 text-xs font-bold py-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Plus size={13} strokeWidth={2.5} />
                + Ajouter un collaborateur
              </button>
            </div>
          </div>

          {/* ── RIGHT: Validateur / Patron ── */}
          <div className="rounded-2xl border border-[#2e1a4f] overflow-hidden flex flex-col">
            {/* Dark purple header */}
            <div
              className="px-5 py-4 flex-1"
              style={{ background: 'linear-gradient(135deg, #100820 0%, #150d2e 100%)' }}
            >
              {/* Role label */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <Crown size={15} className="text-violet-300" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-violet-300">
                  Validateur / Patron
                </span>
              </div>

              {/* Validator member */}
              <div className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-violet-400/20 border border-violet-400/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-extrabold text-violet-300">{validatorName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => { setTmpValidator(validatorName); setEditingValidator(true); }}
                    className="text-sm font-bold text-white hover:text-violet-200 transition-colors cursor-pointer text-left truncate w-full flex items-center gap-1 group"
                    title="Cliquer pour modifier le nom"
                  >
                    {validatorName}
                    <span className="opacity-0 group-hover:opacity-60 text-violet-300 transition-opacity text-[10px]">✏️</span>
                  </button>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-300 bg-violet-400/10 border border-violet-400/20 rounded-full px-1.5 py-0.5 mt-0.5">
                    <Crown size={8} /> Validateur principal
                  </span>
                </div>
              </div>

              {/* Info box */}
              <div className="mt-3 rounded-xl bg-violet-500/10 border border-violet-400/20 px-3 py-3">
                <p className="text-xs text-violet-200/80 leading-relaxed">
                  👑 <strong className="text-violet-100">{validatorName}</strong> reçoit les créations de l'équipe pour les approuver ou les ajuster en 1 clic avant leur publication.
                </p>
              </div>

              {/* Edit validator */}
              <div className="mt-3">
                {editingValidator ? (
                  <div className="flex gap-2">
                    <input
                      value={tmpValidator}
                      onChange={e => setTmpValidator(e.target.value)}
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 text-white px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400/40 placeholder-white/30"
                    />
                    <button
                      onClick={() => { setValidatorName(tmpValidator); setEditingValidator(false); }}
                      className="rounded-lg bg-violet-500/30 hover:bg-violet-500/50 text-violet-200 text-[11px] font-bold px-2.5 py-1.5 transition-colors cursor-pointer"
                    >OK</button>
                    <button
                      onClick={() => setEditingValidator(false)}
                      className="rounded-lg border border-white/20 text-white/60 text-[11px] px-2 py-1.5 cursor-pointer"
                    >✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTmpValidator(validatorName); setEditingValidator(true); }}
                    className="text-[11px] text-violet-400/70 hover:text-violet-300 hover:underline transition-colors cursor-pointer"
                  >
                    Modifier le nom du validateur
                  </button>
                )}
              </div>
            </div>

            {/* Validation rule reminder */}
            <div className="bg-[#100820] border-t border-[#2e1a4f] px-4 py-3">
              <p className="text-[11px] text-violet-300/70 leading-relaxed">
                🔒 Règle stricte : aucun post ne peut être publié sans son accord.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Validation rule banner (when team mode active) ─────────────────── */}
      {teamModeEnabled && (
        <div className="rounded-2xl border border-amber-300/40 bg-amber-50/60 px-5 py-4 flex items-start gap-3 animate-in fade-in duration-300">
          <span className="text-xl shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-extrabold text-amber-900">Règle de validation stricte activée</p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Tous les posts créés par les collaborateurs de la colonne gauche sont automatiquement bloqués avec le statut{' '}
              <strong>"En attente de validation"</strong> et doivent obligatoirement être approuvés par{' '}
              <strong>{validatorName}</strong> avant d'être publiés.
            </p>
          </div>
        </div>
      )}

      {/* ── Pending posts ──────────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-300/60 bg-amber-50 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-600" />
            <p className="text-sm font-extrabold text-amber-800">
              {pending.length} publication{pending.length > 1 ? 's' : ''} en attente de validation
            </p>
            <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-200 rounded-full px-2 py-0.5">{validatorName}</span>
          </div>

          <div className="space-y-2">
            {pending.map(post => (
              <div key={post.id} className="flex items-start gap-3 rounded-xl bg-white/80 border border-amber-200 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{post.channels.join(', ') || 'Tous canaux'}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">{post.text}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{post.date} à {post.time} · Soumis {post.submittedAt}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => validatePost(post.id)}
                    className="flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[10px] font-extrabold px-2.5 py-1.5 transition-colors cursor-pointer"
                    title={`Simuler la validation de ${validatorName}`}
                  >
                    <CheckCircle2 size={11} /> Valider ({validatorName})
                  </button>
                  <button
                    onClick={() => rejectPost(post.id)}
                    className="flex items-center gap-1 rounded-lg border border-red-300 hover:bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-1.5 transition-colors cursor-pointer"
                  >
                    <X size={11} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-amber-700">
            💡 Cliquez sur "Valider ({validatorName})" pour simuler l'approbation — débite 1 crédit et planifie la publication.
          </p>
        </div>
      )}

      {/* ── Approved posts ─────────────────────────────────────────────────── */}
      {approved.length > 0 && (
        <div className="rounded-2xl border border-green-300/60 bg-green-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-green-600" />
            <p className="text-sm font-extrabold text-green-800">
              {approved.length} publication{approved.length > 1 ? 's' : ''} approuvée{approved.length > 1 ? 's' : ''}
            </p>
          </div>
          {approved.map(post => (
            <div key={post.id} className="flex items-center gap-3 rounded-xl bg-white/80 border border-green-200 px-4 py-2.5">
              <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{post.text.slice(0, 60)}…</p>
                <p className="text-[10px] text-gray-500">Planifié le {post.date} à {post.time}</p>
              </div>
              <span className="text-[10px] font-bold text-green-700 bg-green-100 rounded-full px-2 py-0.5 shrink-0">Approuvé</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Workflow diagram ───────────────────────────────────────────────── */}
      {teamModeEnabled && (
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-5 animate-in fade-in duration-300">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Flux de validation</p>
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <div className="flex items-center gap-2 rounded-xl bg-[#0c1f3a] border border-[#1e3a5f] px-3 py-2">
              <UserCheck size={14} className="text-amber-300" />
              <span className="text-xs font-bold text-amber-200">{creatorName} rédige</span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2 rounded-xl bg-amber-100 border border-amber-200 px-3 py-2">
              <Clock size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-800">En attente</span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2 rounded-xl bg-[#150d2e] border border-[#2e1a4f] px-3 py-2">
              <Crown size={14} className="text-violet-300" />
              <span className="text-xs font-bold text-violet-200">{validatorName} valide</span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2 rounded-xl bg-green-100 border border-green-200 px-3 py-2">
              <CheckCircle2 size={14} className="text-green-600" />
              <span className="text-xs font-bold text-green-800">Publié ✓</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Role Preview Cards ─────────────────────────────────────────────── */}
      <div className="space-y-3 mt-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aperçu des interfaces par rôle</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Collaborator view */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">👩</span>
              <div>
                <p className="text-xs font-bold text-foreground">Vue Collaborateur (ex: Marine)</p>
                <p className="text-[10px] text-muted-foreground">Accès limité, soumission pour validation</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5 text-muted-foreground"><span className="text-red-500">✗</span> Onglet Performances / CA masqué</li>
              <li className="flex items-center gap-1.5 text-muted-foreground"><span className="text-red-500">✗</span> Configuration abonnement masquée</li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-medium"><span className="text-emerald-500">✓</span> Bouton "Soumettre pour validation" dans le Cockpit</li>
              <li className="flex items-center gap-1.5 text-amber-700"><span className="text-amber-500">◉</span> Posts en attente : badge orange "En attente"</li>
            </ul>
          </div>

          {/* Admin view */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-base">👨‍💼</span>
              <div>
                <p className="text-xs font-bold text-foreground">Vue Patron / Admin (ex: Joan)</p>
                <p className="text-[10px] text-muted-foreground">Accès complet + flux de validation</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li className="flex items-center gap-1.5 text-emerald-700 font-medium"><span className="text-emerald-500">✓</span> Accès complet à toutes les sections</li>
              <li className="flex items-center gap-1.5 text-foreground"><span className="text-primary">🔔</span> Bulle rouge "Action requise" sur le Calendrier</li>
              <li className="flex items-center gap-1.5 text-foreground"><span className="text-primary">✅</span> "Valider et Planifier" par post</li>
              <li className="flex items-center gap-1.5 text-foreground"><span className="text-primary">✍️</span> "Demander une modification" par post</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Add collaborator modal ─────────────────────────────────────────── */}
      {showAddModal && (
        <AddCollaboratorModal
          onClose={() => setShowAddModal(false)}
          onAdd={(name, email) => addCollaborator({ name, email })}
        />
      )}

      {showConcurrentModal && (
        <ConcurrentSessionModal
          onActivate={() => { setTeamModeEnabled(true); setShowConcurrentModal(false); }}
          onDismiss={() => setShowConcurrentModal(false)}
        />
      )}
    </div>
  );
}