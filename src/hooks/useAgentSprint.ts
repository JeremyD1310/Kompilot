import { BACKEND_URL as KOMPILOT_BACKEND_URL } from '@/lib/backend';
/**
 * useAgentSprint — hook to call the Kompilot backend agent endpoints.
 *
 * Each agent (Content Factory, Ad Spy, Reporter) has its own invoke function.
 * The backend returns { success, content, logs, functionCall, meta }.
 * Logs are streamed back in a single response and fed into the terminal state.
 *
 * Usage:
 *   const { runSprint, runAdSpy, runReport, isRunning, logs, lastMeta } = useAgentSprint();
 */

import { useState, useCallback } from 'react';
import { blink } from '../blink/client';

const BACKEND_URL = KOMPILOT_BACKEND_URL;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentMeta {
  provider: string;
  model: string;
  tokens: { input: number; output: number };
  latencyMs: number;
}

export interface SprintResult {
  content: string;
  posts: Array<{ platform: string; content: string; hashtags: string; bestTime: string }>;
  functionCall: { tool: string; result: unknown };
  logs: string[];
  meta: AgentMeta;
}

export interface AdSpyResult {
  content: string;
  functionCall: { tool: string; result: unknown };
  logs: string[];
  meta: AgentMeta;
}

export interface ReportResult {
  content: string;
  functionCall: { tool: string; result: unknown };
  logs: string[];
  meta: AgentMeta;
}

export type WorkflowStep = 'idle' | 'media_planner' | 'ad_spy' | 'account_manager' | 'completed' | 'failed';

export interface SequentialWorkflowParams {
  brief: string;
  sector: string;
  tone: string;
  platforms: string[];
  postCount: number;
  clientName: string;
  competitor: string;
  period: string;
  satisfaction: number;
  highlights: string;
}

export interface SequentialWorkflowResult {
  sprint: SprintResult;
  adSpy: AdSpyResult;
  report: ReportResult;
}

// ── Helper: get auth token ─────────────────────────────────────────────────────

async function getToken(): Promise<string | null> {
  try {
    return await blink.auth.getValidToken();
  } catch {
    return null;
  }
}

// ── Helper: call backend with auth ────────────────────────────────────────────

async function callAgent<T>(
  path: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`[${res.status}] ${err}`);
  }

  return res.json() as Promise<T>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAgentSprint() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastMeta, setLastMeta] = useState<AgentMeta | null>(null);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');

  const appendLog = (newLogs: string[]) => {
    setLogs(prev => [...prev.slice(-50), ...newLogs]);
  };

  /** Content Factory — generates posts and injects them into the calendar */
  const runSprint = useCallback(async (params: {
    brief: string;
    sector: string;
    tone: string;
    platforms: string[];
    postCount: number;
    establishmentId?: string;
    injectToCalendar?: boolean;
  }): Promise<SprintResult> => {
    setIsRunning(true);
    const startLog = `[${new Date().toTimeString().slice(0, 8)}] [Agent Content] ⚙️ Sprint lancé — connexion au backend...`;
    appendLog([startLog]);

    try {
      const result = await callAgent<SprintResult>('/api/agents/sprint', {
        ...params,
        injectToCalendar: params.injectToCalendar ?? true,
      });
      appendLog(result.logs ?? []);
      setLastMeta(result.meta);
      return result;
    } catch (err) {
      const errLog = `[${new Date().toTimeString().slice(0, 8)}] [Agent Content] ❌ Erreur: ${String(err)}`;
      appendLog([errLog]);
      throw err;
    } finally {
      setIsRunning(false);
    }
  }, []);

  /** Ad Spy — analyzes competitor + enriches with AIO sync data */
  const runAdSpy = useCallback(async (params: {
    competitor: string;
    myBusiness?: string;
    sector?: string;
  }): Promise<AdSpyResult> => {
    setIsRunning(true);
    const startLog = `[${new Date().toTimeString().slice(0, 8)}] [Agent Ad Spy] 🔍 Analyse lancée — connexion au backend...`;
    appendLog([startLog]);

    try {
      const result = await callAgent<AdSpyResult>('/api/agents/adspy', params);
      appendLog(result.logs ?? []);
      setLastMeta(result.meta);
      return result;
    } catch (err) {
      const errLog = `[${new Date().toTimeString().slice(0, 8)}] [Agent Ad Spy] ❌ Erreur: ${String(err)}`;
      appendLog([errLog]);
      throw err;
    } finally {
      setIsRunning(false);
    }
  }, []);

  /** Reporter — reads action history and generates a monthly report */
  const runReport = useCallback(async (params: {
    clientName: string;
    period: string;
    sector: string;
    highlights?: string;
    satisfaction?: number;
  }): Promise<ReportResult> => {
    setIsRunning(true);
    const startLog = `[${new Date().toTimeString().slice(0, 8)}] [Agent Reporter] 📊 Rapport lancé — lecture de l'historique...`;
    appendLog([startLog]);

    try {
      const result = await callAgent<ReportResult>('/api/agents/report', params);
      appendLog(result.logs ?? []);
      setLastMeta(result.meta);
      return result;
    } catch (err) {
      const errLog = `[${new Date().toTimeString().slice(0, 8)}] [Agent Reporter] ❌ Erreur: ${String(err)}`;
      appendLog([errLog]);
      throw err;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  const runSequentialWorkflow = useCallback(async (
    params: SequentialWorkflowParams,
  ): Promise<SequentialWorkflowResult> => {
    try {
      setWorkflowStep('media_planner');
      const sprint = await runSprint({
        brief: params.brief,
        sector: params.sector,
        tone: params.tone,
        platforms: params.platforms,
        postCount: params.postCount,
      });
      setWorkflowStep('ad_spy');
      const adSpy = await runAdSpy({
        competitor: params.competitor,
        myBusiness: params.clientName,
        sector: params.sector,
      });
      setWorkflowStep('account_manager');
      const report = await runReport({
        clientName: params.clientName,
        period: params.period,
        sector: params.sector,
        highlights: [params.highlights, sprint.content, adSpy.content].filter(Boolean).join('\n\n'),
        satisfaction: params.satisfaction,
      });
      setWorkflowStep('completed');
      return { sprint, adSpy, report };
    } catch (error) {
      setWorkflowStep('failed');
      throw error;
    }
  }, [runAdSpy, runReport, runSprint]);

  return { runSprint, runAdSpy, runReport, runSequentialWorkflow, workflowStep, isRunning, logs, lastMeta, clearLogs };
}
