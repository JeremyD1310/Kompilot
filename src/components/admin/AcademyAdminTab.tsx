import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Save, X, GraduationCap, Eye } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import {
  DEFAULT_MODULES,
  ACADEMY_CHANNELS,
  saveAcademyModules,
  getAcademyAdminModules,
} from '../../data/academyContent';
import type { AcademyModule, AcademyChannel, AcademyFormat, AcademyTier } from '../../data/academyContent';

// ── Blank module template ──────────────────────────────────────────────────────
function blankModule(): AcademyModule {
  return {
    id: `custom-${Date.now()}`,
    title: '',
    subtitle: '',
    channel: 'google-maps',
    format: 'article',
    tier: 'free',
    duration: '1 min',
    emoji: '📚',
    content: '',
    tags: [],
    createdAt: new Date().toISOString().slice(0, 10),
  };
}

// ── Module editor form ─────────────────────────────────────────────────────────
function ModuleEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: AcademyModule;
  onSave: (m: AcademyModule) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<AcademyModule>({ ...initial });
  const [tagsInput, setTagsInput] = useState(initial.tags.join(', '));

  function set(key: keyof AcademyModule, value: AcademyModule[keyof AcademyModule]) {
    setForm(f => ({ ...f, [key]: value as never }));
  }

  const handleSave = () => {
    if (!form.title.trim()) { toast.error('Le titre est obligatoire'); return; }
    if (!form.content.trim()) { toast.error('Le contenu est obligatoire'); return; }
    onSave({ ...form, tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean) });
  };

  const inputCls = 'w-full rounded-xl border border-slate-700 bg-slate-900 text-slate-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-slate-600';
  const labelCls = 'text-xs font-semibold text-slate-400 mb-1 block';
  const selectCls = `${inputCls} cursor-pointer`;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Emoji + Title */}
        <div className="md:col-span-2 flex gap-3">
          <div className="w-20 shrink-0">
            <label className={labelCls}>Emoji</label>
            <input
              className={inputCls + ' text-center text-xl'}
              value={form.emoji}
              onChange={e => set('emoji', e.target.value)}
              maxLength={4}
            />
          </div>
          <div className="flex-1">
            <label className={labelCls}>Titre *</label>
            <input
              className={inputCls}
              placeholder="Titre du module..."
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>
        </div>

        {/* Subtitle */}
        <div className="md:col-span-2">
          <label className={labelCls}>Sous-titre</label>
          <input
            className={inputCls}
            placeholder="Description courte..."
            value={form.subtitle}
            onChange={e => set('subtitle', e.target.value)}
          />
        </div>

        {/* Channel */}
        <div>
          <label className={labelCls}>Canal</label>
          <select
            className={selectCls}
            value={form.channel}
            onChange={e => set('channel', e.target.value as AcademyChannel)}
          >
            {ACADEMY_CHANNELS.filter(c => c.id !== 'all').map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div>
          <label className={labelCls}>Format</label>
          <select
            className={selectCls}
            value={form.format}
            onChange={e => set('format', e.target.value as AcademyFormat)}
          >
            <option value="article">📄 Article (texte)</option>
            <option value="video">🎬 Vidéo (URL embed)</option>
            <option value="checklist">✅ Checklist</option>
          </select>
        </div>

        {/* Tier */}
        <div>
          <label className={labelCls}>Accès</label>
          <select
            className={selectCls}
            value={form.tier}
            onChange={e => set('tier', e.target.value as AcademyTier)}
          >
            <option value="free">🎓 Gratuit (tous)</option>
            <option value="premium">✨ Premium (Business & Franchise)</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className={labelCls}>Durée</label>
          <input
            className={inputCls}
            placeholder="Ex: 1 min 30, 45 sec..."
            value={form.duration}
            onChange={e => set('duration', e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label className={labelCls}>Tags (séparés par virgule)</label>
          <input
            className={inputCls}
            placeholder="google, seo, débutant..."
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
          />
        </div>

        {/* Context trigger */}
        <div className="md:col-span-2">
          <label className={labelCls}>Déclencheur contextuel (optionnel)</label>
          <input
            className={inputCls}
            placeholder="Ex: cockpit_tiktok_script"
            value={form.contextTrigger ?? ''}
            onChange={e => set('contextTrigger', e.target.value || undefined)}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Si renseigné, une notification Academy apparaît quand l'utilisateur effectue cette action dans l'app.
          </p>
        </div>

        {/* Content */}
        <div className="md:col-span-2">
          <label className={labelCls}>
            Contenu *{' '}
            <span className="text-slate-500 font-normal">
              {form.format === 'video' ? '(URL embed YouTube/Vimeo)' : '(Markdown supporté : **gras**, - liste)'}
            </span>
          </label>
          <textarea
            className={inputCls + ' h-40 resize-none font-mono text-xs'}
            placeholder={
              form.format === 'video'
                ? 'https://www.youtube.com/embed/...'
                : '**Titre de section**\n\nVotre contenu ici...\n\n- Point 1\n- Point 2'
            }
            value={form.content}
            onChange={e => set('content', e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700 px-4 py-2 text-sm transition-colors"
        >
          <X size={14} /> Annuler
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 text-sm transition-colors"
        >
          <Save size={14} /> Enregistrer
        </button>
      </div>
    </div>
  );
}

// ── Main admin tab ─────────────────────────────────────────────────────────────
export function AcademyAdminTab() {
  const [adminModules, setAdminModules] = useState<AcademyModule[]>(getAcademyAdminModules());
  const [editing, setEditing] = useState<AcademyModule | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // All visible: defaults + admin additions (show merged list)
  const allModules: AcademyModule[] = [
    ...DEFAULT_MODULES.filter(d => !adminModules.find(a => a.id === d.id)),
    ...adminModules,
  ];

  const persistChanges = useCallback((modules: AcademyModule[]) => {
    setAdminModules(modules);
    saveAcademyModules(modules);
  }, []);

  const handleSaveNew = (m: AcademyModule) => {
    persistChanges([...adminModules, m]);
    setIsCreating(false);
    toast.success('Module ajouté à l\'Academy !');
  };

  const handleSaveEdit = (m: AcademyModule) => {
    const updated = adminModules.map(a => a.id === m.id ? m : a);
    // If editing a default module, add override to adminModules
    const isDefault = DEFAULT_MODULES.some(d => d.id === m.id);
    if (isDefault && !adminModules.find(a => a.id === m.id)) {
      persistChanges([...adminModules, m]);
    } else {
      persistChanges(updated.length ? updated : [...adminModules, m]);
    }
    setEditing(null);
    toast.success('Module mis à jour !');
  };

  const handleDelete = (id: string) => {
    const isDefault = DEFAULT_MODULES.some(d => d.id === id);
    if (isDefault) {
      toast.error('Les modules par défaut ne peuvent pas être supprimés (mais peuvent être modifiés).');
      return;
    }
    persistChanges(adminModules.filter(m => m.id !== id));
    toast.success('Module supprimé.');
  };

  const channelLabel = (ch: AcademyChannel) => ACADEMY_CHANNELS.find(c => c.id === ch)?.label ?? ch;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={18} className="text-orange-400" />
            <h2 className="text-lg font-bold text-slate-100">Gestion de l'Academy</h2>
          </div>
          <p className="text-xs text-slate-500">
            {allModules.length} modules au total · {allModules.filter(m => m.tier === 'free').length} gratuits · {allModules.filter(m => m.tier === 'premium').length} premium
          </p>
        </div>
        {!isCreating && !editing && (
          <button
            onClick={() => { setIsCreating(true); setEditing(null); }}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold px-4 py-2 text-sm transition-colors"
          >
            <Plus size={15} /> Ajouter un module
          </button>
        )}
      </div>

      {/* New module form */}
      {isCreating && (
        <div>
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">✦ Nouveau module</p>
          <ModuleEditor
            initial={blankModule()}
            onSave={handleSaveNew}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div>
          <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-3">✦ Modifier le module</p>
          <ModuleEditor
            initial={editing}
            onSave={handleSaveEdit}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* Module list */}
      <div className="space-y-2">
        {allModules.map(m => {
          const isDefault = DEFAULT_MODULES.some(d => d.id === m.id) && !adminModules.find(a => a.id === m.id);
          return (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3"
            >
              <span className="text-xl shrink-0">{m.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-slate-200 truncate">{m.title}</span>
                  {isDefault && (
                    <span className="text-[10px] bg-slate-700 text-slate-400 rounded-full px-2 py-0.5 shrink-0">Défaut</span>
                  )}
                  <span className={`text-[10px] rounded-full px-2 py-0.5 shrink-0 font-bold ${
                    m.tier === 'premium'
                      ? 'bg-amber-900/50 text-amber-400 border border-amber-700'
                      : 'bg-teal-900/50 text-teal-400 border border-teal-700'
                  }`}>
                    {m.tier === 'premium' ? '✨ Premium' : '🎓 Gratuit'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {channelLabel(m.channel)} · {m.format} · {m.duration}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href="/academy"
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  title="Voir dans l'Academy"
                >
                  <Eye size={14} />
                </a>
                <button
                  onClick={() => { setEditing(m); setIsCreating(false); }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                  title="Modifier"
                >
                  <Pencil size={14} />
                </button>
                {!isDefault && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="rounded-2xl border border-slate-700 bg-slate-800/40 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-bold text-slate-400">💡 Conseils</p>
        <p>• Les modules <strong className="text-slate-300">par défaut</strong> peuvent être modifiés mais pas supprimés.</p>
        <p>• Pour une vidéo, utilisez l'URL <strong className="text-slate-300">embed</strong> YouTube : <code className="bg-slate-700 px-1 rounded">youtube.com/embed/ID</code></p>
        <p>• Le <strong className="text-slate-300">déclencheur contextuel</strong> permet d'afficher une notification dans le Cockpit IA au bon moment.</p>
        <p>• Les modifications sont <strong className="text-slate-300">persistées localement</strong> et visibles par tous les utilisateurs.</p>
      </div>
    </div>
  );
}
