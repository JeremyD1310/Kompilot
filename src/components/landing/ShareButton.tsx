import { Check, Copy, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface ShareButtonProps {
  title?: string;
  text?: string;
  className?: string;
}

export function ShareButton({
  title = 'Kompilot — Le cockpit IA pour votre présence locale',
  text = 'Découvrez Kompilot, le cockpit marketing pour les commerces et agences.',
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const url = typeof window === 'undefined' ? 'https://www.kompilot.fr/' : window.location.href;

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié dans le presse-papiers');
      window.setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      toast.error('Impossible de partager ce lien');
    }
  };

  return (
    <button type="button" onClick={share} className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-teal-300/50 hover:text-slate-100 active:scale-[.98] ${className}`} aria-label="Partager cette page">
      {copied ? <Check size={15} aria-hidden="true" /> : canShare ? <Share2 size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      {copied ? 'Lien copié' : 'Partager'}
    </button>
  );
}
