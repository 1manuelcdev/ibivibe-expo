import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VerifyEmailScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-slate-900">Validar e-mail</Text>
        <Text className="mt-2 text-slate-600">
          Deep link e token manual serão implementados na fase 3.
        </Text>
      </View>
    </SafeAreaView>
  );
}
