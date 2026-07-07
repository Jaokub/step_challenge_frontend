import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from '../../components';
import { spacing, borderRadius, fontSize } from '../../constants/theme';

// Format a Date as a local YYYY-MM-DD string (avoids UTC off-by-one from toISOString)
const toDateString = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

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

// Real date field backed by the native OS date picker.
// value/onChange use a 'YYYY-MM-DD' string.
export const FormDateField = ({ label, value, onChange, colors, minimumDate }: any) => {
  const [show, setShow] = useState(false);

  const parsed = value ? new Date(value) : new Date();
  const safeValue = isNaN(parsed.getTime()) ? new Date() : parsed;

  const handleChange = (event: any, selected?: Date) => {
    // Android renders a dialog that closes itself; iOS stays inline until dismissed.
    setShow(false);
    if (event?.type === 'dismissed') return;
    if (selected) onChange(toDateString(selected));
  };

  return (
    <View style={styles.inputContainer}>
      <AppText variant="body-bold" style={{ fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.sm }}>{label}</AppText>
      <TouchableOpacity
        style={[styles.dateInput, { backgroundColor: colors.inputBackground || colors.card, borderColor: colors.inputBorder || colors.cardBorder }]}
        onPress={() => setShow(true)}
      >
        <AppText style={{ color: value ? (colors.inputText || colors.textPrimary) : (colors.inputPlaceholder || colors.textSecondary) }}>
          {value || 'Select Date'}
        </AppText>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={safeValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={minimumDate}
          onChange={handleChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: { marginBottom: spacing.lg },
  textInput: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    fontFamily: 'Sora_400Regular',
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
