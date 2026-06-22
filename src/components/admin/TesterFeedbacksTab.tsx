import { useState } from 'react';
import { Star, Trash2, MessageSquare, FlaskConical, Download } from 'lucide-react';
import { type TesterFeedback } from '../../context/AdminContext';

function StarDisplay({ rating }: { rating: number }) {
  if (rating === 0) return <span className="text-[11px] text-slate-500 italic">Pas de note</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={13}
          className={i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
        />
      ))}
      <span className="ml-1.5 text-xs text-slate-400">{rating}/5</span>
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  if (rating === 0) return null;
  const color =
    rating >= 4 ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50' :
    rating === 3 ? 'bg-amber-900/40 text-amber-400 border-amber-700/50' :
    'bg-red-900/40 text-red-400 border-red-700/50';
  const label = rating === 5 ? 'Excellent' : rating === 4 ? 'Très bien' : rating === 3 ? 'Bien' : rating === 2 ? 'Passable' : 'Mauvais';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border text-[10px] font-bold px-2 py-0.5 ${color}`}>
      {label}
    </span>
  );
}

interface Props {
  feedbacks: TesterFeedback[];
  onDelete: (id: string) => void;
}

export function TesterFeedbacksTab({ feedbacks, onDelete }: Props) {
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const avgRating = feedbacks.length > 0 && feedbacks.some(f => f.rating > 0)
    ? (feedbacks.filter(f => f.rating > 0).reduce((s, f) => s + f.rating, 0) / feedbacks.filter(f => f.rating > 0).length).toFixed(1)
    : null;

  const filtered = feedbacks.filter(f =>
    filterRating === 'all' || f.rating === filterRating
  );

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const exportCSV = () => {
    const rows = [
      ['ID', 'Note', 'Commentaire', 'Date'],
      ...feedbacks.map(f => [f.id, String(f.rating), `"${f.comment.replace(/"/g, '""')}"`, f.date]),
    ];
    const blob = new Blob([rows.map(r => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'retours_testeurs_kompilot.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">

      {/* Header KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-100">{feedbacks.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Retours reçus</p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-400">
            {avgRating ? `★ ${avgRating}` : '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Note moyenne</p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-400">
            {feedbacks.filter(f => f.rating >= 4).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Avis positifs (4-5★)</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-800/50 rounded-xl p-1">
          {(['all', 5, 4, 3, 2, 1] as const).map(r => (
            <button
              key={r}
              onClick={() => setFilterRating(r)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                filterRating === r
                  ? 'bg-orange-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {r === 'all' ? 'Tous' : `${r}★`}
            </button>
          ))}
        </div>
        {feedbacks.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-1.5 transition-all"
          >
            <Download size={12} /> Exporter CSV
          </button>
        )}
      </div>

      {/* Feedback list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-500">
          {feedbacks.length === 0 ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                <FlaskConical size={28} className="opacity-40" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-400">Aucun retour testeur pour l'instant</p>
                <p className="text-xs text-slate-600">Les retours envoyés via le widget "💡 Votre avis" apparaîtront ici en temps réel.</p>
              </div>
            </>
          ) : (
            <p className="text-sm">Aucun retour avec cette note.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb, i) => (
            <div
              key={fb.id}
              className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 hover:border-slate-600 transition-colors"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Number */}
                  <div className="w-8 h-8 rounded-xl bg-orange-600/20 flex items-center justify-center text-[11px] font-extrabold text-orange-400 shrink-0">
                    #{feedbacks.length - feedbacks.indexOf(fb)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StarDisplay rating={fb.rating} />
                      <RatingBadge rating={fb.rating} />
                    </div>
                    <p className="text-[11px] text-slate-500">{fb.date}</p>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(fb.id)}
                  className={`flex items-center gap-1 text-[11px] rounded-lg px-2 py-1 transition-all shrink-0 ${
                    confirmDelete === fb.id
                      ? 'bg-red-900/40 text-red-400 border border-red-700/50'
                      : 'text-slate-600 hover:text-red-400 hover:bg-red-900/20'
                  }`}
                  title="Supprimer ce retour"
                >
                  <Trash2 size={12} />
                  {confirmDelete === fb.id ? 'Confirmer ?' : ''}
                </button>
              </div>

              {fb.comment ? (
                <div className="mt-3 bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700/50">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={13} className="text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{fb.comment}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-600 italic">Aucun commentaire écrit.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
