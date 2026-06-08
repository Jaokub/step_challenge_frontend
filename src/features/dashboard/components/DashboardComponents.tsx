import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../components';
import { ThemeColors } from '../../../constants/theme';
import { MOCK_DATES, MOCK_WEEKS, MOCK_MONTHS, MOCK_GROUPS } from '../hooks/useDashboard';

const { width } = Dimensions.get('window');

// --- DashboardHeader ---
export const DashboardHeader = ({
  timeframe, setTimeframe, selectedDate, setSelectedDate,
  selectedWeek, setSelectedWeek, selectedMonth, setSelectedMonth, colors
}: any) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scrollRef.current) return;
      if (timeframe === 'Daily') {
        const index = MOCK_DATES.indexOf(selectedDate);
        if (index > -1) {
          const itemWidth = 48; // 38 width + 10 gap
          const offset = (index * itemWidth) - (width / 2) + (itemWidth / 2) + 20;
          scrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
        }
      } else if (timeframe === 'Monthly') {
        const index = MOCK_MONTHS.indexOf(selectedMonth);
        if (index > -1) {
          const itemWidth = 64; // approximate width
          const offset = (index * itemWidth) - (width / 2) + (itemWidth / 2) + 20;
          scrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
        }
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [timeframe]);

  const dateObj = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const todayStr = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  return (
    <View>
      <View style={[styles.headerRow, { paddingHorizontal: 20, paddingVertical: 6 }]}>
        <TouchableOpacity onPress={() => router.push('/settings')} style={{ padding: 4 }}>
          <Ionicons name="grid-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <AppText variant="body-bold" style={{ fontSize: 16, color: colors.textPrimary }}>{todayStr}</AppText>
        <TouchableOpacity style={{ padding: 4 }}>
          <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.timeframeContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {['Daily', 'Weekly', 'Monthly'].map((tf) => {
          const isActive = timeframe === tf;
          return (
            <TouchableOpacity key={tf} style={[styles.tfPill, isActive && { backgroundColor: colors.primary }]} onPress={() => setTimeframe(tf)}>
              <AppText variant={isActive ? "body-bold" : "body-regular"} style={{ fontSize: 13, color: colors.textPrimary }}>{tf}</AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ marginBottom: 4, height: 40, justifyContent: 'center' }}>
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[{ paddingHorizontal: 20, gap: 10, alignItems: 'center' }, timeframe === 'Weekly' && { flexGrow: 1, justifyContent: 'center' }]}>
          {timeframe === 'Daily' && MOCK_DATES.map((dateStr) => {
            const isActive = dateStr === selectedDate;
            return (
              <TouchableOpacity key={dateStr} style={[styles.dateCircle, { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : colors.cardBorder }]} onPress={() => setSelectedDate(dateStr)}>
                <AppText style={{ fontSize: 14, color: isActive ? colors.textPrimary : colors.textSecondary }}>{dateStr}</AppText>
              </TouchableOpacity>
            );
          })}
          {timeframe === 'Weekly' && MOCK_WEEKS.map((weekStr) => {
            const isActive = weekStr === selectedWeek;
            return (
              <TouchableOpacity key={weekStr} style={[styles.pillSelector, { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : colors.cardBorder }]} onPress={() => setSelectedWeek(weekStr)}>
                <AppText style={{ fontSize: 14, color: isActive ? colors.textPrimary : colors.textSecondary }}>{weekStr}</AppText>
              </TouchableOpacity>
            );
          })}
          {timeframe === 'Monthly' && MOCK_MONTHS.map((monthStr) => {
            const isActive = monthStr === selectedMonth;
            return (
              <TouchableOpacity key={monthStr} style={[styles.pillSelector, { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : colors.cardBorder }]} onPress={() => setSelectedMonth(monthStr)}>
                <AppText style={{ fontSize: 14, color: isActive ? colors.textPrimary : colors.textSecondary }}>{monthStr}</AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

// --- DashboardStats ---
export const DashboardStats = ({ stats, svgProps, colors }: any) => {
  const { t } = useTranslation();
  const { SV_SIZE, SV_STROKE, SV_RADIUS, SV_CIRCUMFERENCE, strokeDashoffset, currentSteps } = svgProps;
  return (
    <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 10 }}>
      <View style={{ width: SV_SIZE, height: SV_SIZE, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Svg width={SV_SIZE} height={SV_SIZE}>
          <Circle cx={SV_SIZE / 2} cy={SV_SIZE / 2} r={SV_RADIUS} stroke={colors.card} strokeWidth={SV_STROKE} fill="none" />
          <Circle cx={SV_SIZE / 2} cy={SV_SIZE / 2} r={SV_RADIUS} stroke={colors.primary} strokeWidth={SV_STROKE} fill="none" strokeLinecap="round" strokeDasharray={SV_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} transform={`rotate(-90 ${SV_SIZE / 2} ${SV_SIZE / 2})`} />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="heading-bold" style={{ fontSize: 38, color: colors.textPrimary, letterSpacing: -1 }}>{currentSteps.toLocaleString()}</AppText>
          <AppText style={{ fontSize: 14, color: colors.primary, marginTop: -4 }}>{t('dashboard.steps')}</AppText>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <View style={[styles.badgePill, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <Ionicons name="flame" size={16} color={colors.warning} />
          <AppText style={{ fontSize: 13, color: colors.textPrimary, marginLeft: 6 }}>{stats.streak} {t('dashboard.days')}</AppText>
        </View>
        <View style={[styles.badgePill, { backgroundColor: colors.background, borderColor: colors.primary }]}>
          <Ionicons name="location-outline" size={16} color={colors.textPrimary} />
          <AppText style={{ fontSize: 13, color: colors.textPrimary, marginLeft: 6 }}>{stats.distance} {t('dashboard.km')}</AppText>
        </View>
      </View>
    </View>
  );
};

// --- DashboardGroups ---
export const DashboardGroups = ({ selectedGroup, setSelectedGroup, colors }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingRight: 20 }}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingLeft: 20, paddingRight: 10 }}>
      {MOCK_GROUPS.map(group => {
        const isActive = group === selectedGroup;
        return (
          <TouchableOpacity key={group} style={[styles.groupPill, { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : colors.cardBorder }]} onPress={() => setSelectedGroup(group)}>
            <AppText style={{ fontSize: 13, color: colors.textPrimary }}>{group}</AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
    <View style={{ paddingLeft: 8, justifyContent: 'center' }}>
      <TouchableOpacity style={[styles.addGroupBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Ionicons name="add" size={20} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  </View>
);

// --- DashboardLeaderboard ---
export const DashboardLeaderboard = ({ leaderboard, colors }: any) => (
  <View style={{ marginHorizontal: 20, marginTop: 12, backgroundColor: 'transparent' }}>
    {leaderboard.map((userObj: any, idx: number) => (
      <View key={userObj.id} style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }, idx < leaderboard.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: userObj.rankColor }}>
          <AppText variant="body-bold" style={{ fontSize: 14, color: colors.textPrimary }}>{userObj.rank}</AppText>
        </View>
        <AppText style={{ flex: 1, fontSize: 15, color: colors.textPrimary }}>{userObj.name}</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="flame" size={16} color={colors.warning} style={{ marginRight: 4 }} />
          <AppText style={{ fontSize: 14, color: colors.textPrimary }}>{userObj.streak}</AppText>
          <Ionicons name="location-outline" size={16} color={colors.textPrimary} style={{ marginLeft: 12, marginRight: 4 }} />
          <AppText style={{ fontSize: 14, color: colors.textPrimary }}>{userObj.distance}</AppText>
        </View>
      </View>
    ))}
  </View>
);

// --- DashboardEvents ---
export const DashboardEvents = ({ events, colors }: any) => (
  <View style={{ marginTop: 16, paddingBottom: 16 }}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
      {events.map((event: any) => (
        <TouchableOpacity key={event.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, width: width * 0.70, padding: 12, borderRadius: 12 }}>
          <MaterialCommunityIcons name={event.icon as any} size={24} color={colors.textPrimary} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="body-bold" style={{ fontSize: 15, color: '#FFFFFF', marginBottom: 2 }}>{event.title}</AppText>
            <AppText style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{event.date}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeframeContainer: { flexDirection: 'row', marginHorizontal: 20, marginTop: 4, marginBottom: 8, borderRadius: 24, padding: 4, borderWidth: 1 },
  tfPill: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 20 },
  dateCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillSelector: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  badgePill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  groupPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, marginRight: 8 },
  addGroupBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
