import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppNavbar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    />
  );
}

function AppNavbar(_props: object) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  if (pathname.includes('/search/expanded')) return null;
  const items = [
    {
      icon: 'home-outline' as const,
      selectedIcon: 'home' as const,
      label: 'Início',
      route: '/(app)/home',
    },
    {
      icon: 'search-outline' as const,
      selectedIcon: 'search' as const,
      label: 'Buscar',
      route: '/(app)/search',
    },
    {
      icon: 'heart-outline' as const,
      selectedIcon: 'heart' as const,
      label: 'Favoritos',
      route: '/(app)/favorites',
    },
    {
      icon: 'person-outline' as const,
      selectedIcon: 'person' as const,
      label: 'Conta',
      route: '/(app)/accounts',
    },
  ];
  const activeIndex = pathname.includes('/search')
    ? 1
    : pathname.includes('/favorites')
      ? 2
      : pathname.includes('/accounts')
        ? 3
        : 0;

  return (
    <View className="flex-row justify-around border-t border-border bg-background px-4 pt-2" style={{ paddingBottom: insets.bottom, height: 68 + insets.bottom }}>
      {items.map((item, index) => {
        const selected = activeIndex === index;
        return (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as never)}
            className="flex-1 items-center gap-0.5"
          >
            <Ionicons
              color={selected ? colors.foreground : colors.mutedForeground}
              name={selected ? item.selectedIcon : item.icon}
              size={25}
            />
            <Text
              className={`font-dm-medium text-xs ${selected ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
