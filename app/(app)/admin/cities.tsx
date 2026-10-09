import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminCitiesScreen } from '@/features/admin/components/AdminCitiesScreen';
import { colors } from '@/theme/tokens';

export default function AdminCitiesRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <AdminCitiesScreen />
    </SafeAreaView>
  );
}
