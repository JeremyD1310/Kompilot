import { useState, useRef, useEffect } from 'react';
import { Globe, Scan, Palette, Copy, Check, Loader2, Sparkles, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { blink } from '../blink/client';
import { cn } from '../lib/utils';

interface ScanResult {
  businessName: string;
  description: string;
  editorialTone: string;
  industry: string;
  colorPalette: string[];
  igPost: string;
  promoEmailSubject: string;
  promoEmailBody: string;
  adHeadline: string;
  adDescription: string;
  seoScore: number;
  geoScore: number;
  contentScore: number;
  technicalScore: number;
  structuredDataScore: number;
  aiCrawlerAccessibility: 'accessible' | 'partial' | 'blocked' | 'unknown';
  criticalIssues: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    title: string;
    evidence: string;
    action: string;
  }>;
}

export default function WebsiteScanPage() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nc_brand_scan_result');
    if (saved) {
      try {
        setResult(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved scan', e);
      }
    }
  }, []);

  const steps = [
    { label: "Connexion au site web...", icon: <Globe className="w-5 h-5 text-primary" /> },
    { label: "Analyse SEO, technique et données structurées...", icon: <Scan className="w-5 h-5 text-primary" /> },
    { label: "Évaluation GEO et accessibilité aux moteurs IA...", icon: <Globe className="w-5 h-5 text-primary" /> },
    { label: "Priorisation des améliorations et contenus...", icon: <Sparkles className="w-5 h-5 text-primary" /> },
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const startScan = async () => {
    if (!url) return;
    setScanning(true);
    setResult(null);
    setError('');
    setScanStep(0);

    const stepInterval = setInterval(() => {
      setScanStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 800);

    try {
      let scrapedContent = '';
      let detectedTitle = '';
      
      try {
        const { markdown, metadata } = await blink.data.scrape(url);
        scrapedContent = markdown?.slice(0, 12000) || '';
        detectedTitle = metadata?.title || '';
      } catch (e) {
        console.error('Scrape failed', e);
      }

      const { object: scanResult } = await blink.ai.generateObject({
        prompt: `Réalise un audit professionnel du site en français, puis génère des assets marketing.
URL: ${url}
Contenu détecté: ${scrapedContent.slice(0, 10000)}
Titre: ${detectedTitle}

Évalue uniquement ce qui est observable. N'invente aucune performance, note, balise ou preuve absente.
Analyse : SEO on-page, clarté de l'offre, contenu, entités et informations locales, citabilité GEO/AEO, données structurées, signaux de confiance, accessibilité apparente aux moteurs IA, cohérence de marque et conversion.
Pour chaque recommandation, indique la preuve observée et une action concrète. Si un contrôle technique n'est pas possible avec le contenu fourni, marque-le comme inconnu.
Génère aussi 3 propositions de contenu marketing cohérentes avec la marque.`,
        schema: {
          type: 'object',
          properties: {
            businessName: { type: 'string', description: 'Nom commercial détecté ou déduit de l\'URL' },
            description: { type: 'string', description: 'Description courte de l\'activité en 1-2 phrases' },
            editorialTone: { type: 'string', description: 'Ex: Sophistiqué et professionnel, Amical et local, Dynamique et moderne' },
            industry: { type: 'string', description: 'Secteur d\'activité en français' },
            colorPalette: {
              type: 'array', items: { type: 'string' },
              description: '5 couleurs hex suggérées pour cette marque (ex: #0D9488). Adapter au secteur.'
            },
            igPost: { type: 'string', description: 'Post Instagram/Facebook accrocheur de 3-4 lignes avec emojis, adapté au secteur' },
            promoEmailSubject: { type: 'string', description: 'Objet email promotionnel percutant (max 50 chars)' },
            promoEmailBody: { type: 'string', description: 'Corps email promotionnel court (3-4 phrases), professionnel' },
            adHeadline: { type: 'string', description: 'Titre publicité Google/Meta (max 30 chars)' },
            adDescription: { type: 'string', description: 'Description pub Google/Meta (max 90 chars)' },
            seoScore: { type: 'number', description: 'Score SEO observable de 0 à 100' },
            geoScore: { type: 'number', description: 'Score de citabilité GEO/AEO observable de 0 à 100' },
            contentScore: { type: 'number', description: 'Score de qualité et clarté du contenu de 0 à 100' },
            technicalScore: { type: 'number', description: 'Score technique limité aux éléments réellement observables, de 0 à 100' },
            structuredDataScore: { type: 'number', description: 'Score des données structurées observables, de 0 à 100' },
            aiCrawlerAccessibility: { type: 'string', enum: ['accessible', 'partial', 'blocked', 'unknown'] },
            criticalIssues: { type: 'array', items: { type: 'string' }, description: 'Maximum 5 problèmes critiques fondés sur des éléments observés' },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                  title: { type: 'string' },
                  evidence: { type: 'string', description: 'Élément observé qui justifie la recommandation' },
                  action: { type: 'string', description: 'Amélioration concrète et vérifiable' },
                },
                required: ['priority', 'title', 'evidence', 'action'],
              },
            },
          },
          required: ['businessName', 'description', 'editorialTone', 'industry', 'colorPalette', 'igPost', 'promoEmailSubject', 'promoEmailBody', 'adHeadline', 'adDescription', 'seoScore', 'geoScore', 'contentScore', 'technicalScore', 'structuredDataScore', 'aiCrawlerAccessibility', 'criticalIssues', 'recommendations']
        }
      });

      setResult(scanResult as ScanResult);
      localStorage.setItem('nc_brand_scan_result', JSON.stringify({ url, ...scanResult, scannedAt: new Date().toISOString() }));
    } catch (err) {
      setError('Une erreur est survenue lors de l\'analyse.');
    } finally {
      clearInterval(stepInterval);
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-12 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Audit IA/GEO du site professionnel</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Analysez le SEO, la citabilité GEO, le contenu, la technique observable et les améliorations prioritaires de votre site.
          </p>
        </div>

        {/* URL Input */}
        {!result && !scanning && (
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <input
                type="text"
                placeholder="https://moncommerce.fr"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full h-16 pl-6 pr-48 bg-card border border-border rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all group-hover:border-primary/30 shadow-2xl shadow-primary/5"
              />
              <button
                onClick={startScan}
                disabled={!url || scanning}
                className="absolute right-2 top-2 bottom-2 px-6 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium rounded-xl flex items-center gap-2 transition-all active:scale-95"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Scanner et générer</span>
              </button>
            </div>
            {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
          </div>
        )}

        {/* Scanning Animation */}
        {scanning && (
          <div className="max-w-md mx-auto space-y-8 py-12 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                {steps[scanStep].icon}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold animate-pulse">{steps[scanStep].label}</h3>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${((scanStep + 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Brand Card & Palette */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 p-8 bg-card border border-border rounded-2xl space-y-6 shadow-xl shadow-primary/5">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full uppercase tracking-wider">
                      {result.industry}
                    </span>
                    <span className="px-3 py-1 bg-muted text-muted-foreground text-xs font-semibold rounded-full uppercase tracking-wider">
                      {result.editorialTone}
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold tracking-tight">{result.businessName}</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">{result.description}</p>
                </div>
              </div>

              <div className="p-8 bg-card border border-border rounded-2xl space-y-6 shadow-xl shadow-primary/5">
                <h3 className="font-semibold flex items-center gap-2 text-primary">
                  <Palette className="w-4 h-4" /> Palette Couleur
                </h3>
                <div className="flex justify-between gap-2">
                  {result.colorPalette.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group">
                      <button
                        onClick={() => handleCopy(`color-${i}`, color)}
                        className="w-12 h-12 rounded-full border border-border shadow-lg transition-transform hover:scale-110 active:scale-90 relative overflow-hidden"
                        style={{ backgroundColor: color }}
                      >
                        {copied === `color-${i}` && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </button>
                      <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold">Diagnostic SEO et GEO du site</h3>
                <p className="text-sm text-muted-foreground mt-1">Scores fondés sur le contenu observable au moment du scan, sans garantie de positionnement ni de citation par une IA.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  ['SEO', result.seoScore], ['GEO/AEO', result.geoScore], ['Contenu', result.contentScore],
                  ['Technique', result.technicalScore], ['Données structurées', result.structuredDataScore],
                ].map(([label, score]) => (
                  <div key={String(label)} className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                    <p className="text-2xl font-black text-primary">{Number(score) || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm"><strong>Accès apparent aux moteurs IA :</strong> {result.aiCrawlerAccessibility}</p>
              {result.criticalIssues?.length > 0 && (
                <div>
                  <h4 className="font-semibold">Points critiques observés</h4>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground list-disc pl-5">
                    {result.criticalIssues.map((issue, index) => <li key={index}>{issue}</li>)}
                  </ul>
                </div>
              )}
              <div className="space-y-3">
                <h4 className="font-semibold">Plan d'amélioration priorisé</h4>
                {result.recommendations?.map((item, index) => (
                  <article key={index} className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-primary">{item.priority}</span>
                      <h5 className="font-semibold">{item.title}</h5>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground"><strong>Preuve :</strong> {item.evidence}</p>
                    <p className="mt-1 text-sm"><strong>Action :</strong> {item.action}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* Content Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ContentCard
                title="📸 Post Instagram/Facebook"
                content={result.igPost}
                onCopy={() => handleCopy('ig', result.igPost)}
                isCopied={copied === 'ig'}
              />
              <ContentCard
                title="📧 Email Promotionnel"
                content={`${result.promoEmailSubject}\n\n${result.promoEmailBody}`}
                onCopy={() => handleCopy('email', `${result.promoEmailSubject}\n\n${result.promoEmailBody}`)}
                isCopied={copied === 'email'}
                subtitle={`Objet: ${result.promoEmailSubject}`}
              />
              <ContentCard
                title="🎯 Publicité Google/Meta"
                content={`${result.adHeadline}\n\n${result.adDescription}`}
                onCopy={() => handleCopy('ad', `${result.adHeadline}\n\n${result.adDescription}`)}
                isCopied={copied === 'ad'}
                subtitle={`Titre: ${result.adHeadline}`}
              />
            </div>

            {/* Footer Action */}
            <div className="flex flex-col items-center gap-4 pt-12 border-t border-border">
              <a
                href="/email-marketing"
                className="inline-flex items-center gap-2 px-10 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl transition-all hover:gap-4 active:scale-95 shadow-lg shadow-primary/20"
              >
                <span>Exporter vers les campagnes</span>
                <ArrowRight className="w-5 h-5" />
              </a>
              <button 
                onClick={() => { setResult(null); setUrl(''); localStorage.removeItem('nc_brand_scan_result'); }}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recommencer avec un autre site</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentCard({ title, content, onCopy, isCopied, subtitle }: any) {
  return (
    <div className="flex flex-col p-6 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all group shadow-sm hover:shadow-2xl hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm">{title}</h4>
        <button
          onClick={onCopy}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isCopied ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex-1 space-y-3">
        {subtitle && <p className="text-xs font-semibold text-primary">{subtitle}</p>}
        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {content}
        </p>
      </div>
      <button
        onClick={onCopy}
        className={cn(
          "mt-6 w-full py-2.5 text-xs font-medium rounded-xl transition-all",
          isCopied ? "bg-primary/20 text-primary" : "bg-muted hover:bg-primary/10"
        )}
      >
        {isCopied ? "Copié ✓" : "Copier le texte"}
      </button>
    </div>
  );
}
