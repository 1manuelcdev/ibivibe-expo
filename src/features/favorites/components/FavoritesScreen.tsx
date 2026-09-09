import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { useHomeViewModel } from '@/features/home/viewmodels/useHomeViewModel';
import { useFavoritesViewModel } from '@/features/favorites/viewmodels/useFavoritesViewModel';
import { FavoriteButton } from '@/components/FavoriteButton';
import { colors } from '@/theme/tokens';

type FavoriteTab = 'cities' | 'businesses' | 'events';

export function FavoritesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<FavoriteTab>('cities');
  const { favorites, remove } = useFavoritesViewModel();
  const home = useHomeViewModel();
  const favoriteItems = favorites.data ?? [];
  const idField =
    `${tab === 'cities' ? 'city' : tab === 'businesses' ? 'business' : 'event'}_id` as
      | 'city_id'
      | 'business_id'
      | 'event_id';
  const ids = new Set(favoriteItems.map((item) => item[idField]));
  const source =
    tab === 'cities'
      ? home.cities.data
      : tab === 'businesses'
        ? home.businesses.data
        : home.events.data;
  const selected = source?.filter((item) => ids.has(item.id)) ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Favoritos</Text>
        <View style={styles.tabs}>
          {(
            [
              ['cities', 'Cidades'],
              ['businesses', 'Empresas'],
              ['events', 'Eventos'],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              onPress={() => setTab(value)}
              style={[styles.tab, tab === value && styles.activeTab]}
            >
              <Text style={[styles.tabText, tab === value && styles.activeTabText]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {favorites.isLoading || (favoriteItems.length > 0 && !source) ? (
          <ActivityIndicator color={colors.primary} />
        ) : selected.length === 0 ? (
          <Text style={styles.empty}>
            Nenhum {tab === 'cities' ? 'cidade' : tab === 'businesses' ? 'empresa' : 'evento'}{' '}
            favoritado ainda.
          </Text>
        ) : (
          selected.map((item) => {
            const title =
              'name' in item
                ? item.name
                : 'commercial_name' in item
                  ? (item.commercial_name ?? 'Empresa')
                  : 'Evento';
            const favorite = favoriteItems.find((entry) => entry[idField] === item.id);
            const image =
              'avatar_url' in item
                ? item.avatar_url
                : 'cover_img_url' in item
                  ? item.cover_img_url
                  : null;
            return (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/(app)/${tab}/${item.id}`)}
                style={styles.row}
              >
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={[styles.cover, tab === 'businesses' && styles.businessAvatar]}
                  />
                ) : (
                  <View
                    style={[
                      styles.coverFallback,
                      tab === 'businesses' && styles.businessAvatar,
                    ]}
                  >
                    <Ionicons color={colors.mutedForeground} name={favoriteIcons[tab]} size={24} />
                  </View>
                )}
                <Text numberOfLines={1} style={styles.rowText}>
                  {title}
                </Text>
                {favorite && (
                  <FavoriteButton
                    isFavorite
                    onPress={() => remove.mutateAsync(favorite.id)}
                    size={22}
                  />
                )}
                <Ionicons color={colors.mutedForeground} name="chevron-forward" size={22} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 16, padding: 16, paddingBottom: 32 },
  heading: { color: colors.foreground, fontFamily: 'DMSans-Bold', fontSize: 24 },
  tabs: { borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row' as const },
  tab: { flex: 1, paddingBottom: 12, paddingTop: 8 },
  activeTab: { borderBottomColor: colors.primary, borderBottomWidth: 2 },
  tabText: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  activeTabText: { color: colors.foreground },
  empty: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    paddingTop: 24,
    textAlign: 'center' as const,
  },
  row: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 12,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 8,
  },
  cover: { borderRadius: 8, height: 56, width: 56 },
  businessAvatar: { borderRadius: 999, overflow: 'hidden' as const },
  coverFallback: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    borderRadius: 8,
    height: 56,
    justifyContent: 'center' as const,
    width: 56,
  },
  rowText: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 15 },
} as const;

const favoriteIcons = {
  businesses: 'briefcase-outline',
  cities: 'location-outline',
  events: 'calendar-outline',
} as const;
