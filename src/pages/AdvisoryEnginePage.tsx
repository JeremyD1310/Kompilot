import { Page, PageBody, PageDescription, PageHeader, PageTitle } from '@blinkdotnew/ui';
import { BrainCircuit } from 'lucide-react';
import { AdvisoryEnginePanel } from '../components/advisory/AdvisoryEnginePanel';

export default function AdvisoryEnginePage() {
  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><BrainCircuit className="h-5 w-5 text-primary" /></div>
          <div><PageTitle>Analyse & Conseil IA</PageTitle><PageDescription>Un cockpit stratégique qui transforme vos données marketing en prochaines actions.</PageDescription></div>
        </div>
      </PageHeader>
      <PageBody><AdvisoryEnginePanel /></PageBody>
    </Page>
  );
}
