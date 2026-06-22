/**
 * AIOSchemaPanel — LLM Schema.org generator.
 *
 * Lets the user fill in product details + FAQs, then generates a
 * JSON-LD <script> block optimised for LLM citation (ChatGPT, Perplexity, Gemini…).
 * Includes a one-click copy and an "Optimiser pour les LLM" CTA.
 */
import { useState } from 'react';
import { Code2, Plus, Trash2, Copy, Check, Zap, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Button, toast } from '@blinkdotnew/ui';
import { generateAioSchema, generateAioSchemaTag, type AioFaq, type AioProductData } from '../../lib/aio/generateAioSchema';

interface FaqRowProps {
  faq: AioFaq;
  index: number;
  onChange: (i: number, field: 'question' | 'answer', val: string) => void;
  onRemove: (i: number) => void;
}

function FaqRow({ faq, index, onChange, onRemove }: FaqRowProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
          Question {index + 1}
        </span>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
          title="Supprimer"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <input
        type="text"
        value={faq.question}
        onChange={e => onChange(index, 'question', e.target.value)}
        placeholder="Ex: Quels sont les avantages de Kompilot ?"
        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
      />
      <textarea
        value={faq.answer}
        onChange={e => onChange(index, 'answer', e.target.value)}
        placeholder="Ex: Kompilot centralise la gestion des avis, publications et analytics en un seul tableau de bord…"
        rows={2}
        className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none"
      />
    </div>
  );
}

interface AIOSchemaPanelProps {
  defaultName?: string;
  defaultDescription?: string;
  defaultBrand?: string;
}

export function AIOSchemaPanel({
  defaultName = '',
  defaultDescription = '',
  defaultBrand = '',
}: AIOSchemaPanelProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription);
  const [brand, setBrand] = useState(defaultBrand);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [url, setUrl] = useState('');
  const [faqs, setFaqs] = useState<AioFaq[]>([
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);

  const [schemaJson, setSchemaJson] = useState<string | null>(null);
  const [schemaTag, setSchemaTag]   = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [optimised, setOptimised]   = useState(false);

  const addFaq = () => {
    if (faqs.length >= 10) { toast.error('Maximum 10 FAQs'); return; }
    setFaqs(prev => [...prev, { question: '', answer: '' }]);
  };

  const updateFaq = (i: number, field: 'question' | 'answer', val: string) => {
    setFaqs(prev => prev.map((f, idx) => idx === i ? { ...f, [field]: val } : f));
  };

  const removeFaq = (i: number) => setFaqs(prev => prev.filter((_, idx) => idx !== i));

  const generate = () => {
    if (!name.trim()) { toast.error('Entrez un nom de produit / marque.'); return; }
    if (!description.trim()) { toast.error('Entrez une description.'); return; }

    const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());

    const data: AioProductData = {
      name: name.trim(),
      description: description.trim(),
      price: price ? parseFloat(price) || price : 0,
      currency,
      faqs: validFaqs,
      ...(url.trim() ? { url: url.trim() } : {}),
      ...(brand.trim() ? { brand: brand.trim() } : {}),
    };

    const schema = generateAioSchema(data);
    const tag    = generateAioSchemaTag(data);

    setSchemaJson(JSON.stringify(schema, null, 2));
    setSchemaTag(tag);
    setShowPreview(true);
    setOptimised(false);

    toast.success(`Schema généré — ${validFaqs.length} FAQ(s) incluse(s)`);
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copié dans le presse-papiers !');
    } catch {
      toast.error('Copie impossible — utilisez Ctrl+A puis Ctrl+C.');
    }
  };

  const handleOptimise = () => {
    if (!schemaTag) { generate(); return; }
    setOptimised(true);
    toast.success('Schema optimisé pour les LLM ! Copiez le code et injectez-le dans le <head> de votre page.', {
      description: 'ChatGPT, Perplexity et Gemini lisent ce bloc en priorité.',
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
          <Code2 size={16} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-sm text-foreground">Générateur de Schema LLM</h2>
          <p className="text-xs text-muted-foreground">Génère un JSON-LD Schema.org + FAQ pour maximiser vos citations dans les réponses IA</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 shrink-0">
          <Zap size={11} className="text-violet-600" />
          <span className="text-[11px] font-bold text-violet-700 dark:text-violet-400">AIO Schema</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 px-3.5 py-3">
          <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            Les LLM scannent en priorité les structures de données claires et les FAQ directes. Injectez ce bloc JSON-LD dans le <code className="font-mono bg-blue-100 dark:bg-blue-900/40 px-1 rounded">&lt;head&gt;</code> de votre page pour forcer l'extraction par les bots IA.
          </p>
        </div>

        {/* Product fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Nom du produit / marque <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Kompilot"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Plateforme SaaS tout-en-un pour la gestion de présence en ligne des TPE/PME…"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Prix</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Ex: 49"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Devise</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CHF">CHF (Fr)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Marque / Éditeur</label>
            <input
              type="text"
              value={brand}
              onChange={e => setBrand(e.target.value)}
              placeholder="Ex: Kompilot SAS"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">URL de la page</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://kompilot.com/…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* FAQ section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              FAQ LLM <span className="normal-case font-normal text-muted-foreground">(max 10 — forcent l'extraction IA)</span>
            </label>
            <button
              type="button"
              onClick={addFaq}
              disabled={faqs.length >= 10}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={12} /> Ajouter une FAQ
            </button>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <FaqRow
                key={i}
                faq={faq}
                index={i}
                onChange={updateFaq}
                onRemove={removeFaq}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={generate}
            variant="outline"
            className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/5"
          >
            <Code2 size={14} /> Générer le JSON-LD
          </Button>

          <Button
            onClick={handleOptimise}
            className={`flex-1 gap-2 transition-all ${optimised ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <Zap size={14} />
            {optimised ? '✅ Optimisé pour les LLM !' : 'Optimiser pour les LLM'}
          </Button>
        </div>

        {/* JSON-LD Preview */}
        {schemaJson && (
          <div className="rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
              onClick={() => setShowPreview(v => !v)}
            >
              <div className="flex items-center gap-2">
                <Code2 size={13} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">JSON-LD généré</span>
                <span className="text-[10px] text-muted-foreground">— à injecter dans &lt;head&gt;</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); copy(schemaTag ?? schemaJson); }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 px-2 py-0.5 rounded hover:bg-primary/10 transition-colors"
                >
                  {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
                {showPreview ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
              </div>
            </button>

            {showPreview && (
              <div className="relative">
                <pre className="text-[11px] font-mono text-foreground/80 bg-muted/20 p-4 overflow-x-auto leading-relaxed max-h-72 overflow-y-auto">
                  {schemaTag}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Optimised tip */}
        {optimised && (
          <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50/50 dark:bg-green-950/20 px-4 py-3 space-y-1.5">
            <p className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1.5">
              <Zap size={12} /> Comment injecter ce schema ?
            </p>
            <ul className="text-xs text-green-700/80 dark:text-green-400/80 space-y-1 list-disc list-inside">
              <li>Copiez le bloc JSON-LD ci-dessus</li>
              <li>Collez-le dans le <code className="font-mono bg-green-100 dark:bg-green-900/40 px-1 rounded">&lt;head&gt;</code> de votre page produit ou landing page</li>
              <li>Sur WordPress : utilisez le plugin <strong>Rank Math</strong> ou <strong>Yoast SEO</strong> → Schema personnalisé</li>
              <li>Sur Next.js / Vite : injectez via un composant <code className="font-mono bg-green-100 dark:bg-green-900/40 px-1 rounded">&lt;script type="application/ld+json"&gt;</code></li>
              <li>ChatGPT, Perplexity et Gemini lisent ce bloc en priorité lors de l'exploration de votre page</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
