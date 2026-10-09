import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { colors } from '@/theme/tokens';

type AppBackButtonProps = {
  fallbackHref: Href;
};

/**
 * Returns to a known parent route inside the current stack. A direct link has
 * no local history, so it is replaced with the known parent instead.
 */
export function AppBackButton({ fallbackHref }: AppBackButtonProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel="Voltar"
      hitSlop={8}
      onPress={() => {
        if (router.canDismiss()) {
          router.dismissTo(fallbackHref);
          return;
        }

        router.replace(fallbackHref);
      }}
    >
      <Ionicons color={colors.foreground} name="arrow-back" size={25} />
    </Pressable>
  );
}
