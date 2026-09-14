import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Brain, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { Button, Card, CardContent, toast } from '@blinkdotnew/ui';
import { useDemoMode } from '../../context/DemoModeContext';
import { ADVISORY_DEMO_REPORT } from '../../data/advisoryDemoData';
import { fetchLatestAdvisory, generateAdvisory } from '../../lib/advisoryApi';
import type { AdvisoryPillarId, AdvisoryReport } from '../../lib/advisoryTypes';
import { AdvisoryPillarAccordion } from './AdvisoryPillarAccordion';
import { AdvisoryImpactComparison } from './AdvisoryImpactComparison';
import { PillarScoreGrid } from './PillarScoreGrid';

const freshness = (date: string) => new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export function AdvisoryEnginePanel() {
  const { isDemoActive } = useDemoMode();
  const [report, setReport] = useState<AdvisoryReport | null>(isDemoActive ? ADVISORY_DEMO_REPORT : null);
  const [loading, setLoading] = useState(!isDemoActive);
  const [openPillar, setOpenPillar] = useState<AdvisoryPillarId>('social');

  const loadReport = useCallback(async () => {
    if (isDemoActive) {
      setReport(ADVISORY_DEMO_REPORT);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const latest = await fetchLatestAdvisory();
      setReport(latest ?? await generateAdvisory());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger l’analyse';
      toast.error('Analyse indisponible', { description: message });
    } finally {
      setLoading(false);
    }
  }, [isDemoActive]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const handleRefresh = async () => {
    if (isDemoActive) {
      toast.success('Démo actualisée', { description: 'Les recommandations simulées sont à jour.' });
      return;
    }
    setLoading(true);
    try {
      setReport(await generateAdvisory());
      toast.success('Analyse terminée', { description: 'Les recommandations ont été recalculées sur vos dernières données.' });
    } catch (error) {
      toast.error('Échec de l’analyse', { description: error instanceof Error ? error.message : 'Réessayez dans quelques instants.' });
    } finally { setLoading(false); }
  };

  if (loading && !report) return <div className="space-y-4"><div className="h-36 rounded-2xl bg-slate-100 animate-pulse" /><div className="h-20 rounded-2xl bg-slate-100 animate-pulse" /><div className="h-20 rounded-2xl bg-slate-100 animate-pulse" /></div>;
  if (!report) return <Card><CardContent className="py-14 text-center text-slate-500">Aucune analyse disponible.</CardContent></Card>;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4 flex-1"><div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center"><Brain size={27} /></div><div><div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-black text-slate-900">{report.business.name}</h2>{report.business.profileVerified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><BadgeCheck size={14} /> Profil vérifié</span>}</div><p className="text-sm text-slate-500">{report.business.sector} · {report.business.city} · {report.business.maturity === 'established' ? 'entreprise établie' : 'phase de développement'}</p><p className="text-xs text-slate-400 mt-1">Dernière analyse : {freshness(report.generatedAt)}</p></div></div>
            <div className="flex items-center gap-4"><div className="text-center"><p className="text-4xl font-black text-teal-700">{report.overallScore}<span className="text-lg text-slate-400">/100</span></p><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Score conseil</p></div><div className="h-12 w-px bg-slate-200" /><div><p className="text-sm font-bold text-slate-800">{report.criticalCount} priorité{report.criticalCount > 1 ? 's' : ''} haute{report.criticalCount > 1 ? 's' : ''}</p><p className="text-xs text-slate-500">sur 5 piliers analysés</p></div><Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-2"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span className="hidden sm:inline">Actualiser</span></Button></div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100"><ShieldCheck size={15} className="text-teal-600" /><span className="text-xs font-semibold text-slate-600">Contexte utilisé :</span>{report.sources.map(source => <span key={source} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{source}</span>)}</div>
        </CardContent>
      </Card>

      {/* ── 5 Pillars Visual Grid ── */}
      <PillarScoreGrid
        pillars={report.pillars}
        openPillar={openPillar}
        onSelectPillar={(id) => setOpenPillar(current => current === id ? 'social' : id)}
      />

      <div className="flex items-center gap-2"><Sparkles size={17} className="text-teal-600" /><div><h2 className="font-bold text-slate-900">Recommandations prioritaires</h2><p className="text-xs text-slate-500">Ouvrez un pilier pour voir les signaux et les actions concrètes.</p></div></div>
      <div className="space-y-3">{report.pillars.map(pillar => <AdvisoryPillarAccordion key={pillar.id} pillar={pillar} open={openPillar === pillar.id} onToggle={() => setOpenPillar(current => current === pillar.id ? 'social' : pillar.id)} />)}</div>
      <AdvisoryImpactComparison />
    </div>
  );
}
