/**
 * useCrispChat — Crisp widget integration for Kompilot
 *
 * - Injects Crisp script on first load (idempotent)
 * - Hides widget by default until auth resolves
 * - Only shows widget when user is authenticated
 * - Auto-pushes email + first name via Crisp API
 * - Applies discreet minimalist CSS overrides
 */

import { useEffect, useRef, useCallback } from 'react';

const CRISP_WEBSITE_ID = '6489e565-3f8c-457c-8249-c23c610e7997';

type CrispUser = {
  id?: string;
  email?: string | null;
  displayName?: string | null;
};

// ── Singleton: script + style injection (runs once) ───────────────────────

let scriptInjected = false;

function injectCrispScript() {
  if (scriptInjected || document.getElementById('crisp-script-tag')) return;

  // @ts-expect-error Crisp global
  window.$crisp = [];
  // @ts-expect-error Crisp global
  window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

  const s = document.createElement('script');
  s.id = 'crisp-script-tag';
  s.src = 'https://client.crisp.chat/l.js';
  s.async = true;
  document.head!.appendChild(s);

  scriptInjected = true;
}

function injectCrispStyles() {
  if (document.getElementById('crisp-custom-styles')) return;

  const style = document.createElement('style');
  style.id = 'crisp-custom-styles';
  style.textContent = `
    /* Base color — uses Kompilot brand teal */
    .crisp-client { --crisp-widget-color: #0D9488 !important; }

    /* Smaller, discreet launcher — 48px rounded square */
    .crisp-client .crisp-kx6mvl {
      width: 48px !important;
      height: 48px !important;
      border-radius: 14px !important;
      box-shadow: 0 4px 16px rgba(13,148,136,.25) !important;
    }
    .crisp-client .crisp-kx6mvl:not(:hover) {
      opacity: 0.7 !important;
      transition: opacity .3s ease !important;
    }
    .crisp-client .crisp-kx6mvl:hover {
      opacity: 1 !important;
    }
    .crisp-client .crisp-kx6mvl svg {
      width: 20px !important;
      height: 20px !important;
    }

    /* Hide the bottom-right badge text */
    .crisp-client .crisp-1wmp49v { display: none !important; }
  `;
  document.head!.appendChild(style);
}

// ── Crisp API helpers ────────────────────────────────────────────────────

function getCrisp(): any[] | undefined {
  // @ts-expect-error Crisp global
  return window.$crisp;
}

function pushCrisp(...args: any[]) {
  const crisp = getCrisp();
  if (crisp) crisp.push(...args);
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useCrispChat(user?: CrispUser | null, _isLoading?: boolean) {
  const hasPushedIdentity = useRef(false);
  const widgetShown = useRef(false);

  // ── Inject Crisp script + styles on mount ──────────────────────────────
  useEffect(() => {
    injectCrispScript();
    injectCrispStyles();

    // Hide widget immediately — will be shown once auth resolves
    const hideTimer = setTimeout(() => {
      pushCrisp(['do', 'chat:hide']);
    }, 100);

    // Intercept Crisp's auto-show on session load
    pushCrisp(['on', 'session:loaded', () => {
      if (!widgetShown.current) {
        pushCrisp(['do', 'chat:hide']);
      }
    }]);

    return () => clearTimeout(hideTimer);
  }, []);

  // ── React to auth state changes ────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) {
      // Not authenticated → hide widget
      pushCrisp(['do', 'chat:hide']);
      widgetShown.current = false;
      hasPushedIdentity.current = false;
      return;
    }

    // Authenticated → show widget
    pushCrisp(['do', 'chat:show']);
    widgetShown.current = true;

    // Push user identity once per session
    if (!hasPushedIdentity.current) {
      if (user.email) {
        pushCrisp(['set', 'user:email', [user.email]]);
      }
      if (user.displayName) {
        const firstName = user.displayName.split(' ')[0];
        pushCrisp(['set', 'user:nickname', [firstName]]);
      }
      // Tag session for support filtering
      pushCrisp(['set', 'session:segments', [['kompilot-app']]]);
      hasPushedIdentity.current = true;
    }
  }, [user?.id, user?.email, user?.displayName]);

  // ── Programmatic controls ──────────────────────────────────────────────
  const openCrisp = useCallback(() => {
    pushCrisp(['do', 'chat:open']);
  }, []);

  const closeCrisp = useCallback(() => {
    pushCrisp(['do', 'chat:close']);
  }, []);

  return { openCrisp, closeCrisp };
}
