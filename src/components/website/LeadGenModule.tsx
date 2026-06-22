import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, toast, Input } from '@blinkdotnew/ui';
import { Target, Send, Mail, Users, Star, TrendingUp, Sparkles, Phone } from 'lucide-react';

export default function LeadGenModule() {
  const [selectedMagnet, setSelectedMagnet] = useState('1');

  const magnets = [
    { id: '1', title: "👁️ Test de vue en ligne en 1 min", sub: "Offre d'expertise" },
    { id: '2', title: "📚 Guide : 5 conseils pour mieux voir", sub: "Contenu éducatif" },
    { id: '3', title: "🎁 -15% sur votre première paire", sub: "Offre promotionnelle" }
  ];

  const leads = [
    { id: 'l1', name: "Jean-Marc Lefèvre", email: "jean-marc@gmail.com", score: 92, status: "🔥 Très chaud", color: "bg-rose-500" },
    { id: 'l2', name: "Amélie Rousseau", email: "amelie.r@hotmail.fr", score: 78, status: "🌡️ Chaud", color: "bg-orange-500" },
    { id: 'l3', name: "Pierre Dubois", email: "pierre.d@orange.fr", score: 61, status: "🟡 Tiède", color: "bg-amber-500" },
    { id: 'l4', name: "Sophie Martin", email: "s.martin@free.fr", score: 45, status: "🔵 Froid", color: "bg-blue-500" },
    { id: 'l5', name: "Lucas Bernard", email: "l.bernard@gmail.com", score: 88, status: "🔥 Très chaud", color: "bg-rose-500" }
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Section A: Lead Magnet */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🧲</span> Activez votre aimant à clients
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {magnets.map((magnet) => (
            <div
              key={magnet.id}
              onClick={() => setSelectedMagnet(magnet.id)}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedMagnet === magnet.id
                  ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <h3 className="text-sm font-bold mb-1">{magnet.title}</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{magnet.sub}</p>
            </div>
          ))}
        </div>

        <Card className="p-0 overflow-hidden border border-border/50">
          <div className="bg-muted/50 p-2 text-center border-b border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aperçu du pop-up sur votre site</span>
          </div>
          <div className="p-10 flex justify-center bg-gray-100/50">
            <div className="bg-white rounded-2xl shadow-2xl border border-border p-8 max-w-sm w-full space-y-5 animate-in zoom-in-95 duration-500">
              <div className="text-center space-y-2">
                <Badge className="bg-primary/10 text-primary border-none rounded-full px-4">Avant de partir...</Badge>
                <h3 className="text-xl font-bold leading-tight">
                  {magnets.find(m => m.id === selectedMagnet)?.title} !
                </h3>
              </div>
              <div className="space-y-3">
                <Input placeholder="Prénom" className="h-10 text-sm" />
                <Input placeholder="Email" className="h-10 text-sm" />
              </div>
              <Button className="w-full h-11 text-sm font-bold shadow-lg shadow-primary/25">
                Obtenir mon cadeau →
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                🔒 Vos données sont protégées. Désinscription en 1 clic.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Section B: La Machine à Relancer */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📋</span> Nouveaux Prospects
          </h2>
          <Badge variant="outline" className="text-xs">Derniers 30 jours</Badge>
        </div>
        
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {leads.map((lead) => (
              <div key={lead.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${lead.color}`}>
                    {lead.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold truncate">{lead.name}</h3>
                      <Badge className={`${lead.color} text-white border-none text-[10px] h-4`}>{lead.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-0.5">Score IA</p>
                    <p className="text-sm font-black text-foreground">{lead.score}%</p>
                  </div>
                  <Button
                    variant="ghost" size="sm" className="gap-2 text-xs text-primary hover:bg-primary/5 h-8"
                    onClick={() => toast.success('Offre envoyée par email et SMS !')}
                  >
                    <Send size={14} /> Envoyer une offre
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center justify-center gap-4 py-4 bg-muted/20 rounded-xl border border-dashed border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users size={14} />
            <span>Total : <span className="font-bold text-foreground">128 leads</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Conversion : <span className="font-bold text-foreground">12.4%</span></span>
          </div>
        </div>
      </section>
    </div>
  );
}
