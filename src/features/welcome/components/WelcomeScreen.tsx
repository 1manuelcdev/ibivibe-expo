import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Text, useWindowDimensions, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { Button } from '@/components/Button';

const welcomeImages = {
  cave: require('../../../../assets/welcome-cave.jpeg'),
  waterfall: require('../../../../assets/welcome-waterfall.jpeg'),
  food: require('../../../../assets/welcome-food.jpeg'),
  view: require('../../../../assets/welcome-view.jpeg'),
};

export function WelcomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const columnWidth = (width - spacing.screen * 2 - spacing.grid) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <View style={styles.carousel}>
          <View style={[styles.column, { width: columnWidth }]}>
            <Image source={welcomeImages.cave} style={styles.caveImage} />
            <Image source={welcomeImages.food} style={styles.foodImage} />
          </View>
          <View style={[styles.column, { width: columnWidth }]}>
            <Image source={welcomeImages.waterfall} style={styles.waterfallImage} />
            <Image source={welcomeImages.view} style={styles.viewImage} />
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Onde é hoje?</Text>
          <Text style={styles.description}>
            Descubra o que há de melhor nas cidades da Ibiapaba em poucos toques: descubra empresas
            e eventos com filtragem e avaliações simplificadas
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            onPress={() => router.push('/(auth)/login')}
          >
            Entrar
          </Button>
          <Button
            onPress={() => router.push('/(auth)/register')}
            variant="ghost"
          >
            Criar conta
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = {
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    gap: spacing.section,
    paddingHorizontal: spacing.screen,
  },
  carousel: {
    flexDirection: 'row' as const,
    gap: spacing.grid,
    height: 365,
  },
  column: {
    gap: spacing.grid,
  },
  caveImage: {
    width: '100%' as const,
    flex: 1,
    borderRadius: radius.image,
  },
  foodImage: {
    width: '100%' as const,
    height: 151,
    borderRadius: radius.image,
  },
  waterfallImage: {
    width: '100%' as const,
    height: 186,
    borderRadius: radius.image,
  },
  viewImage: {
    width: '100%' as const,
    flex: 1,
    borderRadius: radius.image,
  },
  copy: {
    alignItems: 'center' as const,
    gap: 12,
  },
  title: {
    color: colors.foreground,
    fontFamily: 'DMSans-Bold',
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center' as const,
  },
  description: {
    color: colors.foreground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center' as const,
  },
  actions: {
    gap: 16,
  },
} as const;
