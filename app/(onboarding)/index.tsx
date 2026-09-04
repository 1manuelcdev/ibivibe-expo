import { Redirect } from 'expo-router';

import { useSessionStore } from '@/stores/session-store';

export default function OnboardingIndex() {
  const account = useSessionStore((state) => state.account);
  const isBusiness = account?.type === 'business';

  return <Redirect href={isBusiness ? '/(onboarding)/business/welcome' : '/(onboarding)/user/welcome'} />;
}
