import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function SearchScreen() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.push('/(app)/search/expanded')} style={styles.searchField}>
          <Ionicons color={colors.mutedForeground} name="search-outline" size={18} />
          <Text style={styles.searchText}>O que vamos fazer hoje na Ibiapaba?</Text>
        </Pressable>
        <Text style={styles.message}>
          Atualize seus interesses para ver recomendações certeiras
        </Text>
        <View style={styles.suggestionBox}>
          <Text style={styles.title}>Sugestões</Text>
          <Text style={styles.muted}>
            Estamos trabalhando para trazer sugestões inteligentes para você.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 16, padding: 16 },
  searchField: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
  },
  searchText: {
    color: colors.mutedForeground,
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
  },
  message: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  suggestionBox: { borderTopColor: colors.border, borderTopWidth: 1, gap: 8, paddingTop: 16 },
  title: { color: colors.mutedForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  muted: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
} as const;
