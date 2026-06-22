import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Input } from '@blinkdotnew/ui';
import { Search, RefreshCw, Images, Video } from 'lucide-react';
import { VideoPickerTab } from './VideoPickerTab';

/* ── Photo pool ───────────────────────────────────────────────────────────── */
const IMAGE_POOL = [
  { id: 'i1',  url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80', alt: 'Bureau moderne', tags: ['bureau', 'travail', 'entreprise'] },
  { id: 'i2',  url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80', alt: 'Réunion équipe', tags: ['équipe', 'réunion', 'business'] },
  { id: 'i3',  url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&q=80', alt: 'Télétravail', tags: ['télétravail', 'ordinateur', 'bureau'] },
  { id: 'i4',  url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=80', alt: 'Collaboration', tags: ['collaboration', 'équipe', 'projet'] },
  { id: 'i5',  url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&q=80', alt: 'Tech startup', tags: ['tech', 'startup', 'digital'] },
  { id: 'i6',  url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80', alt: 'Espace de travail', tags: ['espace', 'bureau', 'créatif'] },
  { id: 'i7',  url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80', alt: 'Meeting', tags: ['meeting', 'discussion', 'business'] },
  { id: 'i8',  url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80', alt: 'Analytics', tags: ['analytics', 'données', 'graphique'] },
  { id: 'i9',  url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80', alt: 'Croissance', tags: ['croissance', 'succès', 'graphique'] },
  { id: 'i10', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80', alt: 'Professionnel', tags: ['professionnel', 'costume', 'business'] },
  { id: 'i11', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&q=80', alt: 'Équipe créative', tags: ['créatif', 'équipe', 'design'] },
  { id: 'i12', url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&q=80', alt: 'Sourire client', tags: ['client', 'satisfaction', 'sourire'] },
  { id: 'i13', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', alt: 'Femme professionnelle', tags: ['femme', 'business', 'professionnel'] },
  { id: 'i14', url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=400&q=80', alt: 'Marketing digital', tags: ['marketing', 'digital', 'réseaux'] },
  { id: 'i15', url: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&q=80', alt: 'Café bureau', tags: ['café', 'détente', 'pause'] },
  { id: 'i16', url: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=400&q=80', alt: 'Laptop moderne', tags: ['laptop', 'technologie', 'travail'] },
  { id: 'i17', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80', alt: 'Restaurant gastronomique', tags: ['restaurant', 'gastronomie', 'repas', 'nourriture'] },
  { id: 'i18', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80', alt: 'Pizza artisanale', tags: ['pizza', 'nourriture', 'restaurant', 'artisan'] },
  { id: 'i19', url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80', alt: 'Assiette gastronomique', tags: ['assiette', 'gastronomie', 'chef', 'cuisine'] },
  { id: 'i20', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', alt: 'Repas sain', tags: ['salade', 'sain', 'nourriture', 'légumes'] },
  { id: 'i21', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80', alt: 'Hôtel luxe', tags: ['hôtel', 'luxe', 'chambre', 'hébergement'] },
  { id: 'i22', url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&q=80', alt: 'Service client', tags: ['service', 'client', 'satisfaction', 'sourire'] },
  { id: 'i23', url: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&q=80', alt: 'Café latte', tags: ['café', 'latte', 'boisson', 'pause'] },
  { id: 'i24', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&q=80', alt: 'Boutique moderne', tags: ['boutique', 'commerce', 'magasin', 'shopping'] },
  { id: 'i25', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80', alt: 'Commerce local', tags: ['commerce', 'local', 'artisan', 'boutique'] },
  { id: 'i26', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80', alt: 'Sport fitness', tags: ['sport', 'fitness', 'musculation', 'santé'] },
  { id: 'i27', url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', alt: 'Yoga bien-être', tags: ['yoga', 'bien-être', 'relaxation', 'sport'] },
  { id: 'i28', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=80', alt: 'Shopping sacs', tags: ['shopping', 'mode', 'sacs', 'tendance'] },
  { id: 'i29', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&q=80', alt: 'Bénévolat solidarité', tags: ['solidarité', 'engagement', 'équipe', 'communauté'] },
  { id: 'i30', url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&q=80', alt: 'Anniversaire célébration', tags: ['fête', 'anniversaire', 'célébration', 'événement'] },
];

type Tab = 'photos' | 'videos';

interface ImagePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, type?: 'image' | 'video') => void;
  textContext?: string;
}

export function ImagePickerModal({ open, onClose, onSelect, textContext }: ImagePickerModalProps) {
  const [tab, setTab] = useState<Tab>('photos');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shuffleKey, setShuffleKey] = useState(0);

  /* ── Auto-populate query from textContext when modal opens ── */
  useEffect(() => {
    if (!open) return;
    if (!textContext?.trim()) return;
    const keywords = textContext
      .toLowerCase()
      .replace(/[^a-zàâäéèêëîïôöùûü\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 2)
      .join(' ');
    if (keywords) setQuery(keywords);
  }, [open, textContext]);

  /* ── Filtered + shuffled pool ── */
  const filtered = useMemo(() => {
    const pool = query.trim()
      ? IMAGE_POOL.filter(img =>
          img.alt.toLowerCase().includes(query.toLowerCase()) ||
          img.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
        )
      : IMAGE_POOL;
    return [...pool].sort(() => (shuffleKey ? Math.random() - 0.5 : 0));
  }, [query, shuffleKey]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearching(true);
    setTimeout(() => setSearching(false), 600);
  };

  const handleClose = () => {
    onClose();
    setSelectedId(null);
    setQuery('');
    setTab('photos');
    setShuffleKey(0);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle>Ajouter un média</DialogTitle>
        </DialogHeader>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 px-5 pt-4 pb-3 shrink-0 border-b border-border">
          {([
            { id: 'photos', label: 'Photos',     icon: Images },
            { id: 'videos', label: 'Vidéos IA',  icon: Video  },
          ] as { id: Tab; label: string; icon: React.FC<{size?: number; className?: string}> }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon size={14} />
              {label}
              {id === 'videos' && tab !== 'videos' && (
                <span className="text-[9px] font-bold bg-primary/15 text-primary rounded-full px-1.5 py-0.5">
                  PRO
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4">
          {tab === 'photos' ? (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Ex : bureau, équipe, digital, marketing..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSearching(false); }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    className="pl-8"
                  />
                </div>
                <Button onClick={handleSearch} variant="outline" className="gap-2 shrink-0">
                  {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                  Rechercher
                </Button>
                <Button
                  onClick={() => setShuffleKey(k => k + 1)}
                  variant="outline"
                  className="gap-1.5 shrink-0 text-xs"
                >
                  <RefreshCw size={13} />
                  Autres
                </Button>
              </div>

              {/* Photo grid */}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Search size={28} className="opacity-30" />
                  <p className="text-sm">Aucune image trouvée pour « {query} »</p>
                  <button onClick={() => setQuery('')} className="text-xs text-primary underline">Voir toutes les images</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {filtered.map(img => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => {
                        onSelect(img.url, 'image');
                        handleClose();
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary/40 hover:scale-[1.02] transition-all duration-150"
                    >
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1 opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] truncate">{img.alt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground text-center">Photos libres de droits — Unsplash</p>
            </div>
          ) : (
            <VideoPickerTab
              onSelect={(url, type) => {
                onSelect(url, type);
                onClose();
              }}
            />
          )}
        </div>

        {/* ── Footer (only for photos tab) ── */}
        {tab === 'photos' && (
          <div className="flex items-center justify-end shrink-0 px-5 py-3 border-t border-border">
            <Button variant="ghost" onClick={handleClose}>Annuler</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
