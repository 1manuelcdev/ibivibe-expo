import { SafeAreaView } from 'react-native-safe-area-context';

import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <RegisterForm />
    </SafeAreaView>
  );
}
