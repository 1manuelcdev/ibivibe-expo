const ONBOARDING_KEY_PREFIX = 'ibivibe:onboarding:';

function getKey(accountId: string) {
  return `${ONBOARDING_KEY_PREFIX}${accountId}`;
}

export const onboardingStorage = {
  async getCompletionState(accountId: string) {
    const value = localStorage.getItem(getKey(accountId));

    if (value === null) return null;
    return value === 'completed';
  },

  async markPending(accountId: string) {
    localStorage.setItem(getKey(accountId), 'pending');
  },

  async markCompleted(accountId: string) {
    localStorage.setItem(getKey(accountId), 'completed');
  },
};
