import { useState } from 'react';
import { Badge, toast } from '@blinkdotnew/ui';
import { BookMarked, Trash2, RefreshCw, ToggleLeft, ToggleRight, CalendarClock, ChevronDown, ChevronUp } from 'lucide-react';
import { useContentLibrary } from '../../context/ContentLibraryContext';

const COLORS: Record<string, string> = { website: 'bg-primary/80', linkedin: 'bg-blue-600', instagram: 'bg-pink-500', tiktok: 'bg-foreground', facebook: 'bg-blue-500', google_business: 'bg-orange-500' };
const LABELS: Record<string, string> = { website: 'Web', linkedin: 'LI', instagram: 'IG', tiktok: 'TT', facebook: 'FB', google_business: 'GB' };

function ChannelDot({ ch }: { ch: string }) {
  return <span className={`inline-flex items-center justify-center rounded-full text-[9px] font-bold text-white w-5 h-5 shrink-0 ${COLORS[ch] ?? 'bg-muted'}`}>{LABELS[ch] ?? '?'}</span>;
}

export function PermanentContentSection() {
  const { library, removeFromLibrary, toggleAutoRepublish } = useContentLibrary();
  const [collapsed, setCollapsed] = useState(false);

  const activeCount = library.filter(p => p.autoRepublish).length;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button type="button" onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BookMarked size={17} className="text-primary" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground flex items-center gap-2">
              Contenus Permanents
              {activeCount > 0 && (
                <span className="rounded-full bg-green-100 text-green-700 text-[11px] font-bold px-2 py-0.5 flex items-center gap-1">
                  <RefreshCw size={9} /> {activeCount} actif{activeCount > 1 ? 's' : ''}
                </span>
              )}
              <Badge variant="secondary" className="text-[11px] rounded-full">{library.length}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Posts republiés automatiquement quand le calendrier est vide.</p>
          </div>
        </div>
        {collapsed ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronUp size={16} className="text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-3">
          {library.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <BookMarked size={28} className="opacity-30" />
              <p className="text-sm font-medium">Bibliothèque vide</p>
              <p className="text-xs">Cochez "Ajouter à la bibliothèque" lors de la création.</p>
            </div>
          ) : library.map(post => (
            <div key={post.id} className={`rounded-xl border p-4 space-y-3 transition-all bg-card ${post.autoRepublish ? 'border-primary/30' : 'border-border'}`}>
              <p className="text-sm text-foreground leading-relaxed line-clamp-3">{post.text}</p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">{post.channels.map(c => <ChannelDot key={c} ch={c} />)}</div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1"><CalendarClock size={11} /> {post.addedAt}</span>
                  <button type="button" onClick={() => { toggleAutoRepublish(post.id); toast(post.autoRepublish ? 'Republication désactivée' : 'Republication automatique activée'); }}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-all ${post.autoRepublish ? 'bg-green-100 text-green-700 border-green-300' : 'bg-muted text-muted-foreground border-border'}`}>
                    {post.autoRepublish ? <><ToggleRight size={13} /> Auto-republier</> : <><ToggleLeft size={13} /> Inactif</>}
                  </button>
                  <button type="button" onClick={() => { removeFromLibrary(post.id); toast('Contenu retiré de la bibliothèque.'); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}