import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminCityEditorScreen } from '@/features/admin/components/AdminCityEditorScreen';
import { colors } from '@/theme/tokens';

export default function AdminCityEditorRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <AdminCityEditorScreen />
    </SafeAreaView>
  );
}
