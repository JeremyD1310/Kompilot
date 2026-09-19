const PUBLIC_ORIGIN = 'https://www.kompilot.fr'
const PUBLIC_PATHS = new Set([
  '/', '/a-propos', '/politique-editoriale', '/features', '/local', '/pricing', '/faq', '/temoignages', '/ressources',
  '/cas-clients', '/secteurs/restaurants', '/secteurs/boutiques', '/secteurs/beaute', '/secteurs/sport', '/secteurs/artisans', '/secteurs/sante', '/secteurs/immobilier', '/secteurs/agences',
])

type IndexNowConfig = { enabled?: boolean; key?: string; endpoint?: string }

export function isPublicIndexNowUrl(value: string) {
  try {
    const url = new URL(value)
    return url.origin === PUBLIC_ORIGIN && PUBLIC_PATHS.has(url.pathname) && !url.search && !url.hash
  } catch {
    return false
  }
}

export async function submitIndexNowUrls(urls: string[], config: IndexNowConfig = {}) {
  const enabled = config.enabled ?? import.meta.env.VITE_INDEXNOW_ENABLED === 'true'
  const key = config.key ?? import.meta.env.VITE_INDEXNOW_KEY
  const validUrls = [...new Set(urls.filter(isPublicIndexNowUrl))]
  if (!enabled || !key || validUrls.length === 0) return { submitted: false, reason: 'disabled-or-empty', count: validUrls.length }
  const endpoint = config.endpoint ?? 'https://api.indexnow.org/indexnow'
  console.info('[indexnow] submitting public URL count', validUrls.length)
  const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ host: new URL(PUBLIC_ORIGIN).host, key, urlList: validUrls }) })
  if (!response.ok) throw new Error(`IndexNow submission failed with status ${response.status}`)
  return { submitted: true, reason: 'submitted', count: validUrls.length }
}
