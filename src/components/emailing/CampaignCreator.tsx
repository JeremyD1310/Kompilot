import { useState } from 'react';
import { CardHeader, CardTitle, Button, Badge } from '@blinkdotnew/ui';
import { Sparkles, Send, Lock, ChevronDown, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useOnboardingProfile } from '../../hooks/useOnboardingProfile';
import { EmailingPaywall } from './EmailingPaywall';
import { CampaignStats } from './CampaignStats';
import { launchConfetti } from '../../lib/confetti';
import { blink } from '../../blink/client';

const OBJECTIVES = [
  { key: 'promo',        label: '📣 Annoncer un événement/promo' },
  { key: 'reengagement', label: '💤 Relancer les inactifs' },
  { key: 'birthday',    label: '🎂 Souhaiter les anniversaires' },
] as const;

const TONES = [
  { key: 'Amical',         label: '😊 Amical',         desc: 'Chaleureux, proche, naturel' },
  { key: 'Professionnel',  label: '💼 Professionnel',   desc: 'Formel, sérieux, expert' },
  { key: 'Festif',         label: '🎉 Festif',          desc: 'Joyeux, enthousiaste, dynamique' },
  { key: 'Urgence',        label: '⚡ Urgence',          desc: 'Offre limitée, action immédiate' },
  { key: 'Storytelling',   label: '📖 Storytelling',    desc: 'Narrative, émotionnelle, engageante' },
] as const;

type Objective = typeof OBJECTIVES[number]['key'];
type Tone = typeof TONES[number]['key'];

interface GeneratedEmail {
  subject: string;
  subjectAlts: string[];
  body: string;
}

const LIMIT_BY_PLAN: Record<string, number> = { free: 0, pro: 500, expert: 5000 };
const SENT_MOCK: Record<string, number> = { free: 0, pro: 187, expert: 1240 };

const SECTOR_CONTEXT: Record<string, string> = {
  restaurant:       'restaurant ou café, avec des plats, menus, expériences culinaires',
  retail:           'commerce de détail, boutique, produits physiques en magasin',
  beauty:           'salon de beauté, coiffure, soins, bien-être',
  fitness:          'salle de sport, coaching, bien-être physique',
  services:         'prestataire de services professionnels (consultant, agence, artisan)',
  ecommerce:        'boutique en ligne, e-commerce, livraison à domicile',
  health:           'santé, médical, pharmacie, paramédical',
  education:        'formation, enseignement, coaching, tutoring',
};

function buildSystemPrompt(sector: string, objective: Objective, tone: Tone, businessName: string): string {
  const sectorDesc = SECTOR_CONTEXT[sector] || 'petite entreprise locale';
  const toneGuides: Record<Tone, string> = {
    Amical:        'Ton chaleureux, tutoyement possible, émojis discrets, phrases courtes et naturelles.',
    Professionnel: 'Ton formel avec "vous", pas d\'émojis excessifs, vocabulaire soigné, structure claire.',
    Festif:        'Ton joyeux et enthousiaste, émojis festifs (🎊🎉✨), exclamations, énergie positive.',
    Urgence:       'Créer un sentiment d\'urgence doux ("Encore quelques heures", "Places limitées"), CTA fort.',
    Storytelling:  'Commencer par une micro-histoire ou anecdote liée au business, puis transition vers l\'offre.',
  };
  const objectiveGuides: Record<Objective, string> = {
    promo:        'Annoncer un événement spécial, promotion, ou nouveauté. Inclure détails pratiques (date, remise, code promo).',
    reengagement: 'Relancer un client inactif avec une offre ou une surprise personnalisée. Reconnaître l\'absence sans culpabiliser.',
    birthday:     'Souhaiter l\'anniversaire du client avec un geste commercial (offre, cadeau). Message personnel et chaleureux.',
  };

  return `Tu es un expert en email marketing pour ${sectorDesc} (entreprise : "${businessName}").
Ton : ${toneGuides[tone]}
Objectif : ${objectiveGuides[objective]}
Règles :
- Sujet : accrocheur, max 60 caractères, commence par un émoji pertinent.
- Corps : max 180 mots, paragraphes courts, un seul appel à l'action clair.
- Tout en français.
- Personnaliser selon le secteur d'activité.`;
}

export function CampaignCreator() {
  const { currentPlan } = useSubscription();
  const profile = useOnboardingProfile();
  const businessName = profile?.companyName || 'votre établissement';
  const sector = profile?.sector || 'services';

  const [objective, setObjective] = useState<Objective | null>(null);
  const [tone, setTone] = useState<Tone>('Amical');
  const [generating, setGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [sending, setSending] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [campaignSent, setCampaignSent] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Inline editing state
  const [editingSubject, setEditingSubject] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [bodyDraft, setBodyDraft] = useState('');

  const plan = currentPlan.id;
  const limit = LIMIT_BY_PLAN[plan] ?? 0;
  const sent = SENT_MOCK[plan] ?? 0;
  const gaugePercent = limit > 0 ? Math.round((sent / limit) * 100) : 0;

  const handleGenerate = async () => {
    if (!objective) return;
    setGenerating(true);
    setGeneratedEmail(null);
    setAiError(null);
    setEditingSubject(false);
    setEditingBody(false);

    try {
      const systemPrompt = buildSystemPrompt(sector, objective, tone, businessName);
      const { object } = await blink.ai.generateObject({
        prompt: systemPrompt + '\n\nGénère maintenant l\'email. Fournis également 2 variantes alternatives du sujet.',
        schema: {
          type: 'object',
          properties: {
            subject: {
              type: 'string',
              description: 'Sujet principal de l\'email (accrocheur, max 60 caractères)',
            },
            subjectAlts: {
              type: 'array',
              description: '2 variantes alternatives du sujet',
              items: { type: 'string' },
            },
            body: {
              type: 'string',
              description: 'Corps complet de l\'email en texte brut (max 180 mots, paragraphes courts)',
            },
          },
          required: ['subject', 'subjectAlts', 'body'],
        },
        model: 'gpt-4.1-mini',
      });

      const result = object as GeneratedEmail;
      setGeneratedEmail(result);
    } catch (err: unknown) {
      console.error('AI generation error:', err);
      setAiError('Génération IA indisponible. Vérifiez votre connexion et réessayez.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSwapSubject = (alt: string) => {
    if (!generatedEmail) return;
    setGeneratedEmail({ ...generatedEmail, subject: alt, subjectAlts: [generatedEmail.subject, ...generatedEmail.subjectAlts.filter(s => s !== alt)] });
  };

  const handleSend = async () => {
    if (plan === 'free') { setShowPaywall(true); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 1000));
    setSending(false);
    launchConfetti();
    setCampaignSent(true);
  };

  if (campaignSent) {
    return <CampaignStats onReset={() => { setCampaignSent(false); setGeneratedEmail(null); setObjective(null); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Email usage gauge */}
      {plan !== 'free' && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Emails envoyés ce mois</span>
            <span className="text-muted-foreground tabular-nums">
              <strong className="text-foreground">{sent.toLocaleString('fr-FR')}</strong> / {limit.toLocaleString('fr-FR')}
              {plan === 'expert' && (
                <Badge className="ml-2 text-[10px] bg-violet-100 text-violet-700 border-violet-200">Expert</Badge>
              )}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${gaugePercent}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground">{limit - sent} emails restants ce mois</p>
        </div>
      )}

      {/* Step 1 — Objective */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">1. Objectif de la campagne</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OBJECTIVES.map(obj => (
            <button
              key={obj.key}
              onClick={() => { setObjective(obj.key); setGeneratedEmail(null); }}
              className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-150 ${
                objective === obj.key
                  ? 'border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02]'
              }`}
            >
              {obj.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2 — Tone */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">2. Ton de l'email</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TONES.map(t => (
            <button
              key={t.key}
              onClick={() => setTone(t.key as Tone)}
              title={t.desc}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150 ${
                tone === t.key
                  ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <span className="block">{t.label}</span>
              <span className="block text-[10px] text-muted-foreground mt-0.5 font-normal">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sector indicator */}
      {profile?.sector && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Sparkles size={11} className="text-primary" />
          L'IA adapte le contenu à votre secteur : <strong className="text-foreground capitalize">{profile.sector}</strong>
        </p>
      )}

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={!objective || generating}
        className="gap-2 w-full sm:w-auto"
      >
        {generating ? (
          <><span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Génération IA en cours...</>
        ) : generatedEmail ? (
          <><RefreshCw size={14} /> Régénérer</>
        ) : (
          <><Sparkles size={15} /> ✨ Générer l'email par IA</>
        )}
      </Button>

      {/* AI Error */}
      {aiError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {aiError}
        </div>
      )}

      {/* Email preview */}
      {generatedEmail && (
        <div className="animate-fade-in space-y-4">
          <p className="text-sm font-semibold text-foreground">3. Aperçu & personnalisation</p>

          {/* Subject line variants */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ligne d'objet</p>
            <div className="space-y-2">
              {/* Active subject (editable) */}
              <div className={`rounded-xl border px-4 py-3 flex items-start gap-3 transition-all ${editingSubject ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.02]' : 'border-primary bg-primary/5'}`}>
                <div className="flex-1 min-w-0">
                  {editingSubject ? (
                    <input
                      autoFocus
                      value={subjectDraft}
                      onChange={e => setSubjectDraft(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-foreground outline-none"
                      maxLength={80}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-foreground">{generatedEmail.subject}</p>
                  )}
                  <span className="text-[11px] text-primary/70">✓ Sélectionné</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {editingSubject ? (
                    <>
                      <button onClick={() => { setGeneratedEmail({ ...generatedEmail, subject: subjectDraft }); setEditingSubject(false); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Check size={13} /></button>
                      <button onClick={() => setEditingSubject(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={13} /></button>
                    </>
                  ) : (
                    <button onClick={() => { setSubjectDraft(generatedEmail.subject); setEditingSubject(true); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"><Pencil size={13} /></button>
                  )}
                </div>
              </div>

              {/* Alternative subjects */}
              {generatedEmail.subjectAlts.slice(0, 2).map((alt, i) => (
                <div key={i} className="rounded-xl border border-border bg-card px-4 py-2.5 flex items-center gap-3 hover:border-primary/30 transition-all">
                  <p className="flex-1 text-sm text-muted-foreground">{alt}</p>
                  <button
                    onClick={() => handleSwapSubject(alt)}
                    className="text-[11px] text-primary hover:underline underline-offset-2 shrink-0"
                  >
                    Utiliser
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Email body */}
          <div className="rounded-2xl border border-border shadow-md overflow-hidden bg-card">
            <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-muted-foreground">Aperçu — Boîte de réception</span>
            </div>

            {/* Email header */}
            <div className="px-5 py-4 border-b border-border/60 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                  {businessName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{businessName}</span>
                    <span className="text-xs text-muted-foreground">&lt;contact@kompilot.fr&gt;</span>
                    <span className="text-[11px] text-muted-foreground ml-auto">À l'instant</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">À : vos clients sélectionnés</p>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground pl-12">{generatedEmail.subject}</p>
            </div>

            {/* Email body (editable) */}
            <div className="px-5 py-4 relative group">
              {editingBody ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={bodyDraft}
                    onChange={e => setBodyDraft(e.target.value)}
                    rows={10}
                    className="w-full bg-transparent text-sm text-foreground/80 leading-relaxed font-sans outline-none resize-none border border-primary/30 rounded-lg p-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setGeneratedEmail({ ...generatedEmail, body: bodyDraft }); setEditingBody(false); }} className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg"><Check size={12} /> Valider</button>
                    <button onClick={() => setEditingBody(false)} className="flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg"><X size={12} /> Annuler</button>
                  </div>
                </div>
              ) : (
                <>
                  <pre className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-sans">
                    {generatedEmail.body}
                  </pre>
                  <button
                    onClick={() => { setBodyDraft(generatedEmail.body); setEditingBody(true); }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground"
                    title="Modifier le corps"
                  >
                    <Pencil size={13} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* AI badge */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Sparkles size={11} className="text-primary" />
            Contenu généré par IA — adapté au secteur <strong className="capitalize">{sector}</strong>, ton <strong>{tone}</strong>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={sending}
            className="w-full gap-2 text-base py-6"
          >
            {sending ? (
              <><span className="inline-block w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> ⚡ Kompilot distribue vos emails...</>
            ) : (
              <><Send size={16} /> 🚀 Envoyer la campagne</>
            )}
          </Button>
        </div>
      )}

      {/* Expert auto-scenarios section */}
      <div className="relative rounded-2xl border border-border overflow-hidden">
        <div className={`p-5 space-y-3 ${plan !== 'expert' ? 'blur-[2px] select-none pointer-events-none' : ''}`}>
          <CardHeader className="p-0">
            <CardTitle className="text-sm flex items-center gap-2">
              🤖 Scénarios de relance automatiques
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['Relance panier abandonné', 'Suivi post-achat J+7', 'Réactivation 90 jours'].map(s => (
              <div key={s} className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs font-medium text-muted-foreground">
                ⚡ {s}
              </div>
            ))}
          </div>
        </div>
        {plan !== 'expert' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/70 backdrop-blur-[1px]">
            <Lock size={18} className="text-muted-foreground" />
            <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs font-bold">
              Expert uniquement
            </Badge>
            <button
              onClick={() => setShowPaywall(true)}
              className="text-xs text-primary hover:underline underline-offset-2"
            >
              Passer à Expert →
            </button>
          </div>
        )}
      </div>

      <EmailingPaywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
