/**
 * AgencyLeadSearchPage — /agence/lead-search
 *
 * Lead Maps Scraper: find local businesses via Google Places,
 * analyze their online presence gaps, and export the list as CSV.
 * Agency-only feature.
 */
import { useState, useCallback } from 'react';
import {
  Page, PageHeader, PageTitle, PageDescription, PageBody, PageActions,
  Button, Badge, Input, Card, toast,
} from '@blinkdotnew/ui';
import {
  Search, MapPin, Download, Phone, Globe, Star, AlertTriangle,
  BrainCircuit, RefreshCw, ExternalLink, Users, Lock, Rocket, ArrowRight,
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { blink } from '../blink/client';
import { useSubscription } from '../context/SubscriptionContext';
import { DeepScanProgressModal } from '../components/onboarding/DeepScanProgressModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://gbrhsehk.backend.blink.new';

interface PlaceResult {
  placeId:               string;
  name:                  string;
  address:               string;
  phone:                 string;
  website:               string;
  reviewCount:           number;
  rating:                number;
  hasUnrespondedReviews: boolean;
  isAiInvisible:         boolean;
  status:                'unresponded_reviews' | 'ai_invisible' | 'ok';
}

function StatusBadge({ place }: { place: PlaceResult }) {
  if (place.hasUnrespondedReviews) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[11px] font-semibold gap-1 whitespace-nowrap">
        <AlertTriangle size={10} /> ⚠️ Avis non répondus
      </Badge>
    );
  }
  if (place.isAiInvisible) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 text-[11px] font-semibold gap-1 whitespace-nowrap">
        <BrainCircuit size={10} /> ❌ Invisible sur l'IA
      </Badge>
    );
  }
  return (
    <Badge className="bg-green-100 text-green-700 border-green-200 text-[11px] font-semibold whitespace-nowrap">
      ✅ OK
    </Badge>
  );
}

function exportCSV(places: PlaceResult[], query: string, location: string) {
  const header = ['Nom', 'Adresse', 'Téléphone', 'Site Web', 'Nb Avis', 'Note', 'Statut'];
  const rows = places.map(p => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.address.replace(/"/g, '""')}"`,
    p.phone || '-',
    p.website || '-',
    String(p.reviewCount),
    String(p.rating),
    p.hasUnrespondedReviews ? 'Avis non répondus' : p.isAiInvisible ? 'Invisible IA' : 'OK',
  ]);

  const csv = [header.join(';'), ...rows.map(r => r.join(';'))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prospects-${query.replace(/\s+/g, '_')}-${location.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('Liste exportée au format CSV ✓');
}

// ── Upsell wall for Pro users (agency feature only) ──────────────────────────

function AgencyUpsellWall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Lock size={18} className="text-amber-600" />
          </div>
          <div>
            <PageTitle>Lead Maps Scraper</PageTitle>
            <PageDescription>Trouvez des prospects locaux avec des problèmes de visibilité IA</PageDescription>
          </div>
        </div>
      </PageHeader>
      <PageBody>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40 p-10 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200">
              <Rocket size={36} className="text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-foreground">Fonctionnalité Agence exclusive</h2>
              <p className="text-muted-foreground max-w-md">
                Le <strong>Lead Maps Scraper</strong> scanne Google Places pour trouver des commerces locaux
                avec des avis non répondus ou invisibles sur les IA. Passez au plan Agence pour y accéder.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-sm">
              {[
                { icon: '🔍', title: 'Scan Google Places', desc: 'Trouvez jusqu\'à 60 prospects par recherche' },
                { icon: '📊', title: 'Analyse automatique', desc: 'Score de visibilité IA, avis sans réponse' },
                { icon: '📥', title: 'Export CSV/Excel', desc: 'Intégrez directement dans votre CRM' },
              ].map(f => (
                <div key={f.title} className="rounded-xl bg-white border border-amber-100 p-4 text-left space-y-1 shadow-sm">
                  <div className="text-2xl">{f.icon}</div>
                  <div className="font-semibold text-foreground">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200 gap-2 px-8 py-3 text-base font-bold"
              onClick={onUpgrade}
            >
              Passer au plan Agence <ArrowRight size={18} />
            </Button>
            <p className="text-xs text-muted-foreground">Sans engagement · Accès immédiat · Support prioritaire</p>
          </div>
        </div>
      </PageBody>
    </Page>
  );
}

export default function AgencyLeadSearchPage() {
  const navigate = useNavigate();
  const { currentPlan } = useSubscription();
  const [query,    setQuery]    = useState('');
  const [location, setLocation] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState<PlaceResult[]>([]);
  const [isMock,   setIsMock]   = useState(false);
  const [searched, setSearched] = useState(false);
  // Deep scan modal state
  const [deepScanOpen, setDeepScanOpen] = useState(false);
  const [pendingSearch, setPendingSearch] = useState(false);

  // Agency-only gating: show upsell for non-agency users
  const isAgency = (currentPlan.id === 'expert') || (currentPlan.id as string).includes('agency');
  if (!isAgency) {
    return <AgencyUpsellWall onUpgrade={() => navigate({ to: '/subscription' })} />;
  }

  const runActualSearch = useCallback(async () => {
    setLoading(true);
    setResults([]);
    setSearched(false);

    try {
      const token = await blink.auth.getValidToken();

      // First page
      const params = new URLSearchParams({ q: query.trim(), location: location.trim() });
      const res = await fetch(`${BACKEND_URL}/api/leads/agency/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30_000),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as any;
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as {
        places: PlaceResult[];
        nextPageToken: string | null;
        isMock: boolean;
        hint?: string;
      };

      let all: PlaceResult[] = [...data.places];
      setIsMock(data.isMock);

      // Fetch page 2 + 3 to get up to 60 results (20 per page)
      let pageToken = data.nextPageToken;
      let page = 2;
      while (pageToken && all.length < 60 && page <= 3) {
        await new Promise(r => setTimeout(r, 2000)); // Google requires 2s delay between pages
        const p2 = new URLSearchParams({ q: query.trim(), location: location.trim(), pagetoken: pageToken });
        const r2 = await fetch(`${BACKEND_URL}/api/leads/agency/search?${p2}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(15_000),
        });
        if (!r2.ok) break;
        const d2 = await r2.json() as { places: PlaceResult[]; nextPageToken: string | null };
        all = [...all, ...d2.places];
        pageToken = d2.nextPageToken;
        page++;
      }

      setResults(all.slice(0, 60));
      setSearched(true);

      if (data.isMock) {
        toast('Données de démonstration', {
          description: data.hint ?? 'Ajoutez GOOGLE_PLACES_API_KEY pour des données réelles.',
        });
      } else {
        toast.success(`${all.length} prospects trouvés`);
      }
    } catch (err: any) {
      toast.error('Erreur de recherche', { description: err?.message ?? 'Vérifiez votre connexion.' });
    } finally {
      setLoading(false);
      setPendingSearch(false);
    }
  }, [query, location]);

  // Deep scan: validate inputs, show 35s scan modal, then run actual search
  const handleSearch = useCallback(() => {
    if (!query.trim() || !location.trim()) {
      toast.error('Remplissez les deux champs de recherche');
      return;
    }
    setPendingSearch(true);
    setDeepScanOpen(true);
  }, [query, location]);

  const handleScanComplete = useCallback(() => {
    setDeepScanOpen(false);
    runActualSearch();
  }, [runActualSearch]);

  const alertCount = results.filter(r => r.status !== 'ok').length;

  return (
    <>
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Search size={18} className="text-primary" />
          </div>
          <div>
            <PageTitle>Lead Maps Scraper</PageTitle>
            <PageDescription>Trouvez des prospects locaux avec des problèmes de visibilité IA</PageDescription>
          </div>
        </div>
        {results.length > 0 && (
          <PageActions>
            <Button
              variant="outline"
              className="gap-2 text-sm"
              onClick={() => exportCSV(results, query, location)}
            >
              <Download size={15} />
              Exporter CSV / Excel
            </Button>
          </PageActions>
        )}
      </PageHeader>

      <PageBody>
        {/* Search form */}
        <Card className="p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="🔍 Métier / Secteur  (ex: Restaurant, Coiffeur, Plombier...)"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex-1 relative">
              <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-9"
                placeholder="📍 Ville / Code Postal  (ex: Paris 75001, Lyon, Bordeaux...)"
                value={location}
                onChange={e => setLocation(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button
              className="gap-2 shrink-0 px-6"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading
                ? <><RefreshCw size={15} className="animate-spin" /> Recherche...</>
                : <><Search size={15} /> Rechercher des prospects</>}
            </Button>
          </div>

          {/* Stats strip */}
          {searched && results.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users size={14} />
                <strong className="text-foreground">{results.length}</strong> établissements trouvés
              </span>
              <span className="flex items-center gap-1.5 text-amber-600">
                <AlertTriangle size={14} />
                <strong>{alertCount}</strong> opportunités détectées
              </span>
              {isMock && (
                <span className="text-[11px] text-muted-foreground italic">
                  (données de démo — ajoutez GOOGLE_PLACES_API_KEY pour des données réelles)
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {searched && results.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <Search size={40} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-base font-semibold text-foreground">Aucun résultat trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">Essayez un secteur plus large ou une ville différente.</p>
          </Card>
        )}

        {/* Results table */}
        {results.length > 0 && !loading && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">Nom du commerce</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">Téléphone</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">Site Web</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">Avis</th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((place) => (
                    <tr
                      key={place.placeId}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Name + address */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="font-semibold text-foreground truncate">{place.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{place.address}</p>
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {place.phone ? (
                          <a
                            href={`tel:${place.phone}`}
                            className="flex items-center gap-1.5 text-primary hover:underline text-xs font-medium"
                          >
                            <Phone size={12} /> {place.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </td>

                      {/* Website */}
                      <td className="px-4 py-3 whitespace-nowrap max-w-[160px]">
                        {place.website ? (
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-primary hover:underline text-xs font-medium truncate"
                          >
                            <Globe size={12} />
                            <span className="truncate">{place.website.replace(/^https?:\/\//, '').slice(0, 30)}</span>
                            <ExternalLink size={10} className="shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">Pas de site</span>
                        )}
                      </td>

                      {/* Reviews */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Star size={12} className="text-amber-400 fill-amber-400" />
                          <span className="font-semibold text-foreground text-xs">{place.rating}</span>
                          <span className="text-muted-foreground text-xs">({place.reviewCount})</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge place={place} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                {results.length} résultat{results.length > 1 ? 's' : ''} —{' '}
                <span className="text-amber-600 font-semibold">{alertCount} opportunité{alertCount > 1 ? 's' : ''}</span> d'approche commerciale
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => exportCSV(results, query, location)}
              >
                <Download size={13} /> 📥 Exporter CSV / Excel
              </Button>
            </div>
          </Card>
        )}

        {/* Initial empty state (before search) */}
        {!searched && !loading && (
          <div className="mt-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <MapPin size={28} className="text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">Trouvez vos prochains clients</p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Saisissez un secteur d'activité et une localité pour extraire jusqu'à 60 établissements
              avec leur statut de visibilité IA et leurs avis non répondus.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              {['Restaurant', 'Coiffeur', 'Plombier', 'Dentiste', 'Auto École', 'Boulangerie'].map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </PageBody>
    </Page>

    {/* MODULE 1: Deep Scan 35s modal */}
    <DeepScanProgressModal
      open={deepScanOpen}
      query={query}
      location={location}
      onComplete={handleScanComplete}
      onCancel={() => { setDeepScanOpen(false); setPendingSearch(false); }}
    />
    </>
  );
}
