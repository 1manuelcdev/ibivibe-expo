import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <LoginForm initialEmail={typeof email === 'string' ? email : ''} />
    </SafeAreaView>
  );
}
