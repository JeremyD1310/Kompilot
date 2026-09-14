import { Page, PageBody, PageDescription, PageHeader, PageTitle } from '@blinkdotnew/ui';
import { SearchConsoleAudit } from '../components/analytics/SearchConsoleAudit';

export default function OrganicAuditPage() {
  return <Page className="page-enter"><PageHeader><PageTitle>Rapport Search Console</PageTitle><PageDescription>Une page pour prioriser les gains SEO à partir de vos données Google réelles.</PageDescription></PageHeader><PageBody><SearchConsoleAudit initialSiteUrl="example.com" /></PageBody></Page>;
}
