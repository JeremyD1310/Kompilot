import { Link } from '@tanstack/react-router';
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, MapPin, MessageSquareText, Search, ShieldCheck, Sparkles, Star } from 'lucide-react';

const FEATURES = [
  { icon: Sparkles, title: 'Contenus assistés par IA', text: 'Préparez vos publications pour Instagram, Facebook, LinkedIn et TikTok à partir de votre activité et de votre ton.' },
  { icon: CalendarDays, title: 'Calendrier éditorial', text: 'Organisez vos campagnes et visualisez les prochaines actions à mener sur chaque canal.' },
  { icon: Star, title: 'Avis Google', text: 'Centralisez vos avis et préparez des réponses personnalisées avant leur validation par votre équipe.' },
  { icon: MessageSquareText, title: 'Messages centralisés', text: 'Regroupez les conversations issues de vos canaux connectés dans un espace de travail unique.' },
  { icon: Search, title: 'SEO local et GEO', text: 'Analysez les signaux qui influencent votre visibilité sur Google et dans les réponses des moteurs IA.' },
  { icon: BarChart3, title: 'Reporting lisible', text: 'Suivez les actions réalisées, les performances et les conversions depuis un même tableau de bord.' },
];

const SECTORS = [
  ['/secteurs/restaurants', 'Restaurants', 'Menus, avis, actualités et visibilité locale.'],
  ['/secteurs/boutiques', 'Boutiques', 'Produits, temps forts commerciaux et trafic en magasin.'],
  ['/secteurs/beaute', 'Beauté & coiffure', 'Prestations, disponibilités, avis et fidélisation.'],
  ['/secteurs/sport', 'Sport & coaching', 'Cours, événements, communauté et inscriptions.'],
  ['/secteurs/artisans', 'Artisans', 'Zone d’intervention, réalisations et demandes de devis.'],
  ['/secteurs/sante', 'Santé & bien-être', 'Expertise locale et contenus encadrés avec validation humaine.'],
  ['/secteurs/immobilier', 'Immobilier', 'Biens, expertise de quartier et génération de contacts.'],
  ['/secteurs/agences', 'Agences', 'Pilotage multi-clients, marque blanche et rapports.'],
] as const;

const STEPS = [
  ['01', 'Connectez votre présence', 'Ajoutez votre établissement, votre site et les canaux que vous utilisez déjà.'],
  ['02', 'Recevez votre plan d’action', 'Kompilot rassemble vos contenus, avis et signaux de visibilité pour prioriser les actions utiles.'],
  ['03', 'Validez et mesurez', 'Gardez la décision finale avant publication ou réponse, puis suivez les résultats dans le cockpit.'],
];

export function VisibilityLandingSections({ onCta }: { onCta: () => void }) {
  return <>
    <section id="fonctionnalites" style={{ padding: 'clamp(56px,8vw,96px) 20px' }}><div style={{ maxWidth:1120,margin:'0 auto' }}>
      <div style={{ textAlign:'center',maxWidth:760,margin:'0 auto 44px' }}><p className="nc-section-label">Un seul cockpit, des actions concrètes</p><h2 style={{color:'#F8FAFC',fontSize:'clamp(1.8rem,4vw,2.8rem)',lineHeight:1.15,margin:'14px 0'}}>Tout ce qu’il faut pour piloter votre présence locale</h2><p style={{color:'#94A3B8',lineHeight:1.75,margin:0}}>Kompilot transforme vos contenus, avis, messages et données de visibilité en un plan de travail clair, sans multiplier les outils.</p></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,300px),1fr))',gap:16}}>{FEATURES.map(({icon:Icon,title,text})=><article key={title} style={{padding:24,borderRadius:18,background:'rgba(255,255,255,.035)',border:'1px solid rgba(255,255,255,.08)'}}><div style={{width:42,height:42,display:'grid',placeItems:'center',borderRadius:12,background:'rgba(13,148,136,.14)',marginBottom:18}}><Icon size={20} color="#2DD4BF"/></div><h3 style={{color:'#F1F5F9',fontSize:'1rem',margin:'0 0 10px'}}>{title}</h3><p style={{color:'#64748B',fontSize:'.86rem',lineHeight:1.7,margin:0}}>{text}</p></article>)}</div>
      <div style={{textAlign:'center',marginTop:28}}><Link to="/features" style={{color:'#2DD4BF',fontWeight:700,textDecoration:'none'}}>Découvrir toutes les fonctionnalités <ArrowRight size={15} style={{display:'inline',verticalAlign:'-2px'}}/></Link></div>
    </div></section>

    <section id="fonctionnement" style={{padding:'clamp(56px,8vw,88px) 20px',background:'rgba(13,148,136,.035)',borderBlock:'1px solid rgba(255,255,255,.05)'}}><div style={{maxWidth:1080,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:40}}><p className="nc-section-label">Simple à mettre en place</p><h2 style={{color:'#F8FAFC',fontSize:'clamp(1.8rem,4vw,2.6rem)',margin:'14px 0 10px'}}>Votre visibilité pilotée en trois étapes</h2></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))',gap:16}}>{STEPS.map(([num,title,text])=><article key={num} style={{padding:26,borderRadius:18,background:'#0B1120',border:'1px solid rgba(45,212,191,.14)'}}><span style={{color:'rgba(45,212,191,.35)',fontWeight:900,fontSize:'2rem'}}>{num}</span><h3 style={{color:'#F1F5F9',margin:'18px 0 9px'}}>{title}</h3><p style={{color:'#64748B',fontSize:'.86rem',lineHeight:1.7,margin:0}}>{text}</p></article>)}</div>
      <div style={{display:'flex',justifyContent:'center',gap:18,flexWrap:'wrap',marginTop:28,color:'#94A3B8',fontSize:'.8rem'}}><span><ShieldCheck size={15} color="#2DD4BF" style={{display:'inline',verticalAlign:'-3px'}}/> Validation humaine</span><span><CheckCircle2 size={15} color="#2DD4BF" style={{display:'inline',verticalAlign:'-3px'}}/> Sans compétence technique</span><span><MapPin size={15} color="#2DD4BF" style={{display:'inline',verticalAlign:'-3px'}}/> Pensé pour le local</span></div>
    </div></section>

    <section id="geo" style={{padding:'clamp(60px,9vw,104px) 20px'}}><div style={{maxWidth:1080,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,420px),1fr))',gap:34,alignItems:'center'}}>
      <div><p className="nc-section-label">Visibilité dans les moteurs IA</p><h2 style={{color:'#F8FAFC',fontSize:'clamp(1.8rem,4vw,2.7rem)',lineHeight:1.16,margin:'14px 0 18px'}}>Votre entreprise apparaît-elle dans les réponses des IA&nbsp;?</h2><p style={{color:'#94A3B8',lineHeight:1.75}}>Le GEO (Generative Engine Optimization) consiste à renforcer les informations et les contenus qui aident ChatGPT, Gemini et Perplexity à comprendre et à citer une entreprise.</p><ul style={{padding:0,listStyle:'none',display:'grid',gap:12,margin:'24px 0'}}>{['Analyse de votre présence et de celle de vos concurrents','Détection des informations locales incohérentes','Recommandations de contenus et d’actions prioritaires','Suivi de votre visibilité dans le temps'].map(item=><li key={item} style={{color:'#CBD5E1',fontSize:'.88rem'}}><CheckCircle2 size={16} color="#2DD4BF" style={{display:'inline',verticalAlign:'-3px',marginRight:9}}/>{item}</li>)}</ul><Link to="/local" style={{color:'#2DD4BF',fontWeight:700,textDecoration:'none'}}>Comprendre le SEO local et le GEO <ArrowRight size={15} style={{display:'inline',verticalAlign:'-2px'}}/></Link></div>
      <div style={{borderRadius:22,padding:'clamp(24px,5vw,38px)',background:'radial-gradient(circle at 80% 10%,rgba(139,92,246,.18),transparent 45%),rgba(255,255,255,.035)',border:'1px solid rgba(45,212,191,.18)'}}><p style={{color:'#64748B',textTransform:'uppercase',letterSpacing:'.08em',fontSize:'.7rem',fontWeight:800}}>Exemple de diagnostic</p><h3 style={{color:'#F1F5F9',margin:'10px 0 24px'}}>Les signaux observés par Kompilot</h3>{['Fiche Google et informations locales','Avis, réponses et perception client','Contenus du site et des réseaux sociaux','Présence dans les réponses génératives'].map((item,i)=><div key={item} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 0',borderTop:'1px solid rgba(255,255,255,.07)'}}><span style={{width:26,height:26,borderRadius:8,display:'grid',placeItems:'center',background:'rgba(13,148,136,.13)',color:'#2DD4BF',fontSize:'.72rem',fontWeight:800}}>{i+1}</span><span style={{color:'#CBD5E1',fontSize:'.86rem'}}>{item}</span></div>)}<button onClick={onCta} className="nc-pill" style={{width:'100%',justifyContent:'center',marginTop:24}}>Tester Kompilot <ArrowRight size={15}/></button></div>
    </div></section>

    <section id="secteurs" style={{padding:'clamp(56px,8vw,92px) 20px',background:'rgba(255,255,255,.018)',borderBlock:'1px solid rgba(255,255,255,.05)'}}><div style={{maxWidth:1120,margin:'0 auto'}}><div style={{textAlign:'center',maxWidth:700,margin:'0 auto 38px'}}><p className="nc-section-label">Des usages adaptés à votre métier</p><h2 style={{color:'#F8FAFC',fontSize:'clamp(1.8rem,4vw,2.6rem)',margin:'14px 0'}}>Une visibilité adaptée à votre activité</h2><p style={{color:'#94A3B8',lineHeight:1.7}}>Chaque secteur dispose de ses propres enjeux, contenus et signaux locaux.</p></div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,240px),1fr))',gap:13}}>{SECTORS.map(([to,title,text])=><Link key={to} to={to as '/'} style={{padding:20,borderRadius:15,background:'#0B1120',border:'1px solid rgba(255,255,255,.08)',textDecoration:'none'}}><h3 style={{color:'#F1F5F9',fontSize:'.94rem',margin:'0 0 8px'}}>{title} <ArrowRight size={14} style={{display:'inline',verticalAlign:'-2px',color:'#2DD4BF'}}/></h3><p style={{color:'#64748B',fontSize:'.78rem',lineHeight:1.55,margin:0}}>{text}</p></Link>)}</div></div></section>
  </>;
}
