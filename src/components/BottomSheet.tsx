import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

export function BottomSheet({
  children,
  onClose,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  visible: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modal}>
        <Pressable accessibilityLabel="Fechar" onPress={onClose} style={styles.backdrop} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  modal: { flex: 1, justifyContent: 'flex-end' as const },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '82%' as const,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center' as const,
    backgroundColor: colors.mutedForeground,
    borderRadius: 3,
    height: 5,
    marginBottom: 16,
    opacity: 0.65,
    width: 42,
  },
} as const;
