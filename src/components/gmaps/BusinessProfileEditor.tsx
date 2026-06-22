/**
 * BusinessProfileEditor — Editable panel for Google Business Profile core info.
 * Fields: name, category, address, phone, website, booking URL, SIRET, description.
 */
import { useState } from 'react';
import { toast } from '@blinkdotnew/ui';
import {
  Building2, Phone, Globe, MapPin, Link2, FileText,
  Edit2, CheckCircle2, RefreshCw, Sparkles, Hash, Save,
  X, ChevronDown,
} from 'lucide-react';
import { useEstablishment } from '../../context/EstablishmentContext';

const CATEGORY_OPTIONS = [
  'Restaurant', 'Café / Bar', 'Boulangerie / Pâtisserie', 'Coiffeur / Barbier',
  'Institut beauté / Spa', 'Salon de manucure', 'Épicerie / Alimentation',
  'Pharmacie', 'Boucherie / Charcuterie', 'Fleuriste',
  'Vêtements / Mode', 'Librairie', 'Électronique / Tech',
  'Médecin / Cabinet médical', 'Dentiste', 'Kiné / Ostéo',
  'Salle de sport / Fitness', 'École / Formation', 'Auto / Moto',
  'Hôtel / Hébergement', 'Agence immobilière', 'Agence de voyages',
  'Autre',
];

interface ProfileField {
  key: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  type?: 'text' | 'tel' | 'url' | 'textarea' | 'select';
  maxLength?: number;
  required?: boolean;
  hint?: string;
}

const FIELDS: ProfileField[] = [
  { key: 'name',       label: 'Nom de l\'établissement', icon: <Building2 size={13} />, placeholder: 'Ex : La Mie Dorée - Centre-Ville', type: 'text', required: true, hint: 'Le nom exact tel qu\'il apparaît sur vos enseignes.' },
  { key: 'category',   label: 'Catégorie d\'activité',   icon: <Hash size={13} />,       placeholder: 'Sélectionner…', type: 'select' },
  { key: 'address',    label: 'Adresse complète',         icon: <MapPin size={13} />,     placeholder: 'Ex : 12 rue du Commerce, 33000 Bordeaux', type: 'text', required: true },
  { key: 'phone',      label: 'Téléphone',                icon: <Phone size={13} />,      placeholder: 'Ex : 05 56 00 00 00', type: 'tel' },
  { key: 'website',    label: 'Site web',                 icon: <Globe size={13} />,      placeholder: 'https://…', type: 'url' },
  { key: 'bookingUrl', label: 'Lien de réservation',      icon: <Link2 size={13} />,      placeholder: 'https://planity.com/…', type: 'url', hint: 'Affiché directement sur votre fiche Google Maps.' },
  { key: 'siret',      label: 'SIRET',                    icon: <FileText size={13} />,   placeholder: '000 000 000 00000', type: 'text', hint: 'Pour la conformité des factures.' },
  { key: 'description',label: 'Description Google',       icon: <Edit2 size={13} />,      placeholder: 'Décrivez votre activité, vos spécialités…', type: 'textarea', maxLength: 750 },
];

export function BusinessProfileEditor() {
  const { activeEstablishment, updateEstablishment } = useEstablishment();

  const [form, setForm] = useState({
    name:        activeEstablishment.name,
    category:    activeEstablishment.category || '',
    address:     activeEstablishment.address || '',
    phone:       '',
    website:     '',
    bookingUrl:  activeEstablishment.bookingUrl || '',
    siret:       '',
    description: '',
  });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    updateEstablishment(activeEstablishment.id, {
      name: form.name,
      category: form.category,
      address: form.address,
      bookingUrl: form.bookingUrl,
    });
    setSaving(false);
    setDirty(false);
    toast.success('Profil Google mis à jour !');
  };

  const handleGenerateDesc = async () => {
    setGeneratingDesc(true);
    await new Promise(r => setTimeout(r, 1400));
    const generated = `${form.name} — ${form.category || 'votre commerce'} de référence à ${form.address.split(',')[1]?.trim() || 'votre ville'}. Notre équipe passionnée vous accueille dans un cadre chaleureux pour des prestations haut de gamme. Spécialisés dans les tendances actuelles, nous garantissons un résultat à la hauteur de vos attentes. Réservez facilement en ligne !`;
    handleChange('description', generated);
    setGeneratingDesc(false);
    toast.success('Description générée par l\'IA ✨');
  };

  const completionScore = (() => {
    const scored = [
      !!form.name,
      !!form.category,
      !!form.address,
      !!form.phone,
      !!form.website,
      !!form.bookingUrl,
      form.description.length > 50,
    ];
    return Math.round((scored.filter(Boolean).length / scored.length) * 100);
  })();

  return (
    <div className="space-y-5">
      {/* Completion bar */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white font-extrabold text-base ${completionScore >= 80 ? 'bg-emerald-500' : completionScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
            {completionScore}%
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Complétude du profil</p>
            <p className="text-xs text-muted-foreground">{completionScore < 80 ? 'Complétez votre fiche pour maximiser votre visibilité locale.' : 'Excellent ! Votre fiche est bien renseignée.'}</p>
            <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completionScore}%`, backgroundColor: completionScore >= 80 ? '#10b981' : completionScore >= 50 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            >
              {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">Informations de l'établissement</p>
          <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">Synchronisé avec Google Business</span>
        </div>

        {FIELDS.map(field => {
          const isEditing = editingField === field.key;
          const value = form[field.key as keyof typeof form] || '';

          return (
            <div key={field.key} className="px-5 py-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  {field.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{field.label}</span>
                    {field.required && <span className="text-[9px] text-red-500">*requis</span>}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      {field.type === 'textarea' ? (
                        <>
                          <textarea
                            value={value}
                            onChange={e => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            maxLength={field.maxLength}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[90px] resize-none"
                          />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">{value.length}/{field.maxLength || 750} car.</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={handleGenerateDesc}
                                disabled={generatingDesc}
                                className="flex items-center gap-1 text-[10px] font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700 rounded-lg px-2 py-1 hover:bg-violet-100 transition-colors disabled:opacity-50"
                              >
                                {generatingDesc ? <RefreshCw size={9} className="animate-spin" /> : <Sparkles size={9} />}
                                {generatingDesc ? 'Génération…' : 'IA ✨'}
                              </button>
                              <button onClick={() => setEditingField(null)} className="text-[10px] font-semibold bg-muted text-foreground rounded-lg px-2 py-1 hover:bg-muted/80 transition-colors">Fermer</button>
                            </div>
                          </div>
                        </>
                      ) : field.type === 'select' ? (
                        <div className="relative">
                          <select
                            value={value}
                            onChange={e => { handleChange(field.key, e.target.value); setEditingField(null); }}
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none pr-8"
                          >
                            <option value="">Sélectionner…</option>
                            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <input
                            type={field.type || 'text'}
                            value={value}
                            onChange={e => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                          <button onClick={() => setEditingField(null)} className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      )}
                      {field.hint && <p className="text-[10px] text-muted-foreground">{field.hint}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2 group">
                      {value ? (
                        <p className="text-sm text-foreground leading-relaxed line-clamp-2">{value}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">{field.placeholder}</p>
                      )}
                      <button
                        onClick={() => setEditingField(field.key)}
                        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="shrink-0 mt-0.5">
                    {value ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save footer */}
      {dirty && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
          <div>
            <p className="text-sm font-bold text-foreground">Modifications non enregistrées</p>
            <p className="text-xs text-muted-foreground">Ces changements seront reflétés sur votre fiche Google.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => { setForm({ name: activeEstablishment.name, category: activeEstablishment.category || '', address: activeEstablishment.address || '', phone: '', website: '', bookingUrl: activeEstablishment.bookingUrl || '', siret: '', description: '' }); setDirty(false); }} className="text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl px-3 py-2 bg-muted transition-colors">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 text-sm font-bold bg-primary text-primary-foreground rounded-xl px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
              {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
