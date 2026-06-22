import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast, Input } from '@blinkdotnew/ui';
import { Sparkles, Check, ExternalLink, Mail, Copy } from 'lucide-react';

export default function SEOModule() {
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  const articles = [
    { id: '1', title: "Pourquoi choisir un opticien visagiste à La Rochelle ?", trend: "🔥 Tendance" },
    { id: '2', title: "Les 5 erreurs à éviter avant un bilan de vue", trend: "⬆️ +18%" },
    { id: '3', title: "Lunettes progressives : guide complet 2026", trend: "🔥 Tendance" }
  ];

  const partners = [
    { id: 'p1', name: "PagesJaunes.fr", type: "Annuaire local", da: "78" },
    { id: 'p2', name: "LaRochelle.com", type: "Blog communautaire", da: "54" },
    { id: 'p3', name: "OpticiensFrance.net", type: "Annuaire pro", da: "61" },
    { id: 'p4', name: "AssoCulture17.fr", type: "Blog associatif", da: "38" }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Section A: Score de Santé SEO */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🩺</span> Score de Santé SEO
        </h2>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                <circle
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset={283 * (1 - 0.85)}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-emerald-600">85</span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase">Trés bon</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-sm text-muted-foreground">Votre site est bien optimisé, mais quelques ajustements pourraient booster votre visibilité locale.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "🖼️ Optimiser les images",
                  "🏷️ Écrire les balises Alt",
                  "📝 Compléter les méta-descriptions"
                ].map((chip) => (
                  <div key={chip} className="flex items-center gap-2 p-1.5 pl-3 bg-muted/50 rounded-full border border-border/50">
                    <span className="text-xs font-medium">{chip}</span>
                    <Button
                      size="sm" variant="outline" className="h-7 px-3 rounded-full text-[10px] bg-background"
                      onClick={() => toast.success('Correction appliquée !')}
                    >
                      Corriger en 1 clic
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Section B: Moteur de Contenu SEO */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="text-primary" size={20} /> Sujets suggérés par l'IA
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {articles.map((article) => (
            <Card key={article.id} className="relative overflow-hidden group">
              <CardContent className="p-4 space-y-3">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{article.trend}</Badge>
                <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{article.title}</h3>
                <Button 
                  className="w-full text-xs" variant="outline" size="sm"
                  onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                >
                  {expandedArticle === article.id ? 'Fermer' : "Rédiger l'article"}
                </Button>
                
                {expandedArticle === article.id && (
                  <div className="pt-4 border-t border-dashed space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2 text-xs text-muted-foreground font-mono bg-muted/30 p-3 rounded-lg">
                      <p className="font-bold text-foreground"># {article.title}</p>
                      <p>## Introduction : Pourquoi c'est important ?</p>
                      <p>## 1. Expertise et savoir-faire local</p>
                      <p>### L'accompagnement personnalisé</p>
                      <p>## 2. Les tendances actuelles</p>
                      <p>### Sélection de montures exclusives</p>
                      <p>## Conclusion</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <Input placeholder="Meta Titre" defaultValue={article.title.substring(0, 60)} className="text-xs h-8" />
                      <Input placeholder="Meta Description" defaultValue={`Découvrez ${article.title.toLowerCase()} avec notre guide complet pour les habitants de La Rochelle.`} className="text-xs h-8" />
                    </div>
                    <Button size="sm" className="w-full gap-2" onClick={() => toast.success('Article copié dans le presse-papier !')}>
                      <Copy size={12} /> Copier l'article
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section C: Générateur de Backlinks */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🤝</span> Partenariats Locaux (Netlinking)
        </h2>
        <div className="space-y-3">
          {partners.map((partner) => (
            <Card key={partner.id} className="overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {partner.name[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">{partner.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{partner.type} • DA {partner.da}</p>
                  </div>
                </div>
                <Button 
                  size="sm" variant="ghost" className="gap-2 text-xs"
                  onClick={() => setExpandedEmail(expandedEmail === partner.id ? null : partner.id)}
                >
                  <Mail size={14} /> Envoyer une demande de lien
                </Button>
              </div>
              {expandedEmail === partner.id && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="bg-muted p-4 rounded-lg border border-border/50 space-y-3">
                    <div className="text-xs font-mono text-muted-foreground space-y-1">
                      <p><span className="font-bold">Objet :</span> Proposition de partenariat - Mon Établissement x {partner.name}</p>
                    </div>
                    <div className="text-xs leading-relaxed text-foreground bg-background p-3 rounded border">
                      Bonjour l'équipe de {partner.name},<br /><br />
                      Je suis le responsable de <span className="font-bold">Mon Établissement</span> à La Rochelle. Je suis votre travail avec intérêt et je pense que nos lecteurs pourraient bénéficier d'un échange de visibilité.<br /><br />
                      Seriez-vous ouverts à l'ajout d'un lien vers notre guide local en échange d'une mention de votre site sur nos réseaux sociaux ?<br /><br />
                      Bien cordialement,<br />
                      L'équipe Kompilot
                    </div>
                    <Button size="sm" className="w-full gap-2" onClick={() => {
                      toast.success('Demande envoyée !');
                      setExpandedEmail(null);
                    }}>
                      <ExternalLink size={12} /> Confirmer l'envoi
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
