import React from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody } from '@blinkdotnew/ui';
import { BrandBookAI } from '../components/brand/BrandBookAI';
import { ReputationCrisisCell } from '../components/brand/ReputationCrisisCell';
import { LocalOutreachGenerator } from '../components/brand/LocalOutreachGenerator';
import { Sparkles } from 'lucide-react';

const BrandManagementPage: React.FC = () => {
  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <PageTitle>Gestion de Marque & Communication</PageTitle>
            <PageDescription>
              Pilotez votre identité, gérez votre e-réputation et développez votre ancrage local.
            </PageDescription>
          </div>
        </div>
      </PageHeader>
      
      <PageBody className="space-y-12 pb-20">
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 px-1">
              <span className="w-1 h-6 bg-amber-500 rounded-full" />
              Identité de Marque AI
            </h2>
            <BrandBookAI />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 px-1">
              <span className="w-1 h-6 bg-rose-500 rounded-full" />
              Veille & Réponse de Crise
            </h2>
            <ReputationCrisisCell />
          </div>
        </section>

        <section className="space-y-4 max-w-2xl">
          <h2 className="text-lg font-bold flex items-center gap-2 px-1">
            <span className="w-1 h-6 bg-teal-500 rounded-full" />
            Outreach & Partenariats Locaux
          </h2>
          <LocalOutreachGenerator />
        </section>
      </PageBody>
    </Page>
  );
};

export default BrandManagementPage;
