/**
 * Funnels — Customer Persona + Ad Simulator
 *
 *   GET    /api/funnels/personas              — list user's personas
 *   POST   /api/funnels/personas              — create persona
 *   DELETE /api/funnels/personas/:personaId   — delete persona
 *   POST   /api/funnels/personas/simulate     — score competitor vs user ad (0-100)
 */
import { Hono } from 'hono';
import { createClient } from '@blinkdotnew/sdk';

const app = new Hono<{ Bindings: { BLINK_SECRET_KEY: string } }>();

// ── GET /api/funnels/personas ─────────────────────────────────────────────────
app.get('/personas', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const personas = await blink.db.customerPersonas.list({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return c.json({ personas });
  } catch (err) {
    console.error('[personas GET]', err);
    return c.json({ error: 'Failed to fetch personas' }, 500);
  }
});

// ── POST /api/funnels/personas ────────────────────────────────────────────────
app.post('/personas', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json() as {
      name?: string;
      age?: number;
      jobTitle?: string;
      painPoints?: string[];
      goals?: string[];
      buyingTriggers?: string[];
      description?: string;
    };

    if (!body.name?.trim()) {
      return c.json({ error: 'Le nom du persona est requis.' }, 400);
    }

    const persona = await blink.db.customerPersonas.create({
      id: crypto.randomUUID().replace(/-/g, ''),
      userId: user.id,
      name: body.name.trim(),
      age: body.age ?? null,
      jobTitle: body.jobTitle ?? null,
      painPoints: JSON.stringify(body.painPoints ?? []),
      goals: JSON.stringify(body.goals ?? []),
      buyingTriggers: JSON.stringify(body.buyingTriggers ?? []),
      description: body.description ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return c.json({ persona }, 201);
  } catch (err) {
    console.error('[personas POST]', err);
    return c.json({ error: 'Failed to create persona' }, 500);
  }
});

// ── DELETE /api/funnels/personas/:personaId ───────────────────────────────────
app.delete('/personas/:personaId', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const personaId = c.req.param('personaId');

    // Verify ownership
    const rows = await blink.db.customerPersonas.list({
      where: { id: personaId, userId: user.id },
      limit: 1,
    });
    if (!rows || rows.length === 0) {
      return c.json({ error: 'Persona not found' }, 404);
    }

    await blink.db.customerPersonas.delete(personaId);
    return c.json({ success: true });
  } catch (err) {
    console.error('[personas DELETE]', err);
    return c.json({ error: 'Failed to delete persona' }, 500);
  }
});

// ── POST /api/funnels/personas/simulate ───────────────────────────────────────
// Core feature: score competitor ad vs user ad through the lens of a specific persona
app.post('/personas/simulate', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const blink = createClient({
      projectId: 'presence-manager-saas-gbrhsehk',
      secretKey: c.env.BLINK_SECRET_KEY,
    });

    const token = authHeader.split(' ')[1];
    const user = await blink.auth.verifyToken(token);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json() as {
      personaId?: string;
      competitorAd?: string;
      userAd?: string;
      funnelId?: string;
    };

    if (!body.personaId || !body.competitorAd?.trim() || !body.userAd?.trim()) {
      return c.json({ error: 'personaId, competitorAd et userAd sont requis.' }, 400);
    }

    // Fetch persona
    const personaRows = await blink.db.customerPersonas.list({
      where: { id: body.personaId, userId: user.id },
      limit: 1,
    });
    if (!personaRows || personaRows.length === 0) {
      return c.json({ error: 'Persona introuvable.' }, 404);
    }
    const persona = personaRows[0];

    const painPoints = JSON.parse(persona.painPoints as string ?? '[]');
    const goals = JSON.parse(persona.goals as string ?? '[]');
    const buyingTriggers = JSON.parse(persona.buyingTriggers as string ?? '[]');

    const SYSTEM_PROMPT = `Tu es un expert en psychologie du consommateur et en copywriting basé sur les données.
Tu dois évaluer l'efficacité de publicités selon la psychologie d'un persona spécifique.

RÈGLES D'ÉVALUATION :
- Note chaque publicité sur 100
- Critères : Accroche émotionnelle (25pts), Adéquation au problème (25pts), Clarté du bénéfice (20pts), Confiance/Preuve sociale (15pts), Appel à l'action (15pts)
- Sois précis et objectif dans tes justifications
- Réponds UNIQUEMENT en JSON valide, sans texte avant ni après

FORMAT DE RÉPONSE OBLIGATOIRE :
{
  "competitorScore": 72,
  "userScore": 85,
  "competitorBreakdown": {
    "emotionalHook": 18,
    "problemFit": 20,
    "benefitClarity": 16,
    "socialProof": 10,
    "callToAction": 8
  },
  "userBreakdown": {
    "emotionalHook": 22,
    "problemFit": 23,
    "benefitClarity": 18,
    "socialProof": 12,
    "callToAction": 10
  },
  "competitorStrengths": ["Force 1", "Force 2"],
  "competitorWeaknesses": ["Faiblesse 1"],
  "userStrengths": ["Force 1", "Force 2"],
  "userWeaknesses": ["Faiblesse 1"],
  "personaReaction": "Comment ce persona réagirait à chaque pub (2-3 phrases)",
  "recommendation": "Conseil précis pour améliorer votre pub selon ce persona (2-3 phrases)"
}`;

    const USER_MESSAGE = `PERSONA CIBLE :
- Nom : ${persona.name}
- Poste / Rôle : ${persona.jobTitle ?? 'Non précisé'}
- Âge : ${persona.age ?? 'Non précisé'}
- Description : ${persona.description ?? 'Aucune'}
- Problèmes principaux : ${painPoints.length > 0 ? painPoints.join(', ') : 'Non précisés'}
- Objectifs : ${goals.length > 0 ? goals.join(', ') : 'Non précisés'}
- Déclencheurs d'achat : ${buyingTriggers.length > 0 ? buyingTriggers.join(', ') : 'Non précisés'}

PUBLICITÉ CONCURRENT À NOTER :
"${body.competitorAd}"

MA PUBLICITÉ À NOTER :
"${body.userAd}"

Évalue ces deux publicités selon la psychologie du persona décrit ci-dessus.`;

    const { text } = await blink.ai.generateText({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: USER_MESSAGE },
      ],
      model: 'gpt-4.1',
      maxTokens: 1500,
    });

    // Extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return c.json({ error: 'Format de réponse IA invalide — réessayez.' }, 500);
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Store simulation result
    const simId = crypto.randomUUID().replace(/-/g, '');
    await blink.db.personaAdSimulations.create({
      id: simId,
      userId: user.id,
      personaId: body.personaId,
      funnelId: body.funnelId ?? null,
      competitorAd: body.competitorAd,
      userAd: body.userAd,
      competitorScore: analysis.competitorScore ?? 0,
      userScore: analysis.userScore ?? 0,
      analysis: JSON.stringify(analysis),
      createdAt: new Date().toISOString(),
    });

    return c.json({
      success: true,
      simulationId: simId,
      persona: {
        id: persona.id,
        name: persona.name,
        jobTitle: persona.jobTitle,
        age: persona.age,
      },
      ...analysis,
    });
  } catch (err) {
    console.error('[personas simulate POST]', err);
    return c.json({ error: 'Erreur interne du simulateur.' }, 500);
  }
});

export const router = app;
