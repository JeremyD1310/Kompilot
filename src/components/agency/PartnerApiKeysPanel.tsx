/**
 * PartnerApiKeysPanel — 🔑 Gestion des clés API Partenaire
 *
 * Permet aux clients B2B de générer des clés API pour intégrer
 * Kompilot dans leur SI (CRM, BI, automatisation).
 *
 * Routes:
 *   POST   /api/partner/keys     — generate new key
 *   GET    /api/partner/keys     — list keys
 *   DELETE /api/partner/keys/:id — revoke key
 *   GET    /api/v1/partner/*    — public partner data API
 */
import { useState, useEffect, useCallback } from 'react';
import { Key, Plus, Trash2, Copy, CheckCircle2, Eye, EyeOff, Clock, ExternalLink } from 'lucide-react';
import { Button, Card, CardContent, toast } from '@blinkdotnew/ui';
import { blink } from '@/blink/client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'https://gbrhsehk.backend.blink.new';
const PARTNER_API_BASE = `${BACKEND_URL}/api/v1/partner`;

interface ApiKeyEntry {
  id: string;
  keyName: string;
  prefix: string;
  scopes: string[];
  totalRequests: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

async function fetchAuthHeaders() {
  const token = await blink.auth.getValidToken();
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function PartnerApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null); // Only shown once
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const loadKeys = useCallback(async () => {
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/partner/keys`, { headers });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      // Backend may not be available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/partner/keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ keyName: `Clé API ${new Date().toLocaleDateString('fr-FR')}`, scopes: ['read'] }),
      });
      if (!res.ok) throw new Error('Erreur serveur');
      const data = await res.json();
      setNewKey(data.apiKey);
      setKeys(prev => [{
        id: data.id,
        keyName: data.keyName,
        prefix: data.prefix,
        scopes: data.scopes || ['read'],
        totalRequests: 0,
        lastUsedAt: null,
        expiresAt: null,
        isActive: true,
        createdAt: data.createdAt,
      }, ...prev]);
      toast.success('Clé API générée', {
        description: 'Copiez-la maintenant — elle ne sera plus affichée.',
      });
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    try {
      const headers = await fetchAuthHeaders();
      const res = await fetch(`${BACKEND_URL}/api/partner/keys/${keyId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Erreur serveur');
      setKeys(prev => prev.map(k => k.id === keyId ? { ...k, isActive: false } : k));
      toast.success('Clé révoquée');
    } catch (err: any) {
      toast.error('Erreur', { description: err.message });
    }
  };

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copié !');
    });
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── New key generation ── */}
      {newKey && (
        <div className="rounded-xl border-2 border-amber-400/40 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <Key size={14} /> Nouvelle clé API (affichée une seule fois)
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white rounded-lg border border-amber-200 px-3 py-2 font-mono break-all select-all">
              {newKey}
            </code>
            <Button size="sm" variant="outline" onClick={() => copyKey(newKey)} className="shrink-0 gap-1">
              <Copy size={12} /> Copier
            </Button>
          </div>
          <p className="text-[11px] text-amber-600">
            Conservez cette clé en lieu sûr. Elle ne sera plus jamais affichée.
          </p>
        </div>
      )}

      {/* ── Generate button ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground">Clés API</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Intégrez Kompilot dans vos outils (CRM, BI, Zapier) via l'API REST.
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-1.5 shrink-0"
          size="sm"
        >
          {generating ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <Plus size={14} />
          )}
          Générer une clé
        </Button>
      </div>

      {/* ── Keys list ── */}
      {keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center">
          <Key size={28} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Aucune clé API créée</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Générez une clé pour permettre à vos outils d'accéder aux données Kompilot.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {keys.map(k => (
            <div
              key={k.id}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{k.keyName}</span>
                  {!k.isActive && (
                    <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">
                      Révoquée
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-muted-foreground font-mono">{k.prefix}••••••••</code>
                  <button
                    onClick={() => toggleReveal(k.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={revealedKeys.has(k.id) ? 'Masquer' : 'Afficher'}
                  >
                    {revealedKeys.has(k.id) ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ExternalLink size={10} />
                    {k.totalRequests} requêtes
                  </span>
                  {k.lastUsedAt && (
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(k.lastUsedAt).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">
                    {k.scopes.join(', ')}
                  </span>
                </div>
              </div>
              {k.isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRevoke(k.id)}
                >
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Documentation hint ── */}
      <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-2">
        <p className="text-xs font-bold text-indigo-800">📡 Utilisation de l'API</p>
        <div className="bg-slate-900 rounded-lg p-3">
          <code className="text-[11px] text-emerald-400 font-mono block mb-1">
            curl -H "Authorization: Bearer kp_..." \
          </code>
          <code className="text-[11px] text-emerald-400 font-mono block">
            &nbsp;&nbsp;{PARTNER_API_BASE}/establishments
          </code>
        </div>
        <p className="text-[10px] text-indigo-600/70">
          Endpoints disponibles : établissements, posts programmés, analytics. Rate limit : 60 req/min.
        </p>
      </div>
    </div>
  );
}
