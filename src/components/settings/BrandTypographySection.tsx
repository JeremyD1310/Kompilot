/**
 * BrandTypographySection — Agency white-label typography configuration.
 *
 * Allows agency accounts to define default fonts & styles for all their client
 * publications. These defaults are applied when the FloatingTypographyToolbar
 * is reset via the "Réinitialiser au style de la marque" button in CockpitPage.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast } from '@blinkdotnew/ui';
import { Type, Check, Bold, Italic, Underline, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useBrandSettings } from '../../context/BrandSettingsContext';
import {
  FONT_OPTIONS,
  DEFAULT_TEXT_STYLE,
  textStyleToCSS,
  type TextStyle,
  type FontFamilyId,
} from '../../lib/typographyStyles';

// ── Preview text ──────────────────────────────────────────────────────────────

const PREVIEW_TEXT =
  '✨ Nouvelle collection disponible ! Venez découvrir nos dernières créations en boutique. Réservez votre place dès maintenant 📅';

// ── Toggle button ─────────────────────────────────────────────────────────────

function StyleToggle({
  active, onClick, title, children,
}: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'w-9 h-9 flex items-center justify-center rounded-xl border transition-all',
        active
          ? 'bg-[#0D9488] border-[#0D9488] text-white shadow-sm'
          : 'border-border text-muted-foreground hover:border-[#0D9488]/40 hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BrandTypographySection() {
  const { brandTextStyle, setBrandTextStyle } = useBrandSettings();
  const [draft, setDraft]   = useState<TextStyle>(brandTextStyle);
  const [saved, setSaved]   = useState(false);

  const toggle = (key: 'bold' | 'italic' | 'underline') =>
    setDraft(prev => ({ ...prev, [key]: !prev[key] }));

  const setFont = (id: FontFamilyId) =>
    setDraft(prev => ({ ...prev, fontFamily: id }));

  const handleSave = () => {
    setBrandTextStyle(draft);
    setSaved(true);
    toast.success('Style typographique de la marque sauvegardé ✓', {
      description: 'Tous vos futurs posts partiront avec cette police par défaut.',
    });
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setDraft(DEFAULT_TEXT_STYLE);
  };

  const isDirty =
    draft.fontFamily !== brandTextStyle.fontFamily ||
    draft.bold       !== brandTextStyle.bold       ||
    draft.italic     !== brandTextStyle.italic     ||
    draft.underline  !== brandTextStyle.underline;

  const previewCSS = textStyleToCSS(draft);

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-[#0D9488] to-teal-300" />

      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Type size={14} className="text-primary" />
          </div>
          Police par défaut de la marque
          <Badge
            variant="outline"
            className="ml-auto text-[10px] border-violet-200 text-violet-600 bg-violet-50"
          >
            Agence White Label
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5 pb-5">
        {/* Explanation */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cette police sera appliquée par défaut dans la Creative Factory pour tous vos
          clients. Ils pourront la modifier manuellement, mais cliquer sur{' '}
          <strong>« Réinitialiser au style de la marque »</strong> ramenera toujours à ce réglage.
        </p>

        {/* Font family grid */}
        <div>
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2.5">
            Famille de polices
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FONT_OPTIONS.map(font => (
              <button
                key={font.id}
                type="button"
                onClick={() => setFont(font.id)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
                  draft.fontFamily === font.id
                    ? 'border-[#0D9488] bg-[#0D9488]/5 ring-1 ring-[#0D9488]/20'
                    : 'border-border hover:border-[#0D9488]/30 hover:bg-muted/40',
                )}
              >
                <span className="text-xl shrink-0">{font.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ fontFamily: font.cssFamily }}
                  >
                    {font.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{font.preview}</p>
                </div>
                {draft.fontFamily === font.id && (
                  <Check size={14} className="text-[#0D9488] shrink-0" strokeWidth={2.5} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Style toggles */}
        <div>
          <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2.5">
            Style par défaut
          </p>
          <div className="flex items-center gap-2">
            <StyleToggle active={draft.bold}      onClick={() => toggle('bold')}      title="Gras">
              <Bold size={15} strokeWidth={2.5} />
            </StyleToggle>
            <StyleToggle active={draft.italic}    onClick={() => toggle('italic')}    title="Italique">
              <Italic size={15} strokeWidth={2} />
            </StyleToggle>
            <StyleToggle active={draft.underline} onClick={() => toggle('underline')} title="Souligné">
              <Underline size={15} strokeWidth={2} />
            </StyleToggle>
            <span className="ml-3 text-[11px] text-muted-foreground">
              {[draft.bold && 'Gras', draft.italic && 'Italique', draft.underline && 'Souligné']
                .filter(Boolean).join(' · ') || 'Normal'}
            </span>
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Prévisualisation du texte de post
          </p>
          <p className="text-sm leading-relaxed text-foreground" style={previewCSS}>
            {PREVIEW_TEXT}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handleSave}
            disabled={!isDirty && !saved}
            className="gap-2 rounded-xl h-10 text-sm"
          >
            {saved
              ? <><Check size={14} /> Sauvegardé !</>
              : <><Save size={14} /> Sauvegarder comme style de marque</>}
          </Button>
          {isDirty && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-xs rounded-xl h-10 text-muted-foreground hover:text-foreground"
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
