import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { TextField } from '@/components/TextField';
import { adminApi, type AdminCity } from '@/features/admin/admin-api';
import { isAdminAccount } from '@/features/admin/admin-access';
import { EventTagsSheet } from '@/features/events/components/EventTagsSheet';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

type FormState = {
  description: string;
  latitude: string;
  longitude: string;
  name: string;
  slug: string;
};

export function AdminCityEditorScreen() {
  const { cityId } = useLocalSearchParams<{ cityId: string }>();
  const account = useSessionStore((state) => state.account);
  const cities = useQuery({ queryFn: adminApi.getCities, queryKey: ['admin', 'cities'] });
  const city = cities.data?.find((item) => item.id === cityId);

  if (!isAdminAccount(account)) return null;
  if (cities.isLoading) return <EditorState loading />;
  if (cities.isError || !city) return <EditorState error onRetry={() => cities.refetch()} />;

  return <CityEditorForm city={city} key={city.id} />;
}

function CityEditorForm({ city }: { city: AdminCity }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => formFromCity(city));
  const [selectedTags, setSelectedTags] = useState<OnboardingTag[]>(
    () => city.tags?.map((tag) => ({ ...tag, group_id: '' })) ?? [],
  );
  const [tagsVisible, setTagsVisible] = useState(false);
  const save = useMutation({
    mutationFn: async () => {
      const latitude = form.latitude.trim();
      const longitude = form.longitude.trim();
      if (Boolean(latitude) !== Boolean(longitude))
        throw new Error('Informe latitude e longitude juntas.');
      if (latitude && (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))))
        throw new Error('Informe coordenadas válidas.');
      await adminApi.updateCity(city.id, {
        description: form.description.trim() || null,
        ...(latitude ? { latitude: Number(latitude), longitude: Number(longitude) } : {}),
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
      });
      await adminApi.updateCityTags(
        city.id,
        selectedTags.map((tag) => tag.id),
      );
    },
    onError: (error) => Alert.alert('Não foi possível salvar a cidade', getApiErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] });
      router.back();
    },
  });
  const updateField = (field: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/admin/cities');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={goBack}>
            <Ionicons color={colors.foreground} name="arrow-back" size={25} />
          </Pressable>
          <Text style={styles.title}>Editar cidade</Text>
        </View>
        <TextField
          label="Nome"
          onChangeText={(value) => updateField('name', value)}
          required
          value={form.name}
        />
        <TextField
          label="Slug"
          onChangeText={(value) => updateField('slug', value)}
          value={form.slug}
        />
        <TextField
          inputStyle={styles.descriptionInput}
          label="Descrição"
          multiline
          onChangeText={(value) => updateField('description', value)}
          placeholder="Descreva a cidade"
          textAlignVertical="top"
          value={form.description}
        />
        <View style={styles.coordinateSection}>
          <Text style={styles.sectionTitle}>Localização</Text>
          <Text style={styles.sectionDescription}>
            Latitude e longitude devem ser informadas juntas.
          </Text>
          <View style={styles.coordinates}>
            <TextField
              containerStyle={styles.coordinateField}
              keyboardType="decimal-pad"
              label="Latitude"
              onChangeText={(value) => updateField('latitude', value)}
              value={form.latitude}
            />
            <TextField
              containerStyle={styles.coordinateField}
              keyboardType="decimal-pad"
              label="Longitude"
              onChangeText={(value) => updateField('longitude', value)}
              value={form.longitude}
            />
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <Text style={styles.sectionDescription}>
                {selectedTags.length
                  ? `${selectedTags.length} selecionada${selectedTags.length > 1 ? 's' : ''}`
                  : 'Nenhuma tag selecionada'}
              </Text>
            </View>
            <Pressable onPress={() => setTagsVisible(true)} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonLabel}>Editar tags</Text>
            </Pressable>
          </View>
          {selectedTags.length ? (
            <View style={styles.tags}>
              {selectedTags.map((tag) => (
                <Text key={tag.id} style={styles.tag}>
                  {tag.name}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Mídias</Text>
              <Text style={styles.sectionDescription}>Defina a capa e organize a galeria.</Text>
            </View>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(app)/admin/cities/gallery',
                  params: { cityId: city.id },
                })
              }
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonLabel}>Gerenciar</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          disabled={save.isPending || !form.name.trim()}
          onPress={() => save.mutate()}
          style={[styles.saveButton, (save.isPending || !form.name.trim()) && styles.disabled]}
        >
          <Text style={styles.saveLabel}>{save.isPending ? 'Salvando…' : 'Salvar alterações'}</Text>
        </Pressable>
      </View>
      <EventTagsSheet
        onClose={() => setTagsVisible(false)}
        onSave={setSelectedTags}
        selectedTags={selectedTags}
        targetType="city"
        title="Tags da cidade"
        visible={tagsVisible}
      />
    </View>
  );
}

function formFromCity(city: AdminCity): FormState {
  const [longitude, latitude] = city.location?.coordinates ?? [];
  return {
    description: city.description ?? '',
    latitude: latitude === undefined ? '' : String(latitude),
    longitude: longitude === undefined ? '' : String(longitude),
    name: city.name,
    slug: city.slug ?? '',
  };
}

function EditorState({
  error,
  loading,
  onRetry,
}: {
  error?: boolean;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Text style={styles.stateText}>Não foi possível carregar a cidade.</Text>
          {error && onRetry ? (
            <Pressable onPress={onRetry}>
              <Text style={styles.retry}>Tentar novamente</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 20, padding: 24, paddingBottom: 112 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  descriptionInput: { height: 112, paddingTop: 12 },
  coordinateSection: { gap: 10 },
  coordinates: { flexDirection: 'row' as const, gap: 12 },
  coordinateField: { flex: 1 },
  section: { borderTopColor: colors.border, borderTopWidth: 1, gap: 12, paddingTop: 18 },
  sectionHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
  },
  sectionInfo: { flex: 1 },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  sectionDescription: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    marginTop: 3,
  },
  secondaryButton: {
    backgroundColor: '#27272A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 13 },
  tags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  tag: {
    backgroundColor: '#27272A',
    borderRadius: 12,
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    padding: 16,
    position: 'absolute' as const,
    right: 0,
  },
  saveButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center' as const,
  },
  saveLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 15 },
  disabled: { opacity: 0.5 },
  state: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center' as const,
    padding: 24,
  },
  stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
} as const;
