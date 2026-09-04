import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
      <View className="flex-1 justify-end">
        <Pressable accessibilityLabel="Fechar" className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View className="max-h-[82%] rounded-t-3xl border border-border bg-background px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="mb-4 h-1.5 w-10 self-center rounded-full bg-muted-foreground opacity-65" />
          {children}
        </View>
      </View>
    </Modal>
  );
}
