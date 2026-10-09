import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminCityGalleryScreen } from '@/features/admin/components/AdminCityGalleryScreen';
import { colors } from '@/theme/tokens';

export default function AdminCityGalleryRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <AdminCityGalleryScreen />
    </SafeAreaView>
  );
}
