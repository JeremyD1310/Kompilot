import { Link } from '@tanstack/react-router';
import { Logo } from './LandingNav';
import { KompilotLogo } from '../brand/KompilotLogo';

export function LandingFooter() {
  return (
    <footer style={{ background:'#080E1C',borderTop:'1px solid rgba(255,255,255,.06)' }}>
      {/* padding-bottom ensures the sticky CTA bar never hides footer content on mobile */}
      <div style={{ maxWidth:1120,margin:'0 auto',padding:'32px 24px 80px' }}>
        <div style={{ display:'flex',flexWrap:'wrap',alignItems:'flex-start',justifyContent:'space-between',gap:24,marginBottom:28 }}>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}><KompilotLogo variant="full" height={28} textColor="#E2E8F0" /></div>
          <nav style={{ display:'flex',flexWrap:'wrap',gap:'8px 28px',alignItems:'center' }}>
            {[
              {to:'/pricing',label:'Tarifs'},
              {to:'/cgv',label:'CGV / CGU'},
              {to:'/confidentialite',label:'Confidentialité & RGPD'},
              {to:'/mentions-legales',label:'Mentions Légales'},
              {to:'/login',label:'Se connecter'},
            ].map(l => (
              <Link key={l.to} to={l.to as '/'} style={{ color:'#475569',fontSize:'.76rem',textDecoration:'none',transition:'color .2s',whiteSpace:'nowrap' }} className="hover:text-slate-300">{l.label}</Link>
            ))}
          </nav>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,.05)',borderBottom:'1px solid rgba(255,255,255,.05)',padding:'14px 0',marginBottom:20,display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',gap:'6px 14px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="rgba(13,148,136,.25)" stroke="#0D9488" strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ color:'#475569',fontSize:'.73rem',lineHeight:1.6,textAlign:'center' }}>© 2026 Kompilot. Tous droits réservés. <span style={{ color:'#334155' }}>Données cryptées via <strong style={{ color:'#3B5EDB',fontWeight:600 }}>Cloudflare Workers</strong>. <strong style={{ color:'#6359F8',fontWeight:600 }}>Stripe</strong> sécurise toutes les transactions.</span></span>
        </div>
        <div style={{ display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:8 }}>
          <span style={{ color:'#475569',fontSize:'.68rem' }}>🇫🇷 Fait avec ❤️ en France — RGPD conforme</span>
          <div style={{ display:'flex',gap:16,alignItems:'center' }}>
            <span style={{ display:'inline-flex',alignItems:'center',gap:5,color:'#475569',fontSize:'.65rem' }}><span style={{ color:'#F38020',fontSize:'.7rem' }}>⬡</span> Cloudflare</span>
            <span style={{ display:'inline-flex',alignItems:'center',gap:5,color:'#475569',fontSize:'.65rem' }}><span style={{ color:'#6359F8',fontSize:'.7rem' }}>⬡</span> Stripe Secured</span>
            <span style={{ display:'inline-flex',alignItems:'center',gap:5,color:'#475569',fontSize:'.65rem' }}><span style={{ color:'#22C55E',fontSize:'.7rem' }}>🔒</span> SSL / TLS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
