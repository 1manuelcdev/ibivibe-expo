import * as SQLite from 'expo-sqlite';

const database = SQLite.openDatabaseSync('ibivibe.db');

function ensureTable() {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS account_onboarding (
      account_id TEXT PRIMARY KEY NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export const onboardingStorage = {
  async getCompletionState(accountId: string) {
    ensureTable();
    const row = database.getFirstSync<{ completed: number }>(
      'SELECT completed FROM account_onboarding WHERE account_id = ?',
      [accountId],
    );

    if (!row) return null;
    return row.completed === 1;
  },

  async markPending(accountId: string) {
    ensureTable();
    database.runSync(
      'INSERT INTO account_onboarding (account_id, completed) VALUES (?, 0) ON CONFLICT(account_id) DO UPDATE SET completed = 0',
      [accountId],
    );
  },

  async markCompleted(accountId: string) {
    ensureTable();
    database.runSync(
      'INSERT INTO account_onboarding (account_id, completed) VALUES (?, 1) ON CONFLICT(account_id) DO UPDATE SET completed = 1',
      [accountId],
    );
  },
};
