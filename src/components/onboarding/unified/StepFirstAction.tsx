/**
 * StepFirstAction — AI generates a post + review response, user validates.
 */
import { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { OnboardingData } from './types';
import { SECTORS } from './types';

interface Props { data: OnboardingData; onComplete: () => void; }

const SECTOR_TEMPLATES: Record<string, { post: string; review: string }> = {
  restauration: {
    post: `🍽️ Venez découvrir nos nouveautés de la semaine !\n\nNos chefs ont préparé des plats de saison avec des produits frais du marché local.\n\n📞 Réservez votre table\n\n#Restauration #Local`,
    review: `Merci beaucoup pour votre avis ! Nous sommes ravis que votre expérience ait été à la hauteur. Toute l'équipe vous attend très vite. À bientôt ! 🙏`,
  },
  default: {
    post: `✨ Découvrez notre expertise !\n\nNous vous accompagnons avec des solutions personnalisées pour développer votre activité.\n\n💬 Contactez-nous pour en savoir plus`,
    review: `Merci pour votre retour ! Votre satisfaction est notre priorité. Notre équipe reste à votre disposition. À très bientôt ! 🙏`,
  },
};

export function StepFirstAction({ data, onComplete }: Props) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [reviewResponse, setReviewResponse] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2200));
    const tpl = SECTOR_TEMPLATES[data.sector] || SECTOR_TEMPLATES.default;
    setPostContent(tpl.post.replace(/\{businessName\}/g, data.businessName).replace(/\{city\}/g, data.city));
    setReviewResponse(tpl.review.replace(/\{businessName\}/g, data.businessName));
    setGenerating(false);
    setGenerated(true);
  };

  if (!generated) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, margin: '0 auto 16px',
          background: 'rgba(129,140,248,.1)', border: '1px solid rgba(129,140,248,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><Sparkles size={24} color="#818CF8" /></div>
        <p style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '1rem', margin: '0 0 8px' }}>L'IA prépare votre premier contenu</p>
        <p style={{ color: '#94A3B8', fontSize: '.82rem', margin: '0 0 24px', lineHeight: 1.6 }}>
          Kompilot génère un post et une réponse d'avis adaptés à {SECTORS.find(s => s.id === data.sector)?.label || data.sector}.
        </p>
        <button
          onClick={handleGenerate} disabled={generating}
          style={{
            background: generating ? 'rgba(129,140,248,.2)' : 'linear-gradient(135deg, #818CF8, #6366F1)',
            color: '#fff', fontWeight: 700, padding: '14px 32px',
            borderRadius: 12, border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}
        >{generating ? '⏳ Génération en cours…' : <><Sparkles size={16} /> Générer mon premier contenu</>}</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '16px 18px' }}>
        <p style={{ color: '#818CF8', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 8px' }}>📝 Post généré</p>
        <p style={{ color: '#E2E8F0', fontSize: '.85rem', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{postContent}</p>
      </div>
      <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '16px 18px' }}>
        <p style={{ color: '#10B981', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 8px' }}>⭐ Réponse avis IA</p>
        <p style={{ color: '#E2E8F0', fontSize: '.85rem', margin: 0, lineHeight: 1.7 }}>{reviewResponse}</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onComplete}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff', fontWeight: 700, padding: '14px 32px',
            borderRadius: 12, border: 'none', cursor: 'pointer',
          }}
        ><CheckCircle2 size={16} /> Valider et continuer</button>
      </div>
    </div>
  );
}
