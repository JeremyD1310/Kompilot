/**
 * GoogleMapsListingPage — Manage your Google Business Profile listing.
 * Tabs: Fiche · Infos · Photos · Horaires · Q&R · Avis
 */
import { useState } from 'react';
import { useEstablishment } from '../context/EstablishmentContext';
import { toast } from '@blinkdotnew/ui';
import { FlashTutorialButton } from '../components/shared/FlashTutorialButton';
import { BusinessProfileEditor } from '../components/gmaps/BusinessProfileEditor';
import { ReviewsManager } from '../components/gmaps/ReviewsManager';
import { LocalVisibilityWidget, buildDemoVisibilityData } from '../components/gmaps/LocalVisibilityWidget';
import { MilestoneThresholdsPanel } from '../components/gmaps/MilestoneThresholdsPanel';
import { usePerformanceMilestones } from '../hooks/usePerformanceMilestones';
import {
  MapPin, Star, Camera, Clock, MessageSquare, CheckCircle2, AlertCircle,
  RefreshCw, Edit2, Plus, Sparkles, ExternalLink, Phone, Globe,
  TrendingUp, Eye, MousePointerClick, Navigation2, X, Building2, SlidersHorizontal,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface HoursEntry { open: string; close: string; closed: boolean }
type DayKey = 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche';

const DEFAULT_HOURS: Record<DayKey, HoursEntry> = {
  lundi:    { open: '09:00', close: '19:00', closed: false },
  mardi:    { open: '09:00', close: '19:00', closed: false },
  mercredi: { open: '09:00', close: '19:00', closed: false },
  jeudi:    { open: '09:00', close: '19:00', closed: false },
  vendredi: { open: '09:00', close: '20:00', closed: false },
  samedi:   { open: '10:00', close: '18:00', closed: false },
  dimanche: { open: '10:00', close: '13:00', closed: true  },
};

const DAYS: DayKey[] = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const MOCK_REVIEWS = [
  { id: 'r1', author: 'Marie L.', rating: 5, date: 'Il y a 2 jours', text: 'Excellent service ! L\'équipe est très professionnelle et à l\'écoute. Je recommande vivement.', replied: false },
  { id: 'r2', author: 'Thomas D.', rating: 4, date: 'Il y a 1 semaine', text: 'Très bonne expérience, rapport qualité/prix excellent. Je reviendrai.', replied: true, reply: 'Merci Thomas pour votre fidélité ! À très bientôt 😊' },
  { id: 'r3', author: 'Sophie M.', rating: 5, date: 'Il y a 2 semaines', text: 'Je suis ravie de mon passage. Ambiance agréable, prestations de qualité.', replied: false },
  { id: 'r4', author: 'Jean-Pierre B.', rating: 3, date: 'Il y a 1 mois', text: 'Correct mais le temps d\'attente était un peu long.', replied: false },
];

const MOCK_QA = [
  { id: 'q1', question: 'Acceptez-vous les cartes bancaires ?', answer: 'Oui, nous acceptons toutes les cartes bancaires ainsi que les paiements sans contact.', answered: true },
  { id: 'q2', question: 'Est-ce qu\'il y a un parking à proximité ?', answer: null, answered: false },
  { id: 'q3', question: 'Faut-il prendre rendez-vous ?', answer: 'Oui, nous recommandons de prendre rendez-vous en ligne pour garantir votre créneau.', answered: true },
];

const MOCK_PHOTOS = [
  { id: 'p1', category: 'Couverture', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop', label: 'Photo de couverture' },
  { id: 'p2', category: 'Intérieur', url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=crop', label: 'Salle principale' },
  { id: 'p3', category: 'Équipe', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&h=200&fit=crop', label: 'Notre équipe' },
  { id: 'p4', category: 'Produits', url: 'https://images.unsplash.com/photo-1559599101-f09722fb4948?w=300&h=200&fit=crop', label: 'Nos services' },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} className={i <= value ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'} />
      ))}
    </div>
  );
}

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color }}>{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ── Fiche tab ────────────────────────────────────────────────────────────────

function FicheTab({ establishment }: { establishment: ReturnType<typeof useEstablishment>['activeEstablishment'] }) {
  const [editing, setEditing] = useState(false);
  const [desc, setDesc] = useState(establishment?.description || 'Salon de coiffure haut de gamme au cœur de la ville. Spécialisés en colorations, lissages et soins capillaires. Prenez rendez-vous en ligne !');
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const handleGenerateDesc = async () => {
    setGeneratingDesc(true);
    await new Promise(r => setTimeout(r, 1200));
    setDesc(`${establishment?.name || 'Votre établissement'} — ${establishment?.activity || 'votre commerce'} de référence à ${establishment?.city || 'votre ville'}. Notre équipe passionnée vous accueille dans un cadre chaleureux pour des prestations haut de gamme. Spécialisés dans les tendances actuelles, nous garantissons un résultat à la hauteur de vos attentes. Réservez facilement en ligne !`);
    setGeneratingDesc(false);
    toast.success('Description générée par l\'IA ✨');
  };

  const completionItems = [
    { label: 'Nom & catégorie',   done: true  },
    { label: 'Adresse vérifiée',  done: true  },
    { label: 'Téléphone',         done: !!establishment?.phone },
    { label: 'Site web',          done: !!establishment?.website },
    { label: 'Description',       done: desc.length > 50 },
    { label: 'Photos (≥ 5)',      done: MOCK_PHOTOS.length >= 5 },
    { label: 'Horaires complets', done: true  },
    { label: 'Lien réservation',  done: !!establishment?.bookingUrl },
  ];
  const completedCount = completionItems.filter(i => i.done).length;
  const completionPct  = Math.round((completedCount / completionItems.length) * 100);

  return (
    <div className="space-y-5">
      {/* Completion score */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white font-extrabold text-lg ${completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
            {completionPct}%
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">Score de complétude de votre fiche Google</p>
            <p className="text-xs text-muted-foreground">{completedCount}/{completionItems.length} éléments complétés — {completionPct < 80 ? 'une fiche incomplète réduit votre visibilité locale' : 'excellente fiche — vous êtes bien référencé !'}</p>
            <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${completionPct}%`, backgroundColor: completionPct >= 80 ? '#10b981' : completionPct >= 50 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {completionItems.map(item => (
            <div key={item.label} className="flex items-center gap-2 px-4 py-3">
              {item.done
                ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                : <AlertCircle size={14} className="text-amber-500 shrink-0" />
              }
              <span className="text-xs text-foreground/80">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Stats from Google */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <Eye size={14} />,               label: 'Vues / mois',        value: '1 247',  color: 'text-violet-600' },
          { icon: <MousePointerClick size={14} />, label: 'Clics / site web',   value: '89',     color: 'text-blue-600' },
          { icon: <Navigation2 size={14} />,       label: 'Itinéraires',        value: '34',     color: 'text-teal-600' },
          { icon: <Phone size={14} />,             label: 'Appels téléphone',   value: '22',     color: 'text-emerald-600' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl px-4 py-3 space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">{k.icon}<span className="text-[10px] font-bold uppercase tracking-wide">{k.label}</span></div>
            <p className={`text-2xl font-extrabold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground">↑ ce mois-ci</p>
          </div>
        ))}
      </div>

      {/* Health scores */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-foreground">Analyse de santé de la fiche</p>
        <div className="space-y-3">
          <ScoreGauge score={88} label="Pertinence sémantique" color="#7c3aed" />
          <ScoreGauge score={72} label="Fraîcheur des avis (30 jours)" color="#f59e0b" />
          <ScoreGauge score={completionPct} label="Complétude de la fiche" color="#10b981" />
          <ScoreGauge score={65} label="Engagement photos" color="#0d9488" />
        </div>
      </div>

      {/* Description editor */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-foreground flex items-center gap-2"><Edit2 size={14} /> Description Google Business</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDesc}
              disabled={generatingDesc}
              className="flex items-center gap-1.5 text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-1.5 hover:bg-violet-100 transition-colors disabled:opacity-50"
            >
              {generatingDesc ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {generatingDesc ? 'Génération…' : 'Générer avec IA ✨'}
            </button>
            <button
              onClick={() => setEditing(!editing)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-lg px-3 py-1.5 transition-colors"
            >
              <Edit2 size={11} /> {editing ? 'Fermer' : 'Modifier'}
            </button>
          </div>
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[100px] resize-none"
              maxLength={750}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{desc.length}/750 caractères</span>
              <button
                onClick={() => { setEditing(false); toast.success('Description mise à jour !'); }}
                className="text-xs font-bold bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/80 leading-relaxed">{desc}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => window.open('https://business.google.com', '_blank')}
          className="flex items-center gap-2 text-xs font-semibold bg-card border border-border rounded-xl px-4 py-2.5 hover:bg-muted transition-colors"
        >
          <ExternalLink size={13} /> Ouvrir Google Business Profile
        </button>
        <button
          onClick={() => toast.success('Synchronisation lancée…')}
          className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 hover:bg-primary/15 transition-colors"
        >
          <RefreshCw size={13} /> Synchroniser la fiche
        </button>
      </div>
    </div>
  );
}

// ── Photos tab ───────────────────────────────────────────────────────────────

function PhotosTab() {
  const [photos, setPhotos] = useState(MOCK_PHOTOS);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);
    await new Promise(r => setTimeout(r, 900));
    setUploading(false);
    toast.success('Photo ajoutée à votre fiche Google !');
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Photos total', value: photos.length.toString(), color: 'text-violet-600' },
          { label: 'Vues ce mois', value: '2 148', color: 'text-blue-600' },
          { label: 'Catégories', value: '4', color: 'text-teal-600' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upload zone */}
      <div
        onClick={handleUpload}
        className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
      >
        {uploading ? (
          <RefreshCw size={24} className="animate-spin text-primary mx-auto mb-2" />
        ) : (
          <Camera size={24} className="text-muted-foreground mx-auto mb-2" />
        )}
        <p className="text-sm font-semibold text-foreground">{uploading ? 'Ajout en cours…' : 'Ajouter une photo'}</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG — max 5 Mo · Recommandé : 1200×900 px</p>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {photos.map(photo => (
          <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-border">
            <img src={photo.url} alt={photo.label} className="w-full h-32 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <button
                onClick={() => { setPhotos(prev => prev.filter(p => p.id !== photo.id)); toast.success('Photo supprimée'); }}
                className="p-1.5 rounded-full bg-red-500 text-white"
              >
                <X size={12} />
              </button>
            </div>
            <div className="px-2 py-1.5 border-t border-border bg-background">
              <p className="text-[10px] font-bold text-foreground truncate">{photo.label}</p>
              <p className="text-[9px] text-muted-foreground">{photo.category}</p>
            </div>
          </div>
        ))}
        <button
          onClick={handleUpload}
          className="rounded-xl border-2 border-dashed border-border h-[160px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
        >
          <Plus size={20} />
          <span className="text-xs font-semibold">Ajouter</span>
        </button>
      </div>

      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 px-4 py-3">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          💡 <strong>Conseil IA :</strong> Les fiches Google avec 10+ photos reçoivent en moyenne <strong>42% de clics supplémentaires</strong>. Ajoutez des photos de votre intérieur, équipe et réalisations.
        </p>
      </div>
    </div>
  );
}

// ── Hours tab ────────────────────────────────────────────────────────────────

function HoursTab() {
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Horaires mis à jour sur Google Business !');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Clock size={15} className="text-primary" />
          <p className="text-sm font-bold text-foreground">Heures d'ouverture</p>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 ml-auto">Synchronisé avec Google</span>
        </div>
        <div className="divide-y divide-border">
          {DAYS.map(day => {
            const h = hours[day];
            return (
              <div key={day} className="flex items-center gap-3 px-5 py-3">
                <span className="w-24 text-sm font-semibold text-foreground capitalize">{day}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!h.closed}
                    onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !e.target.checked } }))}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span className="text-xs text-muted-foreground">{h.closed ? 'Fermé' : 'Ouvert'}</span>
                </label>
                {!h.closed && (
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="time"
                      value={h.open}
                      onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <span className="text-xs text-muted-foreground">→</span>
                    <input
                      type="time"
                      value={h.close}
                      onChange={e => setHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                )}
                {h.closed && <span className="ml-auto text-xs text-muted-foreground italic">—</span>}
              </div>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-border flex gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 text-sm font-bold bg-primary text-primary-foreground rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity shadow-sm"
          >
            {saved ? <CheckCircle2 size={14} /> : <RefreshCw size={14} />}
            {saved ? 'Enregistré !' : 'Mettre à jour sur Google'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Q&A tab ──────────────────────────────────────────────────────────────────

function QATab() {
  const [qas, setQas] = useState(MOCK_QA);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);

  const handleGenerateAnswer = async (id: string, question: string) => {
    setGenerating(id);
    await new Promise(r => setTimeout(r, 1000));
    setAnswerDraft(prev => ({
      ...prev,
      [id]: `Bonjour ! Merci pour votre question. ${question.includes('parking') ? 'Oui, un parking gratuit est disponible à 200m de notre établissement. Nous vous souhaitons une bonne visite !' : 'Absolument ! N\'hésitez pas à nous contacter pour plus d\'informations. À très bientôt !'}`
    }));
    setGenerating(null);
  };

  const handlePublish = (id: string, answer: string) => {
    setQas(prev => prev.map(q => q.id === id ? { ...q, answer, answered: true } : q));
    setAnswerDraft(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast.success('Réponse publiée sur Google !');
  };

  return (
    <div className="space-y-4">
      {qas.map(qa => (
        <div key={qa.id} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-start gap-2">
              <MessageSquare size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-foreground">{qa.question}</p>
              {!qa.answered && (
                <span className="ml-auto shrink-0 text-[9px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">Sans réponse</span>
              )}
            </div>
            {qa.answered && qa.answer && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 px-4 py-3">
                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1">✅ Votre réponse :</p>
                <p className="text-sm text-foreground/80">{qa.answer}</p>
              </div>
            )}
            {!qa.answered && (
              <div className="space-y-2">
                <textarea
                  value={answerDraft[qa.id] || ''}
                  onChange={e => setAnswerDraft(prev => ({ ...prev, [qa.id]: e.target.value }))}
                  placeholder="Rédigez votre réponse…"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateAnswer(qa.id, qa.question)}
                    disabled={generating === qa.id}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-1.5 hover:bg-violet-100 transition-colors disabled:opacity-50"
                  >
                    {generating === qa.id ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {generating === qa.id ? 'Génération…' : 'Répondre avec IA ✨'}
                  </button>
                  {answerDraft[qa.id] && (
                    <button
                      onClick={() => handlePublish(qa.id, answerDraft[qa.id])}
                      className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
                    >
                      <CheckCircle2 size={11} /> Publier sur Google
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Reviews tab ──────────────────────────────────────────────────────────────

function ReviewsTab() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState<string | null>(null);

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  const handleGenerateReply = async (id: string, reviewText: string) => {
    setGenerating(id);
    await new Promise(r => setTimeout(r, 1000));
    setReplyDraft(prev => ({
      ...prev,
      [id]: `Merci infiniment pour ce retour si positif ! 😊 C'est avec beaucoup de plaisir que nous vous avons accueilli et nous sommes ravis que la prestation ait répondu à vos attentes. Nous espérons vous revoir très prochainement ! 🌟`
    }));
    setGenerating(null);
  };

  const handlePublishReply = (id: string) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, replied: true, reply: replyDraft[id] } : r));
    setReplyDraft(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast.success('Réponse publiée sur Google Maps !');
  };

  return (
    <div className="space-y-5">
      {/* Rating summary */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-4xl font-extrabold text-foreground tabular-nums">{avgRating.toFixed(1)}</p>
            <StarRating value={Math.round(avgRating)} />
            <p className="text-[11px] text-muted-foreground mt-1">{reviews.length} avis Google</p>
          </div>
          <div className="flex-1 min-w-[180px] space-y-1.5">
            {[5,4,3,2,1].map(n => {
              const count = reviews.filter(r => r.rating === n).length;
              const pct = (count / reviews.length) * 100;
              return (
                <div key={n} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-4 text-right">{n}</span>
                  <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-4">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className={`text-[11px] font-bold rounded-full px-3 py-1.5 border ${avgRating >= 4.5 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : avgRating >= 4 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
              {avgRating >= 4.5 ? '🏆 Excellent' : avgRating >= 4 ? '👍 Bien noté' : '⚠️ À améliorer'}
            </span>
            <span className="text-[10px] text-muted-foreground text-center">Taux réponse : {Math.round((reviews.filter(r=>r.replied).length/reviews.length)*100)}%</span>
          </div>
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {reviews.map(review => (
          <div key={review.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-teal-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {review.author[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-foreground">{review.author}</p>
                  <StarRating value={review.rating} />
                  <span className="text-[10px] text-muted-foreground">{review.date}</span>
                </div>
                <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{review.text}</p>
              </div>
            </div>
            {review.replied && review.reply && (
              <div className="ml-12 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-[11px] font-bold text-primary mb-1">Votre réponse :</p>
                <p className="text-xs text-foreground/80">{review.reply}</p>
              </div>
            )}
            {!review.replied && (
              <div className="ml-12 space-y-2">
                <textarea
                  value={replyDraft[review.id] || ''}
                  onChange={e => setReplyDraft(prev => ({ ...prev, [review.id]: e.target.value }))}
                  placeholder="Répondre à cet avis…"
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[70px] resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerateReply(review.id, review.text)}
                    disabled={generating === review.id}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-1.5 hover:bg-violet-100 transition-colors disabled:opacity-50"
                  >
                    {generating === review.id ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                    {generating === review.id ? 'Génération…' : 'Répondre avec IA ✨'}
                  </button>
                  {replyDraft[review.id] && (
                    <button
                      onClick={() => handlePublishReply(review.id)}
                      className="flex items-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:opacity-90"
                    >
                      <CheckCircle2 size={11} /> Publier
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'fiche' | 'infos' | 'photos' | 'horaires' | 'qa' | 'reviews' | 'settings';

export default function GoogleMapsListingPage() {
  const { activeEstablishment } = useEstablishment();
  const [tab, setTab] = useState<Tab>('fiche');

  // Build visibility data from establishment (demo values)
  const visibilityData = buildDemoVisibilityData(
    '2025-01',
    activeEstablishment?.activity ?? 'commerce',
    activeEstablishment?.city ?? 'votre ville',
  );

  // Fire milestone celebration notifications
  usePerformanceMilestones(visibilityData);

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'fiche',    label: 'Aperçu',      icon: <MapPin size={14} /> },
    { id: 'infos',    label: 'Infos',        icon: <Building2 size={14} /> },
    { id: 'photos',   label: 'Photos',       icon: <Camera size={14} />, badge: `${MOCK_PHOTOS.length}` },
    { id: 'horaires', label: 'Horaires',     icon: <Clock size={14} /> },
    { id: 'qa',       label: 'Q & R',        icon: <MessageSquare size={14} />, badge: `${MOCK_QA.filter(q=>!q.answered).length} sans réponse` },
    { id: 'reviews',  label: 'Avis Google',  icon: <Star size={14} />, badge: `${MOCK_REVIEWS.filter(r=>!r.replied).length} sans réponse` },
    { id: 'settings', label: 'Seuils IA',    icon: <SlidersHorizontal size={14} /> },
  ];

  return (
    <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-[#EA4335] flex items-center justify-center shrink-0">
          <MapPin size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-extrabold text-foreground leading-tight">Fiche Google Maps 📍</h1>
          <p className="text-sm text-muted-foreground">Gérez et optimisez votre présence Google Business Profile depuis Kompilot.</p>
          <FlashTutorialButton featureKey="geo" className="mt-0.5" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Fiche active
          </span>
          <button
            onClick={() => window.open('https://business.google.com', '_blank')}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 hover:bg-muted rounded-xl px-3 py-2 transition-colors"
          >
            <ExternalLink size={12} /> Google Business
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-border pb-3">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t.icon}
            {t.label}
            {t.badge && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                tab === t.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Visibility widget — always visible on the Aperçu tab */}
      {tab === 'fiche' && (
        <LocalVisibilityWidget data={visibilityData} />
      )}

      {/* Tab content */}
      {tab === 'fiche'    && <FicheTab establishment={activeEstablishment} />}
      {tab === 'photos'   && <PhotosTab />}
      {tab === 'horaires' && <HoursTab />}
      {tab === 'qa'       && <QATab />}
      {tab === 'infos'    && <BusinessProfileEditor />}
      {tab === 'reviews'  && <ReviewsManager />}
      {tab === 'settings' && <MilestoneThresholdsPanel />}
    </div>
  );
}