import type { Account } from '@/types/auth';

export function isAdminAccount(account: Account | null) {
  if (!account) return false;

  if (
    account.is_admin === true ||
    account.role === 'admin' ||
    account.role === 'super_admin' ||
    account.type === 'admin'
  ) {
    return true;
  }

  return (
    Array.isArray(account.roles) &&
    account.roles.some((role) => role === 'admin' || role === 'super_admin')
  );
}
