import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextField } from '@/components/TextField';
import { authApi } from '@/features/auth/auth-api';
import { onboardingApi } from '@/features/onboarding/onboarding-api';
import type { OnboardingCity } from '@/features/onboarding/models/onboarding-types';
import { useOnboardingCities } from '@/features/onboarding/viewmodels/useOnboardingData';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function BusinessDataScreen() {
  const router = useRouter();
  const cities = useOnboardingCities();
  const account = useSessionStore((state) => state.account);
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [headquartersCity, setHeadquartersCity] = useState<OnboardingCity | null>(null);
  const [branchCities, setBranchCities] = useState<OnboardingCity[]>([]);
  const [hasBranches, setHasBranches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [picker, setPicker] = useState<'branches' | 'headquarters' | null>(null);
  const cnpjInput = useRef<TextInput>(null);
  const digits = cnpj.replace(/\D/g, '');

  const isValid = Boolean(name.trim() && headquartersCity && digits.length === 14);

  async function submit() {
    if (!account || !headquartersCity || !isValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onboardingApi.createBusiness({
        branch_city_ids: hasBranches ? branchCities.map((city) => city.id) : [],
        cnpj: digits,
        headquarters_city_id: headquartersCity.id,
        name: name.trim(),
      });
      const refreshedAccount = await authApi.getMe().catch(() => ({
        ...account,
        display_name: account.display_name || name.trim(),
        type: 'business',
      }));
      await completeOnboarding(refreshedAccount);
      router.replace('/(app)/home');
    } catch {
      Alert.alert('Não foi possível concluir o cadastro', 'Confira os dados da empresa e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.foreground} name="arrow-back" size={24} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={styles.title}>Sua empresa</Text>
          <Text style={styles.description}>Preencha dados básicos sobre seu empreendimento</Text>
        </View>
        <View style={styles.form}>
          <Field label="Nome" required>
            <TextField blurOnSubmit={false} onChangeText={setName} onSubmitEditing={() => cnpjInput.current?.focus()} placeholder="Nome fantasia" returnKeyType="next" value={name} />
          </Field>
          <View style={styles.field}>
            <Text style={styles.label}>Localização <Text style={styles.required}>*</Text></Text>
            <RadioItem label="Tenho somente uma matriz" selected={!hasBranches} onPress={() => { setHasBranches(false); setBranchCities([]); }} />
            <RadioItem label="Tenho filiais em cidades da Ibiapaba" selected={hasBranches} onPress={() => setHasBranches(true)} />
            <PickerField label="Cidade da matriz" value={headquartersCity?.name} onPress={() => setPicker('headquarters')} />
            {hasBranches ? <PickerField label="Cidades com filiais" value={branchCities.length ? branchCities.map((city) => city.name).join(', ') : undefined} onPress={() => setPicker('branches')} /> : null}
          </View>
          <Field label="CNPJ" required>
            <TextField keyboardType="number-pad" maxLength={18} onChangeText={(value) => setCnpj(formatCnpj(value))} onSubmitEditing={() => void submit()} placeholder="00.000.000/0000-00" ref={cnpjInput} returnKeyType="done" value={cnpj} />
          </Field>
          {cities.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
          {cities.isError ? <Text style={styles.error}>Não foi possível carregar as cidades.</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable disabled={!isValid || isSubmitting} onPress={submit} style={[styles.primaryButton, (!isValid || isSubmitting) && styles.disabledButton]}>
          <Text style={styles.primaryLabel}>{isSubmitting ? 'Concluindo...' : 'Concluir'}</Text>
        </Pressable>
      </View>
      <CityPicker cities={cities.data ?? []} multiple={picker === 'branches'} onClose={() => setPicker(null)} onSelect={(selection) => {
        if (picker === 'headquarters') setHeadquartersCity(selection[0] ?? null);
        if (picker === 'branches') setBranchCities(selection);
        setPicker(null);
      }} selected={picker === 'branches' ? branchCities : headquartersCity ? [headquartersCity] : []} visible={picker !== null} />
    </SafeAreaView>
  );
}

function Field({ children, label, required = false }: { children: React.ReactNode; label: string; required?: boolean }) {
  return <View style={styles.field}><Text style={styles.label}>{label}{required ? <Text style={styles.required}> *</Text> : null}</Text>{children}</View>;
}

function RadioItem({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={styles.radioRow}>
    <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <Ionicons color={colors.primaryForeground} name="checkmark" size={12} /> : null}</View>
    <Text style={styles.radioLabel}>{label}</Text>
  </Pressable>;
}

function PickerField({ label, onPress, value }: { label: string; onPress: () => void; value?: string }) {
  return <Pressable onPress={onPress} style={styles.picker}><Text numberOfLines={1} style={[styles.pickerText, value && styles.pickerValue]}>{value || label}</Text><Ionicons color={colors.mutedForeground} name="chevron-down" size={18} /></Pressable>;
}

function CityPicker({ cities, multiple, onClose, onSelect, selected, visible }: { cities: OnboardingCity[]; multiple: boolean; onClose: () => void; onSelect: (cities: OnboardingCity[]) => void; selected: OnboardingCity[]; visible: boolean }) {
  const [draft, setDraft] = useState(selected);
  const selectedIds = useMemo(() => new Set(draft.map((city) => city.id)), [draft]);
  function toggle(city: OnboardingCity) {
    if (!multiple) { onSelect([city]); return; }
    setDraft((current) => current.some((item) => item.id === city.id) ? current.filter((item) => item.id !== city.id) : [...current, city]);
  }
  return <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}><View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.sheetHeader}><Text style={styles.sheetTitle}>{multiple ? 'Cidades com filiais' : 'Cidade da matriz'}</Text><Pressable onPress={onClose}><Ionicons color={colors.foreground} name="close" size={22} /></Pressable></View><ScrollView>{cities.map((city) => { const selectedCity = selectedIds.has(city.id); return <Pressable key={city.id} onPress={() => toggle(city)} style={styles.cityRow}><Text style={styles.cityText}>{city.name}{city.state ? ` - ${city.state}` : ''}</Text>{selectedCity ? <Ionicons color={colors.primary} name="checkmark" size={21} /> : null}</Pressable>; })}</ScrollView>{multiple ? <Pressable onPress={() => onSelect(draft)} style={styles.primaryButton}><Text style={styles.primaryLabel}>Confirmar</Text></Pressable> : null}</View></View></Modal>;
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12 },
  backButton: { alignItems: 'center' as const, height: 36, justifyContent: 'center' as const, width: 36 },
  content: { gap: 32, padding: 24, paddingTop: 20 },
  heading: { gap: 12 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 24 },
  description: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  form: { gap: 24 },
  field: { gap: 8 },
  label: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  required: { color: '#EF4444' },
  radioRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 10, minHeight: 28 },
  radio: { alignItems: 'center' as const, backgroundColor: '#27272A', borderColor: colors.border, borderRadius: 12, borderWidth: 1, height: 16, justifyContent: 'center' as const, width: 16 },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  radioLabel: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Regular', fontSize: 14 },
  picker: { alignItems: 'center' as const, backgroundColor: '#27272A', borderColor: colors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row' as const, gap: 10, height: 48, paddingHorizontal: 16 },
  pickerText: { color: colors.mutedForeground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 16 },
  pickerValue: { color: colors.foreground },
  footer: { padding: 24, paddingTop: 12 },
  primaryButton: { alignItems: 'center' as const, backgroundColor: colors.primary, borderRadius: 24, height: 48, justifyContent: 'center' as const },
  disabledButton: { opacity: 0.45 },
  primaryLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  error: { color: '#FCA5A5', fontFamily: 'DMSans-Regular', fontSize: 14 },
  modalBackdrop: { backgroundColor: 'rgba(0,0,0,0.6)', flex: 1, justifyContent: 'flex-end' as const },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12, maxHeight: '72%' as const, padding: 24 },
  sheetHeader: { alignItems: 'center' as const, flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  sheetTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  cityRow: { alignItems: 'center' as const, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row' as const, justifyContent: 'space-between' as const, minHeight: 52 },
  cityText: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 15 },
} as const;
