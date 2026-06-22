/** Static data for AgencyDashboardMockup */

export const WEEKLY_DATA  = [22, 30, 28, 44, 40, 58, 54, 69, 65, 77, 72, 88];
export const SOV_DATA     = [12, 16, 20, 17, 24, 30, 27, 33, 37, 41, 38, 46];

export const CITED_PAGES = [
  { name: 'Fiche Google My Business', pct: 87, color: '#818CF8' },
  { name: 'Menu / Services page',     pct: 64, color: '#0D9488' },
  { name: 'Avis clients récents',     pct: 51, color: '#F59E0B' },
  { name: 'Photos & visuels',         pct: 38, color: '#EC4899' },
] as const;

export const LEADS = [
  { name: 'Brasserie du Vieux Port', city: 'Marseille', score: 28, gap: '−8 400€/an', cls: '_nc_row_1' },
  { name: 'Studio Pilates Lena',     city: 'Lyon',      score: 54, gap: '−5 100€/an', cls: '_nc_row_2' },
  { name: 'Garage Michelin Expert',  city: 'Toulouse',  score: 19, gap: '−12 700€/an', cls: '_nc_row_3' },
  { name: 'Pharmacie des Fleurs',    city: 'Bordeaux',  score: 73, gap: '−2 200€/an', cls: '_nc_row_4' },
] as const;

export const NAV_ITEMS = [
  { e: '🏠', l: 'Tableau de bord', a: false },
  { e: '🏢', l: 'Clients',          a: false },
  { e: '🎯', l: 'Prospection IA',   a: true  },
  { e: '📊', l: 'Analytiques',      a: false },
  { e: '📄', l: 'Rapports PDF',     a: false },
] as const;

export const SIDEBAR_CLIENTS = [
  { n: 'Le Petit Bistro',   s: 84, u: true  },
  { n: 'Studio Beauté Léa', s: 71, u: true  },
  { n: 'Garage Martin',     s: 58, u: false },
  { n: 'Pharma. Centre',    s: 92, u: true  },
] as const;

export const PROMPTS = [
  "Demandez à l'IA votre visibilité ou confiez-lui une tâche…",
  "Scrapez les brasseries de Toulouse et générez 5 audits PDF…",
  "Calculez le manque à gagner de Garage Martin · Nantes…",
  "Créez 3 scripts de closing pour Chirurgien esthétique Lyon…",
  "Générez le kit de prospection · Salon Beauté Bordeaux…",
];

export const MOCKUP_CSS = `
@keyframes _nc_in {
  0%   { opacity:0; transform:translateY(28px) scale(.97); filter:blur(5px); }
  100% { opacity:1; transform:translateY(0)    scale(1);   filter:blur(0); }
}
@keyframes _nc_pdot {
  0%,100% { box-shadow:0 0 0 0 rgba(34,197,94,.7); }
  55%      { box-shadow:0 0 0 6px rgba(34,197,94,0); }
}
@keyframes _nc_cursor {
  0%,100% { opacity:1; }
  50%      { opacity:0; }
}
@keyframes _nc_scan_row {
  0%   { opacity:0; transform:translateX(-6px); }
  100% { opacity:1; transform:translateX(0); }
}
._nc_enter   { animation: _nc_in .72s cubic-bezier(.22,1,.36,1) both; }
._nc_pdot    { animation: _nc_pdot 2s ease-in-out infinite; }
._nc_cursor  { display:inline-block; width:1.5px; height:.85em; background:#A78BFA;
               margin-left:1px; vertical-align:middle;
               animation:_nc_cursor .85s step-start infinite; }
._nc_row_1   { animation: _nc_scan_row .45s .3s  both; }
._nc_row_2   { animation: _nc_scan_row .45s .5s  both; }
._nc_row_3   { animation: _nc_scan_row .45s .7s  both; }
._nc_row_4   { animation: _nc_scan_row .45s .9s  both; }
`;
