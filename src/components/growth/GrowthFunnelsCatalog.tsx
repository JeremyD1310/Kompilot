import React, { useState } from 'react';
import { 
  FlaskConical, Heart, ShoppingCart, ShieldAlert, 
  Star, MapPin, Zap, Lock, ChevronRight, Copy, Check, Loader2
} from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, toast 
} from '@blinkdotnew/ui';
import { cn } from '../../lib/utils';
import { blink } from '../../blink/client';
import { useAuth } from '../../hooks/useAuth';

const FUNNELS = [
  { 
    title: 'Funnel Fidélité Automatique', 
    desc: 'Détecte les clients réguliers → envoie SMS de remerciement + coupon J+7', 
    icon: Heart, 
    style: 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400',
    status: 'Prêt' 
  },
  { 
    title: 'Relance Panier Abandonné', 
    desc: 'Scan réseaux → détecte commentaires sans suite → DM de relance automatique', 
    icon: ShoppingCart, 
    style: 'bg-violet-500/15 border-violet-500/20 text-violet-400',
    status: 'Prêt' 
  },
  { 
    title: 'Bouclier Anti No-Show', 
    desc: 'Confirme RDV J-1 + alerte météo défavorable + lien de reprogrammation', 
    icon: ShieldAlert, 
    style: 'bg-amber-500/15 border-amber-500/20 text-amber-400',
    status: 'Prêt' 
  },
  { 
    title: 'Amplificateur d\'Avis', 
    desc: 'Post publié → rappel d\'avis 48h après → réponse IA aux retours', 
    icon: Star, 
    style: 'bg-teal-500/15 border-teal-500/20 text-teal-400',
    status: 'Prêt' 
  },
  { 
    title: 'Pipeline Lead Local', 
    desc: 'Prospection zone → messagerie automatique → proposition offre découverte', 
    icon: MapPin, 
    style: 'bg-blue-500/15 border-blue-500/20 text-blue-400',
    status: 'Premium',
    locked: true
  },
  { 
    title: 'Séquence Offre Flash', 
    desc: 'Créer offre → multipost réseaux → A/B test → vainqueur amplifié', 
    icon: Zap, 
    style: 'bg-rose-500/15 border-rose-500/20 text-rose-400',
    status: 'Premium',
    locked: true
  }
];

const ACTIVATED_FUNNELS_KEY = 'kompilot_activated_funnels';

function getActivatedFunnels(userId: string): Set<number> {
  try {
    return new Set(JSON.parse(localStorage.getItem(`${ACTIVATED_FUNNELS_KEY}_${userId}`) ?? '[]') as number[]);
  } catch { return new Set(); }
}

function saveActivatedFunnels(set: Set<number>, userId: string): void {
  localStorage.setItem(`${ACTIVATED_FUNNELS_KEY}_${userId}`, JSON.stringify([...set]));
}

export const GrowthFunnelsCatalog = () => {
  const { user } = useAuth();
  const userId = user?.id ?? 'anon';
  const [duplicated, setDuplicated] = useState<Record<number, boolean>>({});
  const [activating, setActivating] = useState<Record<number, boolean>>({});
  const [activated, setActivated] = useState<Set<number>>(() => getActivatedFunnels(user?.id ?? 'anon'));

  const handleAction = async (index: number, title: string) => {
    // If already activated, just show status
    if (activated.has(index)) {
      toast(`Tunnel "${title}" est déjà actif.`);
      return;
    }
    setActivating(prev => ({ ...prev, [index]: true }));
    try {
      // Persist as a scheduled_post record with status='active_funnel'
      if (user?.id) {
        await blink.db.posts.create({
          id: `funnel_${index}_${user.id}`,
          userId: user.id,
          title: `[FUNNEL] ${title}`,
          content: FUNNELS[index].desc,
          status: 'active_funnel',
        });
      }
      // Persist activation state to localStorage only after successful DB write
      const next = new Set(activated);
      next.add(index);
      setActivated(next);
      saveActivatedFunnels(next, userId);
      toast.success(`✅ Tunnel "${title}" activé et enregistré.`);
    } catch (e) {
      console.error('[funnel] activation failed', e);
      toast.error(`Erreur lors de l'activation du tunnel "${title}". Réessayez.`);
    } finally {
      setActivating(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDuplicate = (index: number, title: string) => {
    setDuplicated(prev => ({ ...prev, [index]: true }));
    toast.success(`Tunnel "${title}" dupliqué — configurez la copie selon votre second établissement.`);
    setTimeout(() => setDuplicated(prev => ({ ...prev, [index]: false })), 2000);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
              <FlaskConical className="h-6 w-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tunnels de Croissance Automatisés</h2>
              <p className="text-sm text-slate-400">Un clic pour connecter CRM local, réseaux sociaux et anti-no-show</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FUNNELS.map((funnel, index) => (
          <Card key={index} className={cn("relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] bg-slate-900/40", funnel.style)}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className={cn("p-2 rounded-lg bg-current/10", funnel.style)}>
                  <funnel.icon className="h-5 w-5" />
                </div>
                <Badge variant={funnel.locked ? "outline" : "secondary"} className={cn("text-[10px]", 
                  activated.has(index) ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  funnel.status === 'Actif' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 
                  funnel.status === 'Premium' ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 
                  'bg-slate-500/20 text-slate-400 border-slate-500/30'
                )}>
                  {funnel.locked && <Lock className="h-2 w-2 mr-1" />}
                  {activated.has(index) ? '✓ Actif' : funnel.status}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-white mt-3">{funnel.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400 leading-relaxed min-h-[40px]">{funnel.desc}</p>
              
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/5">
                {funnel.locked ? (
                  <div className="flex items-center text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                    <Lock className="h-3 w-3 mr-1.5" /> Réservé Business+
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleAction(index, funnel.title)}
                      disabled={activating[index]}
                      className={cn(
                        "h-8 px-3 text-xs border",
                        activated.has(index)
                          ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20"
                          : "bg-white/5 hover:bg-white/10 text-white border-white/10"
                      )}
                    >
                      {activating[index]
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : activated.has(index)
                          ? <><Check className="h-3 w-3 mr-1" /> En cours</>
                          : <>{index === 0 ? 'Configurer' : 'Activer'} <ChevronRight className="h-3 w-3 ml-1" /></>
                      }
                    </Button>
                    {/* Duplicate button — for agency multi-establishment strategy */}
                    <button
                      onClick={() => handleDuplicate(index, funnel.title)}
                      title="Dupliquer ce tunnel pour un autre établissement"
                      className="h-8 px-2.5 flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 border border-white/10 hover:border-teal-500/30 rounded-md transition-all"
                    >
                      {duplicated[index] 
                        ? <><Check className="h-3 w-3 text-teal-400" /> Dupliqué</>
                        : <><Copy className="h-3 w-3" /> Dupliquer</>
                      }
                    </button>
                  </div>
                )}
                {!funnel.locked && <div className="text-[10px] text-slate-500 font-medium">{activated.has(index) ? '🟢 Auto-pilot actif' : 'Auto-pilot actif'}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};