import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { AppText, THAI_CHAR_REGEX } from '../../components';
import { thaiFonts, englishFonts } from '../../constants/theme';

/**
 * ADR-001 / BUILD_PLAN.md Phase 7 PR 2 — an activity's type is derived
 * entirely from `Activity.expectedSteps` (set = step-gated, null =
 * attendance-only); this is a UI-only concept, not a stored field.
 */
export type ActivityType = 'STEP_GATED' | 'ATTENDANCE';

/**
 * Whether the activity's start/end date are the same day. UI-only concept
 * (like ActivityType) — the backend only ever sees startDate/endDate; when
 * SINGLE_DAY the form keeps endDate equal to startDate instead of showing a
 * second date field.
 */
export type EventDuration = 'SINGLE_DAY' | 'MULTI_DAY';

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
export const FormInput = ({ label, value, onChangeText, placeholder, multiline, keyboardType, colors }: any) => {
  const { i18n } = useTranslation();
  // Same rule as AppText: Thai content always wins regardless of UI
  // language (a Thai-typed activity title should render with Thai glyphs
  // even if the admin console is set to English), falling back to the UI
  // language only while the field is empty (so the placeholder — which IS
  // translated — still gets the right font).
  const fonts = i18n.language === 'th' || THAI_CHAR_REGEX.test(value || '') ? thaiFonts : englishFonts;

  return (
    <View style={styles.inputContainer}>
      <AppText style={[styles.label, { color: colors.textSecondary }]}>{label}</AppText>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: colors.inputBackground || colors.card,
            color: colors.inputText || colors.textPrimary,
            fontFamily: fonts.body.regular,
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
};

// Real date field. Native (iOS/Android) is backed by the OS date picker
// dialog; `@react-native-community/datetimepicker` has no web implementation
// (renders nothing / throws), so web renders a plain HTML <input type="date">
// instead — same value/onChange contract ('YYYY-MM-DD' string), just a
// different picker UI supplied by the browser. value/onChange use a
// 'YYYY-MM-DD' string either way.
export const FormDateField = ({ label, value, onChange, colors, minimumDate }: any) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.inputContainer}>
        <AppText style={[styles.label, { color: colors.textSecondary }]}>{label}</AppText>
        {/* Raw DOM element — react-native-web renders this app for the web
            build (see package.json), and RN's TextInput/TouchableOpacity
            can't host a native browser date-picker affordance. */}
        <input
          type="date"
          value={value || ''}
          min={minimumDate ? toDateString(minimumDate) : undefined}
          onChange={(e: any) => onChange(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            backgroundColor: colors.inputBackground || colors.card,
            color: value ? (colors.inputText || colors.textPrimary) : (colors.inputPlaceholder || colors.textSecondary),
            border: 'none',
            outline: 'none',
            borderRadius: 16,
            padding: '13px 15px',
            fontSize: 13.5,
            fontFamily: 'inherit',
          }}
        />
      </View>
    );
  }

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

/**
 * Generic two-pill toggle — label + full-width equal chips, same visual
 * language as edit-activity's status chips (label 12px/700 + chips).
 * ActivityTypeToggle and EventDurationToggle are both thin wrappers over
 * this so the two pill rows in the create/edit-activity forms stay
 * pixel-identical without duplicating the layout code.
 */
function PillToggle<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
  colors,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { key: T; label: string }[];
  onChange: (next: T) => void;
  colors: any;
}) {
  return (
    <View style={styles.inputContainer}>
      <AppText style={[styles.label, { color: colors.textSecondary }]}>{label}</AppText>
      <View style={styles.typeToggleRow}>
        {options.map((opt) => {
          const active = opt.key === value;
          return (
            <TouchableOpacity
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[
                styles.typeToggleChip,
                { backgroundColor: active ? colors.primary : colors.inputBackground },
              ]}
            >
              <AppText style={{ fontSize: 12, lineHeight: 15, fontWeight: '700' as any, color: active ? colors.onPrimary : colors.textSecondary }}>
                {opt.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
      {!!hint && (
        <AppText style={[styles.typeHint, { color: colors.textSecondary }]}>{hint}</AppText>
      )}
    </View>
  );
}

// Type toggle (เดิน-วิ่ง ↔ เข้าร่วม). Switching to ATTENDANCE should clear
// expectedSteps/totalDistance in the caller (those fields become null on
// submit; this component only renders the toggle itself).
export const ActivityTypeToggle = ({
  value,
  onChange,
  colors,
}: {
  value: ActivityType;
  onChange: (next: ActivityType) => void;
  colors: any;
}) => {
  const { t } = useTranslation();
  return (
    <PillToggle<ActivityType>
      label={t('admin.activityTypeLabel')}
      hint={value === 'STEP_GATED' ? t('admin.stepGatedHint') : t('admin.attendanceHint')}
      value={value}
      onChange={onChange}
      colors={colors}
      options={[
        { key: 'STEP_GATED', label: t('admin.activityTypeStepGated') },
        { key: 'ATTENDANCE', label: t('admin.activityTypeAttendance') },
      ]}
    />
  );
};

// Duration toggle (จบภายใน 1 วัน ↔ หลายวัน). SINGLE_DAY means the caller
// shows one date field and keeps endDate synced to startDate instead of a
// second field — this component only renders the toggle itself.
export const EventDurationToggle = ({
  value,
  onChange,
  colors,
}: {
  value: EventDuration;
  onChange: (next: EventDuration) => void;
  colors: any;
}) => {
  const { t } = useTranslation();
  return (
    <PillToggle<EventDuration>
      label={t('admin.eventDurationLabel')}
      value={value}
      onChange={onChange}
      colors={colors}
      options={[
        { key: 'SINGLE_DAY', label: t('admin.eventDurationSingleDay') },
        { key: 'MULTI_DAY', label: t('admin.eventDurationMultiDay') },
      ]}
    />
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
  typeToggleRow: { flexDirection: 'row', gap: 8 },
  typeToggleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 14,
  },
  typeHint: { fontSize: 11, lineHeight: 15, marginTop: 6 },
});
