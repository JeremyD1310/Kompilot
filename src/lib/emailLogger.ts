/**
 * Lightweight email log system stored in localStorage.
 * Simulates server-side delivery tracking for demo / testing purposes.
 * Key: 'nc_email_logs' — max 100 entries (FIFO, oldest removed first).
 */

const STORAGE_KEY = 'nc_email_logs';
const MAX_ENTRIES = 100;

export type EmailLogStatus = 'sent' | 'delivered' | 'bounced' | 'failed';

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  type: 'welcome' | 'campaign' | 'notification';
  status: EmailLogStatus;
  sentAt: string;
  errorMessage?: string;
}

function generateId(): string {
  return `el_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getEmailLogs(): EmailLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EmailLog[]) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs: EmailLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function logEmail(entry: Omit<EmailLog, 'id' | 'sentAt'>): EmailLog {
  const log: EmailLog = {
    ...entry,
    id: generateId(),
    sentAt: new Date().toISOString(),
  };
  const logs = getEmailLogs();
  logs.unshift(log);
  // Enforce FIFO cap
  if (logs.length > MAX_ENTRIES) logs.splice(MAX_ENTRIES);
  saveLogs(logs);
  return log;
}

export function getFailedEmails(): EmailLog[] {
  return getEmailLogs().filter(l => l.status === 'bounced' || l.status === 'failed');
}

export function markEmailDelivered(id: string): void {
  const logs = getEmailLogs().map(l =>
    l.id === id ? { ...l, status: 'delivered' as EmailLogStatus } : l
  );
  saveLogs(logs);
}

export function markEmailBounced(id: string, errorMessage: string): void {
  const logs = getEmailLogs().map(l =>
    l.id === id ? { ...l, status: 'bounced' as EmailLogStatus, errorMessage } : l
  );
  saveLogs(logs);
}

export function clearEmailLogs(): void {
  saveLogs([]);
}
