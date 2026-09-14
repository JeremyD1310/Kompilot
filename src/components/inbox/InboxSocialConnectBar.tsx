import { useMemo } from 'react';
import { Check, ExternalLink, Loader2, Plug, Share2 } from 'lucide-react';
import { Button, Card, CardContent, toast } from '@blinkdotnew/ui';
import {
  useGbpOAuthConnect, useGbpStatus,
  useMetaOAuthConnect, useMetaStatus,
  useTiktokOAuthConnect, useTiktokStatus,
  useYouTubeOAuthConnect, useYouTubeStatus,
  useLinkedInStatus,
} from '../../hooks/useSocialPublish';

export function InboxSocialConnectBar() {
  const meta = useMetaStatus();
  const google = useGbpStatus();
  const tiktok = useTiktokStatus();
  const youtube = useYouTubeStatus();
  const linkedin = useLinkedInStatus();
  const metaConnect = useMetaOAuthConnect();
  const googleConnect = useGbpOAuthConnect();
  const tiktokConnect = useTiktokOAuthConnect();
  const youtubeConnect = useYouTubeOAuthConnect();

  const connectedCount = useMemo(
    () => [meta.data?.connected, google.data?.connected, tiktok.data?.connected, youtube.data?.connected, linkedin.data?.connected].filter(Boolean).length,
    [meta.data?.connected, google.data?.connected, tiktok.data?.connected, youtube.data?.connected, linkedin.data?.connected],
  );

  const connect = (name: string, action: () => void) => {
    try { action(); } catch (error) {
      toast.error(`Connexion ${name} impossible`, { description: error instanceof Error ? error.message : 'Réessayez.' });
    }
  };

  const items = [
    { key: 'meta', label: 'Facebook + Instagram', connected: !!meta.data?.connected, loading: metaConnect.isPending, connect: () => connect('Meta', () => metaConnect.mutate()), icon: 'M' },
    { key: 'google', label: 'Google Business', connected: !!google.data?.connected, loading: googleConnect.isPending, connect: () => connect('Google', () => googleConnect.mutate()), icon: 'G' },
    { key: 'tiktok', label: 'TikTok', connected: !!tiktok.data?.connected, loading: tiktokConnect.isPending, connect: () => connect('TikTok', () => tiktokConnect.mutate()), icon: 'T' },
    { key: 'youtube', label: 'YouTube', connected: !!youtube.data?.connected, loading: youtubeConnect.isPending, connect: () => connect('YouTube', () => youtubeConnect.mutate()), icon: 'Y' },
    { key: 'linkedin', label: 'LinkedIn', connected: !!linkedin.data?.connected, loading: false, connect: () => connect('LinkedIn', () => { window.location.href = '/settings?tab=connexions'; }), icon: 'in' },
  ];

  return (
    <Card className="mx-3 mt-4 border-teal-200/70 bg-teal-50/40 shadow-none sm:mx-6">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white"><Share2 size={16} /></div>
            <div>
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-slate-900">Canaux de l’inbox</h2><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-teal-700">{connectedCount}/{items.length} actifs</span></div>
              <p className="mt-1 text-xs text-slate-600">Connectez vos comptes pour synchroniser les messages et répondre depuis Kompilot.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {items.map(item => <Button key={item.key} variant={item.connected ? 'outline' : 'default'} size="sm" onClick={item.connect} disabled={item.loading || item.connected} className="justify-start gap-2 bg-background text-xs"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-700">{item.icon}</span>{item.loading ? <Loader2 size={13} className="animate-spin" /> : item.connected ? <Check size={13} className="text-emerald-600" /> : <Plug size={13} />}{item.connected ? 'Connecté' : item.label}<ExternalLink size={11} className="ml-auto opacity-50" /></Button>)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
