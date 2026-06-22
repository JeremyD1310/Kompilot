/**
 * useURLSnapshot — Analyse une URL (site ou fiche Google) via l'IA
 * et retourne les données structurées du commerce pour pré-remplir
 * le formulaire d'inscription.
 *
 * Utilise le backend AI Router (MARKETING_COPY) pour analyser
 * l'URL fournie et extraire : nom, secteur, couleur principale, services.
 *
 * Usage :
 *   const { analyze, result, loading, error, reset } = useURLSnapshot();
 *   await analyze('https://restaurant-le-bistrot.fr');
 */

import { useState, useCallback } from 'react';
import type { GranularSector } from '@/lib/sectors/types';

/* ── Types exportés ──────────────────────────────────────────── */
export interface SnapshotData {
  businessName:   string;
  sector:         GranularSector | null;
  primaryColor:   string;          // ex: "#D97706"
  services:       string[];        // jusqu'à 5 services/produits détectés
  city:           string;
  phone:          string;
  website:        string;
  description:    string;
  confidence:     number;          // 0–1
}

type SnapshotStatus = 'idle' | 'loading' | 'success' | 'error';

/* ── Mapping mots-clés → secteur ────────────────────────────── */
const SECTOR_KEYWORDS: Record<GranularSector, string[]> = {
  restauration: ['restaurant', 'brasserie', 'bistrot', 'pizzeria', 'trattoria', 'gastronomique', 'boulangerie', 'café', 'bar', 'food'],
  beaute:       ['coiffeur', 'salon', 'beauté', 'esthétique', 'nail', 'onglerie', 'spa', 'massage', 'institut'],
  medical:      ['médecin', 'docteur', 'dentiste', 'kinésithérapie', 'ostéopathe', 'pharmacie', 'clinique', 'cabinet médical'],
  batiment:     ['bâtiment', 'construction', 'maçon', 'électricien', 'plombier', 'charpentier', 'BTP', 'rénovation'],
  artisan:      ['artisan', 'menuisier', 'carreleur', 'peintre', 'couvreur', 'ferronnerie', 'ébéniste', 'serrurier'],
  conciergerie: ['conciergerie', 'airbnb', 'location saisonnière', 'gestion locative', 'ménage', 'property'],
  retail:       ['boutique', 'magasin', 'commerce', 'vêtements', 'chaussures', 'décoration', 'librairie', 'fleuriste'],
  ecommerce:    ['boutique en ligne', 'e-commerce', 'shop', 'livraison', 'commande en ligne', 'produits'],
  assurance:    ['assurance', 'mutuelle', 'courtier', 'prévoyance', 'protection', 'garantie'],
  conseil:      ['conseil', 'consulting', 'cabinet', 'expertise', 'audit', 'formation', 'coaching', 'avocat', 'notaire'],
  immobilier:   ['immobilier', 'agence immobilière', 'promoteur', 'transaction', 'location', 'estimation'],
  agence:       ['agence', 'marketing', 'communication', 'digital', 'web', 'graphisme', 'publicité', 'media'],
  autre:        [],
};

function guessSectorFromText(text: string): GranularSector | null {
  const lower = text.toLowerCase();
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS) as [GranularSector, string[]][]) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) return sector;
  }
  return null;
}

/** Couleurs de fallback selon le secteur détecté */
const SECTOR_COLORS: Partial<Record<GranularSector, string>> = {
  restauration: '#D97706',
  beaute:       '#EC4899',
  medical:      '#0EA5E9',
  batiment:     '#F97316',
  artisan:      '#B45309',
  conciergerie: '#8B5CF6',
  retail:       '#10B981',
  ecommerce:    '#6366F1',
  assurance:    '#0D9488',
  conseil:      '#1E40AF',
  immobilier:   '#059669',
  agence:       '#7C3AED',
};

/* ── Hook ─────────────────────────────────────────────────────── */
export function useURLSnapshot() {
  const [status,  setStatus]  = useState<SnapshotStatus>('idle');
  const [result,  setResult]  = useState<SnapshotData | null>(null);
  const [error,   setError]   = useState<string>('');

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError('');
  }, []);

  const analyze = useCallback(async (url: string): Promise<SnapshotData | null> => {
    if (!url.trim()) return null;

    setStatus('loading');
    setResult(null);
    setError('');

    try {
      // Normalise l'URL
      let normalized = url.trim();
      if (!normalized.startsWith('http')) normalized = `https://${normalized}`;

      // Appel au backend AI Router
      const { aiGenerate } = await import('@/lib/aiRouterClient');
      const res = await aiGenerate({
        taskType: 'STRATEGIC_PLANNING',
        prompt: `Analyse cette URL et extrait les informations commerciales en JSON strict.
URL : ${normalized}

Retourne UNIQUEMENT un objet JSON valide (pas de markdown) avec ces champs :
{
  "businessName": "Nom exact du commerce (string)",
  "sector": "un de : restauration|beaute|medical|batiment|artisan|conciergerie|retail|ecommerce|assurance|conseil|immobilier|agence|autre",
  "primaryColor": "couleur hexadécimale principale du site (ex: #D97706)",
  "services": ["service1", "service2", "service3"],
  "city": "ville principale",
  "phone": "numéro si visible",
  "description": "1 phrase de description du commerce (max 80 chars)"
}

Si l'URL est une fiche Google Maps, extrait le nom, secteur et ville depuis l'URL.
Si tu ne peux pas analyser l'URL, retourne au moins businessName déduit de l'URL.`,
        forceJson: true,
        maxTokens: 400,
      });

      // Tente de parser le JSON
      let parsed: Partial<SnapshotData> = {};
      try {
        const raw = res.content.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        parsed = JSON.parse(raw);
      } catch {
        // Fallback : extraire le nom depuis l'URL
        const hostname = new URL(normalized).hostname.replace('www.', '');
        const parts    = hostname.split('.')[0].replace(/-/g, ' ');
        parsed.businessName = parts.charAt(0).toUpperCase() + parts.slice(1);
      }

      const sector    = (parsed.sector as GranularSector) ?? guessSectorFromText(parsed.businessName ?? '');
      const snapshot: SnapshotData = {
        businessName:   parsed.businessName  ?? '',
        sector,
        primaryColor:   parsed.primaryColor  ?? (sector ? (SECTOR_COLORS[sector] ?? '#0D9488') : '#0D9488'),
        services:       Array.isArray(parsed.services) ? parsed.services.slice(0, 5) : [],
        city:           parsed.city          ?? '',
        phone:          parsed.phone         ?? '',
        website:        normalized,
        description:    parsed.description   ?? '',
        confidence:     parsed.businessName  ? 0.85 : 0.4,
      };

      setResult(snapshot);
      setStatus('success');
      return snapshot;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible d\'analyser cette URL';
      setError(msg);
      setStatus('error');
      return null;
    }
  }, []);

  return { analyze, result, status, loading: status === 'loading', error, reset };
}
