import { SafeAreaView } from 'react-native-safe-area-context';

import { ExpandedSearchScreen } from '@/features/search/components/ExpandedSearchScreen';
import { colors } from '@/theme/tokens';

export default function ExpandedSearchRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ExpandedSearchScreen />
    </SafeAreaView>
  );
}
