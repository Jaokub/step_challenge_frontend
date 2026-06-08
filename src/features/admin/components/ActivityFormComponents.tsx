import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../components';
import { spacing, borderRadius, fontSize } from '../../../constants/theme';

export const FormInput = ({ label, value, onChangeText, placeholder, multiline, keyboardType, colors }: any) => (
  <View style={styles.inputContainer}>
    <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.sm }}>{label}</AppText>
    <TextInput
      style={[
        styles.textInput,
        { 
          backgroundColor: colors.inputBackground || colors.card, 
          borderColor: colors.inputBorder || colors.cardBorder,
          color: colors.inputText || colors.textPrimary,
          height: multiline ? 100 : 50,
          textAlignVertical: multiline ? 'top' : 'center'
        }
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.inputPlaceholder || colors.textSecondary}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

export const FormDatePicker = ({ label, value, onPress, colors }: any) => (
  <View style={styles.inputContainer}>
    <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.sm }}>{label}</AppText>
    <TouchableOpacity 
      style={[styles.dateInput, { backgroundColor: colors.inputBackground || colors.card, borderColor: colors.inputBorder || colors.cardBorder }]}
      onPress={onPress}
    >
      <AppText style={{ color: value ? (colors.inputText || colors.textPrimary) : (colors.inputPlaceholder || colors.textSecondary) }}>
        {value || 'Select Date'}
      </AppText>
      <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  inputContainer: { marginBottom: spacing.lg },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: 'DMSans_400Regular',
  },
  dateInput: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  }
});
