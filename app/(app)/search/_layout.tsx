import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

export default function SearchLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'default',
        contentStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}
    />
  );
}
