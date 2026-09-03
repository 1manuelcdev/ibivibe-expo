import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountSelectionScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-slate-900">Contas salvas</Text>
        <Text className="mt-2 text-slate-600">
          A seleção de contas será migrada na fase de autenticação.
        </Text>
        <Link href="/(auth)/login" className="mt-8 text-center font-semibold text-slate-900">
          Continuar para login
        </Link>
      </View>
    </SafeAreaView>
  );
}
