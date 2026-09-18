/**
 * ContactManagerPage — Kompilot Gestion de Contacts
 * /contacts route — 3 tabs: Contacts · Segments · Fichiers importés
 */
import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody,
  Button, Input, Badge, toast,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
  EmptyState, Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Checkbox, Separator,
} from '@blinkdotnew/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Upload, FileSpreadsheet, PenLine, Globe, Search, Plus, X, Trash2,
  Tag, Download, Filter, Eye, Edit3, ChevronRight, Clock, Building2,
  Mail, Phone, Calendar, Layers, FileUp, CheckCircle2, Loader2,
  AlertCircle, GripVertical, BarChart3, Send, Save,
} from 'lucide-react';
import { importFromFile, type ImportResult, type ImportedContact } from '../lib/contactImportService';

/* ── Animations ──────────────────────────────────────────────────────────── */

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const stagger = { animate: { transition: { staggerChildren: 0.05 } } };

const slideRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring' as const, damping: 28, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2 } },
};

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  source: 'csv' | 'manual' | 'formulaire';
  lastActivity: string;
  createdAt: string;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  count: number;
  createdAt: string;
  filters: SegmentFilter[];
}

interface SegmentFilter {
  field: string;
  operator: string;
  value: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  rows: number;
  status: 'parsed' | 'parsing' | 'error';
  uploadedAt: string;
}

/* ── Mock Data ───────────────────────────────────────────────────────────── */

const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', firstName: 'Marie', lastName: 'Dupont', email: 'marie.dupont@atelier-rose.fr', phone: '+33 6 12 34 56 78', company: 'Atelier Rose', tags: ['client', 'vip'], source: 'formulaire', lastActivity: '2026-07-10', createdAt: '2025-11-03' },
  { id: 'c2', firstName: 'Lucas', lastName: 'Martin', email: 'l.martin@techvision.io', phone: '+33 6 98 76 54 32', company: 'TechVision', tags: ['prospect'], source: 'csv', lastActivity: '2026-07-08', createdAt: '2026-01-15' },
  { id: 'c3', firstName: 'Chloé', lastName: 'Bernard', email: 'chloe@designfactory.fr', phone: '+33 7 11 22 33 44', company: 'Design Factory', tags: ['client'], source: 'manual', lastActivity: '2026-06-22', createdAt: '2025-09-20' },
  { id: 'c4', firstName: 'Thomas', lastName: 'Petit', email: 'thomas.petit@greenlogis.fr', phone: '+33 6 55 44 33 22', company: 'GreenLogis', tags: ['prospect', 'newsletter'], source: 'csv', lastActivity: '2026-07-12', createdAt: '2026-03-01' },
  { id: 'c5', firstName: 'Sophie', lastName: 'Moreau', email: 's.moreau@boulangerie-artisanale.fr', phone: '+33 6 77 88 99 00', company: 'Boulangerie Artisanale', tags: ['client'], source: 'formulaire', lastActivity: '2026-05-30', createdAt: '2025-12-10' },
  { id: 'c6', firstName: 'Antoine', lastName: 'Leroy', email: 'a.leroy@nexgen-corp.com', phone: '+33 7 22 33 44 55', company: 'NexGen Corp', tags: ['prospect', 'vip'], source: 'manual', lastActivity: '2026-07-05', createdAt: '2026-02-18' },
  { id: 'c7', firstName: 'Émilie', lastName: 'Roux', email: 'emilie.roux@fleuriste-zen.fr', phone: '+33 6 33 22 11 00', company: 'Fleuriste Zen', tags: ['newsletter'], source: 'csv', lastActivity: '2026-04-14', createdAt: '2026-04-01' },
  { id: 'c8', firstName: 'Nicolas', lastName: 'Fournier', email: 'n.fournier@aquapure.fr', phone: '+33 7 44 55 66 77', company: 'AquaPure', tags: ['client', 'vip'], source: 'formulaire', lastActivity: '2026-07-11', createdAt: '2025-08-22' },
  { id: 'c9', firstName: 'Camille', lastName: 'Garcia', email: 'camille@studio-lumiere.com', phone: '+33 6 88 77 66 55', company: 'Studio Lumière', tags: ['prospect'], source: 'manual', lastActivity: '2026-06-19', createdAt: '2026-05-07' },
  { id: 'c10', firstName: 'Julien', lastName: 'David', email: 'julien.david@eco-mobilité.fr', phone: '+33 7 66 55 44 33', company: 'Éco-Mobilité', tags: ['client', 'newsletter'], source: 'csv', lastActivity: '2026-07-03', createdAt: '2025-10-15' },
  { id: 'c11', firstName: 'Léa', lastName: 'Bonnet', email: 'lea.b@maison-creativa.fr', phone: '+33 6 11 99 88 77', company: 'Maison Créativa', tags: ['vip'], source: 'formulaire', lastActivity: '2026-07-09', createdAt: '2026-01-28' },
  { id: 'c12', firstName: 'Hugo', lastName: 'Vincent', email: 'hugo@precision-meca.com', phone: '+33 7 00 11 22 33', company: 'Precision Méca', tags: ['prospect', 'client'], source: 'csv', lastActivity: '2026-06-28', createdAt: '2026-06-10' },
];

const MOCK_SEGMENTS: Segment[] = [
  { id: 's1', name: 'Prospects chauds', description: 'Contacts avec une activité récente et tag prospect', count: 4, createdAt: '2026-06-01', filters: [{ field: 'tags', operator: 'contient', value: 'prospect' }] },
  { id: 's2', name: 'Clients fidèles', description: 'Clients avec plus de 6 mois d\'ancienneté', count: 5, createdAt: '2026-05-15', filters: [{ field: 'tags', operator: 'contient', value: 'client' }] },
  { id: 's3', name: 'Newsletter', description: 'Inscrits à la newsletter mensuelle', count: 3, createdAt: '2026-04-20', filters: [{ field: 'tags', operator: 'contient', value: 'newsletter' }] },
];

const MOCK_FILES: UploadedFile[] = [
  { id: 'f1', name: 'clients_juillet2026.csv', size: 48200, type: 'csv', rows: 450, status: 'parsed', uploadedAt: '2026-07-01' },
  { id: 'f2', name: 'prospects_q3.xlsx', size: 125800, type: 'xlsx', rows: 120, status: 'parsed', uploadedAt: '2026-07-05' },
];

const ALL_TAGS = ['prospect', 'client', 'vip', 'newsletter'];

const SOURCE_CONFIG: Record<string, { icon: typeof FileSpreadsheet; label: string; color: string }> = {
  csv: { icon: FileSpreadsheet, label: 'CSV', color: 'text-emerald-600 bg-emerald-500/10' },
  manual: { icon: PenLine, label: 'Manuel', color: 'text-violet-600 bg-violet-500/10' },
  formulaire: { icon: Globe, label: 'Formulaire', color: 'text-sky-600 bg-sky-500/10' },
};

const TAG_COLORS: Record<string, string> = {
  prospect: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  client: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  vip: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
  newsletter: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const parseLine = (line: string) => {
    const r: string[] = []; let cur = ''; let q = false;
    for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { r.push(cur.trim()); cur = ''; } else cur += ch; }
    r.push(cur.trim()); return r;
  };
  return { headers: parseLine(lines[0]), rows: lines.slice(1).map(parseLine) };
}

const COL_MAP: Record<string, string> = {
  email: 'email', courriel: 'email', mail: 'email', 'e-mail': 'email',
  prenom: 'firstName', prénom: 'firstName', first_name: 'firstName', nom: 'lastName',
  last_name: 'lastName', telephone: 'phone', tel: 'phone', phone: 'phone',
  entreprise: 'company', societe: 'company', company: 'company',
};

function autoMap(headers: string[]): Record<number, string> {
  const m: Record<number, string> = {};
  headers.forEach((h, i) => { const k = h.toLowerCase().replace(/[^a-z_]/g, ''); if (COL_MAP[k]) m[i] = COL_MAP[k]; });
  return m;
}

/* ── KPI Card ────────────────────────────────────────────────────────────── */

function MiniKpi({ icon: Icon, label, value, color }: { icon: typeof Users; label: string; value: string | number; color: string }) {
  return (
    <motion.div variants={fadeUp} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

/* ── Tag Badge ───────────────────────────────────────────────────────────── */

function TagBadge({ tag }: { tag: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TAG_COLORS[tag] || 'bg-muted text-muted-foreground'}`}>
      {tag}
    </span>
  );
}

/* ── Import Modal ────────────────────────────────────────────────────────── */

function ImportModal({ open, onClose, onImportComplete }: { open: boolean; onClose: () => void; onImportComplete?: (count: number) => void }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [colMapping, setColMapping] = useState<Record<number, string>>({});
  const [segmentChoice, setSegmentChoice] = useState('');
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setImporting(true);

    try {
      const result = await importFromFile(f);
      setImportResult(result);

      if (result.validContacts.length > 0) {
        // Convert to preview format
        const headers = Object.values(result.fieldMapping).length > 0
          ? Object.values(result.fieldMapping)
          : ['email', 'firstName', 'lastName', 'company'];
        const rows = result.validContacts.slice(0, 5).map(c => [
          c.email, c.firstName || '', c.lastName || '', c.company || '',
        ]);
        setParsed({ headers, rows });
        setColMapping(result.fieldMapping);
      } else {
        setParsed(null);
      }
      setStep(2);
    } catch (err: any) {
      toast.error("Erreur d'import", { description: err?.message || 'Format non supporté' });
    } finally {
      setImporting(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleConfirm = () => {
    const count = importResult?.validContacts.length || parsed?.rows.length || 0;
    toast.success('Import lancé', {
      description: `${count} contact(s) en cours d'import${segmentChoice ? ' dans le segment sélectionné' : ''}.`,
    });
    onImportComplete?.(count);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(1); setFile(null); setParsed(null); setImportResult(null); setColMapping({}); setSegmentChoice(''); setImporting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && resetAndClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer des contacts</DialogTitle>
          <DialogDescription>Étape {step} sur 3 — {step === 1 ? 'Sélection du fichier' : step === 2 ? 'Aperçu & mapping' : 'Confirmation'}</DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 1: File drop */}
        {step === 1 && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/30 p-12 cursor-pointer transition-colors"
          >
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.pdf,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <FileUp size={36} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Glissez votre fichier ici ou cliquez pour parcourir</p>
            <p className="text-xs text-muted-foreground">CSV, XLSX, PDF, TXT — max 10 Mo</p>
          </div>
        )}

        {/* Step 2: Preview & column mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
              <FileSpreadsheet size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground truncate">{file?.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">{file ? formatFileSize(file.size) : ''}</span>
            </div>
            {parsed ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Aperçu des premières lignes · {importResult?.totalParsed || parsed.rows.length} lignes détectées
                  {importResult && importResult.validContacts.length > 0 && (
                    <span className="text-emerald-600 ml-1">· {importResult.validContacts.length} contacts valides</span>
                  )}
                  {importResult && importResult.duplicates > 0 && (
                    <span className="text-amber-600 ml-1">· {importResult.duplicates} doublons</span>
                  )}
                  {importResult && importResult.invalidRows > 0 && (
                    <span className="text-destructive ml-1">· {importResult.invalidRows} invalides</span>
                  )}
                </p>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        {parsed.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold text-foreground">
                            <div className="flex flex-col gap-1">
                              <span>{h}</span>
                              <Select value={colMapping[i] || 'ignore'} onValueChange={(v) => setColMapping(prev => ({ ...prev, [i]: v }))}>
                                <SelectTrigger className="h-6 text-[10px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ignore">— Ignorer —</SelectItem>
                                  <SelectItem value="email">Email</SelectItem>
                                  <SelectItem value="firstName">Prénom</SelectItem>
                                  <SelectItem value="lastName">Nom</SelectItem>
                                  <SelectItem value="phone">Téléphone</SelectItem>
                                  <SelectItem value="company">Entreprise</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.slice(0, 5).map((row, ri) => (
                        <tr key={ri} className="border-t border-border">
                          {row.map((cell, ci) => <td key={ci} className="px-3 py-1.5 text-muted-foreground">{cell}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 size={24} className="animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analyse en cours…</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Segment + confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span className="text-sm font-semibold text-foreground">Fichier prêt</span>
              </div>
              <p className="text-xs text-muted-foreground">{file?.name} — {parsed?.rows.length || '…'} contacts à importer</p>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Assigner à un segment (optionnel)</label>
              <Select value={segmentChoice} onValueChange={setSegmentChoice}>
                <SelectTrigger><SelectValue placeholder="Aucun segment" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {MOCK_SEGMENTS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          {step > 1 && <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Retour</Button>}
          {step === 1 && <Button variant="outline" onClick={resetAndClose}>Annuler</Button>}
          {step === 2 && <Button onClick={() => setStep(3)} disabled={!parsed}>Continuer</Button>}
          {step === 3 && <Button onClick={handleConfirm}>Lancer l'import</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Segment Modal ───────────────────────────────────────────────────────── */

function SegmentModal({ open, onClose, onSave, initialData, contacts }: {
  open: boolean; onClose: () => void;
  onSave: (seg: Omit<Segment, 'id' | 'createdAt' | 'count'>) => void;
  initialData?: Segment | null;
  contacts?: Contact[];
}) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [filters, setFilters] = useState<SegmentFilter[]>(
    initialData?.filters?.length ? initialData.filters : [{ field: 'tags', operator: 'contient', value: '' }]
  );
  const [logicMode, setLogicMode] = useState<'AND' | 'OR'>('AND');

  // Reset form when initialData changes
  useState(() => {
    setName(initialData?.name ?? '');
    setDescription(initialData?.description ?? '');
    setFilters(initialData?.filters?.length ? initialData.filters : [{ field: 'tags', operator: 'contient', value: '' }]);
  });

  const addFilter = () => setFilters(prev => [...prev, { field: 'tags', operator: 'contient', value: '' }]);
  const removeFilter = (i: number) => setFilters(prev => prev.filter((_, idx) => idx !== i));
  const updateFilter = (i: number, key: keyof SegmentFilter, val: string) => setFilters(prev => prev.map((f, idx) => idx === i ? { ...f, [key]: val } : f));

  // Live preview count
  const previewCount = useMemo(() => {
    if (!contacts) return -1;
    const activeFilters = filters.filter(f => f.value || f.operator === 'est_vide' || f.operator === 'n_est_pas_vide');
    if (!activeFilters.length) return contacts.length;
    return contacts.filter(c => {
      return activeFilters.every(f => {
        const val = String((c as any)[f.field] || '').toLowerCase();
        const fVal = f.value.toLowerCase();
        switch (f.operator) {
          case 'contient': return val.includes(fVal);
          case 'ne_contient_pas': return !val.includes(fVal);
          case 'est': return val === fVal;
          case 'n_est_pas': return val !== fVal;
          case 'commence_par': return val.startsWith(fVal);
          case 'finit_par': return val.endsWith(fVal);
          case 'est_vide': return !val || val === '[]';
          case 'n_est_pas_vide': return !!val && val !== '[]';
          case 'contient_domaine': return c.email.toLowerCase().includes(fVal);
          default: return true;
        }
      });
    }).length;
  }, [contacts, filters]);

  const handleSave = () => {
    if (!name.trim()) { toast.error('Nom requis'); return; }
    const activeFilters = filters.filter(f => f.value || f.operator === 'est_vide' || f.operator === 'n_est_pas_vide');
    onSave({ name, description, filters: activeFilters });
    setName(''); setDescription(''); setFilters([{ field: 'tags', operator: 'contient', value: '' }]); setLogicMode('AND');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un segment</DialogTitle>
          <DialogDescription>Définissez les critères pour filtrer vos contacts automatiquement</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Nom du segment</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Prospects Île-de-France" />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description optionnelle" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-foreground">Conditions</label>
              {filters.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setLogicMode('AND')}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-l-md border transition-colors ${logicMode === 'AND' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'}`}
                  >ET</button>
                  <button
                    onClick={() => setLogicMode('OR')}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-r-md border border-l-0 transition-colors ${logicMode === 'OR' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border'}`}
                  >OU</button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {filters.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={f.field} onValueChange={(v) => updateFilter(i, 'field', v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tags">Tags</SelectItem>
                      <SelectItem value="source">Source</SelectItem>
                      <SelectItem value="company">Entreprise</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="firstName">Prénom</SelectItem>
                      <SelectItem value="lastName">Nom</SelectItem>
                      <SelectItem value="phone">Téléphone</SelectItem>
                      <SelectItem value="createdAt">Date création</SelectItem>
                      <SelectItem value="lastActivity">Dernière activité</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={f.operator} onValueChange={(v) => updateFilter(i, 'operator', v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contient">contient</SelectItem>
                      <SelectItem value="ne_contient_pas">ne contient pas</SelectItem>
                      <SelectItem value="est">est</SelectItem>
                      <SelectItem value="n_est_pas">n'est pas</SelectItem>
                      <SelectItem value="commence_par">commence par</SelectItem>
                      <SelectItem value="finit_par">finit par</SelectItem>
                      <SelectItem value="est_vide">est vide</SelectItem>
                      <SelectItem value="n_est_pas_vide">n'est pas vide</SelectItem>
                      <SelectItem value="contient_domaine">contient le domaine</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={f.value} onChange={(e) => updateFilter(i, 'value', e.target.value)} placeholder="Valeur" className="flex-1" />
                  {filters.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeFilter(i)}>
                      <X size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2 gap-1 text-xs" onClick={addFilter}>
              <Plus size={12} /> Ajouter une condition
            </Button>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {previewCount >= 0 && (
            <div className="flex items-center gap-2 mr-auto">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-foreground">
                {previewCount} contact{previewCount !== 1 ? 's' : ''} correspondent
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSave}>{initialData ? 'Mettre à jour' : 'Créer le segment'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Contact Detail Panel ────────────────────────────────────────────────── */

function ContactDetail({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const cfg = SOURCE_CONFIG[contact.source];
  const SrcIcon = cfg.icon;

  return (
    <motion.div
      {...slideRight}
      className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-background shadow-2xl overflow-y-auto"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6 py-4">
        <h3 className="text-base font-bold text-foreground">Détail du contact</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
      </div>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
            {contact.firstName[0]}{contact.lastName[0]}
          </div>
          <div>
            <h4 className="text-lg font-bold text-foreground">{contact.firstName} {contact.lastName}</h4>
            <p className="text-sm text-muted-foreground">{contact.company}</p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {contact.tags.map(t => <TagBadge key={t} tag={t} />)}
        </div>

        <Separator />

        {/* Fields */}
        <div className="space-y-3">
          <DetailRow icon={Mail} label="Email" value={contact.email} />
          <DetailRow icon={Phone} label="Téléphone" value={contact.phone} />
          <DetailRow icon={Building2} label="Entreprise" value={contact.company} />
          <DetailRow icon={SrcIcon} label="Source" value={cfg.label} />
          <DetailRow icon={Calendar} label="Créé le" value={formatDate(contact.createdAt)} />
          <DetailRow icon={Clock} label="Dernière activité" value={formatDate(contact.lastActivity)} />
        </div>

        <Separator />

        {/* Edit form placeholder */}
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Edit3 size={14} /> Modifier</h5>
          <div className="space-y-2">
            <Input defaultValue={contact.firstName} placeholder="Prénom" />
            <Input defaultValue={contact.lastName} placeholder="Nom" />
            <Input defaultValue={contact.email} placeholder="Email" />
            <Input defaultValue={contact.phone} placeholder="Téléphone" />
            <Input defaultValue={contact.company} placeholder="Entreprise" />
            <Button className="w-full mt-2" size="sm">Enregistrer</Button>
          </div>
        </div>

        <Separator />

        {/* Activity log placeholder */}
        <div>
          <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Clock size={14} /> Activité récente</h5>
          <div className="space-y-2">
            {[
              { label: 'Email ouvert — Campagne été 2026', date: contact.lastActivity },
              { label: 'Formulaire soumis — Page contact', date: contact.createdAt },
            ].map((ev, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/30 px-3 py-2">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                <div>
                  <p className="text-xs text-foreground">{ev.label}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(ev.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-24">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ContactManagerPage() {
  /* ── state ─────────────────────────────────────────────────────────────── */
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [segments, setSegments] = useState<Segment[]>(MOCK_SEGMENTS);
  const [files, setFiles] = useState<UploadedFile[]>(MOCK_FILES);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [segmentModalOpen, setSegmentModalOpen] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [activeTab, setActiveTab] = useState('contacts');
  const [segmentViewId, setSegmentViewId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── filtered contacts ─────────────────────────────────────────────────── */
  const filteredContacts = useMemo(() => {
    let list = contacts;
    if (segmentViewId) {
      const seg = segments.find(s => s.id === segmentViewId);
      if (seg && seg.filters.length > 0) {
        list = list.filter(c => {
          return seg.filters.every(f => {
            const val = String((c as any)[f.field] || '').toLowerCase();
            const fVal = f.value.toLowerCase();
            switch (f.operator) {
              case 'contient': return val.includes(fVal);
              case 'ne_contient_pas': return !val.includes(fVal);
              case 'est': return val === fVal;
              case 'n_est_pas': return val !== fVal;
              case 'commence_par': return val.startsWith(fVal);
              case 'finit_par': return val.endsWith(fVal);
              case 'est_vide': return !val || val === '[]';
              case 'n_est_pas_vide': return !!val && val !== '[]';
              case 'contient_domaine': return c.email.toLowerCase().includes(fVal);
              default: return true;
            }
          });
        });
      }
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      );
    }
    if (tagFilter.length) {
      list = list.filter(c => tagFilter.some(t => c.tags.includes(t)));
    }
    return list;
  }, [contacts, search, tagFilter, segmentViewId, segments]);

  /* ── handlers ──────────────────────────────────────────────────────────── */
  const toggleTag = (tag: string) => setTagFilter(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selected.size === filteredContacts.length) setSelected(new Set());
    else setSelected(new Set(filteredContacts.map(c => c.id)));
  };

  const bulkDelete = () => {
    setContacts(prev => prev.filter(c => !selected.has(c.id)));
    toast.success(`${selected.size} contact(s) supprimé(s)`);
    setSelected(new Set());
  };

  const bulkTag = () => {
    setContacts(prev => prev.map(c => selected.has(c.id) && !c.tags.includes('vip') ? { ...c, tags: [...c.tags, 'vip'] } : c));
    toast.success('Tag "vip" ajouté');
    setSelected(new Set());
  };

  const bulkExport = () => {
    const rows = contacts.filter(c => selected.has(c.id));
    const csv = ['Prénom,Nom,Email,Téléphone,Entreprise,Tags', ...rows.map(c => `${c.firstName},${c.lastName},${c.email},${c.phone},${c.company},"${c.tags.join('; ')}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'contacts_export.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Export terminé');
  };

  const handleUploadFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const newFile: UploadedFile = {
      id: `f${Date.now()}`, name: f.name, size: f.size,
      type: f.name.split('.').pop() || 'unknown', rows: 0, status: 'parsing', uploadedAt: new Date().toISOString(),
    };
    setFiles(prev => [newFile, ...prev]);

    try {
      const result = await importFromFile(f);
      const count = result.validContacts.length;
      setFiles(prev => prev.map(pf => pf.id === newFile.id ? { ...pf, rows: count, status: 'parsed' } : pf));
      toast.success(`${count} contacts détectés dans ${f.name}`, {
        description: result.duplicates > 0 ? `${result.duplicates} doublons ignorés` : undefined,
      });

      // Auto-add parsed contacts to the contacts list
      if (count > 0) {
        const newContacts: Contact[] = result.validContacts.map((c, i) => ({
          id: `import-${Date.now()}-${i}`,
          firstName: c.firstName || '',
          lastName: c.lastName || '',
          email: c.email,
          phone: c.phone || '',
          company: c.company || '',
          tags: c.tags || [],
          source: 'csv' as const,
          lastActivity: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString().slice(0, 10),
        }));
        setContacts(prev => [...newContacts, ...prev]);
      }
    } catch (err: any) {
      setFiles(prev => prev.map(pf => pf.id === newFile.id ? { ...pf, status: 'error' } : pf));
      toast.error("Erreur d'analyse", { description: err?.message || 'Format non supporté' });
    }

    e.target.value = '';
  }, []);

  const handleSaveSegment = (data: Omit<Segment, 'id' | 'createdAt' | 'count'>) => {
    if (editingSegment) {
      // Update existing segment
      setSegments(prev => prev.map(s => s.id === editingSegment.id ? { ...s, ...data, count: s.count } : s));
      toast.success(`Segment "${data.name}" mis à jour`);
      setEditingSegment(null);
    } else {
      const newSeg: Segment = { ...data, id: `s${Date.now()}`, count: 0, createdAt: new Date().toISOString() };
      setSegments(prev => [...prev, newSeg]);
      toast.success(`Segment "${data.name}" créé`);
    }
  };

  const deleteSegment = (id: string) => {
    setSegments(prev => prev.filter(s => s.id !== id));
    toast.success('Segment supprimé');
  };

  const editSegment = (seg: Segment) => {
    setEditingSegment(seg);
    setSegmentModalOpen(true);
  };

  const saveCurrentFiltersAsSegment = () => {
    if (!tagFilter.length && !search) return;
    const autoFilters: SegmentFilter[] = [];
    if (tagFilter.length) {
      tagFilter.forEach(t => autoFilters.push({ field: 'tags', operator: 'contient', value: t }));
    }
    if (search) {
      autoFilters.push({ field: 'email', operator: 'contient', value: search });
    }
    setEditingSegment({ id: '', name: '', description: '', count: filteredContacts.length, createdAt: '', filters: autoFilters });
    setSegmentModalOpen(true);
  };

  const viewSegment = (id: string) => {
    setSegmentViewId(id);
    setActiveTab('contacts');
  };

  /* ── render ────────────────────────────────────────────────────────────── */
  return (
    <>
      <Page>
        <PageHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users size={20} className="text-primary" />
              </div>
              <div>
                <PageTitle>Gestion de Contacts</PageTitle>
                <PageDescription>Gérez vos contacts, segments et imports de fichiers</PageDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button className="gap-2" onClick={() => setImportOpen(true)}>
                <Upload size={16} /> Importer
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => toast.info('Nouveau contact', { description: 'Formulaire à connecter.' })}>
                <Plus size={16} /> Nouveau contact
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => setSegmentModalOpen(true)}>
                <Layers size={16} /> Nouveau segment
              </Button>
            </div>
          </div>
        </PageHeader>

        <PageBody>
          {/* KPIs */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
          >
            <MiniKpi icon={Users} label="Total contacts" value={contacts.length} color="bg-primary/10 text-primary" />
            <MiniKpi icon={Layers} label="Segments actifs" value={segments.length} color="bg-violet-500/10 text-violet-600" />
            <MiniKpi icon={FileSpreadsheet} label="Importés ce mois" value="450" color="bg-emerald-500/10 text-emerald-600" />
            <MiniKpi icon={Clock} label="Imports en attente" value="1" color="bg-amber-500/10 text-amber-600" />
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSegmentViewId(null); }} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="contacts" className="gap-1.5 text-xs">
                <Users size={13} /> Contacts
              </TabsTrigger>
              <TabsTrigger value="segments" className="gap-1.5 text-xs">
                <Layers size={13} /> Segments
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-1.5 text-xs">
                <FileUp size={13} /> Fichiers importés
              </TabsTrigger>
            </TabsList>

            {/* ──────────────────── CONTACTS TAB ──────────────────── */}
            <TabsContent value="contacts" className="animate-fade-in space-y-4">
              {/* Segment filter chip */}
              {segmentViewId && (
                <motion.div {...fadeUp} initial="initial" animate="animate" className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                  <Filter size={14} className="text-primary" />
                  <span className="text-xs font-medium text-primary">
                    Segment : {segments.find(s => s.id === segmentViewId)?.name}
                  </span>
                  <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => setSegmentViewId(null)}>
                    <X size={12} />
                  </Button>
                </motion.div>
              )}

              {/* Search + filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom, email, entreprise…"
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ALL_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer ${
                        tagFilter.includes(tag)
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {(tagFilter.length > 0 || search) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-[11px] text-primary ml-1"
                      onClick={saveCurrentFiltersAsSegment}
                    >
                      <Save size={11} /> Sauvegarder comme segment
                    </Button>
                  )}
                </div>
              </div>

              {/* Bulk actions bar */}
              <AnimatePresence>
                {selected.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5"
                  >
                    <span className="text-xs font-semibold text-primary">{selected.size} sélectionné(s)</span>
                    <Separator orientation="vertical" className="h-4" />
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={bulkTag}>
                      <Tag size={12} /> Taguer
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={bulkExport}>
                      <Download size={12} /> Exporter
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive" onClick={bulkDelete}>
                      <Trash2 size={12} /> Supprimer
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table or Empty */}
              {filteredContacts.length === 0 ? (
                <EmptyState
                  icon={<Users size={40} />}
                  title="Aucun contact trouvé"
                  description={search || tagFilter.length ? "Ajustez vos filtres pour voir plus de résultats." : "Importez vos premiers contacts ou ajoutez-les manuellement."}
                  action={!search && !tagFilter.length ? { label: 'Importer', onClick: () => setImportOpen(true) } : undefined}
                />
              ) : (
                <motion.div variants={stagger} initial="initial" animate="animate" className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="w-10 px-4 py-3">
                          <Checkbox checked={selected.size === filteredContacts.length && filteredContacts.length > 0} onCheckedChange={toggleSelectAll} />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Nom</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Entreprise</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tags</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Dernière activité</th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((c, i) => {
                        const cfg = SOURCE_CONFIG[c.source];
                        const SrcIcon = cfg.icon;
                        return (
                          <motion.tr
                            key={c.id}
                            variants={fadeUp}
                            className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => setDetailContact(c)}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold shrink-0">
                                  {c.firstName[0]}{c.lastName[0]}
                                </div>
                                <span className="font-medium text-foreground">{c.firstName} {c.lastName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{c.email}</td>
                            <td className="px-4 py-3 text-foreground text-xs">{c.company}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">{c.tags.map(t => <TagBadge key={t} tag={t} />)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color}`}>
                                <SrcIcon size={10} /> {cfg.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.lastActivity)}</td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailContact(c)}>
                                <ChevronRight size={14} />
                              </Button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </motion.div>
              )}
            </TabsContent>

            {/* ──────────────────── SEGMENTS TAB ──────────────────── */}
            <TabsContent value="segments" className="animate-fade-in">
              {segments.length === 0 ? (
                <EmptyState
                  icon={<Layers size={40} />}
                  title="Aucun segment"
                  description="Créez votre premier segment pour filtrer vos contacts dynamiquement."
                  action={{ label: 'Créer un segment', onClick: () => setSegmentModalOpen(true) }}
                />
              ) : (
                <motion.div variants={stagger} initial="initial" animate="animate" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {segments.map((seg) => (
                    <motion.div
                      key={seg.id}
                      variants={fadeUp}
                      whileHover={{ y: -3, boxShadow: '0 8px 30px -12px rgba(13,148,136,.2)' }}
                      className="group cursor-pointer rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow"
                      onClick={() => viewSegment(seg.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{seg.name}</h4>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          <Users size={10} /> {seg.count}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{seg.description}</p>
                      {/* Actions */}
                      <div className="flex items-center gap-2 mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-[11px] h-7 flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info('Envoi email', { description: `Ouvrir le formulaire d'envoi pour le segment "${seg.name}" (${seg.count} contacts).` });
                          }}
                        >
                          <Send size={11} /> Envoyer
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-[11px] h-7 flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewSegment(seg.id);
                          }}
                        >
                          <Eye size={11} /> Voir
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => { e.stopPropagation(); editSegment(seg); }}
                        >
                          <Edit3 size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); deleteSegment(seg.id); }}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(seg.createdAt)}
                        </span>
                        <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Voir contacts <ChevronRight size={10} />
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {/* Add segment card */}
                  <motion.div
                    variants={fadeUp}
                    whileHover={{ y: -2 }}
                    onClick={() => setSegmentModalOpen(true)}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-muted/20 p-8 transition-colors"
                  >
                    <Plus size={24} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Créer un segment</span>
                  </motion.div>
                </motion.div>
              )}
            </TabsContent>

            {/* ──────────────────── FILES TAB ──────────────────── */}
            <TabsContent value="files" className="animate-fade-in space-y-4">
              {/* Upload zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const dt = new DataTransfer(); dt.items.add(f); if (fileInputRef.current) { fileInputRef.current.files = dt.files; fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true })); } } }}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 p-10 transition-colors"
              >
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.pdf,.txt" className="hidden" onChange={handleUploadFile} />
                <Upload size={32} className="text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Glissez un fichier ici ou cliquez pour parcourir</p>
                <p className="text-xs text-muted-foreground">CSV, Excel (.xlsx), PDF, TXT</p>
              </div>

              {/* File list */}
              {files.length === 0 ? (
                <EmptyState
                  icon={<FileUp size={40} />}
                  title="Aucun fichier importé"
                  description="Importez un fichier CSV ou Excel pour commencer."
                />
              ) : (
                <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-2">
                  {files.map((f) => {
                    const ext = f.type.toLowerCase();
                    const iconColor = ext === 'csv' ? 'text-emerald-600 bg-emerald-500/10' : ext === 'xlsx' ? 'text-sky-600 bg-sky-500/10' : 'text-rose-600 bg-rose-500/10';
                    const statusBadge = f.status === 'parsed'
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold"><CheckCircle2 size={10} /> Analysé</span>
                      : f.status === 'parsing'
                        ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 px-2 py-0.5 text-[10px] font-semibold"><Loader2 size={10} className="animate-spin" /> En cours…</span>
                        : <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-700 px-2 py-0.5 text-[10px] font-semibold"><AlertCircle size={10} /> Erreur</span>;

                    return (
                      <motion.div
                        key={f.id}
                        variants={fadeUp}
                        className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                      >
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconColor} shrink-0`}>
                          <FileSpreadsheet size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatFileSize(f.size)} · {f.rows > 0 ? `${f.rows} lignes` : '—'} · {formatDate(f.uploadedAt)}
                          </p>
                        </div>
                        <div className="shrink-0">{statusBadge}</div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </PageBody>
      </Page>

      {/* Slide-in detail panel overlay */}
      <AnimatePresence>
        {detailContact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setDetailContact(null)}
            />
            <ContactDetail contact={detailContact} onClose={() => setDetailContact(null)} />
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImportComplete={(count) => {
        toast.success(`${count} contacts importés avec succès`);
      }} />
      <SegmentModal
        open={segmentModalOpen}
        onClose={() => { setSegmentModalOpen(false); setEditingSegment(null); }}
        onSave={handleSaveSegment}
        initialData={editingSegment}
        contacts={contacts}
      />
    </>
  );
}
