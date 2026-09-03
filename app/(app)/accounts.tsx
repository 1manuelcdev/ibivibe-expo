import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountScreen } from '@/features/accounts/components/AccountScreen';
import { colors } from '@/theme/tokens';

export default function AccountsRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <AccountScreen />
    </SafeAreaView>
  );
}
