import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOwnedBusiness } from '@/features/businesses/use-owned-business';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export default function AppLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppNavbar {...props} />}
      screenOptions={{
        animation: 'fade',
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

function AppNavbar(_props: object) {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const account = useSessionStore((state) => state.account);
  const ownedBusiness = useOwnedBusiness();
  const primaryRoutes = ['/home', '/search', '/favorites', '/accounts'];
  if (!primaryRoutes.includes(pathname)) return null;
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
  const activeIndex = primaryRoutes.indexOf(pathname);

  return (
    <View style={[styles.navbar, { paddingBottom: insets.bottom, height: 68 + insets.bottom }]}>
      {items.map((item, index) => {
        const selected = activeIndex === index;
        return (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as never)}
            style={styles.navItem}
          >
            {item.label === 'Conta' ? (
              <View style={[styles.accountAvatar, selected && styles.activeAccountAvatar]}>
                {ownedBusiness.data?.avatar_url ? (
                  <Image
                    source={{ uri: ownedBusiness.data.avatar_url }}
                    style={styles.accountAvatarImage}
                  />
                ) : (
                  <Text
                    style={[styles.accountAvatarText, selected && styles.activeAccountAvatarText]}
                  >
                    {(account?.display_name ?? account?.name ?? account?.email ?? '?')
                      .slice(0, 1)
                      .toUpperCase()}
                  </Text>
                )}
              </View>
            ) : (
              <Ionicons
                color={selected ? colors.foreground : colors.mutedForeground}
                name={selected ? item.selectedIcon : item.icon}
                size={25}
              />
            )}
            <Text
              style={[
                styles.navLabel,
                { color: selected ? colors.foreground : colors.mutedForeground },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = {
  navbar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row' as const,
    height: 68,
    justifyContent: 'space-around' as const,
    paddingHorizontal: 16,
    paddingTop: 7,
  },
  navItem: { alignItems: 'center' as const, flex: 1, gap: 2 },
  navLabel: { fontFamily: 'DMSans-Medium', fontSize: 12 },
  accountAvatar: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 999,
    height: 25,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    width: 25,
  },
  activeAccountAvatar: { backgroundColor: 'rgba(159,255,139,0.12)' },
  accountAvatarImage: { height: 25, width: 25 },
  accountAvatarText: { color: colors.mutedForeground, fontFamily: 'DMSans-Bold', fontSize: 12 },
  activeAccountAvatarText: { color: colors.primary },
} as const;
