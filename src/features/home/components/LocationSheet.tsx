import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { colors } from '@/theme/tokens';

const recentLocations = ['Tianguá', 'Ubajara', 'Croatá'];

export function LocationSheet({
  onClose,
  onSelect,
  selectedCity,
  visible,
}: {
  onClose: () => void;
  onSelect: (city: string) => void;
  selectedCity: string;
  visible: boolean;
}) {
  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Alterar localização</Text>
          <Pressable onPress={onClose}>
            <Ionicons color={colors.foreground} name="settings-outline" size={22} />
          </Pressable>
        </View>
        <View style={styles.mapPlaceholder}>
          <Ionicons color={colors.mutedForeground} name="map-outline" size={42} />
          <Text style={styles.muted}>Mapa de localização</Text>
          <Text style={styles.mapHint}>
            A seleção de cidade será conectada ao mapa nesta etapa.
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.primaryButton}>
            <Ionicons color={colors.primaryForeground} name="locate-outline" size={18} />
            <Text style={styles.primaryText}>Me localize</Text>
          </Pressable>
          <Pressable onPress={() => onSelect(selectedCity)} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Selecionar cidade</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionTitle}>Locais recentes</Text>
        <View style={styles.recentList}>
          {recentLocations.map((city) => (
            <Pressable key={city} onPress={() => onSelect(city)} style={styles.recentRow}>
              <Ionicons color={colors.mutedForeground} name="location-outline" size={20} />
              <Text style={styles.cityText}>
                {city}
                {city === selectedCity ? '  · atual' : ''}
              </Text>
              <Ionicons color={colors.mutedForeground} name="chevron-forward" size={18} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </BottomSheet>
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
  mapPlaceholder: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 14,
    gap: 6,
    justifyContent: 'center' as const,
    minHeight: 190,
    padding: 20,
  },
  muted: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 16 },
  mapHint: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    textAlign: 'center' as const,
  },
  actions: { flexDirection: 'row' as const, gap: 12 },
  primaryButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 7,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  primaryText: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  secondaryButton: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center' as const,
    minHeight: 48,
    paddingHorizontal: 8,
  },
  secondaryText: {
    color: colors.foreground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    textAlign: 'center' as const,
  },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  recentList: {
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  recentRow: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 12,
  },
  cityText: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 16 },
} as const;
