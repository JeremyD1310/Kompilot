/**
 * Point d'entrée du module de facturation B2B française
 * Re-exporte les éléments publics pour faciliter les imports
 */

export { generateInvoiceHTML, openInvoicePDF } from './invoiceTemplate';
export { buildInvoiceData, KOMPILOT_ISSUER, computeTotals, fmtEur } from './invoiceTypes';
export type {
  InvoiceData,
  InvoiceClient,
  InvoiceLine,
  InvoiceLineComputed,
  InvoiceTotals,
  BuildInvoiceOptions,
} from './invoiceTypes';
