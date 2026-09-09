import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function FullScreenImageViewer({
  images,
  initialIndex,
  onClose,
  visible,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
  visible: boolean;
}) {
  const { height, width } = useWindowDimensions();
  const scrollView = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  if (!images.length) return null;

  function resetToInitialImage() {
    const index = Math.min(Math.max(initialIndex, 0), images.length - 1);
    setActiveIndex(index);
    requestAnimationFrame(() =>
      scrollView.current?.scrollTo({ animated: false, x: width * index }),
    );
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      onShow={resetToInitialImage}
      statusBarTranslucent
      visible={visible}
    >
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.counter}>
            {activeIndex + 1} de {images.length}
          </Text>
          <Pressable
            accessibilityLabel="Fechar visualizador"
            hitSlop={12}
            onPress={onClose}
            style={styles.close}
          >
            <Ionicons color={colors.foreground} name="close" size={25} />
          </Pressable>
        </View>
        <ScrollView
          ref={scrollView}
          horizontal
          onMomentumScrollEnd={(event) =>
            setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width))
          }
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.scroller}
        >
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} style={{ height, width }}>
              <Image resizeMode="contain" source={{ uri }} style={styles.image} />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = {
  screen: { backgroundColor: '#000000', flex: 1 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 52,
    position: 'absolute' as const,
    right: 0,
    top: 0,
    zIndex: 1,
  },
  counter: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  close: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(39,39,42,0.88)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center' as const,
    width: 40,
  },
  scroller: { flex: 1 },
  image: { flex: 1, height: '100%' as const, width: '100%' as const },
} as const;
