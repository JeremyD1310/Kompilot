/**
 * IntegrationsSectionAds — Section intégrations API pour LocalAdsCenterPage
 *
 * Regroupe les panneaux d'intégration :
 *   - OpenAI GPT-4o  (génération de campagnes, contenu, SEO, ad copy)
 *   - Anthropic Claude 3.5 Sonnet (co-working, analyse, plans détaillés)
 *   - Meta Marketing API (publicités Facebook/Instagram)
 *
 * Extrait de LocalAdsCenterPage pour maintenir ce fichier sous 300 lignes.
 */

import { useState } from 'react';
import { MetaIntegrationPanel }   from './MetaIntegrationPanel';
import { OpenAIIntegrationPanel } from '../ai/OpenAIIntegrationPanel';
import { ClaudeIntegrationPanel } from '../ai/ClaudeIntegrationPanel';

type IntegrationTab = 'openai' | 'claude' | 'meta';

interface TabDef {
  id: IntegrationTab;
  label: string;
  icon: string;
  color: string;
  activeColor: string;
  description: string;
}

const TABS: TabDef[] = [
  {
    id: 'openai',
    label: 'OpenAI GPT-4o',
    icon: '✦',
    color: 'border-border text-muted-foreground hover:bg-muted',
    activeColor: 'bg-violet-600 text-white border-violet-600 shadow-sm',
    description: 'Campagnes · Contenu · SEO · Ad Copy',
  },
  {
    id: 'claude',
    label: 'Claude 3.5 Sonnet',
    icon: '◆',
    color: 'border-border text-muted-foreground hover:bg-muted',
    activeColor: 'bg-amber-600 text-white border-amber-600 shadow-sm',
    description: 'Co-working · Analyse · Plans · Audit',
  },
  {
    id: 'meta',
    label: 'Meta Marketing',
    icon: '◈',
    color: 'border-border text-muted-foreground hover:bg-muted',
    activeColor: 'bg-blue-600 text-white border-blue-600 shadow-sm',
    description: 'Facebook · Instagram Ads',
  },
];

export function IntegrationsSectionAds() {
  const [tab, setTab] = useState<IntegrationTab>('openai');
  const active = TABS.find(t => t.id === tab)!;

  return (
    <div>
      {/* ── Séparateur titre ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
          Intégrations API
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* ── Onglets de sélection ────────────────────────────────────── */}
      <div className="flex gap-2 mb-1 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              tab === t.id ? t.activeColor : t.color
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Sous-titre de l'onglet actif ────────────────────────────── */}
      <p className="text-[11px] text-muted-foreground mb-4 pl-1">{active.description}</p>

      {/* ── Contenu ─────────────────────────────────────────────────── */}
      {tab === 'openai' && <OpenAIIntegrationPanel />}
      {tab === 'claude' && <ClaudeIntegrationPanel />}
      {tab === 'meta'   && <MetaIntegrationPanel />}
    </div>
  );
}
