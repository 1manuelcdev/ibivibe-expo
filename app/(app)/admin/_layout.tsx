import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/**
 * Keeps administrative routes in their own navigation stack so nested screens
 * can reliably return to their known parent routes.
 */
export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'fade',
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    />
  );
}
