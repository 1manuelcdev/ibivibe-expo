import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsScreen } from '@/features/settings/components/SettingsScreen';
import { colors } from '@/theme/tokens';

export default function SettingsRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <SettingsScreen />
    </SafeAreaView>
  );
}
