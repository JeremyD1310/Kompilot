import { X, Clock, Tag, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@blinkdotnew/ui';
import type { AcademyModule } from '../../data/academyContent';
import { ACADEMY_CHANNELS } from '../../data/academyContent';

interface Props {
  module: AcademyModule | null;
  onClose: () => void;
}

export function AcademyCourseModal({ module, onClose }: Props) {
  if (!module) return null;

  const channel = ACADEMY_CHANNELS.find(c => c.id === module.channel);
  const isVideo = module.format === 'video';

  // Render markdown-like content as HTML (simple)
  function renderContent(raw: string) {
    return raw
      .trim()
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <p key={i} className="font-bold text-foreground mt-4 mb-1">{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={i} className="ml-4 text-muted-foreground text-sm">{line.slice(2)}</li>;
        }
        if (line.startsWith('#')) {
          const text = line.replace(/^#+\s/, '');
          return <h3 key={i} className="text-base font-bold text-foreground mt-4 mb-2">{text}</h3>;
        }
        if (line.trim() === '') return <div key={i} className="h-2" />;
        // Handle inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      });
  }

  return (
    <Dialog open={!!module} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="text-3xl shrink-0">{module.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {channel && (
                  <span className={`inline-flex items-center gap-1 rounded-full border text-[11px] font-bold px-2.5 py-0.5 ${channel.color}`}>
                    {channel.emoji} {channel.label}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 rounded-full border text-[11px] font-bold px-2.5 py-0.5 ${
                  module.tier === 'premium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}>
                  {module.tier === 'premium' ? '✨ Premium' : '🎓 Gratuit'}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock size={11} /> {module.duration}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-foreground leading-snug">{module.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{module.subtitle}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5">
          {isVideo ? (
            <div className="rounded-xl overflow-hidden bg-black aspect-video">
              <iframe
                src={module.content}
                title={module.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="prose-sm max-w-none space-y-0.5">
              {renderContent(module.content)}
            </div>
          )}

          {/* Tags */}
          {module.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-6 pt-4 border-t border-border">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Tag size={11} /> Tags :
              </span>
              {module.tags.map(tag => (
                <span key={tag} className="text-[11px] bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm font-semibold text-primary mb-1">🚀 Mettre en pratique maintenant</p>
            <p className="text-xs text-muted-foreground">
              Utilisez le <strong>Cockpit IA</strong> de Kompilot pour appliquer ces techniques directement sur vos réseaux.
            </p>
            <button
              onClick={() => { window.location.href = '/cockpit'; }}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              Aller au Cockpit IA <ExternalLink size={11} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
