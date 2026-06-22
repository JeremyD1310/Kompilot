/**
 * SectorVideoPlayer — Lecteur vidéo dynamique post-inscription.
 * Affiche la micro-démo de 30s correspondant au profil maître de l'utilisateur.
 */
import { X, Play, ArrowRight } from 'lucide-react';
import { Button } from '@blinkdotnew/ui';
import { MASTER_PROFILES } from '../../lib/sectors/profiles';
import type { MasterProfile } from '../../lib/sectorProfiles';

interface Props {
  masterProfile: NonNullable<MasterProfile>;
  onClose: () => void;
}

// ── Données des vidéos par profil ────────────────────────────────────────────
// Pour l'instant, utilise des thumbnails et des descriptions en attendant les vraies URLs vidéo.
// Remplacer videoUrl par les vraies URLs quand elles seront disponibles.
const VIDEO_DATA: Record<string, {
  emoji: string;
  title: string;
  subtitle: string;
  steps: string[];
  color: string;
}> = {
  flux: {
    emoji: '📅',
    title: 'Automatiser la distribution de vos coupons par DM',
    subtitle: 'Faire exploser votre taux d\'engagement local',
    steps: [
      'Créez votre premier mot-clé déclencheur (ex: "COUPON") dans Croissance',
      'Liez-le à votre offre : code promo, menu, ou lien de réservation',
      'Activez le bot commentaires pour répondre en < 5 min',
      'Générez vos 3 Stories interactives de la semaine en 1 clic',
    ],
    color: '#F59E0B',
  },
  chantier: {
    emoji: '🏗️',
    title: 'Transformer vos photos de chantiers en Stories interactives',
    subtitle: 'Engager votre communauté locale avec l\'IA',
    steps: [
      'Téléversez vos photos de chantier en cours dans le Cockpit',
      'Activez les 3 Stories interactives hebdomadaires (Sondage / Quiz / Curseur)',
      'Configurez le mot-clé Comment-to-DM pour envoyer vos devis auto',
      'Le bot répond aux commentaires < 5 min pour relancer les prospects',
    ],
    color: '#F97316',
  },
  produits: {
    emoji: '🛍️',
    title: 'Coupons Flash IA & Analyse Avis Produits',
    subtitle: 'Pour les boutiques et e-commerçants locaux',
    steps: [
      'Signalez un surstock et l\'IA crée le coupon flash',
      'Analysez les avis pour identifier vos best-sellers',
      'Activez les posts météo opportunistes',
      'Mesurez le ROI de chaque coupon généré',
    ],
    color: '#8B5CF6',
  },
  services_b2b: {
    emoji: '💼',
    title: 'Automatiser vos Relances & Formulaires IA',
    subtitle: 'Pour les assureurs, consultants et immobilier',
    steps: [
      'Créez un formulaire IA de qualification des leads',
      'Synchronisez votre calendrier de renouvellements',
      'Activez les relances automatiques avant expiration',
      'Simulez l\'impact de votre réputation corporate',
    ],
    color: '#0D9488',
  },
  agence: {
    emoji: '🏢',
    title: 'Déployer la stratégie Comment-to-DM en marque blanche',
    subtitle: 'Capter des abonnés qualifiés pour vos clients',
    steps: [
      'Téléversez votre logo dans Paramètres → Marque Blanche',
      'Configurez les règles Comment-to-DM pour chaque sous-compte',
      'Activez le bot de réponse aux commentaires < 5 min par client',
      'Générez les 3 Stories interactives hebdomadaires en 1 clic',
    ],
    color: '#3B82F6',
  },
};

export function SectorVideoPlayer({ masterProfile, onClose }: Props) {
  const profileConfig = MASTER_PROFILES[masterProfile];
  const video = VIDEO_DATA[masterProfile] ?? VIDEO_DATA.produits;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0F172A] text-white shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Video placeholder */}
        <div
          className="relative flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${video.color}22, #0F172A)`, minHeight: 200 }}
        >
          <div className="text-center py-12 px-8">
            <div className="text-6xl mb-4">{video.emoji}</div>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto cursor-pointer hover:scale-110 transition-transform"
              style={{ background: video.color }}
            >
              <Play className="h-7 w-7 text-white fill-white ml-1" />
            </div>
            <p className="mt-4 text-xs text-slate-400">Vidéo de démonstration personnalisée</p>
            <p className="text-[10px] text-slate-600 mt-1">ID: {profileConfig?.onboardingVideoId}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white" style={{ background: video.color }}>
                {profileConfig?.label ?? masterProfile}
              </span>
            </div>
            <h3 className="text-xl font-bold mt-2">{video.title}</h3>
            <p className="text-slate-400 text-sm mt-1">{video.subtitle}</p>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vos 4 premières actions</p>
            {video.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                  style={{ background: video.color }}
                >
                  {i + 1}
                </div>
                <span className="text-sm text-slate-300">{step}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={onClose}
            className="w-full py-5 font-bold text-white"
            style={{ background: video.color }}
          >
            Commencer mon installation <ArrowRight className="h-4 w-4 ml-2 inline" />
          </Button>
        </div>
      </div>
    </div>
  );
}
