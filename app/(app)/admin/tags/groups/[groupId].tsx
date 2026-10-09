import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminTagGroupEditorScreen } from '@/features/admin/components/AdminTagGroupEditorScreen';
import { colors } from '@/theme/tokens';

export default function AdminTagGroupEditorRoute() {
  return <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, flex: 1 }}><AdminTagGroupEditorScreen /></SafeAreaView>;
}
