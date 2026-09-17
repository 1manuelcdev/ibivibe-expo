import type { Account } from '@/types/auth';

const ACTIVE_ACCOUNT_ID_KEY = 'ibivibe.active-account-id';
const SESSIONS_KEY = 'ibivibe.account-sessions';
const refreshTokenKey = (accountId: string) => `ibivibe.account-session.${accountId}.refresh-token`;

export type StoredAccountSession = {
  account: Account;
  lastUsedAt: string;
};

function parseSessions(value: string | null): StoredAccountSession[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as StoredAccountSession[]) : [];
  } catch {
    return [];
  }
}

export const accountSessionStorage = {
  async getActiveAccountId() {
    return localStorage.getItem(ACTIVE_ACCOUNT_ID_KEY);
  },

  async getRefreshToken(accountId: string) {
    return localStorage.getItem(refreshTokenKey(accountId));
  },

  async list(): Promise<StoredAccountSession[]> {
    return parseSessions(localStorage.getItem(SESSIONS_KEY)).sort((a, b) =>
      b.lastUsedAt.localeCompare(a.lastUsedAt),
    );
  },

  async save(account: Account, refreshToken: string) {
    const sessions = await this.list();
    const nextSession: StoredAccountSession = { account, lastUsedAt: new Date().toISOString() };
    const nextSessions = [
      nextSession,
      ...sessions.filter((session) => session.account.id !== account.id),
    ];

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions));
    localStorage.setItem(ACTIVE_ACCOUNT_ID_KEY, account.id);
    localStorage.setItem(refreshTokenKey(account.id), refreshToken);
    return nextSessions;
  },

  async updateRefreshToken(accountId: string, refreshToken: string) {
    localStorage.setItem(refreshTokenKey(accountId), refreshToken);
  },

  async remove(accountId: string) {
    const [sessions, activeAccountId] = await Promise.all([this.list(), this.getActiveAccountId()]);
    const nextSessions = sessions.filter((session) => session.account.id !== accountId);

    localStorage.setItem(SESSIONS_KEY, JSON.stringify(nextSessions));
    localStorage.removeItem(refreshTokenKey(accountId));
    if (activeAccountId === accountId) localStorage.removeItem(ACTIVE_ACCOUNT_ID_KEY);
    return nextSessions;
  },
};
