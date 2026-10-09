import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { colors } from '@/theme/tokens';

type AppBackButtonProps = {
  fallbackHref: Href;
};

/**
 * Returns to a known parent route when it exists in the stack, or replaces the
 * current route with it when the screen was opened from a deep link.
 */
export function AppBackButton({ fallbackHref }: AppBackButtonProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel="Voltar"
      hitSlop={8}
      onPress={() => router.dismissTo(fallbackHref)}
    >
      <Ionicons color={colors.foreground} name="arrow-back" size={25} />
    </Pressable>
  );
}
