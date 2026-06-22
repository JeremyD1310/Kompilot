import React from 'react';
import { Page, PageHeader, PageTitle, PageBody, Card, Badge, Button, toast, HStack, VStack, Stat } from '@blinkdotnew/ui';
import { ThumbsUp, ThumbsDown, Sparkles, MessageSquareQuote } from 'lucide-react';

const STRENGTHS = [
  "Ambiance chaleureuse",
  "Service rapide et attentionné",
  "Rapport qualité-prix excellent",
  "Équipe souriante et professionnelle",
  "Cadre agréable et lumineux"
];

const FRICTIONS = [
  "Temps d'attente aux heures de pointe",
  "Prix des boissons jugés élevés",
  "Stationnement difficile à proximité",
  "Manque d'options végétariennes"
];

export default function SentimentAnalysisPage() {
  const handleAICorrect = (friction: string) => {
    toast.success('Génération IA lancée', {
      description: `Copilote prépare un post pour adresser le point : "${friction}"`
    });
  };

  return (
    <Page>
      <PageHeader>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <PageTitle>Analyse Sémantique</PageTitle>
            <HStack gap={3}>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1">
                🟢 127 avis analysés
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1">
                Score de sentiment : 78/100
              </Badge>
            </HStack>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Les Points Forts */}
          <Card className="border-emerald-500/20 bg-emerald-500/[0.02]">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500">
                  <ThumbsUp size={20} />
                </div>
                <h2 className="text-xl font-semibold text-emerald-500">Les Points Forts</h2>
              </div>
              
              <VStack gap={3}>
                {STRENGTHS.map((strength, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {strength}
                  </div>
                ))}
              </VStack>
            </div>
          </Card>

          {/* Les Axes d'Amélioration */}
          <Card className="border-red-500/20 bg-red-500/[0.02]">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-full bg-red-500/10 text-red-500">
                  <ThumbsDown size={20} />
                </div>
                <h2 className="text-xl font-semibold text-red-500">Les Axes d'Amélioration</h2>
              </div>
              
              <VStack gap={4}>
                {FRICTIONS.map((friction, index) => (
                  <div 
                    key={index}
                    className="p-4 rounded-lg bg-red-500/5 border border-red-500/10"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3 text-red-700 dark:text-red-300">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="font-medium">{friction}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-fit gap-2 border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        onClick={() => handleAICorrect(friction)}
                      >
                        <Sparkles size={14} />
                        💡 Corriger avec un post IA
                      </Button>
                    </div>
                  </div>
                ))}
              </VStack>
            </div>
          </Card>
        </div>

        {/* Global Insight Section */}
        <Card className="mt-6 border-dashed border-2 bg-transparent">
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
              <MessageSquareQuote size={32} />
            </div>
            <h3 className="text-lg font-medium">Recommandation Stratégique</h3>
            <p className="text-muted-foreground max-w-2xl">
              Votre établissement brille par son ambiance et son équipe. Capitalisez sur ces atouts dans vos prochaines campagnes. 
              Pour le stationnement, envisagez d'indiquer les parkings partenaires sur vos réseaux sociaux pour réduire la friction client.
            </p>
          </div>
        </Card>
      </PageBody>
    </Page>
  );
}
