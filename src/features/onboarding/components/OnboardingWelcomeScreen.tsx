import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

const illustrations = {
  business: require('../../../../assets/onboarding/business-welcome.png'),
  user: require('../../../../assets/onboarding/user-welcome.png'),
};

export function OnboardingWelcomeScreen({ variant }: { variant: 'business' | 'user' }) {
  const router = useRouter();
  const account = useSessionStore((state) => state.account);
  const displayName = account?.display_name || account?.name || 'você';
  const isBusiness = variant === 'business';

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.main}>
          <Image source={illustrations[variant]} style={styles.illustration} />
          <View style={styles.copy}>
            <Text style={styles.title}>Boas-vindas, {displayName}!</Text>
            <Text style={styles.description}>
              {isBusiness
                ? 'Vamos começar a divulgar em breve, mas primeiro precisamos saber mais sobre seu trabalho.'
                : 'Vamos iniciar a exploração em breve, mas primeiro precisamos saber de seus interesses para recomendar de forma acertada.'}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push(
              isBusiness
                ? '/(onboarding)/business/data'
                : '/(onboarding)/user/businesses',
            )
          }
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryLabel}>Continuar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { flex: 1, gap: 32, paddingBottom: 24, paddingHorizontal: 24, paddingTop: 31 },
  main: { alignItems: 'center' as const, flex: 1, gap: 16, justifyContent: 'center' as const },
  illustration: { height: 249, width: 249 },
  copy: { alignItems: 'center' as const, gap: 8 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 24, textAlign: 'center' as const },
  description: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 16, lineHeight: 23, textAlign: 'center' as const },
  primaryButton: { alignItems: 'center' as const, backgroundColor: colors.primary, borderRadius: 24, height: 48, justifyContent: 'center' as const, width: '100%' as const },
  primaryLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  pressed: { opacity: 0.8 },
} as const;
