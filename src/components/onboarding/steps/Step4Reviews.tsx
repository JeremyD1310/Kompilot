import { MapPin, FileText, Star, Sparkles } from 'lucide-react';

export function Step4Reviews() {
  return (
    <div className="space-y-4">
      {/* Google Maps review card */}
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
            <MapPin size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground mb-0.5">Fiche Google Maps</p>
            <div className="flex items-center gap-1 mb-1.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
              ))}
              <span className="text-[11px] font-bold text-foreground ml-1">4.8</span>
              <span className="text-[11px] text-muted-foreground">(127 avis)</span>
            </div>
            <div className="text-[11px] text-muted-foreground bg-background rounded-lg px-2.5 py-2 border border-border/60 italic">
              «&nbsp;Accueil chaleureux, plats délicieux. Je recommande vivement !&nbsp;»
              <span className="block text-[10px] not-italic text-muted-foreground/60 mt-0.5">– Marie L., il y a 2 jours</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">✓ Répondu</span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">📤 Demande envoyée</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Article preview */}
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0 shadow-md shadow-orange-200">
            <FileText size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold text-foreground">Article SEO Local</p>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 rounded-full px-1.5 py-0.5">🔍 Optimisé Google</span>
            </div>
            <p className="text-[11px] font-semibold text-foreground leading-tight">
              «&nbsp;Les 5 meilleurs restaurants du 11e arrondissement de Paris en 2025&nbsp;»
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[10px] text-muted-foreground">📍 Paris 11e</span>
              <span className="text-[10px] text-muted-foreground">⏱️ 4 min de lecture</span>
              <span className="text-[10px] font-bold text-orange-600">🚀 +340 vues/mois</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl bg-amber-50 border border-amber-200/60 px-3 py-2.5">
        <Sparkles size={16} className="text-amber-600 shrink-0" />
        <p className="text-xs text-amber-700">
          <strong>Messagerie unique :</strong> Répondez à tous vos avis Google Maps directement depuis Kompilot — sans ouvrir Google Business.
        </p>
      </div>
    </div>
  );
}
