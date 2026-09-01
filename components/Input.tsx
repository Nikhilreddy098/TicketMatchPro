import React from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, leftIcon, rightIcon, style, ...props }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={COLORS.textMuted}
          style={[styles.input, leftIcon ? { paddingLeft: 44 } : null, rightIcon ? { paddingRight: 44 } : null, style]}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: COLORS.textMain,
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: COLORS.inputBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    color: COLORS.textMain,
    fontSize: 15,
    fontFamily: FONTS.regular,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  leftIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONTS.medium,
  },
});
