import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminTagEditorScreen } from '@/features/admin/components/AdminTagEditorScreen';
import { colors } from '@/theme/tokens';

export default function NewAdminTagRoute() {
  return <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}><AdminTagEditorScreen create /></SafeAreaView>;
}
