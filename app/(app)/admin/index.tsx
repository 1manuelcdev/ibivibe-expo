import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminPanelScreen } from '@/features/admin/components/AdminPanelScreen';
import { colors } from '@/theme/tokens';

export default function AdminRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <AdminPanelScreen />
    </SafeAreaView>
  );
}
