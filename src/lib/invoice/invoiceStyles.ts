/**
 * Styles CSS pour la facture A4 imprimable
 * Format A4 : 210mm × 297mm, optimisé pour impression navigateur → PDF
 */

export const INVOICE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 10pt;
    color: #0F172A;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 18mm 18mm 22mm 18mm;
    background: #fff;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  @page { size: A4; margin: 0; }

  @media print {
    html, body { width: 210mm; height: 297mm; }
    .page { padding: 18mm; box-shadow: none; }
    .no-print { display: none !important; }
  }

  @media screen {
    body { background: #E2E8F0; padding: 72px 16px 32px; }
    .page { box-shadow: 0 20px 60px -10px rgba(0,0,0,0.2); border-radius: 4px; }
  }

  /* Header */
  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    padding-bottom: 20px;
    border-bottom: 2.5px solid #0D9488;
  }
  .logo-text { font-size: 22pt; font-weight: 700; color: #0D9488; letter-spacing: -0.5px; line-height: 1; }
  .logo-tagline { font-size: 7pt; color: #64748B; font-weight: 500; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 4px; }
  .invoice-meta { text-align: right; }
  .invoice-meta .label { font-size: 7pt; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 2px; }
  .invoice-meta .invoice-num { font-size: 16pt; font-weight: 700; color: #0D9488; font-variant-numeric: tabular-nums; }
  .invoice-meta .value { font-size: 9pt; color: #0F172A; font-weight: 500; }
  .badge-paid { display: inline-block; margin-top: 6px; background: #DCFCE7; color: #16A34A; border: 1px solid #BBF7D0; border-radius: 4px; padding: 2px 10px; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; }

  /* Parties */
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .party-block { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; }
  .party-block.highlight { background: #F0FDFA; border-color: #99F6E4; }
  .party-label { font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0D9488; margin-bottom: 8px; }
  .party-name { font-size: 11pt; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
  .party-detail { font-size: 8.5pt; color: #475569; line-height: 1.6; }
  .party-detail strong { color: #0F172A; font-weight: 600; }

  /* Info grid */
  .invoice-info-grid { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
  .info-cell { padding: 10px 12px; border-right: 1px solid #E2E8F0; }
  .info-cell:last-child { border-right: none; }
  .info-cell-label { font-size: 7pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.7px; color: #94A3B8; margin-bottom: 4px; }
  .info-cell-value { font-size: 9pt; font-weight: 600; color: #0F172A; line-height: 1.3; }

  /* Table lignes */
  .lines-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9pt; }
  .lines-table thead tr { background: #0D9488; color: #fff; }
  .lines-table thead th { padding: 8px 10px; text-align: left; font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
  .lines-table thead th.right { text-align: right; }
  .lines-table thead th.center { text-align: center; }
  .lines-table tbody tr { border-bottom: 1px solid #E2E8F0; }
  .lines-table tbody tr:last-child { border-bottom: none; }
  .lines-table tbody tr:nth-child(even) { background: #F8FAFC; }
  .lines-table td { padding: 10px; vertical-align: top; color: #1E293B; }
  .lines-table td.desc { width: 44%; }
  .lines-table td.center { text-align: center; color: #475569; }
  .lines-table td.right { text-align: right; font-variant-numeric: tabular-nums; }
  .lines-table td.bold { font-weight: 700; color: #0F172A; }

  /* Totaux */
  .totals-area { display: flex; justify-content: flex-end; margin-bottom: 20px; }
  .totals-table { width: 260px; border-collapse: collapse; font-size: 9pt; }
  .totals-table td { padding: 5px 10px; color: #475569; }
  .totals-table td:last-child { text-align: right; font-variant-numeric: tabular-nums; color: #0F172A; font-weight: 500; }
  .totals-table .tva-row td { color: #64748B; font-size: 8.5pt; }
  .totals-table .separator td { padding: 0; border-top: 1px solid #E2E8F0; }
  .totals-table .ttc-row { background: #0D9488; border-radius: 6px; }
  .totals-table .ttc-row td { color: #fff !important; font-size: 11pt; font-weight: 700; padding: 9px 12px; }
  .totals-table .ttc-row td:last-child { font-size: 12pt; font-weight: 800; }

  /* Paiement */
  .payment-section { background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 12px; }
  .payment-detail .payment-title { font-size: 8.5pt; font-weight: 700; color: #0F172A; margin-bottom: 2px; }
  .payment-detail .payment-mode { font-size: 8pt; color: #475569; }
  .payment-acquitte { font-size: 8pt; font-weight: 700; color: #16A34A; background: #DCFCE7; border: 1px solid #BBF7D0; border-radius: 4px; padding: 2px 8px; white-space: nowrap; }

  /* Pénalités (obligation B2B art. L441-10 C.Com) */
  .penalties-block { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; }
  .penalties-title { font-size: 7.5pt; font-weight: 700; color: #9A3412; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .penalties-text { font-size: 7.5pt; color: #7C2D12; line-height: 1.6; }

  /* Footer */
  .footer { margin-top: auto; padding-top: 16px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 7pt; color: #94A3B8; line-height: 1.7; }
  .footer-right { font-size: 7pt; color: #94A3B8; text-align: right; line-height: 1.7; }
  .stamp { display: inline-block; border: 2px solid #0D9488; color: #0D9488; font-size: 7pt; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; transform: rotate(-2deg); }

  /* Barre impression (écran) */
  .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #0F172A; color: #fff; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; font-family: inherit; font-size: 13px; gap: 12px; }
  .print-bar .info { opacity: 0.7; font-size: 12px; }
  .print-btn { background: #0D9488; color: #fff; border: none; border-radius: 6px; padding: 7px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .print-btn:hover { background: #0F766E; }
  @media print { .print-bar { display: none !important; } }
`;
