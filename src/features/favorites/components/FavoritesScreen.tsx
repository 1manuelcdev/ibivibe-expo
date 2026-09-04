import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useHomeViewModel } from '@/features/home/viewmodels/useHomeViewModel';
import { useFavoritesViewModel } from '@/features/favorites/viewmodels/useFavoritesViewModel';
import { colors } from '@/theme/tokens';

type FavoriteTab = 'cities' | 'businesses' | 'events';

export function FavoritesScreen() {
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
            return (
              <View key={item.id} style={styles.row}>
                <Ionicons
                  color={colors.primary}
                  name={
                    tab === 'cities'
                      ? 'location-outline'
                      : tab === 'businesses'
                        ? 'briefcase-outline'
                        : 'calendar-outline'
                  }
                  size={24}
                />
                <Text style={styles.rowText}>{title}</Text>
                {favorite && (
                  <Pressable onPress={() => remove.mutate(favorite.id)}>
                    <Ionicons color={colors.mutedForeground} name="heart" size={22} />
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 16, padding: 24, paddingBottom: 32 },
  heading: { color: colors.foreground, fontFamily: 'DMSans-Bold', fontSize: 24 },
  tabs: { borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row' as const },
  tab: { flex: 1, paddingBottom: 12, paddingTop: 8 },
  activeTab: { borderBottomColor: colors.primary, borderBottomWidth: 2 },
  tabText: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    textAlign: 'center' as const,
  },
  activeTabText: { color: colors.foreground },
  empty: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    paddingTop: 24,
    textAlign: 'center' as const,
  },
  row: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    paddingVertical: 16,
  },
  rowText: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 15 },
} as const;
