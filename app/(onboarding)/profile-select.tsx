import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileSelectScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0A]">
      <View className="flex-1 justify-center px-6">
        <Text className="text-2xl font-bold text-slate-900">Escolha de perfil</Text>
      </View>
    </SafeAreaView>
  );
}
