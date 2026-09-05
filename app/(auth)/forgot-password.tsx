import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  return (
    <SafeAreaView style={{ backgroundColor: '#0A0A0A', flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Recuperar senha</Text>
      </View>
    </SafeAreaView>
  );
}
