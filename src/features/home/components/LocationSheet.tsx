import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

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
  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Escolha uma cidade</Text>
          <Pressable accessibilityLabel="Fechar" onPress={onClose}>
            <Ionicons color={colors.foreground} name="close" size={22} />
          </Pressable>
        </View>
        <Text style={styles.description}>
          Você pode explorar toda a Ibiapaba ou definir uma cidade como contexto da sua visita.
        </Text>
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
            cities.map((city) => (
              <CityRow
                key={city.id}
                city={city}
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
      </ScrollView>
    </BottomSheet>
  );
}

function CityRow({
  city,
  onSelect,
  selected,
}: {
  city: HomeCity | null;
  onSelect: (city: HomeCity | null) => void;
  selected: boolean;
}) {
  return (
    <Pressable onPress={() => onSelect(city)} style={styles.cityRow}>
      <Ionicons
        color={selected ? colors.primary : colors.mutedForeground}
        name="location-outline"
        size={20}
      />
      <Text style={styles.cityText}>{city?.name ?? 'Toda a Ibiapaba'}</Text>
      {selected ? (
        <Ionicons color={colors.primary} name="checkmark-circle" size={20} />
      ) : (
        <Ionicons color={colors.mutedForeground} name="chevron-forward" size={18} />
      )}
    </Pressable>
  );
}

const styles = {
  content: { gap: 16, paddingBottom: 12 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  description: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  list: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  cityRow: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
  },
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
