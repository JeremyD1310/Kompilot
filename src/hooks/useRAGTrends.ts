/**
 * useRAGTrends — Searches a RAG collection for industry-relevant trends
 * to enrich content idea generation and LinkedIn post creation.
 */
import { useQuery } from '@tanstack/react-query'
import { blink } from '@/blink/client'

const COLLECTION_NAME = 'kompilot-content-trends'

export interface RAGTrend {
  filename: string
  excerpt: string
  score: number
}

export function useRAGTrends(sector?: string, enabled = true) {
  return useQuery<RAGTrend[]>({
    queryKey: ['rag-trends', sector],
    queryFn: async () => {
      try {
        const results = await blink.rag.search({
          collectionName: COLLECTION_NAME,
          query: `tendances marketing ${sector || 'commerce local'} ${new Date().toISOString().slice(0, 7)}`,
          maxResults: 5,
          scoreThreshold: 0.6,
        })
        return results.results.map(r => ({
          filename: r.filename,
          excerpt: r.content.slice(0, 500),
          score: r.score,
        }))
      } catch {
        // Collection may not exist yet — return empty gracefully
        return []
      }
    },
    enabled,
    staleTime: 15 * 60 * 1000,
  })
}
