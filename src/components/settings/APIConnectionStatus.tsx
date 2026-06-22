import React, { useState, useCallback } from 'react';
import { Share2, CreditCard, CheckCircle2, AlertCircle, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@blinkdotnew/ui';
import toast from 'react-hot-toast';
import { SectionHelp } from '../shared/SectionHelp';

export function useAPIConnections() {
  const [gbp, setGbp] = useState(() => localStorage.getItem('nc_gbp_connected') === 'true');
  const [stripe, setStripe] = useState(() => localStorage.getItem('nc_stripe_connected') === 'true');

  const connectGBP = useCallback(() => {
    // Mock OAuth flow
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Connexion à Google...',
        success: () => {
          localStorage.setItem('nc_gbp_connected', 'true');
          setGbp(true);
          return 'Google Business Profile connecté !';
        },
        error: 'Erreur lors de la connexion',
      }
    );
  }, []);

  const connectStripe = useCallback(() => {
    // Mock Stripe Connect flow
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: 'Ouverture de Stripe...',
        success: () => {
          localStorage.setItem('nc_stripe_connected', 'true');
          setStripe(true);
          return 'Paiements Stripe activés !';
        },
        error: 'Erreur lors de la connexion',
      }
    );
  }, []);

  const disconnectGBP = useCallback(() => {
    localStorage.removeItem('nc_gbp_connected');
    setGbp(false);
    toast.success('Google déconnecté');
  }, []);

  const disconnectStripe = useCallback(() => {
    localStorage.removeItem('nc_stripe_connected');
    setStripe(false);
    toast.success('Stripe déconnecté');
  }, []);

  return { 
    hasGBP: gbp, 
    hasStripe: stripe, 
    connectGBP, 
    connectStripe, 
    disconnectGBP, 
    disconnectStripe 
  };
}

export function APIConnectionStatus() {
  const { hasGBP, hasStripe, connectGBP, connectStripe, disconnectGBP, disconnectStripe } = useAPIConnections();

  return (
    <Card className="border-none shadow-lg bg-background/50 backdrop-blur-sm overflow-hidden rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-accent/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Share2 className="w-5 h-5" />
          </div>
          <CardTitle className="text-lg font-bold">Connexions API</CardTitle>
        </div>
        <SectionHelp 
          title="Pourquoi connecter mes comptes ?"
          description="La connexion à vos outils tiers permet au Copilote d'automatiser vos tâches et de sécuriser vos revenus."
          faqs={[
            { q: "Est-ce que mes données sont sécurisées ?", a: "Oui, Kompilot utilise les protocoles OAuth 2.0. Nous n'avons jamais accès à vos identifiants." },
            { q: "Google Business est-il obligatoire ?", a: "Il est indispensable pour que l'IA puisse publier des posts automatiques et répondre aux avis à votre place." }
          ]}
        />
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 rounded-xl p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
            <p className="font-semibold mb-1">Configuration recommandée</p>
            Google est requis pour l'auto-publication de contenu. Stripe est indispensable pour activer les acomptes anti-no-show.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Business Profile */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${hasGBP ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-dashed border-muted'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
                <img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png" alt="Google" className="h-5 w-auto object-contain" />
              </div>
              {hasGBP ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 px-3 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connecté
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1.5 px-3 py-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Configuration requise
                </Badge>
              )}
            </div>
            
            <h4 className="font-bold mb-2">Google Business Profile</h4>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Activez la publication automatique des posts IA et la gestion des avis clients.
            </p>

            {hasGBP ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dernière sync: il y a 2 min
                </div>
                <Button variant="outline" size="sm" onClick={disconnectGBP} className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20">
                  Déconnecter
                </Button>
              </div>
            ) : (
              <Button onClick={connectGBP} className="w-full gap-2 bg-primary hover:bg-primary/90">
                <ExternalLink className="w-4 h-4" />
                Associer ma Fiche Google
              </Button>
            )}
          </div>

          {/* Stripe Connect */}
          <div className={`p-5 rounded-2xl border-2 transition-all ${hasStripe ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-dashed border-muted'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 shadow-sm">
                <CreditCard className="w-5 h-5 text-[#635BFF]" />
              </div>
              {hasStripe ? (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5 px-3 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connecté
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1.5 px-3 py-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Configuration requise
                </Badge>
              )}
            </div>
            
            <h4 className="font-bold mb-2">Stripe Connect</h4>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Sécurisez vos rendez-vous avec les acomptes et encaissez vos paiements.
            </p>

            {hasStripe ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/50 p-2 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Paiements actifs
                </div>
                <Button variant="outline" size="sm" onClick={disconnectStripe} className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/20">
                  Déconnecter
                </Button>
              </div>
            ) : (
              <Button onClick={connectStripe} className="w-full gap-2 bg-[#635BFF] hover:bg-[#635BFF]/90 text-white">
                <CreditCard className="w-4 h-4" />
                Activer les Paiements
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
