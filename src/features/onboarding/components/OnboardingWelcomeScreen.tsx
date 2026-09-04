import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useSessionStore } from '@/stores/session-store';
import { Button } from '@/components/Button';

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
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 gap-8 px-6 pb-6 pt-8">
        <View className="flex-1 items-center justify-center gap-4">
          <Image className="size-[249px]" source={illustrations[variant]} />
          <View className="items-center gap-2">
            <Text className="font-dm-semibold text-2xl text-foreground">Boas-vindas, {displayName}!</Text>
            <Text className="text-center font-dm text-base leading-6 text-foreground">
              {isBusiness
                ? 'Vamos começar a divulgar em breve, mas primeiro precisamos saber mais sobre seu trabalho.'
                : 'Vamos iniciar a exploração em breve, mas primeiro precisamos saber de seus interesses para recomendar de forma acertada.'}
            </Text>
          </View>
        </View>
        <Button
          onPress={() =>
            router.push(
              isBusiness
                ? '/(onboarding)/business/data'
                : '/(onboarding)/user/businesses',
            )
          }
        >
          Continuar
        </Button>
      </View>
    </SafeAreaView>
  );
}
