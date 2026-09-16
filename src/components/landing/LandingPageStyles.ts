export const LANDING_CSS = `
  .sr{opacity:0;transform:translateY(18px);transition:opacity .6s cubic-bezier(.4,0,.2,1),transform .6s cubic-bezier(.4,0,.2,1)}
  .sr-in{opacity:1!important;transform:none!important}
  .d1{transition-delay:.08s}.d2{transition-delay:.16s}.d3{transition-delay:.24s}.d4{transition-delay:.32s}.d5{transition-delay:.40s}.d6{transition-delay:.48s}
  .nc-pill{display:inline-flex;align-items:center;gap:10px;background:#0D9488;color:#fff;font-weight:700;font-size:1.05rem;border-radius:9999px;padding:18px 40px;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s;box-shadow:0 10px 24px rgba(13,148,136,.18)}
  .nc-pill:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(13,148,136,.25)}.nc-pill:active{transform:scale(.98)}
  .nc-btn-outline{display:inline-flex;align-items:center;gap:8px;background:#fff;color:#0F172A;font-weight:700;font-size:.88rem;border-radius:9999px;padding:10px 22px;border:1px solid #CBD5E1;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
  .nc-btn-outline:hover{border-color:#CBD5E1;color:#0F172A;background:#F8FAFC}
  .landing-desktop-nav-link:hover,.landing-mobile-nav-link:hover{color:#0F172A!important}
  .landing-mobile-nav-link{color:#475569!important}
  .landing-mobile-nav-link[style*="color"]{color:#0F172A!important}
  .nc-section-label{font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.14em;color:#0D9488}
  .landing-section{padding:clamp(68px,9vw,116px) 20px;border-bottom:1px solid #E2E8F0;scroll-margin-top:72px}
  .landing-container{max-width:1120px;margin:0 auto}
  .landing-section-intro{max-width:720px;margin-bottom:46px}
  .landing-section-intro h2{color:#0F172A;font-size:clamp(2rem,4.2vw,3.25rem);line-height:1.06;letter-spacing:-.045em;margin:14px 0}
  .landing-section-intro p:not(.nc-section-label){color:#64748B;font-size:1.02rem;line-height:1.8;margin:0;max-width:650px}
  .landing-benefits{background:#FFFFFF}.benefit-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.benefit-card{padding:26px;border-radius:18px;background:#F8FAFC;border:1px solid #E2E8F0}.benefit-card>span{color:#0D9488;font-size:.75rem;font-weight:800}.benefit-card h3{color:#0F172A;font-size:1.08rem;line-height:1.3;margin:28px 0 9px}.benefit-card p{color:#64748B;font-size:.88rem;line-height:1.65;margin:0}
  .landing-problem{background:#F8FAFC}.problem-layout,.workflow-layout,.geo-layout,.beta-layout{display:grid;grid-template-columns:minmax(240px,.8fr) minmax(0,1.2fr);gap:64px;align-items:start}.problem-list{display:grid;gap:10px}.problem-list article,.workflow-list article{display:grid;grid-template-columns:48px 1fr;gap:16px;padding:20px;border:1px solid #E2E8F0;border-radius:16px;background:#FFFFFF}.problem-list article>span,.workflow-list article>span{color:#0D9488;font-size:1.2rem;font-weight:900}.problem-list h3,.workflow-list h3{color:#0F172A;font-size:1rem;margin:0 0 6px}.problem-list p,.workflow-list p{color:#64748B;font-size:.86rem;line-height:1.65;margin:0}
  .landing-features{background:#FFFFFF}.feature-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.feature-card{padding:22px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;box-shadow:0 8px 24px rgba(15,23,42,.04);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.feature-card:hover{transform:translateY(-3px);border-color:#99F6E4;box-shadow:0 16px 34px rgba(15,23,42,.08)}.feature-card-icon{width:40px;height:40px;display:grid;place-items:center;border-radius:12px;color:#0D9488;background:#CCFBF1;margin-bottom:17px}.feature-card h3{color:#0F172A;font-size:1.04rem;line-height:1.35;margin:18px 0 9px}.feature-card p{color:#475569;font-size:.9rem;line-height:1.65;margin:0 0 10px}.feature-card small{display:block;color:#64748B;font-size:.78rem;line-height:1.6;min-height:40px}.feature-card>a{display:inline-flex;align-items:center;gap:6px;margin-top:18px;color:#0F766E;font-size:.84rem;font-weight:800;text-decoration:none}.feature-card>a:hover{text-decoration:underline}.module-preview{border:1px solid #DDE7E9;border-radius:13px;background:#F8FAFC;overflow:hidden}.module-preview-top{display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid #E2E8F0}.module-preview-top span{width:6px;height:6px;border-radius:50%;background:#CBD5E1}.module-preview-top span:first-child{background:#99F6E4}.module-preview-body{padding:11px}.module-preview-body>p{color:#0F172A!important;font-size:.67rem!important;font-weight:800;margin:0 0 8px!important}.module-preview-row{display:flex;align-items:center;gap:7px;padding:7px 0;border-top:1px solid #E2E8F0;font-size:.65rem}.module-preview-row i{display:grid;place-items:center;width:16px;height:16px;border-radius:5px;background:#CCFBF1;color:#0F766E;font-style:normal;font-weight:800}.module-preview-row span{color:#475569;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.module-preview-row b{color:#0D9488;font-size:.57rem;white-space:nowrap}.landing-workflow{background:#FFFFFF}.human-validation{display:flex;align-items:center;gap:8px;color:#0F766E;font-size:.82rem;font-weight:800;margin-top:24px}.landing-geo{background:#F0FDFA}.geo-layout{align-items:center}.geo-layout>div>p:not(.nc-section-label){color:#475569;line-height:1.8}.geo-layout ul{display:grid;gap:13px;padding:0;margin:26px 0;list-style:none}.geo-layout li{display:flex;gap:10px;align-items:center;color:#334155;font-size:.9rem}.geo-layout li svg{color:#0D9488;flex-shrink:0}.geo-cta{padding:14px 22px;font-size:.9rem}.geo-panel{padding:26px;border-radius:22px;background:#FFFFFF;border:1px solid #BCEFE7;box-shadow:0 16px 38px rgba(15,118,110,.08)}.geo-panel>p{color:#0F766E;font-size:.7rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin:0 0 18px}.geo-panel>div{display:flex;align-items:center;gap:12px;padding:14px 0;border-top:1px solid #E2E8F0}.geo-panel span{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:#CCFBF1;color:#0F766E;font-weight:800;font-size:.72rem}.geo-panel b{color:#334155;font-size:.86rem}.landing-sectors{background:#FFFFFF}.sector-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.sector-grid>a{display:flex;align-items:flex-start;gap:10px;padding:19px;border-radius:16px;background:#F8FAFC;border:1px solid #E2E8F0;text-decoration:none;transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}.sector-grid>a:hover{transform:translateY(-3px);border-color:#99F6E4;box-shadow:0 12px 26px rgba(15,23,42,.06)}.sector-grid>a>svg{color:#0D9488;flex-shrink:0;margin-top:2px}.sector-grid>a>svg:last-child{margin-left:auto}.sector-grid span{display:grid;gap:5px}.sector-grid strong{color:#0F172A;font-size:.85rem}.sector-grid small{color:#64748B;font-size:.73rem;line-height:1.5}.landing-beta{background:#F8FAFC}.beta-layout{align-items:center}.beta-layout .landing-section-intro{margin:0}.beta-layout h2{color:#0F172A;font-size:clamp(2rem,4vw,3rem);line-height:1.08;letter-spacing:-.04em;margin:14px 0}.beta-layout p:not(.nc-section-label){color:#64748B;line-height:1.8;margin:0}.beta-proof{display:flex;gap:14px;align-items:flex-start;padding:24px;border-radius:18px;background:#FFFFFF;border:1px solid #E2E8F0}.beta-proof svg{color:#0D9488;flex-shrink:0}.beta-proof strong{display:block;color:#0F172A;margin-bottom:6px}.beta-proof span{display:block;color:#64748B;font-size:.84rem;line-height:1.6}
  .landing-faq{background:#FFFFFF}.faq-layout{display:grid;grid-template-columns:minmax(240px,.75fr) minmax(0,1.25fr);gap:64px;align-items:start}.faq-cta{margin-top:26px}.content-meta{display:block;color:#94A3B8;font-size:.72rem;line-height:1.5;margin-top:18px}.faq-list{border-top:1px solid #E2E8F0}.faq-item{border-bottom:1px solid #E2E8F0}.faq-item button{width:100%;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:20px 0;background:transparent;border:0;color:#0F172A;text-align:left;font-size:.95rem;font-weight:800;cursor:pointer}.faq-item button svg{color:#0D9488;transition:transform .2s}.faq-item.is-open button svg{transform:rotate(180deg)}.faq-item p{color:#64748B;line-height:1.7;font-size:.86rem;margin:0 0 20px;max-width:680px}
  .landing-feature-card,.landing-sector-card{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
  .landing-feature-card:hover,.landing-sector-card:hover{transform:translateY(-3px);border-color:#99F6E4!important;box-shadow:0 16px 34px rgba(15,23,42,.08)!important}
  .nc-tab-btn{flex:1;padding:10px 12px;border-radius:9999px;border:none;font-size:clamp(.75rem,.88vw + .6rem,.88rem);font-weight:600;cursor:pointer;line-height:1.2;transition:all .25s cubic-bezier(.4,0,.2,1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .landing-faq,.landing-beta{scroll-margin-top:72px}
  @media(max-width:860px){.landing-workflow-grid,.landing-geo-grid,.problem-layout,.workflow-layout,.geo-layout,.beta-layout,.faq-layout{grid-template-columns:1fr!important;gap:32px!important}.benefit-grid,.feature-grid{grid-template-columns:1fr!important}.sector-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
  @media(max-width:520px){.sector-grid{grid-template-columns:1fr!important}.landing-section{padding-inline:16px}.landing-section-intro{margin-bottom:32px}}
  @media(prefers-reduced-motion:reduce){.sr{opacity:1!important;transform:none!important}.nc-pill,.nc-btn-outline,.feature-card,.sector-grid>a{transition:none}}

  /* ── Sticky CTA safety zone ─────────────────────────────────────────────────
   * Force any third-party chat widget (Crisp, Intercom, Tidio, HubSpot, etc.)
   * injected at bottom-right to move to bottom-left so it never overlaps
   * our primary "Démarrer gratuitement" CTA button.
   * These selectors target the most common launcher iframe/div patterns.
   */
  /* Generic: any fixed iframe in the bottom-right quadrant */
  body > iframe[style*="bottom"][style*="right"]:not(#nc-cta-safe-zone),
  body > div[style*="bottom"][style*="right"]:not(#nc-cta-safe-zone) {
    bottom: 20px!important;
    right: auto!important;
    left: 20px!important;
  }
  /* Crisp */
  #crisp-chatbox, .crisp-client { bottom: 20px!important; right: auto!important; left: 20px!important; }
  /* Intercom */
  .intercom-lightweight-app, .intercom-launcher-frame, .intercom-messenger-frame { bottom: 20px!important; right: auto!important; left: 20px!important; }
  /* Tidio */
  #tidio-chat, #tidio-chat-iframe { bottom: 20px!important; right: auto!important; left: 20px!important; }
  /* HubSpot */
  #hubspot-messages-iframe-container { bottom: 20px!important; right: auto!important; left: 20px!important; }
  /* Drift */
  #drift-widget-container { bottom: 20px!important; right: auto!important; left: 20px!important; }
  /* Zendesk */
  #launcher, .zEWidget-launcher { bottom: 20px!important; right: auto!important; left: 20px!important; }
  /* LiveChat */
  #chat-widget-container { bottom: 20px!important; right: auto!important; left: 20px!important; }

  /* On mobile: hide any floating chat widgets (our sticky CTA bar takes full width) */
  @media(max-width:767px){
    #nc-cta-safe-zone{grid-template-columns:1fr!important;gap:6px!important;padding:9px 12px!important}
    #nc-cta-safe-zone>div:first-child,#nc-cta-safe-zone>div:last-child{display:none!important}
    #nc-cta-safe-zone>div:nth-child(2){width:100%!important}
    #nc-cta-safe-zone button{max-width:100%;width:100%;justify-content:center}
    #crisp-chatbox,.crisp-client,
    .intercom-lightweight-app,.intercom-launcher-frame,
    #tidio-chat,#tidio-chat-iframe,
    #hubspot-messages-iframe-container,
    #drift-widget-container,
    #launcher,.zEWidget-launcher,
    #chat-widget-container {
      display:none!important;
      visibility:hidden!important;
      pointer-events:none!important;
    }
    /* Also hide our internal AI chat widget on the landing page on mobile */
    .nc-chat-trigger { display:none!important; }
  }
`;
