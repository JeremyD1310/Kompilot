/**
 * useReferral — Fidélisation & Parrainage
 *
 * Manages referral campaigns, unique secure links, and conversion tracking.
 * DB tables: referral_campaigns, referral_links, referral_conversions
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';
import { useEstablishment } from '../context/EstablishmentContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ReferralCampaign {
  id: string;
  userId: string;
  establishmentId: string;
  isActive: boolean;
  discountPercent: number;
  sponsorDiscountPercent: number;
  avgBasketAmount: number;
  messageTemplate: string;
  channel: 'whatsapp' | 'sms';
  sector: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralLink {
  id: string;
  userId: string;
  campaignId: string;
  establishmentId: string;
  sponsorName: string;
  sponsorReviewRating: number;
  shortCode: string;
  clickCount: number;
  conversionCount: number;
  thankYouSent: boolean;
  createdAt: string;
}

export interface ReferralConversion {
  id: string;
  referralLinkId: string;
  userId: string;
  newClientName?: string;
  newClientPhone?: string;
  revenueGenerated: number;
  convertedAt: string;
}

export interface ReferralStats {
  thankYousSent: number;
  linksShared: number;
  newClientsGenerated: number;
  additionalRevenue: number;
}

// ── AI message templates by sector ────────────────────────────────────────────

const SECTOR_TEMPLATES: Record<string, string> = {
  restauration: `Merci pour votre superbe avis Google, {client.name} ! 🌟 Pour vous remercier, offrez {discount}% de réduction à un ami sur sa première visite chez nous en lui transférant ce lien : {link}. Dès qu'il l'utilise, vous recevez également {sponsorDiscount}% sur votre prochaine commande ! 🎁`,
  coiffure: `Merci {client.name} pour votre magnifique avis ! ✂️💫 Partagez cette offre exclusive à vos proches : {link}. Ils bénéficient de {discount}% sur leur 1ère visite et vous gagnez {sponsorDiscount}% sur votre prochaine coupe !`,
  beaute: `Merci {client.name} pour votre avis 5 étoiles ! 💅✨ Faites profiter vos amies : {link} — {discount}% de réduction sur leur 1er soin. Et vous ? {sponsorDiscount}% offerts sur votre prochaine prestation beauté !`,
  sante: `Merci {client.name} pour votre confiance ! 🙏 Recommandez-nous à vos proches via ce lien personnel : {link}. Ils reçoivent {discount}% de remise sur leur 1ère consultation, et vous bénéficiez de {sponsorDiscount}% sur votre prochain rendez-vous.`,
  commerce: `Merci {client.name} pour votre avis ⭐⭐⭐⭐⭐ ! Partagez ce lien unique à un ami : {link}. Il obtient {discount}% de réduction sur sa 1ère commande, et vous gagnez {sponsorDiscount}% de bon d'achat. Win-win ! 🎉`,
  general: `Merci {client.name} pour votre magnifique avis ! 🌟 En gage de reconnaissance, partagez ce lien à vos proches : {link}. Ils bénéficient de {discount}% de réduction et vous recevez {sponsorDiscount}% sur votre prochain achat !`,
};

// ── Short code generator ───────────────────────────────────────────────────────

function generateShortCode(sponsorName: string): string {
  const clean = sponsorName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 4);
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${clean}${random}`;
}

function generateId(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useReferral() {
  const { user } = useAuth();
  const { activeEstablishment } = useEstablishment();
  const queryClient = useQueryClient();

  const estId = activeEstablishment?.id;

  // ── Fetch campaign for current establishment ──────────────────────────────

  const { data: campaignData, isLoading: campaignLoading } = useQuery({
    queryKey: ['referral_campaign', user?.id, estId],
    queryFn: async () => {
      if (!user?.id || !estId) return null;
      try {
        const rows = await (blink.db as any).referralCampaigns.list({
          where: { userId: user.id, establishmentId: estId },
          limit: 1,
        });
        if (!rows || rows.length === 0) return null;
        const r = rows[0];
        return {
          ...r,
          isActive: Number(r.isActive) > 0,
          thankYouSent: Number(r.thankYouSent) > 0,
        } as ReferralCampaign;
      } catch {
        return null;
      }
    },
    enabled: !!user?.id && !!estId,
    staleTime: 30_000,
  });

  // ── Fetch referral links ──────────────────────────────────────────────────

  const { data: links = [], isLoading: linksLoading } = useQuery({
    queryKey: ['referral_links', user?.id, estId],
    queryFn: async () => {
      if (!user?.id || !estId) return [];
      try {
        const rows = await (blink.db as any).referralLinks.list({
          where: { userId: user.id, establishmentId: estId },
          orderBy: { createdAt: 'desc' },
          limit: 50,
        });
        return (rows || []).map((r: any) => ({
          ...r,
          thankYouSent: Number(r.thankYouSent) > 0,
        })) as ReferralLink[];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id && !!estId,
    staleTime: 30_000,
  });

  // ── Computed stats ────────────────────────────────────────────────────────

  const stats: ReferralStats = {
    thankYousSent: links.filter(l => l.thankYouSent).length,
    linksShared: links.length,
    newClientsGenerated: links.reduce((s, l) => s + (l.conversionCount || 0), 0),
    additionalRevenue:
      links.reduce((s, l) => s + (l.conversionCount || 0), 0) *
      (campaignData?.avgBasketAmount || 50),
  };

  // ── Create / update campaign ──────────────────────────────────────────────

  const saveCampaignMutation = useMutation({
    mutationFn: async (patch: Partial<ReferralCampaign>) => {
      if (!user?.id || !estId) throw new Error('No user/establishment');

      if (campaignData?.id) {
        await (blink.db as any).referralCampaigns.update(campaignData.id, {
          ...patch,
          isActive: patch.isActive !== undefined ? (patch.isActive ? 1 : 0) : undefined,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const sector = activeEstablishment?.category?.toLowerCase() || 'general';
        const matched = Object.keys(SECTOR_TEMPLATES).find(k => sector.includes(k)) || 'general';
        await (blink.db as any).referralCampaigns.create({
          id: generateId(),
          userId: user.id,
          establishmentId: estId,
          isActive: patch.isActive ? 1 : 0,
          discountPercent: patch.discountPercent ?? 10,
          sponsorDiscountPercent: patch.sponsorDiscountPercent ?? 10,
          avgBasketAmount: patch.avgBasketAmount ?? 50,
          messageTemplate: patch.messageTemplate || SECTOR_TEMPLATES[matched],
          channel: patch.channel || 'whatsapp',
          sector: matched,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referral_campaign', user?.id, estId] });
    },
  });

  // ── Create referral link for a reviewer ──────────────────────────────────

  const createLink = useCallback(async (sponsorName: string, reviewRating = 5) => {
    if (!user?.id || !estId || !campaignData?.id) return null;
    const shortCode = generateShortCode(sponsorName);
    const link: any = {
      id: generateId(),
      userId: user.id,
      campaignId: campaignData.id,
      establishmentId: estId,
      sponsorName,
      sponsorReviewRating: reviewRating,
      shortCode,
      clickCount: 0,
      conversionCount: 0,
      thankYouSent: 0,
      createdAt: new Date().toISOString(),
    };
    try {
      await (blink.db as any).referralLinks.create(link);
      queryClient.invalidateQueries({ queryKey: ['referral_links', user?.id, estId] });
      return link as ReferralLink;
    } catch {
      return null;
    }
  }, [user?.id, estId, campaignData?.id, queryClient]);

  // ── Mark thank-you as sent ────────────────────────────────────────────────

  const markThankYouSent = useCallback(async (linkId: string) => {
    try {
      await (blink.db as any).referralLinks.update(linkId, { thankYouSent: 1 });
      queryClient.invalidateQueries({ queryKey: ['referral_links', user?.id, estId] });
    } catch { /* noop */ }
  }, [user?.id, estId, queryClient]);

  // ── Generate referral URL ─────────────────────────────────────────────────

  const getReferralUrl = useCallback((shortCode: string) => {
    const base = window.location.origin;
    return `${base}/ref/${shortCode}`;
  }, []);

  // ── Render message template ───────────────────────────────────────────────

  const renderMessage = useCallback((sponsorName: string, shortCode: string) => {
    if (!campaignData) return '';
    const url = getReferralUrl(shortCode);
    return (campaignData.messageTemplate || SECTOR_TEMPLATES.general)
      .replace('{client.name}', sponsorName)
      .replace('{link}', url)
      .replace('{discount}', String(campaignData.discountPercent || 10))
      .replace('{sponsorDiscount}', String(campaignData.sponsorDiscountPercent || 10));
  }, [campaignData, getReferralUrl]);

  // ── Get template for sector ───────────────────────────────────────────────

  const getSectorTemplate = useCallback((sector: string) => {
    const key = Object.keys(SECTOR_TEMPLATES).find(k => sector.toLowerCase().includes(k)) || 'general';
    return SECTOR_TEMPLATES[key];
  }, []);

  return {
    campaign: campaignData,
    links,
    stats,
    isLoading: campaignLoading || linksLoading,
    saveCampaign: saveCampaignMutation.mutateAsync,
    isSaving: saveCampaignMutation.isPending,
    createLink,
    markThankYouSent,
    getReferralUrl,
    renderMessage,
    getSectorTemplate,
    SECTOR_TEMPLATES,
  };
}
