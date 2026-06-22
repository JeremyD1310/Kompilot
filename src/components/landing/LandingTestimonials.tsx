import { Star } from 'lucide-react';

interface Review {
  name: string;
  role: string;
  rating: number;
  text: string;
}

interface LandingTestimonialsProps {
  reviews: Review[];
  audience: 'commerce' | 'agency';
}

export function LandingTestimonials({ reviews, audience }: LandingTestimonialsProps) {
  return (
    <section id="temoignages" style={{ padding:'clamp(28px, 5vw, 40px) 16px',borderTop:'1px solid rgba(255,255,255,.05)',background:'rgba(255,255,255,.015)' }}>
      <div style={{ maxWidth:1120,margin:'0 auto' }}>
        <div className="text-center" style={{ marginBottom:36 }}>
          <p className="sr nc-section-label" style={{ marginBottom:16 }}>Témoignages</p>
          <h2 className="sr d1" style={{ fontSize:'clamp(1.7rem, 3.5vw, 2.4rem)',fontWeight:800,letterSpacing:'-0.02em',color:'#F1F5F9' }}>
            {audience==='agency'?'Ce que disent nos partenaires agences':'Ce que disent nos utilisateurs'}
          </h2>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',gap:20 }}>
          {reviews.map((r,i) => (
            <div key={i} className={`sr d${i+1} nc-review-card`}>
              <div style={{ display:'flex',gap:3,marginBottom:16 }}>{Array.from({length:r.rating}).map((_,j) => <Star key={j} size={13} style={{ color:'#FBBF24',fill:'#FBBF24' }} />)}</div>
              <p style={{ color:'#CBD5E1',fontSize:'.9rem',lineHeight:1.68,marginBottom:18 }}>"{r.text}"</p>
              <div>
                <p style={{ color:'#F1F5F9',fontSize:'.82rem',fontWeight:600 }}>{r.name}</p>
                <p style={{ color:'#475569',fontSize:'.74rem',marginTop:2 }}>{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}