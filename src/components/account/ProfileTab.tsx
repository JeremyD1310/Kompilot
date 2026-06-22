import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@blinkdotnew/ui';
import { LegalDocumentsTab } from './LegalDocumentsTab';
import {
  User, CheckCircle, AlertCircle, Mail, LogOut, Save, Pencil,
  Camera, Euro, Phone, XCircle, Trash2, Upload,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { blink } from '../../blink/client';
import { toast } from '@blinkdotnew/ui';
import { showToast } from '../../lib/toast';
import { getAverageBasket, setAverageBasket, DEFAULT_AVG_BASKET } from '../../lib/bookingClickTracker';

// ── Validation helpers ────────────────────────────────────────────────────────

function validateDisplayName(name: string): string | null {
  if (!name.trim()) return 'Le nom d\'affichage est requis.';
  if (name.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.';
  if (name.trim().length > 60) return 'Le nom ne peut pas dépasser 60 caractères.';
  if (/[<>{}]/.test(name)) return 'Le nom contient des caractères non autorisés.';
  return null;
}

function validatePhone(phone: string): string | null {
  if (!phone) return null; // optional
  const cleaned = phone.replace(/[\s\-().+]/g, '');
  if (!/^\d{7,15}$/.test(cleaned)) return 'Numéro invalide (7 à 15 chiffres attendus).';
  return null;
}

// ── Inline field error ────────────────────────────────────────────────────────

function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
      <XCircle size={11} className="shrink-0" />
      {message}
    </p>
  );
}

// ── Profile info card ─────────────────────────────────────────────────────────

function ProfileInfoCard() {
  const { user, refreshUser } = useAuth();

  // Form state
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(user?.displayName ?? '');
  const [phoneValue, setPhoneValue] = useState((user as any)?.phone ?? '');
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync from user when it loads
  useEffect(() => {
    if (user && !editing) {
      setNameValue(user.displayName ?? '');
      setPhoneValue((user as any).phone ?? '');
    }
  }, [user?.displayName, (user as any)?.phone]);

  const nameError = nameTouched ? validateDisplayName(nameValue) : null;
  const phoneError = phoneTouched ? validatePhone(phoneValue) : null;
  const hasErrors = !!validateDisplayName(nameValue) || !!validatePhone(phoneValue);

  const handleEdit = () => {
    setNameValue(user?.displayName ?? '');
    setPhoneValue((user as any)?.phone ?? '');
    setNameTouched(false);
    setPhoneTouched(false);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setNameTouched(false);
    setPhoneTouched(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setPhoneTouched(true);
    if (hasErrors) return;

    setSaving(true);
    try {
      await blink.auth.updateMe({
        displayName: nameValue.trim() || undefined,
        phone: phoneValue.trim() || undefined,
      } as any);
      await refreshUser();
      showToast.profileUpdated();
      setEditing(false);
    } catch {
      toast.error('Impossible de mettre à jour le profil. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (!avatarUploading) avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo.');
      return;
    }

    setAvatarUploading(true);
    setAvatarProgress(0);
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const { publicUrl } = await blink.storage.upload(
        file,
        `avatars/${user.id}-${Date.now()}.${ext}`,
        { onProgress: (pct) => setAvatarProgress(pct) }
      );
      await blink.auth.updateMe({ avatarUrl: publicUrl } as any);
      await refreshUser();
      toast.success('Photo de profil mise à jour !');
    } catch {
      toast.error('Impossible d\'uploader l\'image. Veuillez réessayer.');
    } finally {
      setAvatarUploading(false);
      setAvatarProgress(0);
      // Reset input so same file can be re-selected
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const initials = ((user?.displayName ?? user?.email ?? 'U').slice(0, 2)).toUpperCase();
  const avatarUrl = (user as any)?.avatarUrl ?? (user as any)?.avatar ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <User size={14} className="text-primary" />
          </div>
          Informations du profil
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0 group">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary text-xl font-bold select-none overflow-hidden cursor-pointer"
              onClick={handleAvatarClick}
              title="Changer la photo de profil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            {/* Upload overlay */}
            <button
              className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5"
              title="Changer la photo de profil"
              onClick={handleAvatarClick}
              disabled={avatarUploading}
              type="button"
            >
              {avatarUploading ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="text-[8px] font-bold">{avatarProgress}%</span>
                </>
              ) : (
                <>
                  <Camera size={14} />
                  <span className="text-[8px] font-bold">Modifier</span>
                </>
              )}
            </button>
            {/* Hidden file input */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              /* ── Edit form ── */
              <form onSubmit={handleSave} className="space-y-4" noValidate>
                {/* Display name */}
                <div className="space-y-1.5">
                  <label htmlFor="display-name" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nom d'affichage <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="display-name"
                    type="text"
                    value={nameValue}
                    onChange={e => setNameValue(e.target.value)}
                    onBlur={() => setNameTouched(true)}
                    autoFocus
                    maxLength={60}
                    placeholder="Votre nom d'affichage"
                    aria-describedby={nameError ? 'name-error' : undefined}
                    aria-invalid={!!nameError}
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                      nameError
                        ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                        : 'border-input focus:ring-primary/30 focus:border-primary'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    {nameError
                      ? <FieldError message={nameError} />
                      : <span />
                    }
                    <span className="text-[10px] text-muted-foreground">{nameValue.length}/60</span>
                  </div>
                </div>

                {/* Phone (optional) */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Téléphone <span className="text-muted-foreground/50 font-normal">(optionnel)</span>
                  </label>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                      id="phone"
                      type="tel"
                      value={phoneValue}
                      onChange={e => setPhoneValue(e.target.value)}
                      onBlur={() => setPhoneTouched(true)}
                      placeholder="+33 6 12 34 56 78"
                      aria-invalid={!!phoneError}
                      className={`w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${
                        phoneError
                          ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                          : 'border-input focus:ring-primary/30 focus:border-primary'
                      }`}
                    />
                  </div>
                  <FieldError message={phoneError} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={saving || hasErrors} className="gap-1.5">
                    {saving
                      ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Enregistrement…</>
                      : <><Save size={12} />Enregistrer</>
                    }
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={handleCancel}>
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              /* ── View mode ── */
              <div className="space-y-4">
                {/* Email — read-only with clear explanation */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Mail size={11} /> Adresse email
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{user?.email || '—'}</p>
                    {user?.emailVerified ? (
                      <Badge variant="outline" className="gap-1 text-[10px] text-green-700 border-green-200 bg-green-50 rounded-full px-2 py-0">
                        <CheckCircle size={9} /> Vérifié
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px] text-amber-700 border-amber-200 bg-amber-50 rounded-full px-2 py-0">
                        <AlertCircle size={9} /> Non vérifié
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/20 flex items-center justify-center text-[8px]">🔒</span>
                    L'adresse email est liée à votre compte et ne peut pas être modifiée ici. Pour changer d'email, contactez le support.
                  </p>
                </div>

                {/* Display name */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nom d'affichage</p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.displayName || <span className="text-muted-foreground italic">Non renseigné</span>}
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <Phone size={11} /> Téléphone
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {(user as any)?.phone || <span className="text-muted-foreground italic">Non renseigné</span>}
                  </p>
                </div>

                {/* Member since */}
                {memberSince && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Membre depuis</p>
                    <p className="text-sm text-foreground">{memberSince}</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    type="button"
                  >
                    <Pencil size={11} /> Modifier le profil
                  </button>
                  <button
                    onClick={handleAvatarClick}
                    disabled={avatarUploading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    type="button"
                  >
                    <Upload size={11} />
                    {avatarUploading ? `Upload ${avatarProgress}%…` : 'Changer la photo'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Average basket card ───────────────────────────────────────────────────────

function validateBasket(value: string): string | null {
  const n = parseInt(value, 10);
  if (!value.trim()) return 'Ce champ est requis.';
  if (isNaN(n) || n <= 0) return 'Entrez un montant positif (ex : 40).';
  if (n > 9999) return 'Le montant ne peut pas dépasser 9 999 €.';
  return null;
}

function AverageBasketCard() {
  const { user } = useAuth();
  const [value, setValue] = useState<string>(() => String(getAverageBasket(user?.id)));
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState(false);

  const error = touched ? validateBasket(value) : null;

  const handleSave = () => {
    setTouched(true);
    const err = validateBasket(value);
    if (err) return;
    if (!user) return;
    setAverageBasket(user.id, parseInt(value, 10));
    setSaved(true);
    toast.success('Panier moyen mis à jour ! 💶 Les estimations de ROI sont recalculées.');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card className="border-emerald-200/60 dark:border-emerald-900/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            <Euro size={14} className="text-emerald-600" />
          </div>
          Panier moyen & ROI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/10 px-4 py-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            💡 <strong className="text-foreground">Kompilot utilise ce montant</strong> pour calculer automatiquement votre Chiffre d'Affaires Estimé dans l'onglet{' '}
            <strong className="text-foreground">Performance</strong>, même sans Google Analytics.
          </p>
        </div>
        <div className="space-y-2">
          <label htmlFor="avg-basket" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Votre panier moyen par client (en €) <span className="text-red-500">*</span>
          </label>
          <div className="flex items-start gap-3 max-w-xs">
            <div className="flex-1 space-y-1">
              <div className="relative">
                <input
                  id="avg-basket"
                  type="number"
                  min={1}
                  max={9999}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder={String(DEFAULT_AVG_BASKET)}
                  aria-invalid={!!error}
                  className={`w-full rounded-lg border bg-background pl-3 pr-8 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
                      : 'border-input focus:ring-primary/30 focus:border-primary'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">€</span>
              </div>
              <FieldError message={error} />
            </div>
            <Button size="sm" onClick={handleSave} className="gap-1.5 shrink-0 mt-0.5">
              <Save size={12} />
              {saved ? 'Enregistré ✓' : 'Enregistrer'}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Ex : coiffeur = 45 €, restaurant = 28 €, spa = 80 €. Par défaut : {DEFAULT_AVG_BASKET} €
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Danger zone card ──────────────────────────────────────────────────────────

function DangerZoneCard() {
  const { logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteInput.trim().toLowerCase() !== 'supprimer') return;
    setDeleting(true);
    try {
      // Sign out and clear all local data
      await blink.auth.signOut();
      // Clear localStorage
      try { localStorage.clear(); } catch { /* noop */ }
      toast.success('Votre compte a été supprimé. Au revoir !');
    } catch {
      toast.error('Impossible de supprimer le compte. Contactez le support : support@kompilot.fr');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-900/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
          <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
            <AlertCircle size={14} className="text-red-600" />
          </div>
          Zone de danger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Logout */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Se déconnecter</p>
            <p className="text-xs text-muted-foreground mt-0.5">Déconnectez-vous de votre compte sur cet appareil.</p>
          </div>
          {confirmLogout ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">Confirmer ?</span>
              <Button variant="destructive" size="sm" onClick={logout} className="gap-1.5 h-7 text-xs">
                <LogOut size={12} /> Oui
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmLogout(false)} className="h-7 text-xs">
                Non
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmLogout(true)}
              className="gap-2 shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <LogOut size={14} /> Se déconnecter
            </Button>
          )}
        </div>

        {/* Delete account */}
        <div className="rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 px-4 py-3 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Supprimer le compte</p>
              <p className="text-xs text-muted-foreground mt-0.5">Suppression définitive de toutes vos données. Cette action est irréversible.</p>
            </div>
            {!confirmDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="gap-2 shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <Trash2 size={14} /> Supprimer
              </Button>
            )}
          </div>

          {confirmDelete && (
            <div className="space-y-3 pt-1 border-t border-red-200/60">
              <p className="text-xs text-red-700 font-medium">
                ⚠️ Cette action est <strong>irréversible</strong>. Toutes vos données (établissements, publications, messages) seront définitivement supprimées.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Tapez <strong className="text-foreground">supprimer</strong> pour confirmer :
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder="supprimer"
                  className="w-full rounded-lg border border-red-300 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={deleteInput.trim().toLowerCase() !== 'supprimer' || deleting}
                  className="gap-1.5"
                >
                  {deleting
                    ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Suppression…</>
                    : <><Trash2 size={12} />Supprimer définitivement</>
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setConfirmDelete(false); setDeleteInput(''); }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Exported tab ──────────────────────────────────────────────────────────────

export function ProfileTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      <Tabs defaultValue="profile">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">👤 Profil</TabsTrigger>
          <TabsTrigger value="legal" className="flex-1">⚖️ Documents Légaux</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6 mt-4">
          <ProfileInfoCard />
          <AverageBasketCard />
          <DangerZoneCard />
        </TabsContent>
        <TabsContent value="legal" className="mt-4">
          <LegalDocumentsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}