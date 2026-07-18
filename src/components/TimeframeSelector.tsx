import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import AppText from './AppText';
import MonthYearPicker from './MonthYearPicker';
import { useTheme } from '../contexts/ThemeContext';
import { gradients, layout } from '../constants/theme';
import { addDays, startOfWeek } from '../features/dashboard/dateRangeCalculator';
import type { Timeframe, DayTab } from '../hooks/useTimeframeNav';

const { width } = Dimensions.get('window');
const GRAD_START = { x: 0, y: 0 };
const GRAD_END = { x: 1, y: 1 };
const DAY_CELL_WIDTH = 44;
const DAY_ITEM_STRIDE = DAY_CELL_WIDTH + 8;

interface TimeframeSelectorProps {
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  anchorDate: Date;
  refMonth: number;
  refYear: number;
  dayTabs: DayTab[];
  goToPrev: () => void;
  goToNext: () => void;
  setAnchorDay: (day: number) => void;
  setAnchorMonthYear: (month: number, year: number) => void;
}

const weekRangeLabel = (weekStart: Date, weekEnd: Date, monthsShort: string[], yearSuffix: string) => {
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()}-${weekEnd.getDate()} ${monthsShort[weekEnd.getMonth()]}${yearSuffix}`;
  }
  return `${weekStart.getDate()} ${monthsShort[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthsShort[weekEnd.getMonth()]}${yearSuffix}`;
};

/** Fills its children with the brand gradient when `active`, else a recessed groove. */
const ActiveBg: React.FC<{ active: boolean; colors: any; style?: any; children: React.ReactNode }> = ({ active, colors, style, children }) =>
  active ? (
    <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={style}>
      {children}
    </LinearGradient>
  ) : (
    <View style={[style, { backgroundColor: colors.inputBackground }]}>{children}</View>
  );

/**
 * Daily/Weekly/Monthly nav + day strip — the same date-browsing unit the
 * home dashboard uses (see DashboardComponents' DashboardHeader), extracted
 * so any screen can drop in period-scoped browsing without pulling in the
 * dashboard's greeting/goal-ring bits. Pair with `useTimeframeNav`.
 */
const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe, setTimeframe, anchorDate, refMonth, refYear, dayTabs,
  goToPrev, goToNext, setAnchorDay, setAnchorMonthYear,
}) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const monthsFull = t('months.full', { returnObjects: true }) as string[];
  const monthsShort = t('months.short', { returnObjects: true }) as string[];
  const weekdayMin = t('weekdays.min', { returnObjects: true }) as string[];
  const weekdayFull = t('weekdays.full', { returnObjects: true }) as string[];
  const toDisplayYear = (y: number) => (i18n.language === 'th' ? y + 543 : y);

  let topLabel: string;
  if (timeframe === 'Weekly') {
    const weekStart = startOfWeek(anchorDate);
    const weekEnd = addDays(weekStart, 6);
    topLabel = weekRangeLabel(weekStart, weekEnd, monthsShort, ` ${toDisplayYear(weekEnd.getFullYear())}`);
  } else if (timeframe === 'Monthly') {
    topLabel = `${monthsFull[refMonth]} ${toDisplayYear(refYear)}`;
  } else {
    topLabel = `${weekdayFull[anchorDate.getDay()]} ${anchorDate.getDate()} ${monthsShort[anchorDate.getMonth()]} ${toDisplayYear(anchorDate.getFullYear())}`;
  }

  const selectedDay = anchorDate.getDate();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scrollRef.current || timeframe !== 'Daily') return;
      const index = dayTabs.findIndex((tab) => tab.day === selectedDay);
      if (index < 0) return;
      const offset = index * DAY_ITEM_STRIDE - width / 2 + DAY_CELL_WIDTH / 2 + layout.screenPaddingX;
      scrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [timeframe, refMonth, refYear, selectedDay, dayTabs]);

  return (
    <View>
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); goToPrev(); }} style={[styles.navBtn, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.7} style={styles.navLabelWrap}>
          <AppText variant="heading-bold" style={[styles.navLabel, { color: colors.textPrimary }]} numberOfLines={1}>
            {topLabel}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); goToNext(); }} style={[styles.navBtn, { backgroundColor: colors.inputBackground }]}>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleWrap}>
        <View style={[styles.toggleRow, { backgroundColor: colors.inputBackground }]}>
          {(['Daily', 'Weekly', 'Monthly'] as const).map((tf) => {
            const isActive = timeframe === tf;
            const label = tf === 'Daily' ? t('dashboard.daily') : tf === 'Weekly' ? t('dashboard.weekly') : t('dashboard.monthly');
            return (
              <TouchableOpacity key={tf} style={styles.toggleBtnWrap} activeOpacity={0.8}
                onPress={() => { if (!isActive) Haptics.selectionAsync(); setTimeframe(tf); }}>
                <ActiveBg active={isActive} colors={colors} style={styles.toggleBtn}>
                  <AppText variant="body-bold" style={{ fontSize: 14, color: isActive ? colors.onPrimary : colors.textSecondary }}>{label}</AppText>
                </ActiveBg>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {timeframe === 'Daily' && (
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {dayTabs.map((tab) => {
            const isActive = tab.day === selectedDay;
            return (
              <TouchableOpacity key={tab.day} onPress={() => { if (!isActive) Haptics.selectionAsync(); setAnchorDay(tab.day); }} style={styles.dayItem} activeOpacity={0.8}>
                <ActiveBg active={isActive} colors={colors} style={[styles.dayCell, { borderWidth: 1, borderColor: isActive ? 'transparent' : colors.cardBorder }]}>
                  <AppText style={{ fontSize: 10, lineHeight: 12, color: isActive ? colors.onPrimary : (tab.isToday ? colors.primary : colors.textSecondary) }}>{weekdayMin[tab.weekdayIndex]}</AppText>
                  <AppText variant="body-bold" style={{ fontSize: 16, lineHeight: 20, color: isActive ? colors.onPrimary : (tab.isToday ? colors.primary : colors.textPrimary) }}>{tab.day}</AppText>
                </ActiveBg>
                {tab.isToday && !isActive && <View style={[styles.todayDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <MonthYearPicker
        visible={pickerOpen}
        initialMonth={refMonth}
        initialYear={refYear}
        onClose={() => setPickerOpen(false)}
        onSelect={(m, y) => setAnchorMonthYear(m, y)}
      />
    </View>
  );
};

export default TimeframeSelector;

const styles = StyleSheet.create({
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: layout.headerGap,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabelWrap: {
    minWidth: 150,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  toggleWrap: {
    paddingHorizontal: layout.screenPaddingX,
    marginBottom: layout.headerGap,
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 5,
    gap: 4,
  },
  toggleBtnWrap: {
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingVertical: 9,
    alignItems: 'center',
  },
  dayStrip: {
    paddingHorizontal: layout.screenPaddingX,
    gap: 8,
    alignItems: 'center',
    marginBottom: layout.sectionGap,
  },
  dayItem: {
    alignItems: 'center',
    gap: 3,
  },
  dayCell: {
    width: DAY_CELL_WIDTH,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
