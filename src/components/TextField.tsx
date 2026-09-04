import type { ComponentProps } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text, TextInput, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

type TextFieldProps = ComponentProps<typeof TextInput> & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  inputStyle?: StyleProp<TextStyle>;
  label?: string;
  required?: boolean;
};

export function TextField({
  containerStyle,
  error,
  inputStyle,
  label,
  required = false,
  style: _style,
  ...props
}: TextFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, error && styles.inputError, inputStyle]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = {
  container: { gap: 8 },
  label: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    height: 48,
    paddingHorizontal: spacing.control,
  },
  inputError: { borderColor: '#EF4444' },
  error: { color: '#FCA5A5', fontFamily: 'DMSans-Regular', fontSize: 12 },
} as const;
