import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { useSessionStore } from '@/stores/session-store';

export default function Index() {
  const status = useSessionStore((state) => state.status);
  const restoreSession = useSessionStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (status === 'boot') {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#0A0A0A]">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (status === 'needs-verification') return <Redirect href="/(auth)/verify-email" />;
  if (status === 'needs-onboarding') return <Redirect href="/(onboarding)" />;
  if (status === 'authenticated') return <Redirect href="/(app)/home" />;
  return <Redirect href="/(public)/welcome" />;
}
