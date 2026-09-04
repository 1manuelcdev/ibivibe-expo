import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function SearchScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-4 p-4" showsVerticalScrollIndicator={false}>
        <Pressable className="h-12 flex-row items-center gap-2.5 rounded-button border border-border px-4" onPress={() => router.push('/(app)/search/expanded')}>
          <Ionicons color={colors.mutedForeground} name="search-outline" size={18} />
          <Text className="flex-1 font-dm text-base text-muted-foreground">O que vamos fazer hoje na Ibiapaba?</Text>
        </Pressable>
        <Text className="font-dm text-base text-muted-foreground">
          Atualize seus interesses para ver recomendações certeiras
        </Text>
        <View className="gap-2 border-t border-border pt-4">
          <Text className="font-dm-semibold text-base text-muted-foreground">Sugestões</Text>
          <Text className="font-dm text-base text-muted-foreground">
            Estamos trabalhando para trazer sugestões inteligentes para você.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
