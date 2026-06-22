/**
 * ActiveAudienceEngine — Orchestrateur "Active Audience"
 *
 * 3 onglets :
 *   Comment-to-DM  → lier mot-clé → ressource envoyée par DM automatiquement
 *   Engagement Bot → agent IA qui répond aux commentaires < 5 min
 *   Story Calendar → 3 templates de Stories interactives générées chaque lundi
 */
import { MessageSquare, Bot, Calendar, Users2, Zap, TrendingUp } from 'lucide-react';
import { Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@blinkdotnew/ui';
import { CommentToDMTab }    from './CommentToDM';
import { EngagementBotTab } from './EngagementBot';
import { StoryCalendarTab } from './StoryCalendar';

/* ── KPI strip ───────────────────────────────────────────────── */
const KPIS = [
  { label: 'DMs envoyés ce mois', value: '178',  icon: MessageSquare, color: 'text-violet-500' },
  { label: 'Commentaires répondus', value: '94',  icon: Bot,           color: 'text-emerald-500' },
  { label: 'Interactions Stories',  value: '1.2k', icon: TrendingUp,   color: 'text-pink-500'   },
];

export function ActiveAudienceEngine() {
  return (
    <Card className="overflow-hidden border-2 border-pink-200 dark:border-pink-900/50 bg-gradient-to-br from-white via-pink-50/20 to-white dark:from-slate-900 dark:via-pink-950/10 dark:to-slate-900 shadow-xl shadow-pink-100/50 dark:shadow-none">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-pink-100 dark:border-pink-900/30 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center shrink-0">
            <Users2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              Active Audience Engine
              <Badge className="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 border-none text-[10px]">AUTO IA</Badge>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Comment-to-DM · Bot réponses · Stories interactives</p>
          </div>
        </div>

        {/* KPIs strip */}
        <div className="flex gap-4 flex-wrap">
          {KPIS.map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="flex items-center gap-2">
                <Icon className={`w-4 h-4 shrink-0 ${k.color}`} />
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{k.value}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{k.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="comment-dm">
        <div className="px-5 pt-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="comment-dm">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Comment-to-DM
            </TabsTrigger>
            <TabsTrigger value="bot">
              <Bot className="w-3.5 h-3.5 mr-1.5" />
              Engagement Bot
            </TabsTrigger>
            <TabsTrigger value="stories">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Story Calendar
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-5">
          <TabsContent value="comment-dm" className="mt-0">
            <CommentToDMTab />
          </TabsContent>
          <TabsContent value="bot" className="mt-0">
            <EngagementBotTab />
          </TabsContent>
          <TabsContent value="stories" className="mt-0">
            <StoryCalendarTab />
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
}
