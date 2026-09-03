import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchScreen } from '@/features/search/components/SearchScreen';
import { colors } from '@/theme/tokens';

export default function SearchRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <SearchScreen />
    </SafeAreaView>
  );
}
