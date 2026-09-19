import { afterEach, describe, expect, test } from 'bun:test';
import { runWebsiteVisibilityAudit, validatePublicWebsiteUrl } from '../../backend/lib/websiteVisibilityAuditService';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe('website visibility audit security', () => {
  test('accepts public HTTP(S) URLs and strips fragments', () => {
    expect(validatePublicWebsiteUrl('https://example.com/path#section').toString()).toBe('https://example.com/path');
  });

  test('rejects credentials, unsafe ports and private destinations', () => {
    const blocked = [
      'file:///etc/passwd', 'https://user:pass@example.com', 'https://example.com:8080',
      'http://localhost', 'http://127.0.0.1', 'http://10.0.0.1', 'http://169.254.169.254',
      'http://172.16.0.1', 'http://192.168.1.1', 'http://[::1]', 'http://service.internal',
    ];
    for (const value of blocked) expect(() => validatePublicWebsiteUrl(value)).toThrow();
  });

  test('builds deterministic evidence without inventing performance data', async () => {
    const html = `<!doctype html><html><head><title>Atelier Martin</title><meta name="description" content="Artisan à Lyon"><link rel="canonical" href="https://example.com/"><script type="application/ld+json">{"@type":"LocalBusiness","name":"Atelier Martin"}</script></head><body><h1>Artisan à Lyon</h1><p>${'contenu utile '.repeat(140)}</p><a href="/services">Services</a><a href="https://instagram.com/atelier">Instagram</a><a href="tel:+33400000000">Téléphone</a></body></html>`;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('cloudflare-dns.com')) return new Response(JSON.stringify({ Answer: [{ data: url.includes('type=AAAA') ? '2606:2800:220:1:248:1893:25c8:1946' : '93.184.216.34' }] }), { status: 200, headers: { 'content-type': 'application/dns-json' } });
      if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nDisallow:', { status: 200, headers: { 'content-type': 'text/plain' } });
      if (url.endsWith('/services')) return new Response('<html><head><title>Services</title></head><body><h1>Services</h1><p>Présentation.</p></body></html>', { status: 200, headers: { 'content-type': 'text/html' } });
      return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
    }) as typeof fetch;

    const report = await runWebsiteVisibilityAudit('https://example.com/');
    expect(report.pages.length).toBe(2);
    expect(report.pages[0].schemaTypes).toContain('LocalBusiness');
    expect(report.findings.every(item => item.evidence && item.recommendation)).toBe(true);
    expect(report.methodology.scoringPolicy).toContain('Aucun classement Google');
    expect(JSON.stringify(report)).not.toMatch(/trafic estimé|position garantie|citation garantie/i);
  });

  test('respects robots.txt exclusions', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('cloudflare-dns.com')) return new Response(JSON.stringify({ Answer: [{ data: url.includes('type=AAAA') ? '2606:2800:220:1:248:1893:25c8:1946' : '93.184.216.34' }] }), { status: 200, headers: { 'content-type': 'application/dns-json' } });
      if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nDisallow: /private', { status: 200, headers: { 'content-type': 'text/plain' } });
      return new Response('<html><head><title>Accueil</title></head><body><h1>Accueil</h1><a href="/private">Privé</a></body></html>', { status: 200, headers: { 'content-type': 'text/html' } });
    }) as typeof fetch;
    const report = await runWebsiteVisibilityAudit('https://example.com/');
    expect(report.pages).toHaveLength(1);
    expect(report.limitations.some(item => item.includes('/private') && item.includes('robots.txt'))).toBe(true);
  });

  test('rejects cross-origin redirects', async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('cloudflare-dns.com')) return new Response(JSON.stringify({ Answer: [{ data: url.includes('type=AAAA') ? '2606:2800:220:1:248:1893:25c8:1946' : '93.184.216.34' }] }), { status: 200, headers: { 'content-type': 'application/dns-json' } });
      if (url.endsWith('/robots.txt')) return new Response('', { status: 404, headers: { 'content-type': 'text/plain' } });
      return new Response('', { status: 302, headers: { location: 'https://other.example/path', 'content-type': 'text/html' } });
    }) as typeof fetch;
    await expect(runWebsiteVisibilityAudit('https://example.com/')).rejects.toThrow('WEBSITE_UNAVAILABLE_OR_BLOCKED');
  });
});
