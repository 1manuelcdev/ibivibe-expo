import { SafeAreaView } from 'react-native-safe-area-context';

import { FavoritesScreen } from '@/features/favorites/components/FavoritesScreen';
import { colors } from '@/theme/tokens';

export default function FavoritesRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <FavoritesScreen />
    </SafeAreaView>
  );
}
