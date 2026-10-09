import { describe, expect, it } from 'vitest';

import { isAdminAccount } from '@/features/admin/admin-access';

describe('admin access', () => {
  it('allows both administrative roles', () => {
    expect(isAdminAccount({ email: 'admin@ibivibe.com', id: 'admin', role: 'admin' })).toBe(true);
    expect(isAdminAccount({ email: 'root@ibivibe.com', id: 'root', role: 'super_admin' })).toBe(
      true,
    );
  });

  it('does not expose the panel to regular accounts', () => {
    expect(isAdminAccount({ email: 'user@ibivibe.com', id: 'user', role: 'user' })).toBe(false);
  });
});
