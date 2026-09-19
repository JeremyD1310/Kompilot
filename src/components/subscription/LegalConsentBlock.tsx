/**
 * LegalConsentBlock — Bloc "clickwrap" CGV + droit de rétractation SaaS B2B.
 *
 * Rendu juste au-dessus du bouton "Confirmer l'abonnement" dans tout écran de
 * checkout. Les deux cases sont non cochées par défaut et techniquement
 * obligatoires (le bouton reste désactivé tant que les deux ne sont pas cochées).
 *
 * Version CGV suivie pour le log compliance : CGV_V1.0_2026-06
 */
import { useState } from 'react';
import { ShieldCheck, FileText, Download, ScrollText } from 'lucide-react';
import { Dialog, DialogContent } from '@blinkdotnew/ui';

export const CGV_VERSION = 'CGV_V1.0_2026-06';

export interface LegalConsentState {
  cgvAccepted: boolean;
  retractionWaived: boolean;
  /** True when user explicitly renounces their 14-day trial for immediate access */
  renouncedTrial?: boolean;
}

interface LegalConsentBlockProps {
  state: LegalConsentState;
  onChange: (next: LegalConsentState) => void;
  disabled?: boolean;
  /** When true, shows the trial-renunciation checkbox (user is on trial) */
  showTrialRenunciation?: boolean;
}

// ---------------------------------------------------------------------------
// CGV inline content (embedded — no fetch required)
// ---------------------------------------------------------------------------
const CGV_TEXT = `CONDITIONS GÉNÉRALES DE VENTE — Kompilot
Version : ${CGV_VERSION}
Date d'entrée en vigueur : 1er juin 2026

──────────────────────────────────────────
ARTICLE 1 — OBJET
──────────────────────────────────────────
Les présentes Conditions Générales de Vente (ci-après « CGV ») régissent les
relations contractuelles entre la société Kompilot SAS (ci-après « Kompilot »
ou « le Prestataire ») et toute personne physique ou morale (ci-après « le Client »)
souscrivant à l'un des abonnements proposés sur la plateforme Kompilot, accessible
à l'adresse https://kompilot.io. Toute souscription implique l'acceptation pleine
et entière des présentes CGV.

──────────────────────────────────────────
ARTICLE 2 — DESCRIPTION DES SERVICES
──────────────────────────────────────────
Kompilot est un service SaaS (Software as a Service) de surveillance réseau,
d'analyse de trafic et de co-pilotage IA destiné aux professionnels. Les fonctionnalités
exactes varient selon la formule d'abonnement choisie (Starter, Pro, Enterprise).
Le Prestataire se réserve le droit de faire évoluer les fonctionnalités, sous réserve
d'en informer le Client avec un préavis raisonnable.

──────────────────────────────────────────
ARTICLE 3 — PRIX ET FACTURATION
──────────────────────────────────────────
Les prix sont indiqués en euros (€) hors taxes (HT) et toutes taxes comprises (TTC).
La TVA applicable est celle en vigueur à la date de facturation. Les abonnements sont
facturés mensuellement ou annuellement selon le choix du Client au moment de la
souscription. Les tarifs sont révisables ; tout changement est notifié au Client
30 jours avant son entrée en vigueur. Le Client qui n'accepte pas la révision peut
résilier son abonnement sans frais avant la date d'effet.

──────────────────────────────────────────
ARTICLE 4 — CONDITIONS DE PAIEMENT
──────────────────────────────────────────
Le paiement s'effectue par prélèvement automatique via Stripe, au moment du
renouvellement de la période d'abonnement. En cas d'échec de paiement, le service
peut être suspendu après une période de grâce de 7 jours. Le Prestataire n'est pas
responsable des frais bancaires liés à un rejet de prélèvement. Tout montant dû et
non réglé dans les 30 jours suivant l'échéance peut faire l'objet de pénalités de
retard au taux légal majoré de 3 points.

──────────────────────────────────────────
ARTICLE 5 — DROIT DE RÉTRACTATION (14 JOURS)
──────────────────────────────────────────
Conformément aux articles L.221-18 et suivants du Code de la consommation, le Client
bénéficie d'un droit de rétractation de 14 jours calendaires à compter de la date de
souscription. Toutefois, en application de l'article L.221-28 du même Code, si le
Client demande l'exécution immédiate du service numérique avant l'expiration du délai
de rétractation et renonce expressément à ce droit, ce dernier est perdu. Cette
renonciation est actée lors du processus de souscription par une case à cocher
distincte. Pour exercer votre droit de rétractation (si applicable) : envoyez un
courrier électronique à legal@kompilot.io.

──────────────────────────────────────────
ARTICLE 6 — RÉSILIATION
──────────────────────────────────────────
Le Client peut résilier son abonnement à tout moment depuis son espace client, avec
effet à la fin de la période en cours. Aucun remboursement au prorata n'est accordé
pour les jours non utilisés, sauf disposition contraire applicable. Kompilot peut
résilier l'abonnement d'un Client en cas de violation grave des CGV, avec préavis de
48 h par email, ou immédiatement en cas de fraude avérée.

──────────────────────────────────────────
ARTICLE 7 — UTILISATION DE L'API ET DISCLAIMER IA
──────────────────────────────────────────
Le service Kompilot intègre des fonctionnalités d'intelligence artificielle (IA)
via des API tierces (OpenAI, Anthropic, etc.). Les analyses, recommandations et
alertes générées par l'IA sont fournies à titre indicatif uniquement et ne
constituent pas des avis professionnels (juridique, financier, sécurité). Kompilot
ne garantit ni l'exactitude, ni l'exhaustivité, ni l'adéquation des résultats IA
à une situation particulière. Le Client reste seul responsable des décisions prises
sur la base des informations fournies par la plateforme. L'utilisation abusive ou
automatisée de l'API de Kompilot sans autorisation écrite préalable est interdite
et peut entraîner la résiliation immédiate du compte.

──────────────────────────────────────────
ARTICLE 8 — RESPONSABILITÉ ET LIMITATIONS
──────────────────────────────────────────
La responsabilité de Kompilot est limitée au montant des sommes effectivement
versées par le Client durant les 12 mois précédant l'événement donnant lieu au
litige. Kompilot ne peut être tenu responsable des dommages indirects, pertes
d'exploitation ou de données résultant de l'utilisation ou de l'impossibilité
d'utiliser le service.

──────────────────────────────────────────
ARTICLE 9 — DONNÉES PERSONNELLES
──────────────────────────────────────────
Le traitement des données personnelles est régi par la Politique de Confidentialité
disponible sur https://kompilot.io/privacy. En souscrivant, le Client consent à
la collecte et au traitement de ses données aux fins de fourniture du service, de
facturation et de preuve légale du consentement (horodatage, adresse IP).

──────────────────────────────────────────
ARTICLE 10 — DROIT APPLICABLE ET LITIGES
──────────────────────────────────────────
Les présentes CGV sont soumises au droit français. Tout litige sera soumis, à défaut
de résolution amiable, à la compétence exclusive des tribunaux de Paris (France).
Pour les consommateurs au sens de la directive européenne 2013/11/UE, la plateforme
de règlement en ligne des litiges est accessible à : https://ec.europa.eu/consumers/odr.

Kompilot SAS — SIRET : 000 000 000 00000 — legal@kompilot.io
`;

// ---------------------------------------------------------------------------
// PDF download helper
// ---------------------------------------------------------------------------
function downloadCgvPdf() {
  const blob = new Blob([CGV_TEXT], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kompilot_CGV_${CGV_VERSION}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// CGV Modal
// ---------------------------------------------------------------------------
interface CgvModalProps {
  open: boolean;
  onClose: () => void;
  hasScrolled: boolean;
  onScrolled: () => void;
}

function CgvModal({ open, onClose, hasScrolled, onScrolled }: CgvModalProps) {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (hasScrolled) return;
    const el = e.currentTarget;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (isAtBottom) onScrolled();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal header */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <ScrollText size={16} className="text-primary shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Conditions Générales de Vente
              </h2>
              <p className="text-[10px] text-muted-foreground">{CGV_VERSION}</p>
            </div>
          </div>
          <button
            onClick={downloadCgvPdf}
            className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary/80 border border-primary/30 hover:border-primary/60 rounded-md px-2.5 py-1.5 transition-colors bg-primary/5 hover:bg-primary/10 shrink-0"
            type="button"
            aria-label="Télécharger les CGV"
          >
            <Download size={12} />
            Télécharger PDF
          </button>
        </div>

        {/* Scrollable body */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-6 py-5"
          onScroll={handleScroll}
        >
          <pre className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-foreground/80">
            {CGV_TEXT}
          </pre>
          {/* Bottom sentinel padding */}
          <div className="h-4" />
        </div>

        {/* Scroll gate banner */}
        <div
          className={[
            'shrink-0 border-t border-border transition-all duration-300',
            hasScrolled
              ? 'bg-green-500/10 border-green-500/30'
              : 'bg-amber-500/10 border-amber-500/30',
          ].join(' ')}
        >
          <p className={[
            'text-center text-[11px] py-2.5 px-4 font-medium transition-colors duration-300',
            hasScrolled ? 'text-green-600 dark:text-green-400' : 'text-amber-700 dark:text-amber-400',
          ].join(' ')}>
            {hasScrolled
              ? '✅ Lecture terminée — vous pouvez cocher la case CGV'
              : '📜 Faites défiler jusqu\'en bas pour activer la case à cocher'}
          </p>
        </div>

        {/* Modal footer */}
        <div className="shrink-0 flex justify-end gap-2 px-6 py-3 border-t border-border bg-background">
          <button
            onClick={onClose}
            type="button"
            className="text-[12px] font-medium px-4 py-2 rounded-md border border-border text-foreground/70 hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            Fermer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function LegalConsentBlock({ state, onChange, disabled, showTrialRenunciation }: LegalConsentBlockProps) {
  const [cgvModalOpen, setCgvModalOpen] = useState(false);
  const [hasScrolledCgv, setHasScrolledCgv] = useState(false);

  const cgvCheckboxDisabled = disabled || !hasScrolledCgv;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 px-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={13} className="text-primary shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Validation légale obligatoire
        </p>
      </div>

      {/* Checkbox 1 — CGV + Politique de confidentialité */}
      <div className="space-y-1">
        <label className={[
          'flex items-start gap-3 group',
          cgvCheckboxDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}>
          <input
            type="checkbox"
            checked={state.cgvAccepted}
            disabled={cgvCheckboxDisabled}
            onChange={e => onChange({ ...state, cgvAccepted: e.target.checked })}
            className="mt-0.5 w-4 h-4 shrink-0 accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-required="true"
          />
          <span className="text-[11px] text-foreground/80 leading-relaxed select-none">
            En cochant cette case, j'accepte les{' '}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setCgvModalOpen(true); }}
              className="underline text-primary hover:text-primary/80 font-semibold cursor-pointer bg-transparent border-none p-0 inline"
            >
              Conditions Générales de Vente (CGV)
            </button>{' '}
            et la{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="underline text-primary hover:text-primary/80 font-semibold"
            >
              Politique de Confidentialité
            </a>{' '}
            de Kompilot.
            <span className="ml-1 text-destructive font-bold" aria-hidden="true">*</span>
          </span>
        </label>

        {/* Scroll-gate hint */}
        {!hasScrolledCgv && (
          <p className="text-[10px] text-destructive/80 pl-7 leading-tight">
            👆 Lisez les CGV ci-dessus pour déverrouiller
          </p>
        )}
      </div>

      {/* Checkbox 2 — Renonciation droit de rétractation (SaaS B2B) */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={state.retractionWaived}
          disabled={disabled}
          onChange={e => onChange({ ...state, retractionWaived: e.target.checked })}
          className="mt-0.5 w-4 h-4 shrink-0 accent-primary cursor-pointer disabled:opacity-50"
          aria-required="true"
        />
        <span className="text-[11px] text-foreground/80 leading-relaxed select-none">
          J'autorise l'exécution immédiate du service numérique et je renonce
          expressément à mon droit de rétractation conformément à l'article L.221-28
          du Code de la consommation.
          <span className="ml-1 text-destructive font-bold" aria-hidden="true">*</span>
        </span>
      </label>

      {/* Checkbox 3 — Renonciation essai gratuit (optionnel, affiché seulement si showTrialRenunciation) */}
      {showTrialRenunciation && (
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={state.renouncedTrial ?? false}
            disabled={disabled}
            onChange={e => onChange({ ...state, renouncedTrial: e.target.checked })}
            className="mt-0.5 w-4 h-4 shrink-0 accent-amber-500 cursor-pointer disabled:opacity-50"
            aria-required="true"
          />
          <span className="text-[11px] text-foreground/80 leading-relaxed select-none">
            <strong className="text-amber-400">Accès immédiat :</strong> En validant mon abonnement aujourd'hui,
            j'accepte que mon accès complet commence immédiatement, je mets fin à ma période d'essai en cours
            et je renonce expressément à mon droit de rétractation.
            <span className="ml-1 text-destructive font-bold" aria-hidden="true">*</span>
          </span>
        </label>
      )}

      {/* Mention version CGV */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-border/40">
        <FileText size={10} className="text-muted-foreground/50 shrink-0" />
        <p className="text-[9px] text-muted-foreground/50">
          Version des CGV acceptées : {CGV_VERSION} · Ce consentement est enregistré
          avec horodatage et adresse IP à des fins de preuve légale (anti-chargeback).
        </p>
      </div>

      {/* CGV Modal */}
      <CgvModal
        open={cgvModalOpen}
        onClose={() => setCgvModalOpen(false)}
        hasScrolled={hasScrolledCgv}
        onScrolled={() => setHasScrolledCgv(true)}
      />
    </div>
  );
}

/** Returns true only when both checkboxes are ticked */
export function isLegalConsentValid(state: LegalConsentState): boolean {
  return state.cgvAccepted && state.retractionWaived;
}