import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components';

// Format a Date as a local YYYY-MM-DD string (avoids UTC off-by-one from toISOString)
const toDateString = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Mockup frames 3/4 (create/edit activity) — every field shares this same
// label + grey-groove-box shape: label 12px/700/#6f7d78 marginBottom:6,
// box background:#eef2f0 border-radius:16px padding:13px 15px. No calendar
// icon on the date fields in the mockup — plain text box, same as every
// other input.
export const FormInput = ({ label, value, onChangeText, placeholder, multiline, keyboardType, colors }: any) => (
  <View style={styles.inputContainer}>
    <AppText style={[styles.label, { color: colors.textSecondary }]}>{label}</AppText>
    <TextInput
      style={[
        styles.textInput,
        {
          backgroundColor: colors.inputBackground || colors.card,
          color: colors.inputText || colors.textPrimary,
          minHeight: multiline ? 64 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        },
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

// Real date field backed by the native OS date picker.
// value/onChange use a 'YYYY-MM-DD' string.
export const FormDateField = ({ label, value, onChange, colors, minimumDate }: any) => {
  const { t } = useTranslation();
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
      <AppText style={[styles.label, { color: colors.textSecondary }]}>{label}</AppText>
      <TouchableOpacity
        style={[styles.dateInput, { backgroundColor: colors.inputBackground || colors.card }]}
        onPress={() => setShow(true)}
      >
        <AppText style={[styles.dateText, { color: value ? (colors.inputText || colors.textPrimary) : (colors.inputPlaceholder || colors.textSecondary) }]}>
          {value || t('common.selectDate')}
        </AppText>
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
  // Mockup: gap:14px between fields — this component owns its own bottom
  // margin instead since fields are declared one at a time by the caller.
  inputContainer: { marginBottom: 14 },
  label: { fontSize: 12, lineHeight: 15, fontWeight: '700' as any, marginBottom: 6 },
  textInput: {
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 13.5,
    lineHeight: 17,
  },
  dateInput: {
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 13,
    justifyContent: 'center',
  },
  dateText: { fontSize: 13.5, lineHeight: 17 },
});
