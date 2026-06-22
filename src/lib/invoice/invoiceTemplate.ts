/**
 * Template HTML de la facture A4 B2B française
 * Génère le balisage complet de la facture à partir des données calculées
 */

import { KOMPILOT_ISSUER, fmtEur, computeTotals } from './invoiceTypes';
import type { InvoiceData } from './invoiceTypes';
import { INVOICE_CSS } from './invoiceStyles';

export function generateInvoiceHTML(data: InvoiceData): string {
  const { lignesCalc, totalHT, totalTVA, totalTTC } = computeTotals(data.lignes);
  const iss = KOMPILOT_ISSUER;

  // ── Lignes du tableau ──
  const lignesHTML = lignesCalc.map(l => `
    <tr>
      <td class="desc">${l.description}</td>
      <td class="center">${l.quantite}</td>
      <td class="right">${fmtEur(l.prixUnitaireHT)}</td>
      <td class="center">${l.tauxTVA} %</td>
      <td class="right">${fmtEur(l.tvaLigne)}</td>
      <td class="right bold">${fmtEur(l.totalHTLigne)}</td>
    </tr>
  `).join('');

  // ── Récap TVA (groupé par taux) ──
  const groupedTVA: Record<number, number> = {};
  lignesCalc.forEach(l => { groupedTVA[l.tauxTVA] = (groupedTVA[l.tauxTVA] ?? 0) + l.tvaLigne; });
  const tvaRows = Object.entries(groupedTVA).map(([taux, montant]) => `
    <tr class="tva-row"><td>TVA ${taux} %</td><td>${fmtEur(montant)}</td></tr>
  `).join('');

  // ── Bloc client ──
  const clientSiretHTML = data.client.siret
    ? `<strong>SIRET :</strong> ${data.client.siret}<br/>`
    : `<span style="color:#EF4444;font-weight:600;">⚠ SIRET non renseigné — Ajoutez-le dans Paramètres</span><br/>`;
  const clientTvaHTML = data.client.tvaIntra
    ? `<strong>TVA Intra :</strong> ${data.client.tvaIntra}`
    : `<em style="color:#94A3B8;">TVA non applicable (micro-entreprise ou exonéré)</em>`;

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  // Taux pénalités de retard = 3 × taux intérêt légal (4,22 % en 2026 — mise à jour réglementaire annuelle)
  const penaltyRate = (3 * 4.22).toFixed(2);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Facture ${data.numero} — Kompilot</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>${INVOICE_CSS}</style>
</head>
<body>

  <div class="print-bar no-print">
    <div>
      <strong>Facture ${data.numero}</strong>
      <span class="info"> — Kompilot SAS · ${data.dateEmission}</span>
    </div>
    <button class="print-btn" onclick="window.print()">⬇&nbsp; Télécharger en PDF (Ctrl+P)</button>
  </div>

  <div class="page">

    <!-- En-tête -->
    <div class="header">
      <div>
        <div class="logo-text">Kompilot</div>
        <div class="logo-tagline">Présence digitale locale · SaaS B2B</div>
      </div>
      <div class="invoice-meta">
        <div class="label">Facture</div>
        <div class="invoice-num">${data.numero}</div>
        <div class="label" style="margin-top:6px;">Émise le</div>
        <div class="value">${data.dateEmission}</div>
        <div class="badge-paid">✓ Payée</div>
      </div>
    </div>

    <!-- Émetteur + Client -->
    <div class="parties">
      <div class="party-block highlight">
        <div class="party-label">Émetteur — Prestataire</div>
        <div class="party-name">${iss.raisonSociale}</div>
        <div class="party-detail">
          ${iss.formeJuridique}<br/>
          ${iss.adresse}, ${iss.codePostal} ${iss.ville}, ${iss.pays}<br/>
          <strong>SIRET :</strong> ${iss.siret}<br/>
          <strong>RCS :</strong> ${iss.rcs} — <strong>NAF/APE :</strong> ${iss.nafApe}<br/>
          <strong>TVA Intra :</strong> ${iss.tvaIntra}<br/>
          ${iss.email} · ${iss.website}
        </div>
      </div>
      <div class="party-block">
        <div class="party-label">Client — Destinataire</div>
        <div class="party-name">${data.client.name}</div>
        <div class="party-detail">
          ${data.client.address}<br/>
          ${clientSiretHTML}
          ${clientTvaHTML}
        </div>
      </div>
    </div>

    <!-- Grille info facture -->
    <div class="invoice-info-grid">
      <div class="info-cell">
        <div class="info-cell-label">N° de facture</div>
        <div class="info-cell-value">${data.numero}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">Date d'émission</div>
        <div class="info-cell-value">${data.dateEmission}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">Période de prestation</div>
        <div class="info-cell-value">${data.datePrestation}</div>
      </div>
      <div class="info-cell">
        <div class="info-cell-label">Échéance de paiement</div>
        <div class="info-cell-value">${data.dateLimitePaiement}</div>
      </div>
    </div>

    <!-- Tableau des lignes -->
    <table class="lines-table">
      <thead>
        <tr>
          <th class="desc">Désignation</th>
          <th class="center">Qté</th>
          <th class="right">P.U. HT</th>
          <th class="center">TVA</th>
          <th class="right">Montant TVA</th>
          <th class="right">Total HT</th>
        </tr>
      </thead>
      <tbody>${lignesHTML}</tbody>
    </table>

    <!-- Totaux -->
    <div class="totals-area">
      <table class="totals-table">
        <tbody>
          <tr><td>Sous-total HT</td><td>${fmtEur(totalHT)}</td></tr>
          ${tvaRows}
          <tr class="separator"><td colspan="2"></td></tr>
          <tr class="ttc-row">
            <td>TOTAL TTC</td>
            <td>${fmtEur(totalTTC)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mode de règlement -->
    <div class="payment-section">
      <div style="font-size:16pt;line-height:1;">💳</div>
      <div class="payment-detail">
        <div class="payment-title">Mode de règlement</div>
        <div class="payment-mode">${data.modePaiement} — Ce document vaut justificatif de paiement.</div>
      </div>
      <div class="payment-acquitte">ACQUITTÉ</div>
    </div>

    <!-- Mentions pénalités de retard (obligatoire B2B — art. L441-10 C.Com) -->
    <div class="penalties-block">
      <div class="penalties-title">⚖ Conditions de paiement &amp; pénalités de retard — Art. L441-10 Code de Commerce</div>
      <div class="penalties-text">
        En cas de retard de paiement, des pénalités de retard seront exigibles au taux de <strong>${penaltyRate} % l'an</strong>
        (3 fois le taux d'intérêt légal). Conformément à l'article D441-5 du Code de Commerce,
        une <strong>indemnité forfaitaire de recouvrement de 40 €</strong> sera automatiquement due
        dès le premier jour de retard, sans mise en demeure préalable. Aucun escompte accordé pour paiement anticipé.
      </div>
    </div>

    <!-- Pied de page légal -->
    <div class="footer">
      <div class="footer-left">
        <strong>${iss.raisonSociale}</strong> — ${iss.formeJuridique}<br/>
        ${iss.adresse}, ${iss.codePostal} ${iss.ville} · SIRET : ${iss.siret} · NAF : ${iss.nafApe}<br/>
        TVA Intra : ${iss.tvaIntra} · RCS ${iss.rcs} · ${iss.email}
      </div>
      <div class="footer-right">
        <div class="stamp">Document conforme</div><br/>
        Facture ${data.numero} · Générée par Kompilot<br/>
        Le ${today}
      </div>
    </div>

  </div>

  <script>
    document.querySelector('.print-btn')?.addEventListener('click', () => window.print());
  </script>
</body>
</html>`;
}

// ── Ouverture du PDF dans un nouvel onglet ────────────────────────────────────

export function openInvoicePDF(data: InvoiceData): void {
  const html = generateInvoiceHTML(data);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // Fallback popup bloqué → téléchargement direct
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facture-${data.numero}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 15_000);
}
