/**
 * useSMSCampaignRealtime
 *
 * Subscribes to a per-campaign Blink Realtime channel (`sms-campaign-{id}`)
 * and drives live metric updates into the analytics panel.
 *
 * Two modes:
 *   • Publisher (first subscriber) — simulates metric events arriving in
 *     real time (deliveries → opens → clicks → conversions) at realistic
 *     intervals and publishes them on the channel.
 *   • Subscriber — receives those events and updates local state.
 *
 * This means: if two browser tabs have the same campaign open, both will
 * see the counters tick up simultaneously via Blink Realtime.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { blink } from '../blink/client';
import { useAuth } from './useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface LiveMetrics {
  delivered:  number;
  opened:     number;
  clicked:    number;
  converted:  number;
  revenue:    number;
  /** 0–100 – how far through the simulation we are */
  progress:   number;
  /** Whether we're still receiving live events */
  isLive:     boolean;
  /** Connection status */
  status:     'connecting' | 'live' | 'completed' | 'error';
  /** Latest event description for the feed */
  events:     LiveEvent[];
}

export interface LiveEvent {
  id:        string;
  ts:        Date;
  type:      'delivered' | 'opened' | 'clicked' | 'converted';
  count:     number;
  label:     string;
}

interface Options {
  campaignId:    string;
  totalSent:     number;
  avgBasket:     number;
  /** If true, this instance drives the simulation (publisher). Defaults to true. */
  autoSimulate?: boolean;
}

// ── Final-state targets (derived from sent) ────────────────────────────────────

function targets(sent: number, avgBasket: number) {
  const delivered  = Math.round(sent * 0.987);
  const opened     = Math.round(delivered * 0.962);
  const clicked    = Math.round(opened * 0.431);
  const converted  = Math.round(clicked * 0.287);
  const revenue    = converted * avgBasket;
  return { delivered, opened, clicked, converted, revenue };
}

// ── Simulation schedule (offsets in ms from campaign send) ────────────────────
// Each step: { delay, type, fraction of final value to release }

function buildSchedule(
  sent: number,
  avgBasket: number
): Array<{ delay: number; type: LiveEvent['type']; value: number; label: string }> {
  const t = targets(sent, avgBasket);
  return [
    // Deliveries — immediate burst
    { delay:     800, type: 'delivered', value: Math.round(t.delivered * 0.5),  label: 'Livraison lot 1/2'     },
    { delay:    2000, type: 'delivered', value: t.delivered,                     label: 'Livraison complète ✅'  },
    // Opens — rapid first wave (30 min = simulate as 5 s)
    { delay:    3500, type: 'opened',    value: Math.round(t.opened * 0.18),     label: 'Premières ouvertures'  },
    { delay:    5000, type: 'opened',    value: Math.round(t.opened * 0.38),     label: 'Pic d\'ouverture 🔥'   },
    { delay:    7500, type: 'opened',    value: Math.round(t.opened * 0.62),     label: 'Ouvertures en cours'   },
    { delay:   10500, type: 'opened',    value: Math.round(t.opened * 0.81),     label: 'Ralentissement'        },
    { delay:   14000, type: 'opened',    value: t.opened,                        label: 'Ouvertures stabilisées'},
    // Clicks — follow opens with ~2 s lag
    { delay:    6000, type: 'clicked',   value: Math.round(t.clicked * 0.20),    label: 'Premiers clics'        },
    { delay:    8500, type: 'clicked',   value: Math.round(t.clicked * 0.45),    label: 'Clics en hausse'       },
    { delay:   12000, type: 'clicked',   value: Math.round(t.clicked * 0.75),    label: 'CTR accéléré 📈'       },
    { delay:   16000, type: 'clicked',   value: t.clicked,                       label: 'Clics finalisés'       },
    // Conversions — trailing clicks by ~3 s
    { delay:    9500, type: 'converted', value: Math.round(t.converted * 0.15),  label: 'Premières réservations'},
    { delay:   13500, type: 'converted', value: Math.round(t.converted * 0.42),  label: 'Conversions en cours'  },
    { delay:   18000, type: 'converted', value: Math.round(t.converted * 0.75),  label: 'Conversions accélérées'},
    { delay:   22000, type: 'converted', value: t.converted,                     label: 'Campagne complétée 🎉' },
  ];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSMSCampaignRealtime({
  campaignId,
  totalSent,
  avgBasket,
  autoSimulate = true,
}: Options): LiveMetrics {
  const { user } = useAuth();
  const channelName = `sms-campaign-${campaignId}`;

  const [metrics, setMetrics] = useState<LiveMetrics>({
    delivered: 0, opened: 0, clicked: 0, converted: 0, revenue: 0,
    progress: 0, isLive: true, status: 'connecting', events: [],
  });

  const channelRef  = useRef<ReturnType<typeof blink.realtime.channel> | null>(null);
  const timersRef   = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Publish a metric event onto the channel
  const publish = useCallback(async (
    type: LiveEvent['type'],
    value: number,
    label: string,
  ) => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.publish('metric', { type, value, label }, {
        userId: user?.id ?? 'system',
      });
    } catch {
      // Non-fatal — just means real-time delivery skipped
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let channel: ReturnType<typeof blink.realtime.channel> | null = null;
    let mounted = true;

    const init = async () => {
      try {
        channel = blink.realtime.channel(channelName);
        channelRef.current = channel;

        await channel.subscribe({ userId: user.id });

        if (!mounted) return;
        setMetrics(m => ({ ...m, status: 'live' }));

        // ── Listen for metric events ───────────────────────────────────────
        channel.onMessage((msg: any) => {
          if (!mounted || msg.type !== 'metric') return;
          const { type, value, label } = msg.data as {
            type: LiveEvent['type']; value: number; label: string;
          };

          setMetrics(prev => {
            // Update the matching counter (take the max — idempotent)
            const next = { ...prev };
            if (type === 'delivered' && value > prev.delivered) next.delivered = value;
            if (type === 'opened'    && value > prev.opened)    next.opened    = value;
            if (type === 'clicked'   && value > prev.clicked)   next.clicked   = value;
            if (type === 'converted' && value > prev.converted) {
              next.converted = value;
              next.revenue   = value * avgBasket;
            }

            // Progress = how far along the final targets we are
            const t = targets(totalSent, avgBasket);
            const progress = Math.round(
              ((next.delivered / t.delivered) * 0.15 +
               (next.opened    / t.opened)    * 0.30 +
               (next.clicked   / t.clicked)   * 0.25 +
               (next.converted / t.converted) * 0.30) * 100
            );
            next.progress = Math.min(100, progress);

            // Append to live event feed (keep last 8)
            const event: LiveEvent = {
              id:    `${msg.id}-${type}`,
              ts:    new Date(msg.timestamp),
              type,
              count: value,
              label,
            };
            next.events = [event, ...prev.events].slice(0, 8);

            // Mark completed when we reach final conversion value
            if (next.converted >= t.converted) {
              next.isLive  = false;
              next.status  = 'completed';
              next.progress = 100;
            }

            return next;
          });
        });

        // ── Publish simulation schedule (publisher mode) ───────────────────
        if (autoSimulate) {
          const schedule = buildSchedule(totalSent, avgBasket);
          const lastDelay = Math.max(...schedule.map(s => s.delay));

          schedule.forEach(step => {
            const t = setTimeout(() => {
              if (!mounted) return;
              publish(step.type, step.value, step.label);
            }, step.delay);
            timersRef.current.push(t);
          });

          // After all events, mark completed
          const done = setTimeout(() => {
            if (!mounted) return;
            setMetrics(m => ({ ...m, isLive: false, status: 'completed', progress: 100 }));
          }, lastDelay + 1500);
          timersRef.current.push(done);
        }

      } catch (err) {
        if (!mounted) return;
        setMetrics(m => ({ ...m, status: 'error', isLive: false }));
      }
    };

    init().catch(console.error);

    return () => {
      mounted = false;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      channel?.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  return metrics;
}
