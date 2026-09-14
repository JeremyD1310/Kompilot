import { Link, useParams } from '@tanstack/react-router';
import { ArrowRight, CheckCircle2, MapPin, MessageSquareText, Share2, Sparkles } from 'lucide-react';
import { usePageSeo } from '../hooks/usePageSeo';

type Sector = {
  name: string;
  audience: string;
  promise: string;
  painPoints: string[];
  examples: string[];
};

const SECTORS: Record<string, Sector> = {
  restaurants: { name: 'Restaurants', audience: 'restaurants, cafés et établissements de restauration', promise: 'Remplissez plus de tables grâce à une présence locale régulière.', painPoints: ['Répondre rapidement aux avis Google', 'Publier menus, événements et temps forts', 'Rester visible dans les recherches locales'], examples: ['Restaurant indépendant', 'Groupe de restaurants', 'Café et bar'] },
  boutiques: { name: 'Boutiques', audience: 'boutiques et commerces de proximité', promise: 'Transformez votre actualité commerciale en visibilité et en visites.', painPoints: ['Animer les réseaux sans y passer des heures', 'Valoriser nouveautés et promotions', 'Harmoniser plusieurs points de vente'], examples: ['Mode et accessoires', 'Commerce spécialisé', 'Réseau de boutiques'] },
  beaute: { name: 'Beauté', audience: 'salons de coiffure, instituts et professionnels de la beauté', promise: 'Fidélisez votre clientèle et attirez de nouveaux rendez-vous.', painPoints: ['Mettre en avant les réalisations', 'Répondre aux avis et messages', 'Créer un calendrier de contenus régulier'], examples: ['Salon de coiffure', 'Institut de beauté', 'Spa'] },
  sport: { name: 'Sport', audience: 'clubs, salles, coachs et studios sportifs', promise: 'Développez votre communauté locale et vos inscriptions.', painPoints: ['Promouvoir cours et événements', 'Créer du contenu motivant', 'Centraliser les interactions clients'], examples: ['Salle de sport', 'Coach indépendant', 'Studio yoga ou Pilates'] },
  artisans: { name: 'Artisans', audience: 'artisans et entreprises du bâtiment', promise: 'Gagnez en crédibilité locale et générez davantage de demandes de devis.', painPoints: ['Montrer les chantiers et savoir-faire', 'Collecter et traiter les avis', 'Être trouvé dans sa zone d’intervention'], examples: ['Plombier et électricien', 'Artisan du bâtiment', 'Entreprise multiservices'] },
  sante: { name: 'Santé', audience: 'cabinets et professionnels de santé autorisés à communiquer', promise: 'Développez une information locale claire, régulière et maîtrisée.', painPoints: ['Informer sans communication agressive', 'Gérer la réputation du cabinet', 'Maintenir des informations pratiques à jour'], examples: ['Cabinet pluridisciplinaire', 'Profession paramédicale', 'Centre de soins'] },
  immobilier: { name: 'Immobilier', audience: 'agences et réseaux immobiliers', promise: 'Renforcez votre expertise locale et générez plus de mandats.', painPoints: ['Valoriser biens et réussites locales', 'Publier régulièrement par agence', 'Suivre la réputation de chaque implantation'], examples: ['Agence indépendante', 'Réseau immobilier', 'Mandataire'] },
  agences: { name: 'Agences', audience: 'agences marketing, consultants et freelances', promise: 'Pilotez la visibilité de plusieurs clients depuis un même cockpit.', painPoints: ['Industrialiser la production de contenus', 'Centraliser les comptes clients', 'Prouver la valeur avec des rapports lisibles'], examples: ['Agence digitale', 'Consultant marketing', 'Freelance social media'] },
};

export default function SectorPage() {
  const { sector: slug } = useParams({ strict: false }) as { sector: string };
  const sector = SECTORS[slug] ?? SECTORS.boutiques;
  const path = `/secteurs/${slug}`;
  usePageSeo(`Kompilot pour les ${sector.name} | Marketing local par IA`, `Kompilot aide les ${sector.audience} à gérer réseaux sociaux, avis clients et visibilité locale depuis une seule plateforme.`, path);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200">
      <header className="border-b border-white/10"><div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between"><Link to="/" className="font-extrabold text-xl text-white">Kompilot</Link><div className="flex gap-4 text-sm"><Link to="/features" className="text-slate-300">Fonctionnalités</Link><Link to="/pricing" className="text-slate-300">Tarifs</Link></div></div></header>
      <main>
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-teal-400 font-bold mb-4">Kompilot pour les {sector.name}</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6">Le copilote marketing des {sector.audience}</h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-9">{sector.promise} Kompilot centralise contenus, avis et visibilité locale avec l’aide de l’IA.</p>
          <div className="flex flex-wrap justify-center gap-3"><Link to="/signup" className="rounded-xl bg-teal-600 px-6 py-3 font-bold text-white flex items-center gap-2">Essayer gratuitement <ArrowRight size={17}/></Link><Link to="/demo" className="rounded-xl border border-white/20 px-6 py-3 font-bold text-white">Voir la démonstration</Link></div>
        </section>
        <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-5">
          {[{ icon: <Share2/>, title: 'Contenus réguliers' }, { icon: <MessageSquareText/>, title: 'Avis centralisés' }, { icon: <MapPin/>, title: 'Visibilité locale' }].map((item, index) => <article key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-6"><div className="text-teal-400 mb-4">{item.icon}</div><h2 className="font-bold text-white text-lg mb-3">{item.title}</h2><p className="text-slate-400">{sector.painPoints[index]}</p></article>)}
        </section>
        <section className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center"><div><p className="text-teal-400 font-bold mb-3">Une plateforme adaptée à votre activité</p><h2 className="text-3xl font-black text-white mb-5">Passez moins de temps à communiquer, sans disparaître des radars</h2><div className="space-y-3">{sector.examples.map(example => <p key={example} className="flex gap-2 text-slate-300"><CheckCircle2 className="text-teal-400 shrink-0" size={19}/>{example}</p>)}</div></div><div className="rounded-3xl bg-gradient-to-br from-teal-600/30 to-indigo-600/20 border border-white/10 p-8"><Sparkles className="text-teal-300 mb-4"/><h2 className="text-2xl font-bold text-white mb-3">Démarrez avec vos priorités</h2><p className="text-slate-300 mb-6">Connectez vos canaux, préparez votre calendrier et gardez la validation humaine sur chaque contenu important.</p><Link to="/signup" className="text-teal-300 font-bold">Créer mon espace →</Link></div></section>
      </main>
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500"><Link to="/" className="hover:text-white">Accueil</Link> · <Link to="/faq" className="hover:text-white">FAQ</Link> · <Link to="/confidentialite" className="hover:text-white">Confidentialité</Link></footer>
    </div>
  );
}
