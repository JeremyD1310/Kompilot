/** Inline CSS injected once in SignupPage */
export const SIGNUP_CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
  @keyframes spin { to { transform: rotate(360deg) } }
  @keyframes slideDown { from { opacity:0; max-height:0; transform:translateY(-8px) } to { opacity:1; max-height:200px; transform:none } }
  @keyframes siretPop { 0%{transform:scale(.85);opacity:0} 60%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
  .su-card { animation: fadeUp .4s cubic-bezier(.4,0,.2,1) both; }
  .nc-field {
    width: 100%; background: rgba(255,255,255,.04);
    border: 1px solid rgba(255,255,255,.09); border-radius: 12px;
    padding: 13px 16px 13px 42px; font-size: .92rem; color: #F1F5F9; outline: none;
    transition: border-color .2s, box-shadow .2s; box-sizing: border-box;
    font-family: inherit;
  }
  .nc-field::placeholder { color: rgba(148,163,184,.4); }
  .nc-field:focus { border-color: rgba(13,148,136,.55); box-shadow: 0 0 0 3px rgba(13,148,136,.1); }
  .nc-field-pw { padding-right: 44px; }
  .nc-label { display: block; color: #475569; font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 8px; }
  .seg-btn {
    flex: 1; padding: 18px 14px; border-radius: 14px; cursor: pointer;
    border: 2px solid rgba(255,255,255,.08);
    background: rgba(255,255,255,.03);
    text-align: center; transition: all .22s cubic-bezier(.4,0,.2,1);
    position: relative; overflow: hidden;
  }
  .seg-btn:hover { border-color: rgba(13,148,136,.35); background: rgba(13,148,136,.05); }
  .seg-btn.active {
    border-color: #0D9488;
    background: rgba(13,148,136,.12);
    box-shadow: 0 0 0 1px rgba(13,148,136,.3), 0 4px 16px rgba(13,148,136,.15);
  }
  .siret-field-wrap { animation: slideDown .3s cubic-bezier(.4,0,.2,1) both; overflow: hidden; }
  .siret-badge { animation: siretPop .35s cubic-bezier(.34,1.56,.64,1) both; }
  .submit-btn {
    width: 100%; background: #0D9488; color: #fff; font-weight: 700; border: none;
    border-radius: 12px; padding: 16px 0; font-size: 1rem; cursor: pointer;
    transition: opacity .2s, transform .15s; margin-top: 4px;
    box-shadow: 0 4px 24px rgba(13,148,136,.35);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .submit-btn:hover:not(:disabled) { opacity: .9; }
  .submit-btn:active:not(:disabled) { transform: scale(.98); }
  .submit-btn:disabled { opacity: .4; cursor: not-allowed; }
  .progress-bar { position: fixed; top: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,.06); z-index: 50; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #0D9488, #2DD4BF); transition: width .6s cubic-bezier(.4,0,.2,1); border-radius: 0 2px 2px 0; }
  .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(100,116,139,.6); pointer-events: none; }
`;
