import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import type { HomeCity } from '@/features/home/models/home-types';
import { colors } from '@/theme/tokens';

export function LocationSheet({
  cities,
  error,
  isLoading,
  onClose,
  onRetry,
  onSelect,
  selectedCityId,
  visible,
}: {
  cities: HomeCity[];
  error: boolean;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (city: HomeCity | null) => void;
  selectedCityId: string | null;
  visible: boolean;
}) {
  const previewImage = cities.find((city) => city.cover_img_url)?.cover_img_url;

  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Alterar localização</Text>
          <Ionicons color={colors.foreground} name="settings-outline" size={24} />
        </View>
        <View style={styles.switcher}>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.preview} />
          ) : (
            <View style={[styles.preview, styles.previewFallback]}>
              <Ionicons color={colors.mutedForeground} name="map-outline" size={36} />
            </View>
          )}
          <View style={styles.actions}>
            <Pressable onPress={() => onSelect(null)} style={styles.primaryButton}>
              <Text style={styles.primaryLabel}>Me localize</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton}>
              <Text style={styles.secondaryLabel}>Editar</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.recents}>
          <Text style={styles.recentsTitle}>Locais recentes</Text>
          <View style={styles.list}>
            <CityRow city={null} onSelect={onSelect} selected={selectedCityId === null} />
            {isLoading ? (
              <View style={styles.state}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : error ? (
              <View style={styles.state}>
                <Text style={styles.stateText}>Não foi possível carregar as cidades.</Text>
                <Pressable onPress={onRetry}>
                  <Text style={styles.retry}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : cities.length ? (
              cities
                .slice(0, 5)
                .map((city, index) => (
                  <CityRow
                    city={city}
                    isLast={index === Math.min(cities.length, 5) - 1}
                    key={city.id}
                    onSelect={onSelect}
                    selected={city.id === selectedCityId}
                  />
                ))
            ) : (
              <View style={styles.state}>
                <Text style={styles.stateText}>Nenhuma cidade disponível agora.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

function CityRow({
  city,
  isLast = false,
  onSelect,
  selected,
}: {
  city: HomeCity | null;
  isLast?: boolean;
  onSelect: (city: HomeCity | null) => void;
  selected: boolean;
}) {
  return (
    <Pressable
      onPress={() => onSelect(city)}
      style={[styles.cityRow, isLast && styles.lastCityRow]}
    >
      <Ionicons
        color={selected ? colors.primary : colors.foreground}
        name="person-circle-outline"
        size={18}
      />
      <Text style={styles.cityText}>{city?.name ?? 'Toda a Ibiapaba'}</Text>
      <Ionicons color={colors.foreground} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = {
  content: { gap: 24, paddingBottom: 12 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 8,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  switcher: { gap: 16 },
  preview: { borderRadius: 12, height: 179, width: '100%' as const },
  previewFallback: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    justifyContent: 'center' as const,
  },
  actions: { flexDirection: 'row' as const, gap: 8 },
  primaryButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    flex: 1,
    height: 48,
    justifyContent: 'center' as const,
  },
  primaryLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  secondaryButton: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    height: 48,
    justifyContent: 'center' as const,
  },
  secondaryLabel: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 14 },
  recents: { gap: 12 },
  recentsTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  list: { backgroundColor: '#27272A', borderRadius: 16, overflow: 'hidden' as const },
  cityRow: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
  },
  lastCityRow: { borderBottomWidth: 0 },
  cityText: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 14 },
  state: { alignItems: 'center' as const, gap: 10, padding: 20 },
  stateText: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  retry: { color: colors.primary, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
} as const;
