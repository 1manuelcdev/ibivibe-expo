import { SafeAreaView } from 'react-native-safe-area-context';

import { NewEventScreen } from '@/features/events/components/NewEventScreen';
import { colors } from '@/theme/tokens';

export default function NewEventRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <NewEventScreen />
    </SafeAreaView>
  );
}
