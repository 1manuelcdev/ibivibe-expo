import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function UnderDevelopmentScreen() {
  const router = useRouter();
  const { feature } = useLocalSearchParams<{ feature?: string }>();

  return (
    <View style={styles.screen}>
      <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.back}>
        <Ionicons color={colors.foreground} name="arrow-back" size={24} />
      </Pressable>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name="construct-outline" size={42} />
        </View>
        <Text style={styles.title}>Em desenvolvimento</Text>
        <Text style={styles.description}>
          {feature ? `${feature} está` : 'Esta funcionalidade está'} sendo preparada para uma
          próxima versão do IbiVibe.
        </Text>
      </View>
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1, padding: 24 },
  back: { minHeight: 44, justifyContent: 'center' as const, width: 44 },
  content: { alignItems: 'center' as const, flex: 1, justifyContent: 'center' as const },
  icon: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 32,
    height: 96,
    justifyContent: 'center' as const,
    marginBottom: 24,
    width: 96,
  },
  title: {
    color: colors.foreground,
    fontFamily: 'DMSans-Bold',
    fontSize: 26,
    textAlign: 'center' as const,
  },
  description: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
    maxWidth: 310,
    textAlign: 'center' as const,
  },
} as const;
