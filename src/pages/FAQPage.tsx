import { useEffect } from 'react';
import { blink } from '../blink/client';
import { useAuth } from '../hooks/useAuth';
import { PWABanner } from '../components/layout/PWABanner';
import { LandingNav } from '../components/landing/LandingNav';
import { LandingFooter } from '../components/landing/LandingFooter';
import { FAQSection } from '../components/landing/FAQSection';
import { setPageSeo } from '../lib/seo';

type Audience = 'commerce' | 'agency';

export default function FAQPage() {
  const { user } = useAuth();

  useEffect(() => {
    setPageSeo({
      title: 'FAQ | Kompilot',
      description: 'Retrouvez les réponses aux questions fréquentes sur Kompilot, ses fonctionnalités, ses offres et son accompagnement.',
      path: '/faq',
    });
  }, []);

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
