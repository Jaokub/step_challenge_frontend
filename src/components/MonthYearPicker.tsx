import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import CustomModal from './CustomModal';
import AppText from './AppText';
import { useTheme } from '../contexts/ThemeContext';
import { gradients } from '../constants/theme';

interface MonthYearPickerProps {
  visible: boolean;
  initialMonth: number; // 0-11
  initialYear: number;
  onClose: () => void;
  onSelect: (month: number, year: number) => void;
}

/**
 * Month + year picker. Year is stepped with arrows; tapping a month applies the
 * selection immediately and closes. Thai locale shows the Buddhist year (+543).
 */
const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  visible, initialMonth, initialYear, onClose, onSelect,
}) => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const [year, setYear] = useState(initialYear);

  useEffect(() => {
    if (visible) setYear(initialYear);
  }, [visible, initialYear]);

  const monthsShort = t('months.short', { returnObjects: true }) as string[];
  const displayYear = i18n.language === 'th' ? year + 543 : year;

  const stepYear = (delta: number) => {
    Haptics.selectionAsync();
    setYear((y) => y + delta);
  };

  const pickMonth = (m: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(m, year);
    onClose();
  };

  return (
    <CustomModal visible={visible} onClose={onClose} title={t('dashboard.selectPeriod')}>
      {/* Year stepper */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => stepYear(-1)}
          style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <AppText variant="heading-bold" style={{ fontSize: 22, color: colors.textPrimary, minWidth: 90, textAlign: 'center' }}>{displayYear}</AppText>
        <TouchableOpacity
          onPress={() => stepYear(1)}
          style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Month grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {monthsShort.map((label, m) => {
          const isSelected = m === initialMonth && year === initialYear;
          const inner = (
            <AppText variant="body-bold" style={{ fontSize: 14, color: isSelected ? colors.onPrimary : colors.textPrimary }}>{label}</AppText>
          );
          return (
            <TouchableOpacity
              key={label}
              onPress={() => pickMonth(m)}
              activeOpacity={0.8}
              style={{ width: '30.5%', borderRadius: 14, overflow: 'hidden' }}
            >
              {isSelected ? (
                <LinearGradient
                  colors={gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                >
                  {inner}
                </LinearGradient>
              ) : (
                <View style={{ paddingVertical: 12, alignItems: 'center', backgroundColor: colors.background }}>
                  {inner}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </CustomModal>
  );
};

export default MonthYearPicker;
