import { SafeAreaView } from 'react-native-safe-area-context';

import { MyEventsScreen } from '@/features/events/components/MyEventsScreen';
import { colors } from '@/theme/tokens';

export default function ManageEventsRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <MyEventsScreen />
    </SafeAreaView>
  );
}
