/**
 * Types et constantes pour la facturation B2B française
 * Conformité : Articles L441-3, L441-9 C.Com, Directive 2006/112/CE
 */

// ── Émetteur fixe (Kompilot SAS) ───────────────────────────────────────────

export const KOMPILOT_ISSUER = {
  raisonSociale: 'Kompilot SAS',
  formeJuridique: 'Société par Actions Simplifiée au capital de 10 000 €',
  adresse: '15 Rue de la Paix',
  codePostal: '75001',
  ville: 'Paris',
  pays: 'France',
  siret: '123 456 789 00012',
  rcs: 'Paris',
  nafApe: '6311Z',
  tvaIntra: 'FR12 123456789',
  email: 'facturation@kompilot.fr',
  website: 'www.kompilot.com',
} as const;

// ── Interfaces de données ─────────────────────────────────────────────────────

export interface InvoiceClient {
  name: string;          // Raison sociale / nom établissement
  address: string;       // Adresse de facturation complète
  siret?: string;        // SIRET client (si renseigné)
  tvaIntra?: string;     // TVA intracommunautaire client
}

export interface InvoiceLine {
  description: string;   // Désignation article
  quantite: number;
  prixUnitaireHT: number;
  tauxTVA: number;       // ex: 20 (pour 20 %)
}

export interface InvoiceData {
  numero: string;              // ex: "NC-2026-06-001"
  dateEmission: string;        // ex: "01 juin 2026"
  datePrestation: string;      // ex: "Période du 01/06/2026 au 30/06/2026"
  dateLimitePaiement: string;  // "Paiement à réception" | "Prélèvement le XX/XX"
  modePaiement: string;        // "Payé par carte bancaire (Stripe)"
  client: InvoiceClient;
  lignes: InvoiceLine[];
}

// ── Computed ─────────────────────────────────────────────────────────────────

export interface InvoiceLineComputed extends InvoiceLine {
  totalHTLigne: number;
  tvaLigne: number;
  totalTTCLigne: number;
}

export interface InvoiceTotals {
  lignesCalc: InvoiceLineComputed[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

// ── Helpers numériques ────────────────────────────────────────────────────────

export function computeTotals(lignes: InvoiceLine[]): InvoiceTotals {
  let totalHT = 0;
  let totalTVA = 0;

  const lignesCalc: InvoiceLineComputed[] = lignes.map(l => {
    const ht = l.quantite * l.prixUnitaireHT;
    const tva = ht * (l.tauxTVA / 100);
    totalHT += ht;
    totalTVA += tva;
    return { ...l, totalHTLigne: ht, tvaLigne: tva, totalTTCLigne: ht + tva };
  });

  return { lignesCalc, totalHT, totalTVA, totalTTC: totalHT + totalTVA };
}

export function fmtEur(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

// ── Builder de données de facture ─────────────────────────────────────────────

export interface BuildInvoiceOptions {
  invoiceId: string;
  dateEmission: string;
  planName: string;
  priceHT: number;
  clientName: string;
  clientAddress: string;
  clientSiret?: string;
  clientTvaIntra?: string;
  periodStart?: string;
  periodEnd?: string;
  paidAt?: string;
}

export function buildInvoiceData(options: BuildInvoiceOptions): InvoiceData {
  const {
    invoiceId, dateEmission, planName, priceHT,
    clientName, clientAddress, clientSiret, clientTvaIntra,
    periodStart, periodEnd, paidAt,
  } = options;

  const [day, monthStr, year] = dateEmission.split(' ');
  const periodLabel = periodEnd
    ? `Période du ${periodStart ?? dateEmission} au ${periodEnd}`
    : `Période du ${day} ${monthStr} ${year}`;

  return {
    numero: invoiceId,
    dateEmission,
    datePrestation: periodLabel,
    dateLimitePaiement: paidAt
      ? `Payé le ${paidAt} — Prélèvement automatique`
      : 'Paiement à réception',
    modePaiement: 'Payé par carte bancaire (Stripe)',
    client: { name: clientName, address: clientAddress, siret: clientSiret, tvaIntra: clientTvaIntra },
    lignes: [{
      description: `Abonnement Kompilot — ${planName} (${periodLabel})`,
      quantite: 1,
      prixUnitaireHT: priceHT,
      tauxTVA: 20,
    }],
  };
}
