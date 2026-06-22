import React, { useState } from 'react';
import { 
  Card, CardHeader, CardTitle, CardContent, 
  Button, Badge, cn
} from '@blinkdotnew/ui';
import { 
  ShieldAlert, Star, MessageSquare, AlertTriangle, 
  ChevronDown, ChevronUp, Sparkles, RefreshCw,
  MapPin
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from '../icons/SocialIcons';

interface NegativeSignal {
  id: number;
  type: 'review' | 'comment';
  channel: string;
  source: string;
  text: string;
  severity: 'Modérée' | 'Élevée';
  rating?: number;
  aiResponse: string;
}

const SIGNALS: NegativeSignal[] = [
  {
    id: 1,
    type: 'review',
    channel: 'Google Maps',
    source: 'Google Review',
    text: "Service lent, pas à la hauteur de la réputation",
    severity: 'Modérée',
    rating: 2,
    aiResponse: "Nous vous remercions sincèrement de ce retour — votre ressenti compte énormément pour nous. Pourriez-vous nous accorder quelques instants pour comprendre précisément ce qui n'a pas été à la hauteur de vos attentes ? Nous vous invitons à nous contacter en message privé afin d'y apporter une réponse personnalisée."
  },
  {
    id: 2,
    type: 'comment',
    channel: 'Instagram',
    source: 'Instagram comment',
    text: "Déçu par la qualité, plus comme avant",
    severity: 'Élevée',
    aiResponse: "Votre déception nous touche particulièrement, car l'excellence est notre quête permanente. Quelle dimension de notre qualité vous semble avoir évolué ? Nous serions honorés d'échanger avec vous en direct pour restaurer votre confiance et comprendre votre perspective."
  },
  {
    id: 3,
    type: 'review',
    channel: 'Google Maps',
    source: 'Google Review',
    text: "Jamais rappelé malgré deux messages laissés",
    severity: 'Élevée',
    rating: 1,
    aiResponse: "Nous vous présentons nos excuses les plus sincères pour ce silence qui ne reflète en rien nos standards d'accompagnement. La réactivité est au cœur de notre promesse. Pourriez-vous nous transmettre vos coordonnées en privé ? Je m'assurerai personnellement qu'un responsable vous contacte dans l'heure."
  },
  {
    id: 4,
    type: 'comment',
    channel: 'Facebook',
    source: 'Facebook comment',
    text: "Prix en hausse mais qualité en baisse",
    severity: 'Modérée',
    aiResponse: "Nous entendons votre remarque sur l'équilibre entre valeur et investissement. Pourriez-vous nous préciser quel aspect de notre service vous semble moins performant aujourd'hui ? Votre regard d'expert nous est précieux pour ajuster nos processus et maintenir notre promesse d'excellence."
  }
];

export const ReputationCrisisCell: React.FC = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'instagram': return <InstagramIcon className="w-3 h-3" />;
      case 'facebook': return <FacebookIcon className="w-3 h-3" />;
      default: return <MapPin className="w-3 h-3" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'instagram': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'facebook': return 'bg-blue-600/10 text-blue-600 border-blue-600/20';
      default: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
  };

  return (
    <Card className="w-full max-w-2xl border-amber-500/40 bg-slate-950 shadow-2xl overflow-hidden">
      <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-500 animate-pulse" />
            <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
              Cellule de Crise Réputationnelle
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-500/30 text-amber-500 gap-1 px-2 py-1">
            <RefreshCw className="w-3 h-3" /> Temps réel
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {SIGNALS.map((signal) => (
          <div 
            key={signal.id}
            className={cn(
              "group relative overflow-hidden transition-all duration-300 rounded-xl border",
              expandedId === signal.id 
                ? "bg-slate-900 border-teal-500/50 shadow-lg shadow-teal-500/10" 
                : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
            )}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn("gap-1 text-[10px] font-bold uppercase", getChannelColor(signal.channel))}>
                    {getChannelIcon(signal.channel)} {signal.channel}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] border-none",
                      signal.severity === 'Élevée' ? "text-rose-500 bg-rose-500/5" : "text-amber-500 bg-amber-500/5"
                    )}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1" /> {signal.severity}
                  </Badge>
                </div>
                {signal.rating && (
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={cn("w-3 h-3", i < signal.rating! ? "text-amber-500 fill-amber-500" : "text-slate-700")} 
                      />
                    ))}
                  </div>
                )}
              </div>

              <p className="text-sm font-medium text-slate-200 mb-4 line-clamp-2">
                "{signal.text}"
              </p>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedId(expandedId === signal.id ? null : signal.id)}
                className={cn(
                  "w-full justify-between h-9 text-xs transition-all duration-300",
                  expandedId === signal.id 
                    ? "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30" 
                    : "bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  {expandedId === signal.id ? "Réponse générée" : "Générer une réponse maïeutique"}
                </span>
                {expandedId === signal.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {expandedId === signal.id && (
              <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-300">
                <div className="relative p-4 rounded-lg bg-teal-500/5 border border-teal-500/20">
                  <div className="absolute -top-2 left-4 px-2 bg-slate-950 text-[10px] font-bold text-teal-500 uppercase tracking-widest border border-teal-500/20 rounded">
                    IA PREMIUM
                  </div>
                  <p className="text-sm text-teal-50/90 leading-relaxed italic">
                    {signal.aiResponse}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};