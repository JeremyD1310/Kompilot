/**
 * SocialProofTab — Preuves Sociales
 * Testimonial table + collect button + JSON-LD preview
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, MessageSquare, Copy, Check, Send, FileText,
  CheckCircle2, Clock, AlertCircle, ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, toast } from '@blinkdotnew/ui';
import { MOCK_SOCIAL_PROOF_TESTIMONIALS } from '../../lib/demoMockData';

const SOURCE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  google: { label: 'Google', icon: <span className="text-xs">🔵</span> },
  tripadvisor: { label: 'TripAdvisor', icon: <span className="text-xs">🟢</span> },
  linkedin: { label: 'LinkedIn', icon: <span className="text-xs">🔷</span> },
  email: { label: 'Email', icon: <span className="text-xs">📧</span> },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: React.ReactNode }> = {
  published: { label: 'Publié', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { label: 'En attente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  draft: { label: 'Brouillon', variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

export function SocialProofTab() {
  const [collecting, setCollecting] = useState(false);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);
  const testimonials = MOCK_SOCIAL_PROOF_TESTIMONIALS;

  const published = testimonials.filter((t) => t.status === 'published');
  const avgRating = published.length > 0
    ? (published.reduce((s, t) => s + t.rating, 0) / published.length).toFixed(1)
    : '0';

  // Build JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Le Petit Bistro',
    url: 'https://lepetitbistro-lr.fr',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avgRating,
      reviewCount: published.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: published.map((t) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: t.author },
      datePublished: t.publishedAt ? new Date(t.publishedAt).toISOString().split('T')[0] : undefined,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: t.rating,
        bestRating: 5,
      },
      reviewBody: t.text,
    })),
  };

  const handleCollect = () => {
    setCollecting(true);
    toast.success('Demande d\'avis envoyée !', { description: 'Un email de collecte a été envoyé au client.' });
    setTimeout(() => setCollecting(false), 2000);
  };

  const handleCopyJsonLd = () => {
    navigator.clipboard.writeText(JSON.stringify(jsonLd, null, 2));
    setCopiedJsonLd(true);
    toast.success('JSON-LD copié dans le presse-papier !');
    setTimeout(() => setCopiedJsonLd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Summary + Collect */}
      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[150px]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Note moyenne</p>
              <p className="text-xl font-semibold">{avgRating}/5</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[150px]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Témoignages publiés</p>
              <p className="text-xl font-semibold">{published.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[150px]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">En attente</p>
              <p className="text-xl font-semibold">{testimonials.length - published.length}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center">
          <Button onClick={handleCollect} disabled={collecting} className="gap-2">
            <Send className="h-4 w-4" />
            {collecting ? 'Envoi...' : 'Collecter un avis'}
          </Button>
        </div>
      </div>

      {/* Testimonials Table */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={fadeIn}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Témoignages collectés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Auteur</th>
                    <th className="pb-3 pr-4 font-medium">Note</th>
                    <th className="pb-3 pr-4 font-medium">Source</th>
                    <th className="pb-3 pr-4 font-medium">Extrait</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {testimonials.map((t) => {
                    const src = SOURCE_LABELS[t.source] ?? { label: t.source, icon: null };
                    const st = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.draft;
                    return (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4">
                          <div>
                            <p className="font-medium">{t.author}</p>
                            {t.company && <p className="text-xs text-muted-foreground">{t.company}</p>}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <StarRating rating={t.rating} />
                        </td>
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-1.5 text-xs">
                            {src.icon} {src.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="max-w-[250px] truncate text-xs text-muted-foreground">{t.text}</p>
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {t.publishedAt
                            ? new Date(t.publishedAt).toLocaleDateString('fr-FR')
                            : '—'}
                        </td>
                        <td className="py-3">
                          <Badge variant={st.variant} className="text-xs gap-1">
                            {st.icon} {st.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* JSON-LD Preview */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={fadeIn}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Aperçu JSON-LD (Schema.org)
              </CardTitle>
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleCopyJsonLd}>
                {copiedJsonLd ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedJsonLd ? 'Copié !' : 'Exporter'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="p-4 rounded-lg bg-muted/50 text-xs font-mono overflow-x-auto max-h-[300px] overflow-y-auto text-foreground/80 leading-relaxed">
              {JSON.stringify(jsonLd, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground mt-3">
              Ce balisage structuré sera injecté dans l'en-tête de votre site web pour améliorer
              l'affichage dans les résultats de recherche et les réponses IA.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
