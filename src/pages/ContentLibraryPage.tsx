import React, { useState, useMemo } from 'react';
import { 
  Page, 
  PageHeader, 
  PageTitle, 
  PageBody, 
  PageActions, 
  Button, 
  Badge, 
  DataTable, 
  EmptyState, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  toast,
  Card,
  CardContent,
  Persona,
  Stat,
  StatGroup
} from '@blinkdotnew/ui';
import { 
  Search, 
  RotateCcw, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Globe
} from 'lucide-react';
import { LinkedinIcon, InstagramIcon, FacebookIcon } from '../components/icons/SocialIcons';
import { useContentLibrary, LibraryPost } from '../context/ContentLibraryContext';
import { blink } from '../blink/client';

// --- Components ---

const ChannelIcon = ({ channel }: { channel: string }) => {
  switch (channel.toLowerCase()) {
    case 'linkedin': return <LinkedinIcon className="w-3 h-3" />;
    case 'instagram': return <InstagramIcon className="w-3 h-3" />;
    case 'facebook': return <FacebookIcon className="w-3 h-3" />;
    default: return <Globe className="w-3 h-3" />;
  }
};

const PerformanceScoreBadge = ({ score }: { score: 'top' | 'good' | 'average' | 'low' | undefined }) => {
  if (!score) return null;
  
  const config = {
    top: { label: '🔥 Top', variant: 'default' as const, className: 'bg-orange-500 text-white border-none' },
    good: { label: '✅ Bon', variant: 'secondary' as const, className: 'bg-emerald-500 text-white border-none' },
    average: { label: '〰️ Moyen', variant: 'outline' as const, className: 'text-muted-foreground' },
    low: { label: '📉 Bas', variant: 'outline' as const, className: 'text-muted-foreground opacity-50' },
  };
  
  const { label, className } = config[score];
  return <Badge className={className}>{label}</Badge>;
};

const PostCard = ({ post, onRecycle }: { post: LibraryPost, onRecycle: (post: LibraryPost) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const isHighPerformer = post.performance?.score === 'top' || post.performance?.score === 'good';

  const borderColor = useMemo(() => {
    if (post.performance?.score === 'top') return 'border-l-orange-500';
    if (post.performance?.score === 'good') return 'border-l-emerald-500';
    return 'border-l-slate-300';
  }, [post.performance?.score]);

  return (
    <Card className={`relative overflow-hidden border-l-4 ${borderColor} transition-all hover:shadow-md`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-1.5">
            {post.channels.map(ch => (
              <Badge key={ch} variant="outline" className="flex items-center gap-1 py-0 px-2 h-6 text-[10px] uppercase font-bold tracking-wider">
                <ChannelIcon channel={ch} /> {ch}
              </Badge>
            ))}
          </div>
          <PerformanceScoreBadge score={post.performance?.score} />
        </div>

        <div className="mb-4">
          <p className={`text-sm text-foreground whitespace-pre-wrap leading-relaxed ${!expanded ? 'line-clamp-3' : ''}`}>
            {post.text}
          </p>
          {post.text.length > 150 && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> Voir moins</> : <><ChevronDown className="w-3 h-3" /> Voir plus</>}
            </button>
          )}
        </div>

        {post.performance && (
          <div className="grid grid-cols-4 gap-2 py-3 border-y border-border/50 mb-4 bg-muted/20 rounded-lg px-3">
            <div className="text-center">
              <span className="block text-[10px] text-muted-foreground uppercase font-bold">Vues</span>
              <span className="text-sm font-semibold">{post.performance.views.toLocaleString()}</span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] text-muted-foreground uppercase font-bold">Likes</span>
              <span className="text-sm font-semibold">{post.performance.likes.toLocaleString()}</span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] text-muted-foreground uppercase font-bold">Shares</span>
              <span className="text-sm font-semibold">{post.performance.shares.toLocaleString()}</span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] text-muted-foreground uppercase font-bold">Reach</span>
              <span className="text-sm font-semibold">{(post.performance.reach / 1000).toFixed(1)}k</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Clock className="w-3 h-3" />
            {post.publishedAt ? `Publié le ${new Date(post.publishedAt).toLocaleDateString('fr-FR')}` : 'Non publié'}
            {post.isRecycled && <Badge variant="secondary" className="text-[9px] h-4">Recyclé</Badge>}
          </div>
          
          {isHighPerformer && (
            <Button 
              size="sm" 
              variant="outline" 
              className="gap-2 text-xs h-8 border-primary/30 hover:border-primary hover:bg-primary/5"
              onClick={() => onRecycle(post)}
            >
              <Sparkles className="w-3 h-3 text-primary" /> Recycler avec IA
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const RecycleModal = ({ 
  post, 
  isOpen, 
  onClose 
}: { 
  post: LibraryPost | null, 
  isOpen: boolean, 
  onClose: () => void 
}) => {
  const { recyclePost } = useContentLibrary();
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!post) return;
    setLoading(true);
    try {
      const response = await blink.ai.generateObject({
        prompt: `Réécris ce post avec un angle complètement différent, même thème mais formulation nouvelle, pour republier 3 mois plus tard sans paraître répétitif. Post original: ${post.text}`,
        schema: {
          type: 'object',
          properties: {
            newText: { type: 'string' }
          },
          required: ['newText']
        }
      });
      setNewText(response.newText);
    } catch (error) {
      toast.error("Erreur lors de la génération IA");
    } finally {
      setLoading(false);
    }
  };

  const handleRecycle = () => {
    if (!post || !newText) return;
    recyclePost(post.id, newText);
    toast.success("Post recyclé !", { description: "Planifié pour dans 3 mois." });
    onClose();
    setNewText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Recyclage intelligent
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Post original</h4>
            <div className="p-3 bg-muted rounded-md text-sm italic line-clamp-3">
              "{post?.text}"
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Nouvelle version (IA)</h4>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 text-[10px]" 
                onClick={handleGenerate}
                disabled={loading}
              >
                {newText ? "Régénérer" : "Générer un nouvel angle"}
              </Button>
            </div>
            
            {loading ? (
              <div className="h-32 flex flex-col items-center justify-center gap-3 bg-primary/5 border border-primary/20 border-dashed rounded-md">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-xs text-primary animate-pulse">L'IA rédige un nouvel angle...</span>
              </div>
            ) : (
              <Textarea 
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Le contenu réécrit apparaîtra ici..."
                className="min-h-[140px] text-sm leading-relaxed"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button onClick={handleRecycle} disabled={!newText || loading}>
            Planifier le recyclage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Page ---

export default function ContentLibraryPage() {
  const { library } = useContentLibrary();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [recycleModalPost, setRecycleModalPost] = useState<LibraryPost | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const total = library.length;
    const avgViews = total > 0 
      ? Math.round(library.reduce((acc, p) => acc + (p.performance?.views || 0), 0) / total)
      : 0;
    const topPerformers = library.filter(p => p.performance?.score === 'top').length;
    const recycled = library.filter(p => p.isRecycled).length;
    
    return { total, avgViews, topPerformers, recycled };
  }, [library]);

  const filteredPosts = useMemo(() => {
    let result = [...library];

    // Search filter
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p => p.text.toLowerCase().includes(s));
    }

    // Category filter
    if (filter === 'top') {
      result = result.filter(p => p.performance?.score === 'top');
    } else if (filter === 'recycle') {
      result = result.filter(p => (p.performance?.score === 'top' || p.performance?.score === 'good') && !p.isRecycled);
    } else if (filter === 'recycled') {
      result = result.filter(p => p.isRecycled);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'performance') {
        return (b.performance?.views || 0) - (a.performance?.views || 0);
      }
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    });

    return result;
  }, [library, search, filter, sortBy]);

  return (
    <Page>
      <PageHeader>
        <div>
          <PageTitle>Bibliothèque de Contenus</PageTitle>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Anti-Doublon actif
            </span>
            <span className="text-[11px] text-muted-foreground">Protection 60 jours · Reformulation IA automatique</span>
          </div>
        </div>
        <PageActions>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Ajouter un post
          </Button>
        </PageActions>
      </PageHeader>

      <PageBody className="space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Contenus</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-500/5 border-emerald-500/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Vues Moyennes</p>
                <h3 className="text-2xl font-bold">{stats.avgViews.toLocaleString()}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/5 border-orange-500/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-full text-orange-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Top Performers</p>
                <h3 className="text-2xl font-bold">{stats.topPerformers}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-violet-500/5 border-violet-500/10">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/10 rounded-full text-violet-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Recyclés IA</p>
                <h3 className="text-xl font-bold">{stats.recycled}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-3 rounded-xl border shadow-sm">
          <Tabs value={filter} onValueChange={setFilter} className="w-full md:w-auto">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="all" className="text-xs px-4">Tous</TabsTrigger>
              <TabsTrigger value="top" className="text-xs px-4">Top Performers</TabsTrigger>
              <TabsTrigger value="recycle" className="text-xs px-4">À Recycler</TabsTrigger>
              <TabsTrigger value="recycled" className="text-xs px-4">Recyclés</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un post..." 
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">Plus récents</SelectItem>
                <SelectItem value="performance" className="text-xs">Meilleures performances</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onRecycle={(p) => setRecycleModalPost(p)} 
              />
            ))}
          </div>
        ) : (
          <div className="py-20 border-2 border-dashed rounded-3xl">
            <EmptyState 
              icon={<RotateCcw className="w-12 h-12 text-muted-foreground/30" />}
              title="Aucun contenu trouvé"
              description="Ajustez vos filtres ou lancez une nouvelle recherche pour trouver ce que vous cherchez."
              action={{
                label: "Réinitialiser les filtres",
                onClick: () => { setFilter('all'); setSearch(''); }
              }}
            />
          </div>
        )}
      </PageBody>

      <RecycleModal 
        isOpen={!!recycleModalPost} 
        onClose={() => setRecycleModalPost(null)} 
        post={recycleModalPost} 
      />
    </Page>
  );
}
