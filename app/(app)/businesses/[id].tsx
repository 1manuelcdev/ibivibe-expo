import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntityDetailScreen } from '@/features/details/components/EntityDetailScreen';
import { colors } from '@/theme/tokens';

export default function BusinessDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}>
      <EntityDetailScreen id={id} kind="business" />
    </SafeAreaView>
  );
}
