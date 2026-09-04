import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function UnderDevelopmentScreen() {
  const router = useRouter();
  const { feature } = useLocalSearchParams<{ feature?: string }>();

  return (
    <View className="flex-1 bg-background p-6">
      <Pressable accessibilityLabel="Voltar" className="h-11 w-11 justify-center" onPress={() => router.back()}>
        <Ionicons color={colors.foreground} name="arrow-back" size={24} />
      </Pressable>
      <View className="flex-1 items-center justify-center">
        <View className="mb-6 size-24 items-center justify-center rounded-full bg-muted">
          <Ionicons color={colors.primary} name="construct-outline" size={42} />
        </View>
        <Text className="text-center font-dm-bold text-[26px] text-foreground">Em desenvolvimento</Text>
        <Text className="mt-3 max-w-[310px] text-center font-dm text-[15px] leading-6 text-muted-foreground">
          {feature ? `${feature} está` : 'Esta funcionalidade está'} sendo preparada para uma
          próxima versão do IbiVibe.
        </Text>
      </View>
    </View>
  );
}
