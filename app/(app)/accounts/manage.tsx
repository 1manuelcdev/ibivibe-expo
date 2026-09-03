import { SafeAreaView } from 'react-native-safe-area-context';

import { ManageAccountsScreen } from '@/features/accounts/components/ManageAccountsScreen';
import { colors } from '@/theme/tokens';

export default function ManageAccountsRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ManageAccountsScreen />
    </SafeAreaView>
  );
}
