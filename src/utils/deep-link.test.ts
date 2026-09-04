import { describe, expect, it } from 'vitest';

import { getVerificationRoute } from '@/utils/deep-link';

describe('getVerificationRoute', () => {
  it('routes the direct application scheme to email verification', () => {
    expect(getVerificationRoute('ibivibe:///auth/verify-email?token=token-123')).toBe(
      '/(auth)/verify-email?token=token-123',
    );
  });

  it('unwraps the encoded email tracking link', () => {
    const trackingUrl =
      'http://links.updates.ibivibe.com.br/CL0/ibivibe:%2F%2F%2Fauth%2Fverify-email%3Ftoken=token-123';

    expect(getVerificationRoute(trackingUrl)).toBe('/(auth)/verify-email?token=token-123');
  });

  it('does not redirect unrelated links', () => {
    expect(getVerificationRoute('ibivibe:///businesses/123')).toBeNull();
  });
});
