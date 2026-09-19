import { useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Globe, Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { blink } from '../blink/client';
import { BACKEND_URL } from '../lib/backend';

type Category = 'technical' | 'content' | 'local' | 'trust' | 'geo';
type Finding = { id: string; category: Category; priority: 'P0' | 'P1' | 'P2'; pageUrl: string; title: string; evidence: string; impact: string; recommendation: string; effort: string; status: 'todo' };
type AuditReport = {
  auditId: string; requestedUrl: string; canonicalOrigin: string; observedAt: string; persisted: boolean;
  pages: Array<{ url: string; status: number; title: string; wordCount: number; schemaTypes: string[] }>;
  scores: Record<Category | 'overall', number>; findings: Finding[]; limitations: string[];
  methodology: { maxPages: number; maxDepth: number; maxResponseBytes: number; robotsPolicy: string; scoringPolicy: string };
};

const labels: Record<Category | 'overall', string> = { overall: 'Global', technical: 'Technique', content: 'Contenu', local: 'Local', trust: 'Confiance', geo: 'GEO / IA' };
const priorityStyle = { P0: 'border-red-500/30 bg-red-500/5 text-red-700', P1: 'border-amber-500/30 bg-amber-500/5 text-amber-700', P2: 'border-blue-500/30 bg-blue-500/5 text-blue-700' };

export default function WebsiteScanPage() {
  const [url, setUrl] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | Finding['priority']>('all');

  const runAudit = async () => {
    if (!url.trim() || !authorized) return;
    setLoading(true); setError(''); setReport(null);
    try {
      const token = await blink.auth.getValidToken();
      const response = await fetch(`${BACKEND_URL}/api/geo/website-audit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: url.trim(), authorizationConfirmed: authorized }),
      });
      const data = await response.json() as AuditReport & { error?: string; details?: string };
      if (!response.ok) throw new Error(data.details || data.error || `HTTP ${response.status}`);
      setReport(data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Audit impossible'); }
    finally { setLoading(false); }
  };

  const visibleFindings = report?.findings.filter(item => filter === 'all' || item.priority === filter) ?? [];
  return <div className="min-h-screen bg-background p-4 text-foreground sm:p-6 lg:p-10"><div className="mx-auto max-w-6xl space-y-8">
    <header className="space-y-3 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Globe /></div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Audit de visibilité Web & IA</h1><p className="mx-auto max-w-3xl text-muted-foreground">Analyse observable du SEO, de la présence locale, des preuves de confiance et de la capacité du site à être compris par les moteurs et assistants IA.</p></header>

    {!report && <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
      <label className="text-sm font-semibold" htmlFor="website-audit-url">Site professionnel à analyser</label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row"><input id="website-audit-url" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://monentreprise.fr" className="h-12 flex-1 rounded-xl border bg-background px-4 outline-none focus:ring-2 focus:ring-primary/40" /><button onClick={() => void runAudit()} disabled={loading || !url.trim() || !authorized} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{loading ? 'Analyse limitée en cours…' : 'Lancer l’audit'}</button></div>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border bg-muted/30 p-3 text-sm"><input type="checkbox" checked={authorized} onChange={event => setAuthorized(event.target.checked)} className="mt-1" /><span>Je confirme être autorisé à analyser ce domaine. Kompilot consulte uniquement des pages publiques, sans formulaire ni contournement d’authentification.</span></label>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" />Maximum 8 pages, profondeur 1, taille et durée limitées, respect de robots.txt.</p>
      {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    </section>}

    {report && <>
      <section className="rounded-2xl border bg-card p-5 sm:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Analyse du {new Date(report.observedAt).toLocaleString('fr-FR')}</p><h2 className="mt-1 break-all text-xl font-bold">{report.canonicalOrigin}</h2><p className="mt-1 text-sm text-muted-foreground">{report.pages.length} page(s) publique(s) analysée(s) · {report.findings.length} constat(s)</p></div><button onClick={() => { setReport(null); setError(''); }} className="inline-flex items-center gap-2 self-start rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted"><RefreshCw className="h-4 w-4" />Nouvel audit</button></div>
        {!report.persisted && <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-800"><AlertCircle className="mt-0.5 h-4 w-4" />Résultat disponible, mais historique non enregistré : la migration 003 doit être validée et appliquée dans Blink.</div>}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{(['overall', 'technical', 'content', 'local', 'trust', 'geo'] as const).map(key => <div key={key} className="rounded-xl border bg-muted/20 p-4 text-center"><p className="text-3xl font-black text-primary">{report.scores[key]}</p><p className="mt-1 text-xs text-muted-foreground">{labels[key]}</p></div>)}</div>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Plan d’amélioration priorisé</h2><p className="text-sm text-muted-foreground">Chaque recommandation est reliée à une preuve observée.</p></div><div className="flex gap-2">{(['all', 'P0', 'P1', 'P2'] as const).map(value => <button key={value} onClick={() => setFilter(value)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${filter === value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{value === 'all' ? 'Toutes' : value}</button>)}</div></div>
        <div className="mt-5 space-y-3">{visibleFindings.map(item => <article key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-md border px-2 py-0.5 text-xs font-black ${priorityStyle[item.priority]}`}>{item.priority}</span><span className="rounded-md bg-muted px-2 py-0.5 text-xs">{labels[item.category]}</span><h3 className="font-bold">{item.title}</h3></div><p className="mt-3 text-sm"><strong>Preuve :</strong> {item.evidence}</p><p className="mt-2 text-sm text-muted-foreground"><strong>Impact potentiel :</strong> {item.impact}</p><p className="mt-2 text-sm"><strong>Action recommandée :</strong> {item.recommendation}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><a href={item.pageUrl} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 break-all text-primary hover:underline"><ExternalLink className="h-3 w-3 shrink-0" />{item.pageUrl}</a><span>Effort : {item.effort}</span></div></article>)}</div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border bg-card p-5"><h2 className="font-bold">Pages observées</h2><div className="mt-3 space-y-2">{report.pages.map(page => <div key={page.url} className="rounded-xl border p-3 text-sm"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><span className="min-w-0 flex-1 truncate font-medium">{page.title || page.url}</span><span className="text-xs text-muted-foreground">HTTP {page.status}</span></div><p className="mt-1 text-xs text-muted-foreground">{page.wordCount} mots · {page.schemaTypes.length ? page.schemaTypes.join(', ') : 'aucun schéma détecté'}</p></div>)}</div></div>
        <div className="rounded-2xl border bg-card p-5"><h2 className="font-bold">Méthodologie et limites</h2><p className="mt-3 text-sm text-muted-foreground">{report.methodology.scoringPolicy}</p><p className="mt-2 text-sm text-muted-foreground">{report.methodology.robotsPolicy}</p>{report.limitations.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{report.limitations.map(item => <li key={item}>{item}</li>)}</ul>}<p className="mt-4 text-xs font-medium">Aucune position Google, performance commerciale ou citation par une IA n’est garantie.</p></div></section>
    </>}
  </div></div>;
}
