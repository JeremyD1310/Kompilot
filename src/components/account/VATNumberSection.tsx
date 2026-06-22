/**
 * VATNumberSection — Numéro TVA Intracommunautaire field with VIES validation.
 *
 * - Validates against VIES via /api/billing/vat/validate
 * - Shows reverse-charge badge (autoliquidation 0%) if applicable
 * - Persists VAT number to Stripe + user metadata via backend
 * - Shows saved VAT number on load via /api/billing/vat
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast } from '@blinkdotnew/ui';
import {
  Building2, Loader2, CheckCircle2, XCircle, Trash2, Info, ExternalLink,
} from 'lucide-react';
import { blink } from '../../blink/client';

const BACKEND = 'https://gbrhsehk.backend.blink.new';

interface VatInfo {
  vatNumber:     string | null;
  vatCountry:    string | null;
  reverseCharge: boolean;
  verifiedAt:    string | null;
}

interface ValidateResult {
  valid:         boolean;
  vatNumber:     string;
  countryCode:   string;
  name?:         string | null;
  address?:      string | null;
  reverseCharge: boolean;
  stripeVerified?: boolean;
  isEU:          boolean;
  message:       string;
  error?:        string;
}

// ── EU flag helper ─────────────────────────────────────────────────────────────

const EU_FLAGS: Record<string, string> = {
  AT:'🇦🇹', BE:'🇧🇪', BG:'🇧🇬', CY:'🇨🇾', CZ:'🇨🇿', DE:'🇩🇪', DK:'🇩🇰',
  EE:'🇪🇪', ES:'🇪🇸', FI:'🇫🇮', FR:'🇫🇷', GR:'🇬🇷', HR:'🇭🇷', HU:'🇭🇺',
  IE:'🇮🇪', IT:'🇮🇹', LT:'🇱🇹', LU:'🇱🇺', LV:'🇱🇻', MT:'🇲🇹', NL:'🇳🇱',
  PL:'🇵🇱', PT:'🇵🇹', RO:'🇷🇴', SE:'🇸🇪', SI:'🇸🇮', SK:'🇸🇰',
};

function countryFlag(code: string): string {
  return EU_FLAGS[code.toUpperCase()] ?? '🇪🇺';
}

// ── Main component ─────────────────────────────────────────────────────────────

export function VATNumberSection() {
  const [vatInput,   setVatInput]   = useState('');
  const [saved,      setSaved]      = useState<VatInfo | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [removing,   setRemoving]   = useState(false);
  const [result,     setResult]     = useState<ValidateResult | null>(null);

  // Load existing VAT info on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await blink.auth.getValidToken();
        const res   = await fetch(`${BACKEND}/api/billing/vat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: VatInfo = await res.json();
          setSaved(data);
          if (data.vatNumber) setVatInput(data.vatNumber);
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleValidate = async () => {
    const trimmed = vatInput.trim().toUpperCase().replace(/\s+/g, '');
    if (!trimmed || trimmed.length < 6) {
      toast.error('Numéro TVA invalide', { description: 'Saisissez un numéro complet (ex: FR12345678901).' });
      return;
    }

    setValidating(true);
    setResult(null);
    try {
      const token = await blink.auth.getValidToken();
      const res   = await fetch(`${BACKEND}/api/billing/vat/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ vatNumber: trimmed }),
      });
      const data: ValidateResult = await res.json();
      setResult(data);

      if (data.valid) {
        setSaved({
          vatNumber:     data.vatNumber,
          vatCountry:    data.countryCode,
          reverseCharge: data.reverseCharge,
          verifiedAt:    new Date().toISOString(),
        });
        if (data.reverseCharge) {
          toast.success('Autoliquidation activée — TVA 0 % ✓', {
            description: 'Votre numéro UE est valide. Aucune TVA ne vous sera facturée.',
          });
        } else {
          toast.success('Numéro TVA validé ✓', { description: data.message });
        }
      } else {
        toast.error('Numéro non trouvé dans VIES', { description: data.message || data.error });
      }
    } catch {
      toast.error('Erreur de validation', { description: 'Vérifiez votre connexion.' });
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const token = await blink.auth.getValidToken();
      const res   = await fetch(`${BACKEND}/api/billing/vat`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSaved(null);
        setResult(null);
        setVatInput('');
        toast.success('Numéro TVA supprimé');
      }
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border-border animate-pulse">
        <CardContent className="py-4 px-5 h-24" />
      </Card>
    );
  }

  const isVerified  = !!saved?.vatNumber;
  const isReverse   = saved?.reverseCharge === true;

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm overflow-hidden">
      <div className={`h-1 w-full bg-gradient-to-r ${isReverse ? 'from-violet-500 to-purple-400' : 'from-[#0D9488] to-teal-300'}`} />

      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 size={14} className="text-primary" />
          </div>
          Numéro TVA Intracommunautaire
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">Optionnel — B2B UE</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {/* Explanation */}
        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-200 px-3.5 py-3">
          <Info size={13} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-800 leading-relaxed">
            Si votre entreprise est domiciliée dans l'UE (hors France), renseignez votre numéro de TVA
            intracommunautaire. Si valide, l'<strong>autoliquidation</strong> s'applique et vous ne payez
            plus la TVA française (règle du reverse-charge B2B).
          </p>
        </div>

        {/* Current saved state */}
        {isVerified && (
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
            isReverse
              ? 'bg-violet-50 border-violet-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <CheckCircle2 size={15} className={isReverse ? 'text-violet-600 shrink-0' : 'text-green-600 shrink-0'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold font-mono text-foreground">{saved!.vatNumber}</span>
                <span className="text-base">{countryFlag(saved!.vatCountry ?? '')}</span>
                {isReverse ? (
                  <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200 font-bold">
                    Autoliquidation — TVA 0 %
                  </Badge>
                ) : (
                  <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">
                    Vérifié VIES
                  </Badge>
                )}
              </div>
              {saved?.verifiedAt && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Vérifié le {new Date(saved.verifiedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </Button>
          </div>
        )}

        {/* Input + validate */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={vatInput}
              onChange={e => { setVatInput(e.target.value.toUpperCase()); setResult(null); }}
              placeholder="FR12345678901"
              className="w-full h-10 rounded-xl border border-border bg-background px-3.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 transition-all"
            />
          </div>
          <Button
            onClick={handleValidate}
            disabled={validating || !vatInput.trim()}
            className="h-10 px-4 rounded-xl text-sm gap-1.5 shrink-0"
          >
            {validating
              ? <><Loader2 size={13} className="animate-spin" /> Vérification…</>
              : 'Valider'}
          </Button>
        </div>

        {/* Validation result */}
        {result && !result.valid && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5">
            <XCircle size={13} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-800">Numéro introuvable dans VIES</p>
              <p className="text-[11px] text-red-700 mt-0.5 leading-relaxed">
                {result.message ?? result.error}
                {' '}
                <a
                  href="https://ec.europa.eu/taxation_customs/vies/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-0.5"
                >
                  Vérifier sur VIES <ExternalLink size={10} />
                </a>
              </p>
            </div>
          </div>
        )}

        {result?.valid && result.name && (
          <div className="rounded-xl bg-muted/30 border border-border px-3.5 py-2.5">
            <p className="text-xs font-semibold text-foreground">{result.name}</p>
            {result.address && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{result.address}</p>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground/60 text-center">
          Validation VIES — Commission Européenne · Données transmises à Stripe pour conformité fiscale
        </p>
      </CardContent>
    </Card>
  );
}
