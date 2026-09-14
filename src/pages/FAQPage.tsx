import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
import { PWABanner } from '../components/layout/PWABanner';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { FAQSection, FAQ_ITEMS } from '../components/landing/FAQSection';
import { usePageSeo } from '../hooks/usePageSeo';
import { createFaqGraph } from '../lib/seoData';

type Audience = 'commerce' | 'agency';

export default function FAQPage() {
  const { user } = useAuth();
  usePageSeo(
    'FAQ Kompilot — Questions sur le marketing local par IA',
    'Réponses aux questions fréquentes sur Kompilot, ses fonctionnalités, ses offres et le contrôle humain des contenus générés par IA.',
    '/faq',
    { structuredData: createFaqGraph('/faq', 'FAQ Kompilot', 'Réponses aux questions fréquentes sur Kompilot, ses fonctionnalités, ses offres et le contrôle humain des contenus générés par IA.', FAQ_ITEMS.map(item => ({ question: item.q, answer: item.a }))) },
  );

  const handleCta = () => blink.auth.login(window.location.origin + '/dashboard');
  const setAudience = (_audience: Audience) => undefined;

  return (
    <>
      <PWABanner />
      <div className="min-h-screen overflow-x-hidden bg-[#0B1120] text-slate-100">
        <header>
          <LandingNav audience="commerce" setAudience={setAudience} onCta={handleCta} isLoggedIn={!!user} />
        </header>
        <main>
          <FAQSection onCta={handleCta} />
        </main>
        <LandingFooter />
      </div>
    </>
  );
}
