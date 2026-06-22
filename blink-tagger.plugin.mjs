/**
 * Blink Visual Editor — Vite plugin (self-contained, no external imports).
 *
 * Two responsibilities:
 *  1. Stamp `data-blnk-id="<relPath>:<index>"` onto every JSX opening tag during
 *     dev transforms. The Blink IDE uses these to identify tagged elements when
 *     the user clicks them in the iframe.
 *  2. Inject the picker runtime via `transformIndexHtml` so the iframe can talk
 *     to the parent IDE (TOGGLE_SELECTOR / ELEMENT_CLICKED / SET_ELEMENT_ATTRS).
 *
 * Source of truth: `auto-engineer/src/lib/sandbox/plugins/blink-tagger.ts` +
 * `auto-engineer/src/lib/sandbox/runtime/blink-picker-runtime.ts`. Keep in sync
 * when either changes.
 */

import * as path from 'path'

const PICKER_RUNTIME_JS = `(function(){
  'use strict';
  if (window.__blinkPickerInstalled) return;
  window.__blinkPickerInstalled = true;

  var active = false;
  var hoverEl = null;
  var hoverOutline = null;

  var COMPUTED_KEYS = ['color','backgroundColor','fontSize','fontWeight','fontFamily','textAlign','textDecorationLine','borderColor','borderWidth','borderStyle','borderRadius','opacity','display','paddingTop','paddingRight','paddingBottom','paddingLeft','marginTop','marginRight','marginBottom','marginLeft','width','height','gap','flexDirection','justifyContent','alignItems','lineHeight','letterSpacing'];

  window.addEventListener('message', function(ev){
    var msg = ev.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'TOGGLE_SELECTOR') setActive(!!msg.payload);
    else if (msg.type === 'SET_ELEMENT_ATTRS') applyAttrs(msg.payload);
    else if (msg.type === 'RESET_INLINE_STYLES') resetInlineStyles(msg.payload);
  });

  function setActive(next){
    if (active === next) return;
    active = next;
    document.documentElement.classList.toggle('blink-picker-active', active);
    if (!active) { clearHover(); clearSelectedRectTracking(); }
  }

  // Rect-tracking — keep parent UI glued to elements during scroll.
  var selectedIds = new Set();
  var pendingReflow = false;
  var lastSentRects = Object.create(null);
  function trackSelectedId(id) { if (typeof id === 'string' && id) selectedIds.add(id); }
  function clearSelectedRectTracking() { selectedIds.clear(); lastSentRects = Object.create(null); }
  function scheduleReflow() {
    if (pendingReflow) return;
    // Hover ring must follow scroll: include hoverEl in the reflow trigger.
    // Mirrors src/lib/sandbox/runtime/blink-runtime-picker.ts — keep in sync.
    if (selectedIds.size === 0 && !hoverEl) return;
    pendingReflow = true;
    var raf = window.requestAnimationFrame || function(cb){ return setTimeout(cb, 16); };
    raf(function(){ pendingReflow = false; emitRectUpdates(); repositionHover(); });
  }
  function repositionHover() {
    if (!hoverEl) return;
    if (!hoverEl.isConnected) { hoverEl = null; drawHover(null); return; }
    drawHover(hoverEl);
  }
  function emitRectUpdates() {
    try {
      var updates = [], ids = Array.from(selectedIds);
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        var el = document.querySelector('[data-blnk-id="' + id.replace(/"/g, '\\\\"') + '"]');
        if (!el) { selectedIds.delete(id); continue; }
        var r = el.getBoundingClientRect();
        var prev = lastSentRects[id];
        if (prev && Math.abs(prev.x - r.x) < 0.5 && Math.abs(prev.y - r.y) < 0.5 && Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5) continue;
        var rect = { x: r.x, y: r.y, width: r.width, height: r.height };
        lastSentRects[id] = rect;
        updates.push({ id: id, rect: rect });
      }
      if (updates.length === 0) return;
      window.parent.postMessage({ type: 'ELEMENT_RECT_UPDATE', payload: { updates: updates } }, '*');
    } catch (err) {
      try { console.error('[blink-picker] emitRectUpdates failed', err); } catch (e2) {}
    }
  }
  window.addEventListener('scroll', scheduleReflow, { passive: true, capture: true });
  window.addEventListener('resize', scheduleReflow);

  document.addEventListener('mouseover', function(e){
    if (!active) return;
    var el = closestTagged(e.target);
    if (el === hoverEl) return;
    hoverEl = el;
    drawHover(el);
  }, true);

  document.addEventListener('click', function(e){
    if (!active) return;
    var el = closestTagged(e.target);
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
    emitElementClicked(el, { meta: !!(e.metaKey || e.ctrlKey), shift: !!e.shiftKey });
  }, true);

  document.addEventListener('submit', function(e){ if (active) e.preventDefault(); }, true);

  document.addEventListener('keydown', function(e){
    if (!active) return;
    if (e.key === 'Escape') {
      try { window.parent.postMessage({ type: 'TOGGLE_PICK_AND_EDIT_REQUESTED' }, '*'); } catch (err) {}
    }
  }, true);

  function closestTagged(target){
    var el = target;
    while (el && el !== document.documentElement) {
      if (el.dataset && el.dataset.blnkId) return el;
      el = el.parentElement;
    }
    return null;
  }

  function emitElementClicked(el, modifiers){
    try {
      var id = el.dataset.blnkId;
      var lastColon = id.lastIndexOf(':');
      var filePath = lastColon >= 0 ? id.slice(0, lastColon) : id;
      var index = lastColon >= 0 ? parseInt(id.slice(lastColon + 1), 10) || 0 : 0;
      var r = el.getBoundingClientRect();
      var cs = window.getComputedStyle(el);
      var computed = {};
      for (var i = 0; i < COMPUTED_KEYS.length; i++) {
        var k = COMPUTED_KEYS[i];
        computed[k] = cs[k];
      }
      var classes = el.classList ? Array.prototype.slice.call(el.classList) : [];
      window.parent.postMessage({
        type: 'ELEMENT_CLICKED',
        payload: {
          id: id,
          filePath: filePath,
          lineNumber: 0,
          col: index,
          tagName: (el.tagName || 'div').toLowerCase(),
          rect: { x: r.x, y: r.y, width: r.width, height: r.height },
          computedStyles: computed,
          classes: classes,
          // Identifying signals — mirrors blink-runtime-picker.ts; keep in sync.
          className: getClassName(el),
          nearestHeading: findNearestHeading(el),
          parentTag: getParentTag(el),
          textContent: getDirectText(el),
          modifiers: modifiers || { meta: false, shift: false },
        },
      }, '*');
      trackSelectedId(id);
    } catch (err) {
      try { console.error('[blink-picker] emitElementClicked failed', err); } catch (e2) {}
    }
  }

  // Direct text first, descendant text fallback. Mirrors
  // src/lib/sandbox/runtime/blink-runtime-picker.ts — keep in sync.
  function getDirectText(el){
    var t = '';
    var nodes = el.childNodes;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].nodeType === 3) t += nodes[i].nodeValue;
    }
    t = t.trim();
    if (t) return t;
    var descendants = (el.textContent || '').replace(/\\s+/g, ' ').trim();
    return descendants.slice(0, 200);
  }

  // Identifying signals for the Apply chat message. Mirrors
  // src/lib/sandbox/runtime/blink-runtime-picker.ts — keep in sync.
  function getClassName(el){
    try {
      if (el.classList && (typeof el.className !== 'string')) {
        return Array.prototype.slice.call(el.classList).join(' ').slice(0, 200);
      }
      return String(el.className || '').slice(0, 200);
    } catch (err) {
      try { console.error('[blink-picker] getClassName failed', err); } catch (e2) {}
      return '';
    }
  }
  function getParentTag(el){
    try {
      var p = el.parentElement;
      if (!p || !p.tagName) return null;
      return p.tagName.toLowerCase();
    } catch (err) {
      try { console.error('[blink-picker] getParentTag failed', err); } catch (e2) {}
      return null;
    }
  }
  function findNearestHeading(el){
    try {
      var node = el.parentElement;
      var best = null;
      var hops = 0;
      while (node && hops < 6) {
        var found = findHeadingIn(node);
        if (found && (!best || found.rank < best.rank)) best = found;
        node = node.parentElement;
        hops++;
      }
      if (!best) return null;
      return { tag: best.tag, text: best.text };
    } catch (err) {
      try { console.error('[blink-picker] findNearestHeading failed', err); } catch (e2) {}
      return null;
    }
  }
  function findHeadingIn(container){
    var tags = ['h1','h2','h3','h4','h5','h6'];
    for (var i = 0; i < tags.length; i++) {
      var match = container.querySelector(tags[i]);
      if (match) {
        var text = (match.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
        if (text) return { tag: tags[i], text: text, rank: i + 1 };
      }
    }
    return null;
  }

  function applyAttrs(payload){
    try {
      if (!payload || typeof payload !== 'object') return;
      var sel = null;
      if (typeof payload.id === 'string') {
        sel = '[data-blnk-id="' + payload.id.replace(/"/g, '\\\\"') + '"]';
      } else if (payload.id && payload.id.path) {
        sel = '[data-blnk-id^="' + payload.id.path.replace(/"/g, '\\\\"') + ':"]';
      }
      if (!sel) return;
      var el = document.querySelector(sel);
      if (!el) return;
      var attrs = payload.attrs || {};
      if (attrs.style && typeof attrs.style === 'object') {
        for (var k in attrs.style) {
          if (Object.prototype.hasOwnProperty.call(attrs.style, k)) {
            el.style.setProperty(camelToKebab(k), String(attrs.style[k]));
          }
        }
      }
      if (typeof attrs.className === 'string') el.className = attrs.className;
      if (typeof attrs.textContent === 'string') el.textContent = attrs.textContent;
    } catch (err) {
      try { console.error('[blink-picker] applyAttrs failed', err); } catch (e2) {}
    }
  }

  function resetInlineStyles(payload){
    try {
      if (!payload || typeof payload !== 'object' || typeof payload.id !== 'string') return;
      var sel = '[data-blnk-id="' + payload.id.replace(/"/g, '\\\\"') + '"]';
      var el = document.querySelector(sel);
      if (!el) return;
      var props = Array.isArray(payload.properties) ? payload.properties : null;
      if (props && props.length > 0) {
        for (var i = 0; i < props.length; i++) el.style.removeProperty(camelToKebab(props[i]));
      } else if (el.removeAttribute) {
        el.removeAttribute('style');
      }
    } catch (err) {
      try { console.error('[blink-picker] resetInlineStyles failed', err); } catch (e2) {}
    }
  }

  function camelToKebab(s){
    return s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }

  function drawHover(el){
    if (!hoverOutline) {
      hoverOutline = document.createElement('div');
      // Bold dashed ring — mirrors blink-runtime-picker.ts; keep in sync.
      hoverOutline.style.cssText = 'position:fixed;pointer-events:none;outline:2px dashed rgba(59,130,246,0.95);outline-offset:-1px;box-shadow:0 0 0 1px rgba(59,130,246,0.12),0 0 12px rgba(59,130,246,0.22);border-radius:1px;z-index:2147483646;box-sizing:border-box;transition:all 60ms ease-out';
      document.body.appendChild(hoverOutline);
    }
    if (!el) { hoverOutline.style.display = 'none'; return; }
    var r = el.getBoundingClientRect();
    hoverOutline.style.left = r.x + 'px';
    hoverOutline.style.top = r.y + 'px';
    hoverOutline.style.width = r.width + 'px';
    hoverOutline.style.height = r.height + 'px';
    hoverOutline.style.display = 'block';
  }

  function clearHover(){
    hoverEl = null;
    if (hoverOutline) hoverOutline.style.display = 'none';
  }

  var style = document.createElement('style');
  style.textContent = '.blink-picker-active, .blink-picker-active * { cursor: crosshair !important; }';
  if (document.head) document.head.appendChild(style);
  else document.addEventListener('DOMContentLoaded', function(){ document.head.appendChild(style); });
})();`

export function blinkTaggerPlugin() {
  return {
    name: 'blink-tagger',
    enforce: 'pre',
    transformIndexHtml() {
      return [{ tag: 'script', children: PICKER_RUNTIME_JS, injectTo: 'head' }]
    },
    transform(code, id) {
      if (!/\.[jt]sx$/.test(id)) return null
      if (id.includes('node_modules')) return null
      if (code.includes('data-blnk-id=')) return null

      const relPath = path
        .relative(process.cwd(), id)
        .replace(/\\/g, '/')
        .replace(/^src\//, '')

      let counter = 0
      // The leading `(?<![A-Za-z0-9_)\]])` negative lookbehind keeps the regex
      // from matching TypeScript generic call sites like `useState<string>()`,
      // `fn<T>(x)`, or `getFoo()<T>` inside `.tsx` files. In real JSX the `<`
      // is always preceded by start-of-input / whitespace / one of
      // `( { > , = ? : } & |` etc., never an identifier character, `)`, or `]`.
      const result = code.replace(
        /(?<![A-Za-z0-9_)\]])<([A-Za-z][A-Za-z0-9.]*)(\s(?:[^>]*?(?:\/?>|>))|(?:\s*\/?>))/g,
        (match, tagName, rest) => {
          if (tagName.startsWith('!')) return match
          const idx = counter++
          const attrValue = `${relPath}:${idx}`
          const sep = rest.startsWith(' ') || rest.startsWith('\n') ? '' : ' '
          return `<${tagName} data-blnk-id="${attrValue}"${sep}${rest}`
        }
      )
      return { code: result, map: null }
    },
  }
}
