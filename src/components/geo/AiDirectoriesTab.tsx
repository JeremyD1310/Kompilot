/**
 * AiDirectoriesTab — Annuaires IA
 * Grid of directory cards grouped by category with optimized descriptions
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, Copy, Check, ExternalLink, Award, Shield,
  Search, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, toast } from '@blinkdotnew/ui';
import { MOCK_AI_DIRECTORIES } from '../../lib/demoMockData';

const CATEGORY_ORDER = [
  'Annuaires Généraux',
  'Annuaires Sectoriels',
  'Bases de Données IA',
  'Répertoires de Référence',
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Annuaires Généraux': <Globe className="h-4 w-4" />,
  'Annuaires Sectoriels': <Search className="h-4 w-4" />,
  'Bases de Données IA': <Sparkles className="h-4 w-4" />,
  'Répertoires de Référence': <Award className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  listed: { label: 'Inscrit', variant: 'default' },
  pending: { label: 'En attente', variant: 'secondary' },
  not_submitted: { label: 'Non soumis', variant: 'outline' },
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

function DirectoryCard({ dir, index }: { dir: typeof MOCK_AI_DIRECTORIES[0]; index: number }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[dir.submissionStatus] ?? STATUS_CONFIG.not_submitted;

  const handleCopy = () => {
    navigator.clipboard.writeText(dir.optimizedDescription);
    setCopied(true);
    toast.success('Description copiée !');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={fadeIn}>
      <Card className="card-hover h-full flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{dir.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dir.description}</p>
            </div>
            <Badge variant={statusCfg.variant} className="shrink-0 text-xs">{statusCfg.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 pt-0">
          {/* DA Score */}
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Domain Authority</span>
            <span className="ml-auto text-sm font-semibold">{dir.domainAuthority}</span>
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${dir.domainAuthority}%` }}
              />
            </div>
          </div>

          {/* Optimized description — expandable */}
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Description optimisée
            </button>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-2"
              >
                <div className="p-3 rounded-lg bg-muted/50 text-xs text-foreground leading-relaxed">
                  {dir.optimizedDescription}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-7 text-xs gap-1.5"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copié !' : 'Copier la description'}
                </Button>
              </motion.div>
            )}
          </div>

          {/* Action button */}
          {dir.submissionStatus === 'not_submitted' && (
            <Button variant="outline" size="sm" className="mt-auto h-8 text-xs gap-1.5 w-full">
              <ExternalLink className="h-3 w-3" />
              Soumettre
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AiDirectoriesTab() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    icon: CATEGORY_ICONS[cat],
    directories: MOCK_AI_DIRECTORIES.filter((d) => d.category === cat),
  }));

  const listedCount = MOCK_AI_DIRECTORIES.filter((d) => d.submissionStatus === 'listed').length;
  const notSubmittedCount = MOCK_AI_DIRECTORIES.filter((d) => d.submissionStatus === 'not_submitted').length;

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="flex flex-wrap gap-4">
        <Card className="flex-1 min-w-[150px]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total annuaires</p>
              <p className="text-xl font-semibold">{MOCK_AI_DIRECTORIES.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[150px]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Inscrits</p>
              <p className="text-xl font-semibold text-emerald-600">{listedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[150px]">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">À soumettre</p>
              <p className="text-xl font-semibold text-amber-600">{notSubmittedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grouped directory grids */}
      {grouped.map((group, gi) => (
        <div key={group.category}>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary">{group.icon}</span>
            {group.category}
            <Badge variant="secondary" className="ml-1 text-xs">{group.directories.length}</Badge>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.directories.map((dir, di) => (
              <DirectoryCard key={dir.id} dir={dir} index={gi * 4 + di} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
