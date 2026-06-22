/**
 * PitchGeneratorPanel — Générateur de scripts de prospection "Crush Acquisition"
 * Formule : "Découverte d'un angle mort + Solution Kompilot = Fin du pilotage au hasard"
 */
import { useState } from 'react';
import {
  Megaphone, Sparkles, Copy, Check, MessageSquare, Mail,
  Zap, ArrowRight, Store, ChevronDown, RefreshCw,
} from 'lucide-react';
import { SECTORS, formatPitch, PITCH_AI_SYSTEM, type Sector, type ExportFormat } from './pitchData';
import { PitchSendModal } from './PitchSendModal';
import { generateMarketingCopy } from '../../lib/aiRouterClient';

const FORMAT_TABS: { id: ExportFormat; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'story', label: 'Story / Post',   icon: Megaphone,     desc: 'Instagram, LinkedIn, Facebook' },
  { id: 'sms',   label: 'SMS',             icon: MessageSquare, desc: '160 car. · Prospection directe' },
  { id: 'email', label: 'Email',           icon: Mail,          desc: 'Avec objet et signature' },
];

export function PitchGeneratorPanel() {
  const [selectedSector, setSelectedSector] = useState<Sector>(SECTORS[0]);
  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [generating, setGenerating] = useState(false);
  const [pitch, setPitch] = useState<string>(SECTORS[0].defaultPitch);
  const [copied, setCopied] = useState(false);
  const [activeFormat, setActiveFormat] = useState<ExportFormat>('story');
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendFormat, setSendFormat] = useState<ExportFormat>('sms');
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSectorChange = (sectorId: string) => {
    const s = SECTORS.find(sec => sec.id === sectorId) ?? SECTORS[0];
    setSelectedSector(s);
    setPitch(s.defaultPitch);
    setAiError(null);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setAiError(null);
    const ctx = businessName ? ` pour "${businessName}"` : '';
    const cityCtx = city ? ` à ${city}` : '';
    const userPrompt = `Génère un script de prospection${ctx}${cityCtx} pour le secteur : ${selectedSector.label}.
Angle mort à révéler : ${selectedSector.blindSpot}.
Solution Kompilot : ${selectedSector.solution}.
Format : témoignage court (3-4 phrases) à la 1ère personne.
${businessName ? `Mentionne "${businessName}" naturellement.` : ''}
${city ? `Mentionne "${city}".` : ''}`;
    try {
      const res = await generateMarketingCopy(userPrompt, { system: PITCH_AI_SYSTEM });
      setPitch(res.content.trim());
    } catch {
      setAiError('Service IA momentanément indisponible — pitch par défaut affiché.');
      setPitch(selectedSector.defaultPitch);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formatPitch(pitch, activeFormat)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formattedPitch = formatPitch(pitch, activeFormat);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-primary/90 to-teal-600 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Megaphone size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white">Générateur de Pitchs de Conversion</h2>
            <p className="text-white/80 text-xs mt-0.5">Scripts prêts à envoyer — formule "Angle mort → Kompilot → Résultat"</p>
          </div>
        </div>
        {/* Formula badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
          {['🔍 Découverte de l\'angle mort', '→', '🤖 Solution automatisée', '→', '🎯 Fin du pilotage au hasard'].map((item, i) =>
            item === '→' ? (
              <span key={i} className="text-white/60 font-bold">{item}</span>
            ) : (
              <span key={i} className="flex items-center gap-1 font-bold bg-white/20 text-white rounded-full px-2.5 py-1">{item}</span>
            )
          )}
        </div>
      </div>

      {/* ── Config ── */}
      <div className="px-6 py-5 border-b border-border space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Sector */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">Secteur d'activité</label>
            <div className="relative">
              <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <select
                value={selectedSector.id}
                onChange={e => handleSectorChange(e.target.value)}
                className="w-full appearance-none pl-8 pr-8 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
              >
                {SECTORS.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          {/* Business name */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">Nom du commerce <span className="text-muted-foreground font-normal">(optionnel)</span></label>
            <input type="text" placeholder="Ex : Le Bistrot du Port" value={businessName} onChange={e => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          {/* City */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">Ville <span className="text-muted-foreground font-normal">(optionnel)</span></label>
            <input type="text" placeholder="Ex : Bordeaux" value={city} onChange={e => setCity(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold px-5 py-2.5 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-70">
          {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Génération en cours…' : 'Générer un pitch avec l\'IA'}
        </button>
        {aiError && <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">⚠️ {aiError}</p>}
      </div>

      {/* ── Output ── */}
      <div className="px-6 py-5 space-y-4">
        {/* Format tabs */}
        <div className="flex gap-2 flex-wrap">
          {FORMAT_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveFormat(tab.id)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  activeFormat === tab.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}>
                <Icon size={12} /> {tab.label}
                <span className={`text-[10px] font-normal ${activeFormat === tab.id ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                  · {tab.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pitch output box */}
        <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-teal-500/5 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{selectedSector.emoji}</span>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wide">Script {selectedSector.label}</span>
            <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5 ml-auto">
              {activeFormat === 'sms' ? `${formattedPitch.length} car.` : activeFormat === 'email' ? 'Email complet' : 'Post social'}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-medium">{formattedPitch}</div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleCopy}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
              copied ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-background border-border text-foreground hover:border-primary/40 hover:bg-primary/5'
            }`}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copié !' : 'Copier le texte'}
          </button>
          <button onClick={() => { setSendFormat('sms'); setShowSendModal(true); }}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-2.5 text-sm font-bold hover:bg-emerald-100 transition-colors">
            <MessageSquare size={14} /> Envoyer en SMS test
          </button>
          <button onClick={() => { setSendFormat('email'); setShowSendModal(true); }}
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2.5 text-sm font-bold hover:bg-blue-100 transition-colors">
            <Mail size={14} /> Envoyer en Email test
          </button>
        </div>

        {/* Tips */}
        <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-2">
          <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5"><Zap size={12} className="text-primary" /> Conseils d'envoi</p>
          <ul className="space-y-1.5">
            {[
              'Personnalisez avec le nom réel du prospect avant d\'envoyer',
              'Le format SMS est idéal pour un 1er contact froid — taux d\'ouverture 98%',
              'Pour l\'email : attendez 48h puis relancez avec une démo vidéo de 60 secondes',
              'Après la réponse positive : envoyez le lien d\'essai Kompilot',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <ArrowRight size={10} className="text-primary shrink-0 mt-0.5" /> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showSendModal && (
        <PitchSendModal
          pitch={formatPitch(pitch, sendFormat)}
          format={sendFormat}
          onClose={() => setShowSendModal(false)}
        />
      )}
    </div>
  );
}
