export const LANDING_CSS = `
  .sr{opacity:0;transform:translateY(18px);transition:opacity .6s cubic-bezier(.4,0,.2,1),transform .6s cubic-bezier(.4,0,.2,1)}
  .sr-in{opacity:1!important;transform:none!important}
  .d1{transition-delay:.08s}.d2{transition-delay:.16s}.d3{transition-delay:.24s}.d4{transition-delay:.32s}.d5{transition-delay:.40s}.d6{transition-delay:.48s}
  .nc-pill{display:inline-flex;align-items:center;gap:10px;background:#0D9488;color:#fff;font-weight:700;font-size:1.05rem;border-radius:9999px;padding:18px 40px;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s;box-shadow:0 0 36px rgba(13,148,136,.4)}
  .nc-pill:hover{transform:scale(1.025);box-shadow:0 0 48px rgba(13,148,136,.55)}.nc-pill:active{transform:scale(.98)}
  .nc-btn-outline{display:inline-flex;align-items:center;gap:8px;background:transparent;color:#94A3B8;font-weight:600;font-size:.88rem;border-radius:9999px;padding:10px 22px;border:1px solid rgba(255,255,255,.12);cursor:pointer;transition:border-color .2s,color .2s}
  .nc-btn-outline:hover{border-color:rgba(13,148,136,.5);color:#E2E8F0}
  .nc-adv-card{padding:44px 36px;border-radius:20px;background:rgba(255,255,255,.025);display:flex;flex-direction:column;transition:background .2s}
  .nc-adv-card:hover{background:rgba(255,255,255,.04)}
  .nc-review-card{padding:28px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05)}
  .nc-section-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:#0D9488}
  .nc-star-spin{display:inline-block;animation:starSpin 3s linear infinite}
  @keyframes starSpin{to{transform:rotate(360deg)}}
  .nc-pill-shimmer{position:relative;overflow:hidden}
  .nc-pill-shimmer::after{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);animation:shimmer 2.4s ease-in-out infinite}
  @keyframes shimmer{0%{left:-100%}100%{left:160%}}
  .nc-tab-btn{flex:1;padding:10px 12px;border-radius:9999px;border:none;font-size:clamp(.75rem,.88vw + .6rem,.88rem);font-weight:600;cursor:pointer;line-height:1.2;transition:all .25s cubic-bezier(.4,0,.2,1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nc-agency-feat-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:24px 20px;transition:border-color .2s}
  .nc-agency-feat-card:hover{border-color:rgba(129,140,248,.3)}
  @media(prefers-reduced-motion:reduce){.sr{opacity:1!important;transform:none!important}.nc-pill,.nc-btn-outline{transition:none}.nc-star-spin{animation:none}.nc-pill-shimmer::after{animation:none}}

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
