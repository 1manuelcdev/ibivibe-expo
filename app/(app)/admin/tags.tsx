import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminTagsScreen } from '@/features/admin/components/AdminTagsScreen';
import { colors } from '@/theme/tokens';

export default function AdminTagsRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <AdminTagsScreen />
    </SafeAreaView>
  );
}
