/**
 * useLinkedInGenerator — React Query mutation for LinkedIn post generation.
 */
import { useMutation } from '@tanstack/react-query'
import { blink } from '@/blink/client'

const API_BASE = 'https://gbrhsehk.backend.blink.new'

export interface LinkedInGenerateRequest {
  sourceContent: string
  keywordsAio: string[]
  postGoal: string
  brandTone?: string
  postLength?: string
  ctaType?: string
}

export interface LinkedInGenerateResponse {
  success: boolean
  post: string
  metadata: {
    charCount: number
    wordCount: number
    hashtagCount: number
    keywords: string[]
    goal: string
    tone: string
    postLength: string
    ctaType: string
    model: string
    generatedAt: string
  }
}

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const token = await blink.auth.getValidToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  return res.json()
}

export function useLinkedInGenerator() {
  return useMutation<LinkedInGenerateResponse, Error, LinkedInGenerateRequest>({
    mutationFn: (body) =>
      fetchWithAuth('/api/linkedin/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  })
}
