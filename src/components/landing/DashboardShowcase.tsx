/**
 * DashboardShowcase — Animated cycling dashboard preview for the landing page hero.
 * Replaces the static "03" step card with a dynamic video-like showcase
 * that cycles through 3 feature scenes: Calendar, Inbox, Analytics.
 */
import { useState, useEffect } from 'react';
import { Calendar, MessageSquare, BarChart3, TrendingUp, Star, Eye } from 'lucide-react';

const SCENES = [
  {
    id: 'calendar',
    title: 'Calendrier éditorial IA',
    color: '#0D9488',
    icon: Calendar,
    items: [
      { day: 'Lun', time: '09:00', text: 'Post Instagram — Nouveau menu', status: 'scheduled' },
      { day: 'Lun', time: '12:00', text: 'Story Facebook — Behind the scenes', status: 'scheduled' },
      { day: 'Mar', time: '08:30', text: 'LinkedIn — Article sectoriel IA', status: 'draft' },
      { day: 'Mar', time: '18:00', text: 'TikTok — POV: meilleur plat', status: 'ai-generated' },
      { day: 'Mer', time: '10:00', text: 'Google Business — Promo weekend', status: 'scheduled' },
    ],
  },
  {
    id: 'inbox',
    title: 'Inbox unifiée',
    color: '#3B82F6',
    icon: MessageSquare,
    items: [
      { source: 'Google', from: 'Marie D.', text: 'Super expérience, je recommande ! ⭐⭐⭐⭐⭐', time: '2 min', replied: true },
      { source: 'Instagram', from: '@foodie_paris', text: 'Vous ouvrez le dimanche ?', time: '15 min', replied: false },
      { source: 'WhatsApp', from: 'Jean-Pierre', text: 'Réservation pour 4 personnes samedi', time: '1h', replied: true },
      { source: 'Google', from: 'Lucas M.', text: 'Service impeccable, plats délicieux 🙏', time: '3h', replied: true },
    ],
  },
  {
    id: 'analytics',
    title: 'G.E.O. Analytics',
    color: '#8B5CF6',
    icon: BarChart3,
    metrics: [
      { label: 'Score Visibilité', value: '74', prev: '18', unit: '/100' },
      { label: 'Avis Google', value: '47', prev: '12', unit: '' },
      { label: 'Reach mensuel', value: '12.4K', prev: '3.2K', unit: '' },
      { label: 'Citations IA', value: '8', prev: '0', unit: 'plateformes' },
    ],
    graphData: [12, 18, 15, 22, 28, 34, 41, 38, 52, 58, 65, 74],
  },
];

const SCENE_DURATION = 4000; // ms per scene

function CalendarScene({ scene }: { scene: typeof SCENES[0] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <Calendar size={11} className="text-teal-400" />
        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Cette semaine</span>
      </div>
      {scene.items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] animate-fade-in" style={{ animationDelay: `${i * 120}ms` }}>
          <span className="text-[9px] text-slate-500 w-7 shrink-0">{item.day}</span>
          <span className="text-[9px] text-slate-600 w-8 shrink-0">{item.time}</span>
          <span className="text-[10px] text-slate-300 truncate flex-1">{item.text}</span>
          <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${
            item.status === 'ai-generated' ? 'bg-violet-500/20 text-violet-400' :
            item.status === 'scheduled' ? 'bg-teal-500/20 text-teal-400' :
            'bg-slate-500/20 text-slate-400'
          }`}>
            {item.status === 'ai-generated' ? 'IA' : item.status === 'scheduled' ? 'Planifié' : 'Brouillon'}
          </span>
        </div>
      ))}
    </div>
  );
}

function InboxScene({ scene }: { scene: typeof SCENES[0] }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={11} className="text-blue-400" />
        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Messages récents</span>
        <span className="ml-auto text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full font-bold">4 nouveaux</span>
      </div>
      {scene.items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
          <span className={`text-[8px] px-1 py-0.5 rounded font-bold shrink-0 mt-0.5 ${
            item.source === 'Google' ? 'bg-red-500/15 text-red-400' :
            item.source === 'Instagram' ? 'bg-pink-500/15 text-pink-400' :
            'bg-green-500/15 text-green-400'
          }`}>{item.source}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-300">{item.from}</span>
              <span className="text-[8px] text-slate-600 ml-auto shrink-0">{item.time}</span>
            </div>
            <p className="text-[9px] text-slate-500 truncate">{item.text}</p>
          </div>
          {item.replied && (
            <span className="text-[8px] text-teal-400 shrink-0 mt-1">✓ Auto</span>
          )}
        </div>
      ))}
    </div>
  );
}

function AnalyticsScene({ scene }: { scene: typeof SCENES[0] }) {
  const graph = scene.graphData;
  const max = Math.max(...graph);
  const h = 40;
  const w = 160;
  const points = graph.map((v, i) => {
    const x = (i / (graph.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={11} className="text-violet-400" />
        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Score G.E.O.</span>
        <TrendingUp size={9} className="text-emerald-400 ml-auto" />
        <span className="text-[9px] text-emerald-400 font-bold">+311%</span>
      </div>

      {/* Mini graph */}
      <div className="px-1">
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 40 }}>
          <defs>
            <linearGradient id="geoGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={`0,${h} ${points} ${w},${h}`} fill="url(#geoGrad)" />
          <polyline points={points} fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {scene.metrics.map((m, i) => (
          <div key={i} className="px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <p className="text-[8px] text-slate-500 uppercase tracking-wider">{m.label}</p>
            <p className="text-[14px] font-black text-slate-100 leading-none">
              {m.value}<span className="text-[9px] text-slate-500 font-normal ml-0.5">{m.unit}</span>
            </p>
            <p className="text-[8px] text-slate-600 mt-0.5">
              <span className="text-emerald-400">↑</span> depuis {m.prev}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardShowcase() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setSceneIndex(i => (i + 1) % SCENES.length);
          return 0;
        }
        return prev + 2.5; // 100 / (4000/100) = 2.5 per 100ms
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const scene = SCENES[sceneIndex];
  const Icon = scene.icon;

  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0D1117] shadow-[0_20px_60px_-10px_rgba(0,0,0,.7),0_0_0_1px_rgba(13,148,136,.18)] w-full">
      {/* Browser chrome header */}
      <div className="bg-[#161B22] px-3.5 py-2 flex items-center gap-2 border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          {['#FF5F57', '#FFBD2E', '#28CA41'].map(c => (
            <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 4px ${c}55` }} />
          ))}
        </div>
        <div className="flex-1 bg-white/[0.06] rounded px-3 py-0.5 text-center">
          <span className="text-[10px] text-slate-500 font-medium">app.kompilot.io/dashboard</span>
        </div>
      </div>

      {/* Scene tabs */}
      <div className="flex border-b border-white/[0.06]">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => { setSceneIndex(i); setProgress(0); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold transition-colors ${
              i === sceneIndex ? 'text-white bg-white/[0.06] border-b-2' : 'text-slate-600 hover:text-slate-400'
            }`}
            style={i === sceneIndex ? { borderBottomColor: s.color } : undefined}
          >
            <s.icon size={10} />
            {s.title}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.04]">
        <div
          className="h-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%`, background: scene.color }}
        />
      </div>

      {/* Scene content */}
      <div className="p-3 min-h-[180px]" key={sceneIndex}>
        {scene.id === 'calendar' && <CalendarScene scene={scene} />}
        {scene.id === 'inbox' && <InboxScene scene={scene} />}
        {scene.id === 'analytics' && <AnalyticsScene scene={scene} />}
      </div>
    </div>
  );
}
