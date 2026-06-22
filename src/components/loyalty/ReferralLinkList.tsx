/**
 * ReferralLinkList — displays all active referral links for the current establishment
 */
import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from '@blinkdotnew/ui';
import type { ReferralLink } from '../../hooks/useReferral';

interface Props {
  links: ReferralLink[];
  getReferralUrl: (code: string) => string;
}

export function ReferralLinkList({ links, getReferralUrl }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Lien copié !');
  };

  if (links.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center">
        <Share2 size={24} className="mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Aucun lien de parrainage créé</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          Dès qu'un client laisse un avis 4-5 ⭐, créez son lien unique en 1 clic ci-dessus.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-border">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Share2 size={14} className="text-primary" />
          Liens de parrainage actifs ({links.length})
        </h4>
      </div>
      <div className="divide-y divide-border">
        {links.slice(0, 10).map(link => {
          const url = getReferralUrl(link.shortCode);
          return (
            <div key={link.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                link.sponsorReviewRating === 5 ? 'bg-amber-500' : 'bg-amber-400'
              }`}>
                {link.sponsorName.substring(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{link.sponsorName}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{url}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {link.thankYouSent && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                    ✅ Envoyé
                  </span>
                )}
                {link.conversionCount > 0 && (
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                    {link.conversionCount} conv.
                  </span>
                )}
                <button onClick={() => handleCopy(url, link.id)}
                  className="w-7 h-7 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {copiedId === link.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
