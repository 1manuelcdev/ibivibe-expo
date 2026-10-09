import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Modal, Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function ActionModal({
  children,
  description,
  onClose,
  title,
  visible,
}: {
  children: ReactNode;
  description?: string;
  onClose: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => undefined} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.heading}>
              <Text numberOfLines={1} style={styles.title}>
                {title}
              </Text>
              {description ? <Text style={styles.description}>{description}</Text> : null}
            </View>
            <Pressable accessibilityLabel="Fechar" hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.mutedForeground} name="close" size={21} />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ActionModalItem({
  description,
  destructive = false,
  disabled = false,
  icon,
  onPress,
  style,
  title,
}: {
  description?: string;
  destructive?: boolean;
  disabled?: boolean;
  icon: IconName;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  title: string;
}) {
  const iconColor = destructive ? '#FCA5A5' : colors.foreground;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.action, destructive && styles.destructiveAction, disabled && styles.disabled, style]}
    >
      <View style={styles.icon}>
        <Ionicons color={iconColor} name={icon} size={19} />
      </View>
      <View style={styles.actionText}>
        <Text style={[styles.actionTitle, destructive && styles.destructiveTitle]}>{title}</Text>
        {description ? (
          <Text style={[styles.actionDescription, destructive && styles.destructiveDescription]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Ionicons
        color={destructive ? '#FCA5A5' : colors.mutedForeground}
        name="chevron-forward"
        size={18}
      />
    </Pressable>
  );
}

const styles = {
  overlay: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.62)',
    flex: 1,
    justifyContent: 'center' as const,
    padding: 24,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    maxWidth: 420,
    padding: 16,
    width: '100%' as const,
  },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 10 },
  heading: { flex: 1, gap: 2, minWidth: 0 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  description: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  action: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 12,
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 20,
    padding: 12,
  },
  destructiveAction: {
    backgroundColor: 'rgba(127,29,29,0.16)',
    borderColor: 'rgba(248,113,113,0.22)',
    borderWidth: 1,
    marginTop: 8,
  },
  icon: {
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
    height: 32,
    justifyContent: 'center' as const,
    width: 32,
  },
  actionText: { flex: 1, gap: 2 },
  actionTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  actionDescription: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  destructiveTitle: { color: '#FCA5A5' },
  destructiveDescription: { color: '#FDA4AF' },
  disabled: { opacity: 0.5 },
} as const;
