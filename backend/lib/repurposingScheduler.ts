import { createClient } from '@blinkdotnew/sdk';
import type { Env } from './types';

type Row = Record<string, any>;
const CHANNEL_MAP: Record<string, string[]> = { linkedin: ['linkedin'], carousel: ['linkedin'], short_video: ['tiktok'], newsletter: [] };

function nextSlot(start: Date, index: number) {
  const date = new Date(start);
  date.setUTCDate(date.getUTCDate() + index);
  date.setUTCHours(9, 0, 0, 0);
  return date.toISOString();
}

export async function scheduleApprovedRepurposing(env: Env, approval: Row, job: Row) {
  const blink = createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
  const outputRows = (() => { try { const parsed = JSON.parse(job.outputsJson || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })();
  const posts = blink.db.table<Row>('scheduled_posts');
  const links = blink.db.table<Row>('repurposing_scheduled_posts');
  const start = new Date(job.scheduleStartAt || approval.scheduleStartAt || Date.now() + 86400000);
  let scheduled = 0;
  for (const [index, output] of outputRows.entries()) {
    const mappedChannels = CHANNEL_MAP[String(output.channel)] || [];
    if (!mappedChannels.length) continue;
    const postId = `repurpose_${job.id}_${index}`;
    const existing = await posts.get(postId);
    if (!existing) {
      await posts.create({ id: postId, userId: job.userId, textContent: String(output.content || '').slice(0, 12000), channels: JSON.stringify(mappedChannels), scheduledAt: nextSlot(start, index), status: 'scheduled', platformVariants: JSON.stringify({ [mappedChannels[0]]: String(output.content || '').slice(0, 12000), repurposingChannel: output.channel }), campaignId: job.id });
      scheduled += 1;
    }
    const linkExists = await links.list({ where: { jobId: job.id, outputIndex: index }, limit: 1 });
    if (!linkExists[0]) await links.create({ id: crypto.randomUUID(), userId: job.userId, jobId: job.id, approvalId: approval.id, scheduledPostId: postId, outputIndex: index, outputChannel: String(output.channel), scheduledAt: nextSlot(start, index) });
  }
  return scheduled;
}
