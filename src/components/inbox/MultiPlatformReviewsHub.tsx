import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageSquare, Sparkles, Copy, Send, Filter } from 'lucide-react'
import { toast } from '@blinkdotnew/ui'
import { blink } from '@/blink/client'

type Platform = 'Tous' | 'Google' | 'TripAdvisor' | 'Facebook'

interface Review {
  id: string
  platform: 'Google' | 'TripAdvisor' | 'Facebook'
  author: string
  rating: number
  text: string
  date: string
}

const MOCK_REVIEWS: Review[] = [
  { id: 'g1', platform: 'Google', author: 'Marie Dupont', rating: 5, text: 'Restaurant exceptionnel ! Les plats sont savoureux et le service est impeccable. Je reviendrai sans hésiter.', date: '2024-01-15' },
  { id: 'g2', platform: 'Google', author: 'Pierre Martin', rating: 4, text: 'Très bonne adresse. La carte est variée et les produits frais. Seul bémol, l\'attente un peu longue en soirée.', date: '2024-01-12' },
  { id: 'g3', platform: 'Google', author: 'Sophie Bernard', rating: 3, text: 'Correct dans l\'ensemble mais j\'attendais mieux. Le cadre est agréable mais les portions sont petites pour le prix.', date: '2024-01-10' },
  { id: 'g4', platform: 'Google', author: 'Luc Lefebvre', rating: 5, text: 'Une vraie pépite de quartier ! Accueil chaleureux, cuisine maison et prix raisonnables. À recommander absolument !', date: '2024-01-08' },
  { id: 'g5', platform: 'Google', author: 'Isabelle Moreau', rating: 4, text: 'Bonne découverte. Le chef est passionné et ça se ressent dans les assiettes. Belle sélection de vins également.', date: '2024-01-05' },
  { id: 'g6', platform: 'Google', author: 'Thomas Petit', rating: 2, text: 'Déçu par ma dernière visite. Le plat du jour était fade et le serveur peu attentionné. J\'espère que c\'était exceptionnel.', date: '2024-01-03' },
  { id: 't1', platform: 'TripAdvisor', author: 'JohnTraveler_UK', rating: 5, text: 'Absolutely charming! We stumbled upon this gem while visiting Paris. The staff spoke excellent English and the food was divine.', date: '2024-01-14' },
  { id: 't2', platform: 'TripAdvisor', author: 'Giulia_Roma88', rating: 4, text: 'Molto carino questo posto! Atmosfera romantica, cucina francese autentica. Lo consigliamo per una cena speciale.', date: '2024-01-11' },
  { id: 't3', platform: 'TripAdvisor', author: 'Hans_München', rating: 5, text: 'Wunderbares Erlebnis! Das Essen war hervorragend und das Personal sehr freundlich. Perfekt für einen romantischen Abend.', date: '2024-01-09' },
  { id: 't4', platform: 'TripAdvisor', author: 'Clara_Visiteur', rating: 3, text: 'Emplacement idéal en centre-ville. L\'hôtel est propre mais les chambres un peu vieillissantes. Bon rapport qualité-prix.', date: '2024-01-07' },
  { id: 't5', platform: 'TripAdvisor', author: 'Marco_Napoli', rating: 4, text: 'Belle découverte touristique. Le petit-déjeuner est copieux et l\'accueil très professionnel. Je recommande.', date: '2024-01-04' },
  { id: 't6', platform: 'TripAdvisor', author: 'AnneB_Paris', rating: 5, text: 'Un séjour parfait de A à Z. La vue depuis notre chambre était magnifique et le spa de qualité. On reviendra !', date: '2024-01-02' },
  { id: 'f1', platform: 'Facebook', author: 'Camille Rousseau', rating: 5, text: 'Trop bien ce resto ! On a fêté l\'anniversaire de ma mère là-bas et c\'était top. Merci à toute l\'équipe 🎉', date: '2024-01-13' },
  { id: 'f2', platform: 'Facebook', author: 'Kevin Bonnet', rating: 4, text: 'Super ambiance le vendredi soir ! La playlist est cool et les cocktails délicieux. Par contre le service un peu lent.', date: '2024-01-10' },
  { id: 'f3', platform: 'Facebook', author: 'Nathalie Simon', rating: 5, text: 'Je recommande à tous mes amis ! Cuisine authentique, patron super sympa et prix vraiment corrects pour le quartier.', date: '2024-01-08' },
  { id: 'f4', platform: 'Facebook', author: 'Antoine Girard', rating: 3, text: 'Bien mais pas transcendant. On a attendu 45 min pour avoir notre table malgré la réservation. À améliorer.', date: '2024-01-06' },
  { id: 'f5', platform: 'Facebook', author: 'Emma Leclerc', rating: 4, text: 'Adresse sympa pour un déjeuner entre collègues. Menu du midi bien fait, rapide et savoureux. On y retourne souvent !', date: '2024-01-04' },
  { id: 'f6', platform: 'Facebook', author: 'Julien Fontaine', rating: 5, text: 'Coup de cœur absolu ❤️ La terrine maison est incroyable et le dessert du chef… on en rêve encore. Bravo !', date: '2024-01-01' },
]

const PLATFORM_BADGE: Record<string, string> = {
  Google: 'bg-blue-100 text-blue-700',
  TripAdvisor: 'bg-green-100 text-green-700',
  Facebook: 'bg-indigo-100 text-indigo-700',
}

const PLATFORM_EMOJI: Record<string, string> = { Google: '⭐', TripAdvisor: '🦉', Facebook: '👍' }
const TABS: Platform[] = ['Tous', 'Google', 'TripAdvisor', 'Facebook']

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const [loading, setLoading] = useState(false)
  const [reply, setReply] = useState('')

  async function handleAIReply() {
    setLoading(true)
    try {
      const { object } = await blink.ai.generateObject({
        prompt: `You are a helpful local business owner. Write a warm, professional reply in French to this ${review.platform} review (rating: ${review.rating}/5): ${review.text}. Keep it under 150 words.`,
        schema: {
          type: 'object',
          properties: { reply: { type: 'string' } },
          required: ['reply'],
        },
      })
      setReply((object as { reply: string }).reply)
    } catch {
      toast.error('Erreur lors de la génération de la réponse.')
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(reply)
    toast.success('Réponse copiée !')
  }

  const initials = review.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{review.author}</p>
            <StarRow rating={review.rating} />
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLATFORM_BADGE[review.platform]}`}>
          {PLATFORM_EMOJI[review.platform]} {review.platform}
        </span>
      </div>

      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{review.text}</p>

      {!reply && (
        <button
          onClick={handleAIReply}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-60 transition-colors px-3 py-1.5 rounded-lg w-fit"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? 'Génération...' : 'Répondre avec IA'}
        </button>
      )}

      <AnimatePresence>
        {reply && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={3}
              className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
            <div className="flex gap-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1.5 rounded-lg">
                <Copy className="h-3.5 w-3.5" /> Copier
              </button>
              <button onClick={() => toast.success('Réponse publiée !')} className="flex items-center gap-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors px-3 py-1.5 rounded-lg">
                <Send className="h-3.5 w-3.5" /> Publier
              </button>
              <button onClick={handleAIReply} disabled={loading} className="flex items-center gap-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 disabled:opacity-60 transition-colors px-3 py-1.5 rounded-lg ml-auto">
                <Sparkles className="h-3.5 w-3.5" /> {loading ? '...' : 'Régénérer'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function MultiPlatformReviewsHub() {
  const [activeTab, setActiveTab] = useState<Platform>('Tous')
  const [batchLoading, setBatchLoading] = useState(false)

  const filtered = activeTab === 'Tous' ? MOCK_REVIEWS : MOCK_REVIEWS.filter(r => r.platform === activeTab)

  function avgRating(platform: 'Google' | 'TripAdvisor' | 'Facebook') {
    const reviews = MOCK_REVIEWS.filter(r => r.platform === platform)
    return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
  }

  async function handleBatchReply() {
    setBatchLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setBatchLoading(false)
    toast.success('Réponses IA générées pour tous les avis visibles !')
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {(['Google', 'TripAdvisor', 'Facebook'] as const).map(p => (
          <div key={p} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLATFORM_BADGE[p]}`}>{PLATFORM_EMOJI[p]} {p}</span>
            <div className="ml-auto text-right">
              <p className="text-lg font-bold text-gray-900 leading-none">{avgRating(p)}</p>
              <p className="text-xs text-gray-400">/ 5 · 6 avis</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <Filter className="h-3.5 w-3.5 text-gray-400 ml-1.5 mr-0.5" />
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${activeTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'Tous' ? 'Tous' : `${tab} ${PLATFORM_EMOJI[tab]}`}
            </button>
          ))}
        </div>
        <button
          onClick={handleBatchReply}
          disabled={batchLoading}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-60 transition-colors px-4 py-2 rounded-lg shadow-sm"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          {batchLoading ? 'Génération en cours…' : 'Répondre à tous (IA)'}
        </button>
      </div>

      {/* Count */}
      <p className="text-xs text-gray-400">{filtered.length} avis · {activeTab === 'Tous' ? 'toutes plateformes' : activeTab}</p>

      {/* Cards */}
      <motion.div layout className="grid gap-3 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filtered.map(review => <ReviewCard key={review.id} review={review} />)}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}