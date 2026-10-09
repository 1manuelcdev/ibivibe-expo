import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi } from '@/features/admin/admin-api';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';
import { TextField } from '@/components/TextField';

export function AdminCitiesScreen() {
  const account = useSessionStore((state) => state.account);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const cities = useQuery({ queryFn: adminApi.getCities, queryKey: ['admin', 'cities'] });
  const visibleCities = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) return cities.data ?? [];
    return (cities.data ?? []).filter((city) =>
      city.name.toLocaleLowerCase('pt-BR').includes(normalized),
    );
  }, [cities.data, search]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/admin');
  }

  if (!isAdminAccount(account)) return null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={goBack}>
            <Ionicons color={colors.foreground} name="arrow-back" size={25} />
          </Pressable>
          <Text style={styles.title}>Editar cidades</Text>
        </View>
        <Text style={styles.description}>
          Selecione uma cidade para gerenciar suas informações.
        </Text>
        <TextField onChangeText={setSearch} placeholder="Buscar cidade" value={search} />
        {cities.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {cities.isError ? (
          <State text="Não foi possível carregar as cidades." onPress={() => cities.refetch()} />
        ) : null}
        {!cities.isLoading && !cities.isError && !visibleCities.length ? (
          <State text={search ? 'Nenhuma cidade encontrada.' : 'Nenhuma cidade disponível.'} />
        ) : null}
        {visibleCities.map((city) => (
          <Pressable
            key={city.id}
            accessibilityHint={`Abre ${city.name}`}
            onPress={() => router.push(`/(app)/admin/cities/${city.id}`)}
            style={styles.city}
          >
            <Ionicons color={colors.foreground} name="location-outline" size={22} />
            <Text style={styles.cityName}>{city.name}</Text>
            <Ionicons color={colors.mutedForeground} name="chevron-forward" size={20} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function State({ onPress, text }: { onPress?: () => void; text: string }) {
  return (
    <View style={styles.state}>
      <Text style={styles.stateText}>{text}</Text>
      {onPress ? (
        <Pressable onPress={onPress}>
          <Text style={styles.retry}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 18, padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  description: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  city: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    minHeight: 58,
  },
  cityName: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 16 },
  state: { alignItems: 'center' as const, gap: 12, paddingVertical: 36 },
  stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
} as const;
