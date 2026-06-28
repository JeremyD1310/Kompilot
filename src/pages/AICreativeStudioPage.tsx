/**
 * AICreativeStudioPage — AI Creative Studio
 * ─────────────────────────────────────────
 * 1. AI Image Generation (DALL-E style via Blink AI)
 * 2. Video Script / UGC Storyboard Generator
 * 3. Smart Watermark (logo upload + auto-apply)
 *
 * Completing any generation marks the Creative Factory step ✅ in the Growth Checklist.
 */
import { useState } from 'react';
import { Page, PageHeader, PageTitle, PageDescription, PageBody } from '@blinkdotnew/ui';
import { Sparkles, Wand2, Video, Image as ImageIcon, Layers, Type, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
// MODULE 2: Typography Studio
import { TypographyStudioPanel } from '../components/cockpit/TypographyStudioPanel';
// MODULE NEW: Data-Driven AI Ads
import { DataDrivenAIAds } from '../components/cockpit/DataDrivenAIAds';
// MODULE: UGC Script Generator
import { UGCScriptSection } from '../components/cockpit/UGCScriptSection';
// MODULE: Enhanced UGC Script Panel (Hook → Body → CTA)
import { UGCScriptPanel } from '../components/creative/UGCScriptPanel';
// MODULE: URL-to-Video Ingestion
import { URLToVideoSection } from '../components/creative/URLToVideoSection';
// MODULE: Générateur d'annonces sectorielles (identique landing page)
import { KompilotAdGenerator } from '../components/landing/KompilotAdGenerator';
// Extracted creative sections
import { ImageGeneratorSection } from '../components/creative/ImageGeneratorSection';
import { WatermarkSection } from '../components/creative/WatermarkSection';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'image' | 'video' | 'watermark' | 'urltovideo' | 'ugc_hook';

// ── Main Component ────────────────────────────────────────────────────────────

export default function AICreativeStudioPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab | 'typography' | 'datadrivenads' | 'secteurs'>('image');

  return (
    <Page>
      <PageHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <PageTitle>🎨 AI Creative Studio</PageTitle>
            <PageDescription>
              Générez des visuels, scripts vidéos et appliquez votre branding automatiquement
            </PageDescription>
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* Tab bar */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl w-full sm:w-fit mb-6 border border-border overflow-x-auto">
          {([
            { id: 'datadrivenads', label: '⚡ Data-Driven Ads', icon: TrendingUp, highlight: true },
            { id: 'secteurs',   label: '🎯 Secteurs IA',     icon: TrendingUp },
            { id: 'image',      label: '🖼️ Images IA',       icon: ImageIcon },
            { id: 'video',      label: '🎬 Scripts Vidéos',  icon: Video },
            { id: 'ugc_hook',   label: '🎯 Script UGC',      icon: Sparkles },
            { id: 'urltovideo', label: '🔗 URL → Vidéo',     icon: Wand2 },
            { id: 'watermark',  label: '🔖 Smart Watermark', icon: Layers },
            { id: 'typography', label: '✏️ Studio Typo',      icon: Type },
          ] as { id: Tab | 'typography' | 'datadrivenads' | 'secteurs'; label: string; icon: any; highlight?: boolean }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-card text-primary shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'datadrivenads' && <DataDrivenAIAds />}
        {activeTab === 'secteurs'   && <KompilotAdGenerator variant="dashboard" />}
        {activeTab === 'image'      && <ImageGeneratorSection userId={user?.id} />}
        {activeTab === 'video'      && <UGCScriptSection      userId={user?.id} />}
        {activeTab === 'watermark'  && <WatermarkSection      userId={user?.id} />}
        {/* MODULE: URL-to-Video Ingestion */}
        {activeTab === 'urltovideo' && (
          <URLToVideoSection userId={user?.id} />
        )}
        {/* MODULE: Enhanced UGC Script (Hook → Body → CTA) */}
        {activeTab === 'ugc_hook' && (
          <UGCScriptPanel />
        )}
        {/* MODULE 2: Typography Studio with Social Mirror */}
        {activeTab === 'typography' && (
          <TypographyStudioPanel
            onApply={(text, fmt) => {
              // Notify user of the applied formatting
              import('@blinkdotnew/ui').then(({ toast }) => {
                toast.success('Formatage appliqué !', {
                  description: `Police : ${fmt.font} · ${[fmt.bold && 'Gras', fmt.italic && 'Italique', fmt.underline && 'Souligné'].filter(Boolean).join(', ') || 'Normal'}`,
                });
              });
            }}
          />
        )}
      </PageBody>
    </Page>
  );
}
