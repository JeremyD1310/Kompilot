import React, { useState } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, 
  Button, Input, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Tabs, TabsList, TabsTrigger, TabsContent, toast
} from '@blinkdotnew/ui';
import { 
  Users, Newspaper, Handshake, Sparkles, Copy, 
  CheckCircle2, ChevronRight, PenTool, Send
} from 'lucide-react';

type TargetType = 'Partenaire Local' | 'Influenceur de Zone' | 'Micro-Média';

interface FormState {
  targetName: string;
  context: string;
  proposedValue: string;
}

const INITIAL_STATE: FormState = {
  targetName: '',
  context: '',
  proposedValue: 'Échange de visibilité'
};

export const LocalOutreachGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TargetType>('Partenaire Local');
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

  const generateScript = () => {
    if (!form.targetName) {
      toast.error('Veuillez saisir le nom de la cible');
      return;
    }

    const savedBrand = localStorage.getItem('kompilot_brand_book');
    const brandPromise = savedBrand ? JSON.parse(savedBrand).brandPromise : "acteur local incontournable de la tech";

    const valueDescriptions: Record<string, string> = {
      'Échange de visibilité': 'explorer un échange de visibilité mutuelle auprès de nos communautés respectives',
      'Commission sur ventes': 'discuter d\'un modèle de commission avantageux sur chaque recommandation réussie',
      'Invitation exclusive': 'vous convier à un moment privilégié pour découvrir nos solutions en avant-première',
      'Partenariat événementiel': 'co-organiser un événement local pour dynamiser notre écosystème de zone',
      'Publication croisée': 'partager nos expertises respectives via une série de publications croisées'
    };

    const script = `Bonjour ${form.targetName},

Je me permets de vous contacter car ${form.context || 'j\'admire votre engagement local et la pertinence de vos actions'}.

En tant que ${brandPromise}, nous partageons probablement la même clientèle locale exigeante.

Je souhaiterais explorer avec vous la possibilité de ${valueDescriptions[form.proposedValue] || form.proposedValue}.

Seriez-vous disponible pour un échange de 15 minutes cette semaine ?

Avec mes cordiales salutations,
[Votre Signature]`;

    setGeneratedScript(script);
    toast.success('Script généré avec succès');
  };

  const copyToClipboard = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript);
      toast.success('Copié dans le presse-papier', {
        icon: <CheckCircle2 className="w-4 h-4 text-teal-500" />
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl border-teal-500/30 bg-white dark:bg-slate-950 shadow-xl overflow-hidden">
      <CardHeader className="bg-teal-500/5 border-b border-teal-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Handshake className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-teal-700 dark:text-teal-400">
              Relations Locales & Outreach Premium
            </CardTitle>
            <p className="text-xs text-slate-500">Tissez des liens stratégiques avec votre écosystème de proximité</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="Partenaire Local" onValueChange={(val) => setActiveTab(val as TargetType)}>
          <TabsList className="grid grid-cols-3 mb-8 bg-slate-100 dark:bg-slate-900 p-1">
            <TabsTrigger value="Partenaire Local" className="gap-2 text-xs">
              <Handshake className="w-3.5 h-3.5" /> Partenaire
            </TabsTrigger>
            <TabsTrigger value="Influenceur de Zone" className="gap-2 text-xs">
              <Users className="w-3.5 h-3.5" /> Influenceur
            </TabsTrigger>
            <TabsTrigger value="Micro-Média" className="gap-2 text-xs">
              <Newspaper className="w-3.5 h-3.5" /> Média
            </TabsTrigger>
          </TabsList>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Nom du destinataire</label>
              <Input 
                value={form.targetName}
                onChange={(e) => setForm({ ...form, targetName: e.target.value })}
                placeholder="Ex: Boutique L'Élégance, Marc Dupont..."
                className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Contexte (Pourquoi eux ?)</label>
              <Textarea 
                value={form.context}
                onChange={(e) => setForm({ ...form, context: e.target.value })}
                placeholder="Ex: J'apprécie votre approche de la proximité..."
                className="min-h-[80px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Valeur proposée</label>
              <Select 
                value={form.proposedValue}
                onValueChange={(val) => setForm({ ...form, proposedValue: val })}
              >
                <SelectTrigger className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Échange de visibilité">Échange de visibilité</SelectItem>
                  <SelectItem value="Commission sur ventes">Commission sur ventes</SelectItem>
                  <SelectItem value="Invitation exclusive">Invitation exclusive</SelectItem>
                  <SelectItem value="Partenariat événementiel">Partenariat événementiel</SelectItem>
                  <SelectItem value="Publication croisée">Publication croisée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateScript}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold gap-2"
            >
              <Sparkles className="w-4 h-4" /> Générer le script
            </Button>
          </div>
        </Tabs>

        {generatedScript && (
          <div className="mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">
                <PenTool className="w-3 h-3" /> Script Suggéré
              </div>
              <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 gap-2 text-xs">
                <Copy className="w-3 h-3" /> Copier
              </Button>
            </div>
            
            <div className="relative p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-teal-500/20 shadow-inner">
              <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {generatedScript}
              </pre>
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Send className="w-12 h-12 text-teal-500 rotate-12" />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
