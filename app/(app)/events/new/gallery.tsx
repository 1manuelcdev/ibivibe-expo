import { SafeAreaView } from 'react-native-safe-area-context';

import { EventGalleryScreen } from '@/features/events/components/EventGalleryScreen';
import { colors } from '@/theme/tokens';

export default function EventGalleryRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <EventGalleryScreen />
    </SafeAreaView>
  );
}
