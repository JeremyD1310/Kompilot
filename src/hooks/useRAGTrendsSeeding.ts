/**
 * useRAGTrendsSeeding — Seeds a RAG collection with current marketing trends
 * relevant to the user's sector for content idea enrichment.
 */
import { useMutation } from '@tanstack/react-query'
import { blink } from '@/blink/client'

const COLLECTION_NAME = 'kompilot-content-trends'

export function useRAGTrendsSeeding() {
  return useMutation({
    mutationFn: async (sector: string) => {
      // Ensure collection exists
      try {
        await blink.rag.createCollection({
          name: COLLECTION_NAME,
          description: 'Industry marketing trends and content ideas for Kompilot users',
        })
      } catch (e: any) {
        // 409 = already exists — that's fine
        if (!e?.message?.includes('409') && !e?.message?.includes('already exists')) {
          throw e
        }
      }

      // Fetch current trends via web search
      const { text } = await blink.ai.generateText({
        prompt: `Liste les 10 tendances marketing les plus pertinentes pour le secteur "${sector}" en ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}. Pour chaque tendance, donne: le nom, une description de 2-3 phrases, et un angle de contenu exploitable. Format: JSON array [{name, description, contentAngle}]`,
        search: true,
        model: 'openai/gpt-4.1-mini',
        maxTokens: 1500,
      })

      // Parse and upload to RAG
      const match = text.match(/\[[\s\S]*\]/)
      if (!match) return { seeded: 0 }

      const trends: { name: string; description: string; contentAngle: string }[] = JSON.parse(match[0])
      let seeded = 0

      for (const trend of trends) {
        await blink.rag.upload({
          collectionName: COLLECTION_NAME,
          filename: `trend-${sector}-${trend.name.replace(/\s+/g, '-').toLowerCase()}.txt`,
          content: `Tendance: ${trend.name}\n\n${trend.description}\n\nAngle de contenu: ${trend.contentAngle}\n\nSecteur: ${sector}\nDate: ${new Date().toISOString().slice(0, 10)}`,
          metadata: { sector, trendName: trend.name, source: 'web-search-synthesis', observedAt: new Date().toISOString() },
        })
        seeded++
      }

      return { seeded }
    },
  })
}
