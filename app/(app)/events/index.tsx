import { SafeAreaView } from 'react-native-safe-area-context';

import { OverviewScreen } from '@/features/exploration/components/OverviewScreen';
import { colors } from '@/theme/tokens';

export default function EventsOverviewRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <OverviewScreen kind="events" />
    </SafeAreaView>
  );
}
