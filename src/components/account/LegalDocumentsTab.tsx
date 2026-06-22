/**
 * LegalDocumentsTab — Générateur de Documents Légaux par IA
 *
 * Génère les Mentions Légales et CGV conformes à la loi française
 * à partir des données de l'établissement actif (SIRET, secteur, ville).
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, toast } from '@blinkdotnew/ui';
import {
  FileText, Scale, Sparkles, Copy, Check, RefreshCw, Shield, AlertCircle,
} from 'lucide-react';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';
import { useEstablishment } from '../../context/EstablishmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type DocType = 'mentions_legales' | 'cgv';

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildMentionsLegalesPrompt(
  establishmentName: string,
  siret: string,
  sector: string,
  city: string,
): string {
  return `Tu es un juriste spécialisé TPE/PME française. Génère les Mentions Légales complètes conformes à la loi française pour cet établissement :
- Nom commercial : ${establishmentName}
- SIRET : ${siret || 'Non renseigné'}
- Secteur d'activité : ${sector}
- Ville : ${city}
Inclure : éditeur du site, hébergeur (Kompilot SaaS), directeur de publication, données personnelles (RGPD), cookies, propriété intellectuelle, droit applicable (loi française, tribunaux de ${city}).
Format : texte structuré avec titres en majuscules, paragraphes clairs, prêt à copier-coller sur un site web.`;
}

function buildCGVPrompt(
  establishmentName: string,
  siret: string,
  sector: string,
  city: string,
): string {
  return `Tu es un juriste spécialisé TPE/PME française. Génère les Conditions Générales de Vente (CGV) complètes et conformes à la loi française pour cet établissement :
- Nom commercial : ${establishmentName}
- SIRET : ${siret || 'Non renseigné'}
- Secteur d'activité : ${sector}
- Ville : ${city}
Inclure les spécificités sectorielles adaptées au secteur "${sector}" (ex : salon de coiffure, restaurant, médical, commerce de détail…).
Sections à couvrir : objet, prix et paiement, prestations/livraison, annulations/remboursements, responsabilité, protection des données (RGPD), résolution des litiges (loi française, tribunaux de ${city}).
Format : texte structuré avec titres en majuscules, articles numérotés, prêt à copier-coller.`;
}

// ── Info Panel ────────────────────────────────────────────────────────────────

function InfoPanel({
  name, siret, sector, city,
}: { name: string; siret: string; sector: string; city: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Données utilisées pour la génération
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        <div className="flex gap-1.5">
          <span className="text-muted-foreground shrink-0">Établissement :</span>
          <span className="font-medium text-foreground truncate">{name}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-muted-foreground shrink-0">SIRET :</span>
          <span className="font-medium text-foreground">{siret || <em className="text-muted-foreground font-normal">Non renseigné</em>}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-muted-foreground shrink-0">Secteur :</span>
          <span className="font-medium text-foreground">{sector}</span>
        </div>
        <div className="flex gap-1.5">
          <span className="text-muted-foreground shrink-0">Ville :</span>
          <span className="font-medium text-foreground">{city || <em className="text-muted-foreground font-normal">Non renseignée</em>}</span>
        </div>
      </div>
    </div>
  );
}

// ── Document Panel ────────────────────────────────────────────────────────────

function DocumentPanel({
  docType,
  establishmentName,
  siret,
  sector,
  city,
}: {
  docType: DocType;
  establishmentName: string;
  siret: string;
  sector: string;
  city: string;
}) {
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMentions = docType === 'mentions_legales';
  const label = isMentions ? 'Mentions Légales' : 'CGV';

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const prompt = isMentions
        ? buildMentionsLegalesPrompt(establishmentName, siret, sector, city)
        : buildCGVPrompt(establishmentName, siret, sector, city);

      const { text } = await blink.ai.generateText({
        prompt,
        model: 'gpt-4.1-mini',
        maxTokens: 1800,
        temperature: 0.3,
      });

      setGeneratedText(text ?? '');
    } catch {
      toast.error(`Impossible de générer les ${label}. Veuillez réessayer.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedText) return;
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast.success(`${label} copiées dans le presse-papier !`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Impossible de copier. Sélectionnez le texte manuellement.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Compliance badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="gap-1.5 text-xs text-emerald-700 border-emerald-200 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/30 rounded-full px-2.5 py-0.5">
          <Shield size={10} /> Conforme RGPD
        </Badge>
        <Badge variant="outline" className="gap-1.5 text-xs text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/30 rounded-full px-2.5 py-0.5">
          <Scale size={10} /> Loi française
        </Badge>
      </div>

      {/* Info about data used */}
      <InfoPanel name={establishmentName} siret={siret} sector={sector} city={city} />

      {/* Generate button (always visible) */}
      {!generatedText ? (
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full gap-2"
          size="default"
        >
          {isGenerating ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              L'IA rédige vos documents conformes…
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Générer les {label} avec l'IA
            </>
          )}
        </Button>
      ) : (
        /* Generated document area */
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <FileText size={11} /> Document généré — prêt à copier
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="gap-1.5 h-7 text-xs"
              >
                {isGenerating ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground/50 border-t-transparent" />
                ) : (
                  <RefreshCw size={11} />
                )}
                Régénérer
              </Button>
              <Button
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 h-7 text-xs"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copié !' : 'Copier'}
              </Button>
            </div>
          </div>

          <textarea
            readOnly
            value={generatedText}
            className="w-full h-64 rounded-xl border border-border bg-muted/20 p-3 text-xs text-foreground font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 select-all"
            aria-label={`Contenu des ${label}`}
          />

          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <AlertCircle size={10} className="shrink-0" />
            Document généré par IA à titre indicatif. Consultez un juriste pour valider les spécificités de votre activité.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LegalDocumentsTab() {
  const { user } = useAuth();
  const { activeEstablishment } = useEstablishment();
  const [activeDoc, setActiveDoc] = useState<DocType>('mentions_legales');
  const [localSiret, setLocalSiret] = useState('');

  const siret = activeEstablishment?.siret || localSiret;
  const city = activeEstablishment?.address?.split(',').pop()?.trim() || activeEstablishment?.address || '';
  const sector = activeEstablishment?.category || 'Commerce';
  const establishmentName = activeEstablishment?.name || 'Mon Établissement';

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scale size={14} className="text-primary" />
            </div>
            Générateur de Documents Légaux
          </CardTitle>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            Générez vos documents juridiques conformes à la loi française en quelques secondes grâce à l'IA. Documents personnalisés selon votre établissement et secteur d'activité.
          </p>
        </CardHeader>

        {/* SIRET fallback input */}
        {!activeEstablishment?.siret && (
          <CardContent className="pt-0 pb-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/20 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle size={11} /> SIRET non renseigné dans votre établissement
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-500">
                Saisissez-le temporairement pour l'inclure dans les documents (non sauvegardé).
              </p>
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="text"
                  value={localSiret}
                  onChange={e => setLocalSiret(e.target.value.replace(/\D/g, '').slice(0, 14))}
                  placeholder="12345678901234"
                  maxLength={14}
                  className="flex-1 rounded-lg border border-amber-200 dark:border-amber-700 bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                />
                <span className="text-xs text-muted-foreground">{localSiret.length}/14</span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Document type tabs */}
      <Card>
        <CardContent className="pt-5 space-y-5">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-lg bg-muted">
            <button
              onClick={() => setActiveDoc('mentions_legales')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                activeDoc === 'mentions_legales'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={13} />
              Mentions Légales
            </button>
            <button
              onClick={() => setActiveDoc('cgv')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                activeDoc === 'cgv'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Scale size={13} />
              CGV
            </button>
          </div>

          {/* Document panel */}
          <DocumentPanel
            key={activeDoc}
            docType={activeDoc}
            establishmentName={establishmentName}
            siret={siret}
            sector={sector}
            city={city}
          />
        </CardContent>
      </Card>
    </div>
  );
}
