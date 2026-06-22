/**
 * AgentRAGPanel — RAG-powered knowledge base for Claude Cowork agents.
 *
 * Features:
 * - Upload documents (PDF, TXT, MD) → blink.rag collection
 * - Semantic search with AI answer + source citations
 * - Per-user collection scoped by userId
 * - Document list with delete
 * - Streaming AI answers
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Database, Upload, Search, Trash2, FileText,
  Loader2, CheckCircle2, RefreshCw, X, AlertCircle,
} from 'lucide-react';
import { cn, toast } from '@blinkdotnew/ui';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DocEntry {
  id: string;
  filename: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  chunkCount?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function collectionName(userId: string) {
  return `cowork_rag_${userId.slice(0, 16).replace(/[^a-z0-9]/gi, '_')}`;
}

async function ensureCollection(userId: string) {
  const name = collectionName(userId);
  try {
    await blink.rag.createCollection({ name, description: 'Claude Cowork knowledge base' });
  } catch (err: any) {
    // Ignore 409 collection-already-exists
    if (!err?.message?.includes('409') && !err?.message?.includes('already exists') && err?.code !== 'COLLECTION_EXISTS') {
      throw err;
    }
  }
  return name;
}

// ── Upload row ────────────────────────────────────────────────────────────────

function DocRow({ doc, onDelete }: { doc: DocEntry; onDelete: (id: string) => void }) {
  const statusConfig: Record<DocEntry['status'], { icon: React.ReactNode; color: string; label: string }> = {
    pending:    { icon: <Loader2 size={11} className="animate-spin" />, color: 'text-slate-400', label: 'En attente' },
    processing: { icon: <Loader2 size={11} className="animate-spin" />, color: 'text-amber-400', label: 'Traitement…' },
    ready:      { icon: <CheckCircle2 size={11} />,                     color: 'text-emerald-400', label: 'Prêt' },
    error:      { icon: <AlertCircle size={11} />,                      color: 'text-red-400', label: 'Erreur' },
  };
  const cfg = statusConfig[doc.status];

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/40 border border-slate-700/40 group">
      <FileText size={14} className="text-slate-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-slate-200 truncate">{doc.filename}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn('flex items-center gap-1 text-[10px] font-bold', cfg.color)}>
            {cfg.icon} {cfg.label}
          </span>
          {doc.chunkCount !== undefined && doc.status === 'ready' && (
            <span className="text-[10px] text-slate-500">· {doc.chunkCount} segments</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(doc.id)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
        title="Supprimer"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AgentRAGPanel() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<{ filename: string; excerpt: string; score: number }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userId = user?.id ?? '';

  // Load existing docs on mount
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const name = collectionName(userId);
        const list = await blink.rag.listDocuments({ collectionId: name });
        setDocs((list ?? []).map((d: any) => ({
          id: d.id,
          filename: d.filename ?? d.name ?? 'Document',
          status: d.status ?? 'ready',
          chunkCount: d.chunkCount,
        })));
      } catch { /* first time — no collection yet */ }
    })();
  }, [userId]);

  const handleUpload = useCallback(async (file: File) => {
    if (!userId) return;
    setIsUploading(true);
    const tempId = `temp_${Date.now()}`;
    const newDoc: DocEntry = { id: tempId, filename: file.name, status: 'pending' };
    setDocs(prev => [newDoc, ...prev]);

    try {
      setUploadProgress('Préparation de la collection…');
      const name = await ensureCollection(userId);

      // Extract text for PDFs and uploads
      setUploadProgress('Extraction du contenu…');
      let content: string;
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Upload to storage first, then extract
        const storagePath = `rag/${userId}/${Date.now()}_${file.name}`;
        const storageResult = await blink.storage.upload(file, storagePath, { upsert: true });
        const extracted = await blink.data.extractFromUrl(storageResult.publicUrl);
        content = typeof extracted === 'string' ? extracted : '';
        if (!content.trim()) throw new Error('Impossible d\'extraire le texte du PDF');
      } else {
        content = await file.text();
      }

      setUploadProgress('Indexation du document…');
      setDocs(prev => prev.map(d => d.id === tempId ? { ...d, status: 'processing' } : d));

      const doc = await blink.rag.upload({
        collectionName: name,
        filename: file.name,
        content,
      });

      // Poll for ready
      setUploadProgress('Création des embeddings…');
      await blink.rag.waitForReady(doc.id, { timeoutMs: 120_000 });
      const ready = await blink.rag.getDocument(doc.id);

      setDocs(prev => prev.map(d =>
        d.id === tempId
          ? { id: doc.id, filename: file.name, status: 'ready', chunkCount: (ready as any).chunkCount }
          : d
      ));
      toast.success(`✅ "${file.name}" indexé avec succès`);
    } catch (err: any) {
      setDocs(prev => prev.map(d => d.id === tempId ? { ...d, status: 'error' } : d));
      toast.error(`Erreur d'indexation : ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  }, [userId]);

  const handleDelete = useCallback(async (docId: string) => {
    try {
      await blink.rag.deleteDocument(docId);
      setDocs(prev => prev.filter(d => d.id !== docId));
      toast.success('Document supprimé');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching || !userId) return;
    const readyDocs = docs.filter(d => d.status === 'ready');
    if (readyDocs.length === 0) {
      toast.error('Aucun document indexé', { description: 'Ajoutez d\'abord un document à votre base de connaissances.' });
      return;
    }
    setIsSearching(true);
    setAnswer('');
    setSources([]);

    try {
      const name = collectionName(userId);
      const stream = await blink.rag.aiSearch({
        collectionName: name,
        query: query.trim(),
        stream: true,
        model: 'google/gemini-3-flash',
      });

      const reader = (stream as ReadableStream).getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.type === 'text-delta') { accumulated += json.delta; setAnswer(accumulated); }
            if (json.type === 'sources') setSources(json.sources ?? []);
          } catch {}
        }
      }
    } catch (err: any) {
      toast.error('Erreur de recherche', { description: err.message });
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, userId, docs]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const readyCount = docs.filter(d => d.status === 'ready').length;

  return (
    <div className="rounded-2xl border bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border-teal-500/20 bg-slate-900/80 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400">
            <Database size={22} />
          </div>
          <div>
            <p className="font-bold text-sm text-white">Base de Connaissances RAG</p>
            <p className="text-[11px] text-slate-400">Indexez vos documents — les agents y accèdent en réponse</p>
          </div>
        </div>
        {readyCount > 0 && (
          <span className="text-[11px] font-bold text-teal-300 bg-teal-500/10 border border-teal-500/25 px-2.5 py-1 rounded-full">
            {readyCount} doc{readyCount > 1 ? 's' : ''} indexé{readyCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="px-5 pb-5 space-y-4">
        {/* Upload zone */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
            Ajouter un document
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 cursor-pointer transition-all',
              isUploading ? 'border-teal-500/40 bg-teal-500/5' : 'border-slate-700/60 hover:border-teal-500/40 hover:bg-teal-500/5'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 size={20} className="animate-spin text-teal-400" />
                <p className="text-[11px] font-bold text-teal-400">{uploadProgress || 'Traitement…'}</p>
              </>
            ) : (
              <>
                <Upload size={20} className="text-slate-500" />
                <p className="text-[12px] font-semibold text-slate-400">
                  Cliquez pour importer
                </p>
                <p className="text-[10px] text-slate-600">PDF · TXT · MD · Tout format texte</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.html"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {/* Document list */}
        {docs.length > 0 && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Documents indexés ({docs.length})
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {docs.map(doc => (
                <DocRow key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Search / Q&A */}
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2 block">
            Interroger la base de connaissances
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Ex: Quelles sont les conditions contractuelles ?"
              disabled={readyCount === 0}
              className="flex-1 rounded-xl bg-slate-800/60 border border-slate-700/60 text-sm text-slate-200 placeholder:text-slate-600 px-3 py-2.5 focus:outline-none focus:border-teal-500/50 transition-colors disabled:opacity-40"
            />
            <button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching || readyCount === 0}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all border shrink-0',
                query.trim() && readyCount > 0
                  ? 'bg-teal-500/15 border-teal-500/30 text-teal-300 hover:bg-teal-500/25'
                  : 'opacity-40 cursor-not-allowed border-slate-700/40 bg-slate-800/20 text-slate-500'
              )}
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </button>
          </div>
          {readyCount === 0 && (
            <p className="text-[10px] text-slate-600 mt-1.5">Indexez au moins un document pour interroger la base</p>
          )}
        </div>

        {/* Answer */}
        {(answer || isSearching) && (
          <div className="rounded-xl bg-slate-800/40 border border-teal-500/20 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/40">
              {isSearching
                ? <Loader2 size={12} className="animate-spin text-teal-400" />
                : <CheckCircle2 size={12} className="text-teal-400" />}
              <span className="text-[11px] font-bold text-teal-400">Réponse basée sur vos documents</span>
              {answer && (
                <button
                  onClick={() => { setAnswer(''); setSources([]); setQuery(''); }}
                  className="ml-auto text-slate-600 hover:text-slate-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="px-4 py-3">
              <p className="text-[12px] text-slate-200 leading-relaxed whitespace-pre-wrap">{answer || '…'}</p>
              {sources.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sources :</p>
                  {sources.slice(0, 3).map((s, i) => (
                    <div key={i} className="rounded-lg bg-slate-700/30 px-3 py-2">
                      <p className="text-[10px] font-bold text-teal-400">{s.filename}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{s.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
