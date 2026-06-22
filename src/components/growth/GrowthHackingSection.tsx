/**
 * GrowthHackingSection — Growth Hacking Local (Coups de Boost)
 * Extracted from GrowthPage.tsx for size compliance.
 */
import { useState } from 'react';
import { Button, toast } from '@blinkdotnew/ui';
import { Zap, Copy } from 'lucide-react';

const Spinner = () => (
  <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
);

function GeneratedBox({ text, onCopy }: { text: string; onCopy?: () => void }) {
  return (
    <div className="relative">
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{text}</div>
      {onCopy && (
        <button onClick={onCopy} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-80 transition-opacity">
          <Copy size={12} /> Copier
        </button>
      )}
    </div>
  );
}

export function GrowthHackingSection({ name, bookingUrl }: { name: string; bookingUrl: string }) {
  const [flashOffer, setFlashOffer]             = useState('');
  const [isGeneratingFlash, setIsGeneratingFlash] = useState(false);
  const [qrGenerated, setQrGenerated]           = useState(false);
  const [isGeneratingQr, setIsGeneratingQr]     = useState(false);
  const [referralScript, setReferralScript]     = useState('');
  const [isGeneratingReferral, setIsGeneratingReferral] = useState(false);
  const [contestPost, setContestPost]           = useState('');
  const [isGeneratingContest, setIsGeneratingContest]   = useState(false);

  const handleFlash = async () => {
    setIsGeneratingFlash(true);
    await new Promise(r => setTimeout(r, 2000));
    setFlashOffer(`⚡ OFFRE FLASH — 24H SEULEMENT !\n\n🎁 -20% sur votre prochaine visite chez ${name}\n⏰ Valable jusqu'à demain soir 23h59\n\nRéservez maintenant ! 👉 ${bookingUrl}\n\n#OffreFlash #${name.replace(/\s/g, '')} #BonPlan`);
    setIsGeneratingFlash(false);
    toast.success('⚡ Offre Flash générée !');
  };

  const handleQr = async () => {
    setIsGeneratingQr(true);
    await new Promise(r => setTimeout(r, 1000));
    setQrGenerated(true);
    setIsGeneratingQr(false);
    toast.success('📱 Flyer QR Code généré !');
  };

  const handleReferral = async () => {
    setIsGeneratingReferral(true);
    await new Promise(r => setTimeout(r, 1500));
    setReferralScript(`📲 Message de parrainage :\n\nBonjour ! Je vous recommande ${name}. Parrainez un ami et profitez de -15% sur votre prochaine visite chacun !\n\nRéservez ici 👉 ${bookingUrl}\n\nMerci de partager ce message à vos proches 🙏`);
    setIsGeneratingReferral(false);
    toast.success('🤝 Script de parrainage prêt !');
  };

  const handleContest = async () => {
    setIsGeneratingContest(true);
    await new Promise(r => setTimeout(r, 1500));
    setContestPost(`🏆 CONCOURS — Tentez votre chance !\n\n@${name.replace(/\s/g, '')} offre un bon cadeau !\n\n🎁 Pour participer :\n1️⃣ Suivez notre compte\n2️⃣ Likez cette publication\n3️⃣ Taguez un ami en commentaire\n\nRésultats vendredi ! 🍀\n\n#Concours #CommerceLocal`);
    setIsGeneratingContest(false);
    toast.success('🏆 Post concours généré !');
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Zap size={18} className="text-primary" />
        Growth Hacking Local (Coups de Boost) 🚀
      </h2>

      <div className="space-y-2">
        <Button onClick={handleFlash} disabled={isGeneratingFlash} className="gap-2 w-full sm:w-auto">
          {isGeneratingFlash ? <Spinner /> : '⚡'} Déclencher une offre Flash
        </Button>
        {flashOffer && <GeneratedBox text={flashOffer} onCopy={() => { navigator.clipboard.writeText(flashOffer); toast.success('Offre Flash copiée !'); }} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 pt-2">
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">Le Pack QR Code Magique 📱</p>
          <p className="text-xs text-muted-foreground leading-relaxed">Flyer QR Code à imprimer : offrez un petit cadeau en échange d'un avis Google.</p>
          <Button variant="outline" size="sm" onClick={handleQr} disabled={isGeneratingQr} className="gap-2 w-full">
            {isGeneratingQr ? <Spinner /> : null} Générer mon QR Code Flyer
          </Button>
          {qrGenerated && (
            <div className="space-y-2">
              <div className="w-16 h-16 rounded-lg bg-primary mx-auto flex items-center justify-center">
                <div className="grid grid-cols-3 gap-0.5">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-sm ${[0,2,4,6,8].includes(i) ? 'bg-primary-foreground' : 'bg-primary'}`} />
                  ))}
                </div>
              </div>
              <button onClick={() => toast.success('Impression lancée !')} className="w-full text-xs font-semibold text-primary hover:opacity-80">
                🖨️ Imprimer
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">L'Opération Parrainage Flash 🤝</p>
          <p className="text-xs text-muted-foreground leading-relaxed">Script SMS/Email de parrainage à envoyer à vos clients fidèles.</p>
          <Button variant="outline" size="sm" onClick={handleReferral} disabled={isGeneratingReferral} className="gap-2 w-full">
            {isGeneratingReferral ? <Spinner /> : null} Générer le Script
          </Button>
          {referralScript && <GeneratedBox text={referralScript} onCopy={() => { navigator.clipboard.writeText(referralScript); toast.success('Script copié !'); }} />}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-sm font-bold text-foreground">Le Jeu Concours Local 🏆</p>
          <p className="text-xs text-muted-foreground leading-relaxed">Post Instagram de concours avec un partenaire local pour booster votre audience.</p>
          <Button variant="outline" size="sm" onClick={handleContest} disabled={isGeneratingContest} className="gap-2 w-full">
            {isGeneratingContest ? <Spinner /> : null} Générer le Post Concours
          </Button>
          {contestPost && <GeneratedBox text={contestPost} onCopy={() => { navigator.clipboard.writeText(contestPost); toast.success('Post copié !'); }} />}
        </div>
      </div>
    </div>
  );
}
