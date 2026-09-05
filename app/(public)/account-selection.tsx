import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountSelectionScreen() {
  return (
    <SafeAreaView style={{ backgroundColor: '#0A0A0A', flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '700' }}>Contas salvas</Text>
        <Text style={{ color: '#A1A1AA', marginTop: 8 }}>
          A seleção de contas será migrada na fase de autenticação.
        </Text>
        <Link href="/(auth)/login" style={{ color: '#FFFFFF', fontWeight: '600', marginTop: 32, textAlign: 'center' }}>
          Continuar para login
        </Link>
      </View>
    </SafeAreaView>
  );
}
