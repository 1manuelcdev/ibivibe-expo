import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeScreen } from '@/features/home/components/HomeScreen';

export default function HomeRoute() {
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <HomeScreen />
    </SafeAreaView>
  );
}
