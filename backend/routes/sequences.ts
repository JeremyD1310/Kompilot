import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const router = new Hono();

function getBlink(env: Record<string, string>) {
  return createClient({ projectId: env.BLINK_PROJECT_ID, secretKey: env.BLINK_SECRET_KEY });
}

async function getAuth(c: any) {
  const blink = getBlink(c.env as Record<string, string>);
  const auth = await blink.auth.verifyToken(c.req.header('Authorization'));
  if (!auth.valid) return null;
  return auth;
}

function timeout(ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(t) };
}

function uid() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

// 1. GET /api/sequences — list user's sequences
router.get('/api/sequences', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const blink = getBlink(c.env as Record<string, string>);
  const sequences = await blink.db.emailSequences.list({
    where: { userId: auth.userId },
    orderBy: { createdAt: 'desc' }
  });
  return c.json(sequences.map((s: any) => ({
    ...s,
    sendgridKey: s.sendgridKey ? '***' : null
  })));
});

// 2. POST /api/sequences — create sequence
router.post('/api/sequences', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const blink = getBlink(c.env as Record<string, string>);
  const body = await c.req.json();
  if (!body.name || !body.fromEmail) return c.json({ error: 'Name and fromEmail are required' }, 400);

  const sequence = await blink.db.emailSequences.create({
    id: uid(),
    userId: auth.userId,
    name: body.name,
    fromEmail: body.fromEmail,
    fromName: body.fromName || '',
    sendgridKey: body.sendgridKey || '',
    triggerType: body.triggerType || 'manual',
    triggerConfig: JSON.stringify(body.triggerConfig || {}),
    status: 'active',
    totalEnrolled: 0,
    totalSent: 0
  });
  return c.json(sequence);
});

// 11. POST /api/sequences/process — Process pending enrollments
// Define this BEFORE /:id routes to avoid routing conflict
router.post('/api/sequences/process', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const blink = getBlink(c.env as Record<string, string>);
  
  const enrollments = await blink.db.emailSequenceEnrollments.list({
    where: { userId: auth.userId, status: 'active' }
  });

  const results = { sent: 0, errors: [] as string[] };

  for (const enrollment of enrollments) {
    const sequence = await blink.db.emailSequences.get(enrollment.sequenceId);
    if (!sequence || !sequence.sendgridKey || sequence.status !== 'active') continue;

    const steps = await blink.db.emailSequenceSteps.list({
      where: { sequenceId: enrollment.sequenceId, status: 'active' },
      orderBy: { stepOrder: 'asc' }
    });

    if (enrollment.currentStep >= steps.length) {
      await blink.db.emailSequenceEnrollments.update(enrollment.id, { 
        status: 'completed', 
        completedAt: new Date().toISOString() 
      });
      continue;
    }

    const step = steps[enrollment.currentStep];
    const referenceTime = enrollment.lastSentAt 
      ? new Date(enrollment.lastSentAt).getTime() 
      : new Date(enrollment.enrolledAt).getTime();
    
    const sendAfter = referenceTime + (step.delayDays || 0) * 86400000 + (step.delayHours || 0) * 3600000;

    if (Date.now() >= sendAfter) {
      const { signal, clear } = timeout(10000);
      try {
        const payload = {
          personalizations: [{ to: [{ email: enrollment.contactEmail, name: enrollment.contactName || undefined }] }],
          from: { email: sequence.fromEmail, name: sequence.fromName || sequence.fromEmail },
          subject: step.subject,
          content: [{ type: 'text/html', value: step.htmlContent }],
        };

        const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sequence.sendgridKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal
        });

        if (res.ok) {
          await blink.db.emailSequenceEnrollments.update(enrollment.id, {
            currentStep: enrollment.currentStep + 1,
            lastSentAt: new Date().toISOString()
          });
          
          await blink.db.emailSequences.update(sequence.id, {
            totalSent: (sequence.totalSent || 0) + 1
          });

          results.sent++;
        } else {
          const errText = await res.text();
          results.errors.push(`SendGrid error for ${enrollment.contactEmail}: ${res.status} ${errText}`);
        }
      } catch (err: any) {
        results.errors.push(`Error sending to ${enrollment.contactEmail}: ${err.message}`);
      } finally {
        clear();
      }
    }
  }

  return c.json({ success: true, ...results });
});

// 3. PATCH /api/sequences/:id — update settings
router.patch('/api/sequences/:id', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const blink = getBlink(c.env as Record<string, string>);
  const body = await c.req.json();

  const sequence = await blink.db.emailSequences.get(id);
  if (!sequence || sequence.userId !== auth.userId) return c.json({ error: 'Not found' }, 404);

  const updated = await blink.db.emailSequences.update(id, {
    name: body.name ?? sequence.name,
    status: body.status ?? sequence.status,
    fromEmail: body.fromEmail ?? sequence.fromEmail,
    fromName: body.fromName ?? sequence.fromName,
    sendgridKey: body.sendgridKey ?? sequence.sendgridKey,
    triggerType: body.triggerType ?? sequence.triggerType,
    triggerConfig: body.triggerConfig ? JSON.stringify(body.triggerConfig) : sequence.triggerConfig,
    updatedAt: new Date().toISOString()
  });
  return c.json(updated);
});

// 4. DELETE /api/sequences/:id — delete sequence + steps + enrollments
router.delete('/api/sequences/:id', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const blink = getBlink(c.env as Record<string, string>);

  const sequence = await blink.db.emailSequences.get(id);
  if (!sequence || sequence.userId !== auth.userId) return c.json({ error: 'Not found' }, 404);

  await blink.db.emailSequenceSteps.deleteMany({ where: { sequenceId: id } });
  await blink.db.emailSequenceEnrollments.deleteMany({ where: { sequenceId: id } });
  await blink.db.emailSequences.delete(id);

  return c.json({ success: true });
});

// 5. GET /api/sequences/:id/steps — list steps
router.get('/api/sequences/:id/steps', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const blink = getBlink(c.env as Record<string, string>);

  const steps = await blink.db.emailSequenceSteps.list({
    where: { sequenceId: id, userId: auth.userId },
    orderBy: { stepOrder: 'asc' }
  });
  return c.json(steps);
});

// 6. POST /api/sequences/:id/steps — add step
router.post('/api/sequences/:id/steps', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const blink = getBlink(c.env as Record<string, string>);
  const body = await c.req.json();

  if (!body.subject || !body.htmlContent) return c.json({ error: 'Subject and htmlContent required' }, 400);

  const stepCount = await blink.db.emailSequenceSteps.count({ where: { sequenceId: id } });

  const step = await blink.db.emailSequenceSteps.create({
    id: uid(),
    sequenceId: id,
    userId: auth.userId,
    subject: body.subject,
    htmlContent: body.htmlContent,
    delayDays: body.delayDays ?? 0,
    delayHours: body.delayHours ?? 0,
    sendTime: body.sendTime ?? '09:00',
    stepOrder: body.stepOrder ?? stepCount,
    status: 'active'
  });
  return c.json(step);
});

// 7. PATCH /api/sequences/:id/steps/:stepId — update step fields
router.patch('/api/sequences/:id/steps/:stepId', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const stepId = c.req.param('stepId');
  const blink = getBlink(c.env as Record<string, string>);
  const body = await c.req.json();

  const step = await blink.db.emailSequenceSteps.get(stepId);
  if (!step || step.userId !== auth.userId) return c.json({ error: 'Not found' }, 404);

  const updated = await blink.db.emailSequenceSteps.update(stepId, {
    subject: body.subject ?? step.subject,
    htmlContent: body.htmlContent ?? step.htmlContent,
    delayDays: body.delayDays ?? step.delayDays,
    delayHours: body.delayHours ?? step.delayHours,
    sendTime: body.sendTime ?? step.sendTime,
    stepOrder: body.stepOrder ?? step.stepOrder,
    status: body.status ?? step.status
  });
  return c.json(updated);
});

// 8. DELETE /api/sequences/:id/steps/:stepId — delete step
router.delete('/api/sequences/:id/steps/:stepId', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const stepId = c.req.param('stepId');
  const blink = getBlink(c.env as Record<string, string>);

  const step = await blink.db.emailSequenceSteps.get(stepId);
  if (!step || step.userId !== auth.userId) return c.json({ error: 'Not found' }, 404);

  await blink.db.emailSequenceSteps.delete(stepId);
  return c.json({ success: true });
});

// 9. POST /api/sequences/:id/enroll — enroll contacts
router.post('/api/sequences/:id/enroll', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const blink = getBlink(c.env as Record<string, string>);
  const { contacts } = await c.req.json() as { contacts: { email: string; name?: string }[] };

  if (!contacts || !Array.isArray(contacts)) return c.json({ error: 'Contacts array required' }, 400);
  const list = contacts.slice(0, 500);

  const sequence = await blink.db.emailSequences.get(id);
  if (!sequence || sequence.userId !== auth.userId) return c.json({ error: 'Not found' }, 404);

  const enrollments = list.map(contact => ({
    id: uid(),
    sequenceId: id,
    userId: auth.userId,
    contactEmail: contact.email,
    contactName: contact.name || '',
    enrolledAt: new Date().toISOString(),
    currentStep: 0,
    status: 'active'
  }));

  await blink.db.emailSequenceEnrollments.createMany(enrollments);

  const currentTotal = sequence.totalEnrolled || 0;
  await blink.db.emailSequences.update(id, {
    totalEnrolled: currentTotal + enrollments.length
  });

  return c.json({ success: true, count: enrollments.length });
});

// 10. GET /api/sequences/:id/enrollments — list enrollments
router.get('/api/sequences/:id/enrollments', async (c) => {
  const auth = await getAuth(c);
  if (!auth) return c.json({ error: 'Unauthorized' }, 401);
  const id = c.req.param('id');
  const blink = getBlink(c.env as Record<string, string>);

  const enrollments = await blink.db.emailSequenceEnrollments.list({
    where: { sequenceId: id, userId: auth.userId },
    orderBy: { enrolledAt: 'desc' },
    limit: 100
  });
  return c.json(enrollments);
});

export { router };
