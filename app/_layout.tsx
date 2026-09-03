import '../global.css';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('../assets/DMSans-SemiBold.ttf'),
    'DMSans-Bold': require('../assets/DMSans-Bold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            animation: 'none',
            contentStyle: { backgroundColor: colors.background },
            headerShown: false,
          }}
        />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
