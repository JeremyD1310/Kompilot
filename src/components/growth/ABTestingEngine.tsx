import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, MessageSquare, Tag, Reply, 
  Trophy, Zap, Play, RotateCcw 
} from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Tabs, TabsList, TabsTrigger, TabsContent,
  Button, Input, Badge, toast 
} from '@blinkdotnew/ui';
import { cn } from '../../lib/utils';

interface VariantData {
  a: string;
  b: string;
  aExtra?: string;
  bExtra?: string;
}

export const ABTestingEngine = () => {
  const [activeTab, setActiveTab] = useState('messages');
  const [rates, setRates] = useState({ a: 12.4, b: 11.2 });
  const [data, setData] = useState<Record<string, VariantData>>({
    messages: { a: 'Offre exclusive pour vous', b: 'Cadeau : -20% sur votre commande', aExtra: 'Bonjour, voici une offre...', bExtra: 'Hello ! On a un petit cadeau...' },
    coupons: { a: '20%', b: '15%', aExtra: '7 jours', bExtra: '15 jours' },
    comment: { a: 'INFOS', b: 'PROMO', aExtra: 'Voici les infos...', bExtra: 'Profitez de la promo...' }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => ({
        a: Math.max(0.1, Number((prev.a + (Math.random() - 0.5) * 0.8).toFixed(1))),
        b: Math.max(0.1, Number((prev.b + (Math.random() - 0.5) * 0.8).toFixed(1))),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const resetTest = () => {
    setRates({ a: 10 + Math.random() * 5, b: 10 + Math.random() * 5 });
    toast.success('Nouveau test lancé');
  };

  const applyWinner = () => {
    const winner = rates.a > rates.b ? 'A' : 'B';
    toast.success(`Variante ${winner} appliquée avec succès !`);
  };

  const isWinnerA = rates.a >= rates.b * 1.15;
  const isWinnerB = rates.b >= rates.a * 1.15;

  return (
    <Card className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] border-slate-800 text-white overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <FlaskConical className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Moteur d'A/B Testing</CardTitle>
            <p className="text-xs text-slate-400">Optimisez vos messages et offres en temps réel</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetTest} className="text-slate-300 hover:text-white hover:bg-white/10">
            <RotateCcw className="h-4 w-4 mr-2" /> Nouveau test
          </Button>
          <Button size="sm" onClick={applyWinner} className="bg-teal-600 hover:bg-teal-500 text-white border-0">
            <Zap className="h-4 w-4 mr-2" /> Appliquer le gagnant
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="messages" onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 mb-6">
            <TabsTrigger value="messages" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white gap-2">
              <MessageSquare className="h-4 w-4" /> Messages
            </TabsTrigger>
            <TabsTrigger value="coupons" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white gap-2">
              <Tag className="h-4 w-4" /> Coupons / Offres
            </TabsTrigger>
            <TabsTrigger value="comment" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2">
              <Reply className="h-4 w-4" /> Comment-to-DM
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <VariantCard label="Variante A" value={rates.a} isWinner={isWinnerA} color="teal">
              <VariantInputs type={activeTab} side="a" data={data[activeTab]} onChange={(k, v) => setData(d => ({...d, [activeTab]: {...d[activeTab], [k]: v}}))} />
            </VariantCard>
            <VariantCard label="Variante B" value={rates.b} isWinner={isWinnerB} color="violet">
              <VariantInputs type={activeTab} side="b" data={data[activeTab]} onChange={(k, v) => setData(d => ({...d, [activeTab]: {...d[activeTab], [k]: v}}))} />
            </VariantCard>
          </div>
        </Tabs>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <StatCard label="Total testés" value="1,284" icon={<Play className="h-4 w-4 text-slate-400" />} />
          <StatCard label="Conversion A" value={`${rates.a}%`} icon={<div className="w-2 h-2 rounded-full bg-teal-500" />} />
          <StatCard label="Conversion B" value={`${rates.b}%`} icon={<div className="w-2 h-2 rounded-full bg-violet-500" />} />
          <StatCard label="CA estimé" value={`${(rates.a * 150 + rates.b * 150).toLocaleString()}€`} icon={<Zap className="h-4 w-4 text-amber-400" />} />
        </div>
      </CardContent>
    </Card>
  );
};

const VariantCard = ({ label, value, isWinner, color, children }: any) => (
  <div className={cn("relative p-5 rounded-xl border bg-slate-900/40 transition-all duration-500", 
    isWinner ? (color === 'teal' ? "border-teal-500/50 bg-teal-500/5 shadow-[0_0_20px_rgba(20,184,166,0.1)]" : "border-violet-500/50 bg-violet-500/5 shadow-[0_0_20px_rgba(139,92,246,0.1)]") : "border-slate-800")}>
    <div className="flex justify-between items-center mb-4">
      <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</span>
      {isWinner && <Badge className={cn("animate-bounce", color === 'teal' ? "bg-teal-500" : "bg-violet-500")}><Trophy className="h-3 w-3 mr-1" /> Meilleur</Badge>}
    </div>
    <div className="space-y-4 mb-6">{children}</div>
    <div className="flex items-end justify-between pt-4 border-t border-white/5">
      <span className="text-sm text-slate-500">Taux de conversion</span>
      <span className={cn("text-3xl font-black tabular-nums", color === 'teal' ? "text-teal-400" : "text-violet-400")}>{value}%</span>
    </div>
  </div>
);

const VariantInputs = ({ type, side, data, onChange }: any) => {
  if (type === 'messages') return (
    <>
      <Input value={data[side]} onChange={(e) => onChange(side, e.target.value)} placeholder="Objet du mail" className="bg-slate-950/50 border-slate-800 text-slate-200" />
      <textarea value={data[`${side}Extra`]} onChange={(e) => onChange(`${side}Extra`, e.target.value)} placeholder="Corps du message" className="w-full h-20 bg-slate-950/50 border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500" />
    </>
  );
  if (type === 'coupons') return (
    <>
      <Input value={data[side]} onChange={(e) => onChange(side, e.target.value)} placeholder="Remise (%)" className="bg-slate-950/50 border-slate-800 text-slate-200" />
      <Input value={data[`${side}Extra`]} onChange={(e) => onChange(`${side}Extra`, e.target.value)} placeholder="Expiration (jours)" className="bg-slate-950/50 border-slate-800 text-slate-200" />
    </>
  );
  return (
    <>
      <Input value={data[side]} onChange={(e) => onChange(side, e.target.value)} placeholder="Mot-clé déclencheur" className="bg-slate-950/50 border-slate-800 text-slate-200" />
      <textarea value={data[`${side}Extra`]} onChange={(e) => onChange(`${side}Extra`, e.target.value)} placeholder="Réponse DM" className="w-full h-20 bg-slate-950/50 border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500" />
    </>
  );
};

const StatCard = ({ label, value, icon }: any) => (
  <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">{label}</span>
    </div>
    <div className="text-lg font-bold text-slate-200">{value}</div>
  </div>
);
