import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { AppText, EmptyState } from '../../../components';
import { ThemeColors } from '../../../constants/theme';
import { MOCK_DATES, MOCK_WEEKS, MOCK_MONTHS } from '../hooks/useDashboard';

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
          const itemWidth = 54; // 44 width + 10 gap
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
  }, [timeframe]); // Only auto-scroll when timeframe changes

  return (
    <View>
      <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <AppText style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 2 }}>สวัสดี,</AppText>
          <AppText variant="heading-bold" style={{ color: colors.textPrimary, fontSize: 24 }}>อรอนงค์ 👋</AppText>
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="body-bold" style={{ color: '#fff', fontSize: 14 }}>AN</AppText>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 4 }}>
          {['Daily', 'Weekly', 'Monthly'].map((tf) => {
            const isActive = timeframe === tf;
            const tfLabel = tf === 'Daily' ? 'วันนี้' : tf === 'Weekly' ? 'สัปดาห์' : 'เดือน';
            return (
              <TouchableOpacity 
                key={tf} 
                style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 }, isActive && { backgroundColor: colors.primary }]} 
                onPress={() => {
                  if (!isActive) Haptics.selectionAsync();
                  setTimeframe(tf);
                }}
              >
                <AppText variant={isActive ? "body-bold" : "body-regular"} style={{ fontSize: 14, color: isActive ? '#fff' : colors.textSecondary }}>{tfLabel}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ marginBottom: 4, height: 60, justifyContent: 'center' }}>
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[{ paddingHorizontal: 20, gap: 10, alignItems: 'center' }, timeframe === 'Weekly' && { flexGrow: 1, justifyContent: 'center' }]}>
          {timeframe === 'Daily' && MOCK_DATES.map((dateStr) => {
            const isActive = dateStr === selectedDate;
            const isToday = dateStr === '24 May'; // Mock
            const displayDate = dateStr.split(' ')[0];
            return (
              <TouchableOpacity 
                key={dateStr} 
                onPress={() => {
                  if (!isActive) Haptics.selectionAsync();
                  setSelectedDate(dateStr);
                }} 
                style={{ alignItems: 'center', gap: 4 }}
              >
                <View style={[{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, isActive ? { backgroundColor: colors.primary } : { backgroundColor: colors.card }]}>
                  <AppText variant="body-bold" style={{ fontSize: 16, color: isActive ? '#fff' : (isToday ? colors.primary : colors.textSecondary) }}>{displayDate}</AppText>
                </View>
                {isToday && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isActive ? colors.primary : colors.primary }} />}
              </TouchableOpacity>
            );
          })}
          {timeframe === 'Weekly' && MOCK_WEEKS.map((weekStr) => {
            const isActive = weekStr === selectedWeek;
            return (
              <TouchableOpacity key={weekStr} style={[{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: isActive ? colors.primary : colors.card }]} onPress={() => setSelectedWeek(weekStr)}>
                <AppText variant="body-bold" style={{ fontSize: 14, color: isActive ? '#fff' : colors.textSecondary }}>{weekStr}</AppText>
              </TouchableOpacity>
            );
          })}
          {timeframe === 'Monthly' && MOCK_MONTHS.map((monthStr) => {
            const isActive = monthStr === selectedMonth;
            return (
              <TouchableOpacity key={monthStr} style={[{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: isActive ? colors.primary : colors.card }]} onPress={() => setSelectedMonth(monthStr)}>
                <AppText variant="body-bold" style={{ fontSize: 14, color: isActive ? '#fff' : colors.textSecondary }}>{monthStr}</AppText>
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
  
  const stepGoal = 10000;
  const progressPercent = Math.min(100, Math.floor((currentSteps / stepGoal) * 100));

  return (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Main Stats Card */}
      <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <AppText style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 4 }}>เป้าหมายวันนี้</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <AppText variant="heading-bold" style={{ color: colors.primary, fontSize: 40 }}>{progressPercent}%</AppText>
              <AppText style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>สำเร็จ</AppText>
            </View>
            <View style={{ marginTop: 12, height: 8, backgroundColor: colors.background, borderRadius: 4, overflow: 'hidden' }}>
              <View style={{ height: '100%', backgroundColor: colors.primary, borderRadius: 4, width: `${progressPercent}%` }} />
            </View>
          </View>
          
          <View style={{ width: 96, height: 96, marginLeft: 16 }}>
            <Svg width={96} height={96} viewBox={`0 0 ${SV_SIZE} ${SV_SIZE}`}>
              <Circle cx={SV_SIZE / 2} cy={SV_SIZE / 2} r={SV_RADIUS} stroke={colors.background} strokeWidth={SV_STROKE} fill="none" />
              <Circle cx={SV_SIZE / 2} cy={SV_SIZE / 2} r={SV_RADIUS} stroke={colors.primary} strokeWidth={SV_STROKE} fill="none" strokeLinecap="round" strokeDasharray={SV_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} transform={`rotate(-90 ${SV_SIZE / 2} ${SV_SIZE / 2})`} />
            </Svg>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
          <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Ionicons name="footsteps" size={18} color={colors.primary} />
          </View>
          <AppText variant="heading-bold" style={{ fontSize: 18, color: colors.textPrimary }}>{currentSteps.toLocaleString()}</AppText>
          <AppText style={{ fontSize: 12, color: colors.textSecondary }}>ก้าว</AppText>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
          <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: `${colors.warning}20`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Ionicons name="flame" size={18} color={colors.warning} />
          </View>
          <AppText variant="heading-bold" style={{ fontSize: 18, color: colors.textPrimary }}>{stats.activeCalories}</AppText>
          <AppText style={{ fontSize: 12, color: colors.textSecondary }}>kcal</AppText>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.cardBorder }}>
          <View style={{ width: 32, height: 32, borderRadius: 12, backgroundColor: `#00e5ff20`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Ionicons name="location" size={18} color="#00e5ff" />
          </View>
          <AppText variant="heading-bold" style={{ fontSize: 18, color: colors.textPrimary }}>{stats.distance}</AppText>
          <AppText style={{ fontSize: 12, color: colors.textSecondary }}>กม.</AppText>
        </View>
      </View>
    </View>
  );
};

// --- DashboardLeaderboard ---
export const DashboardLeaderboard = ({ leaderboard, selectedGroupId, setSelectedGroupId, userGroups, colors }: any) => {
  const { t } = useTranslation();
  
  const rankColor = (rank: number) => rank === 1 ? "#FBBF24" : rank === 2 ? "#94A3B8" : rank === 3 ? "#D97706" : colors.textSecondary;

  // Process leaderboard to show exactly 4 rows
  let displayList: any[] = [];
  if (leaderboard && leaderboard.length > 0) {
    const myUser = leaderboard.find((u: any) => u.isMe);
    const top3 = leaderboard.slice(0, 3);
    const isMeInTop3 = top3.some((u: any) => u.isMe);
    
    if (isMeInTop3 || !myUser) {
      displayList = leaderboard.slice(0, 4);
    } else {
      displayList = [...top3, myUser];
    }
  }
  
  // Fill empty slots up to 4
  while (displayList.length < 4) {
    displayList.push(null);
  }

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="trophy" size={20} color={colors.primary} />
          <AppText variant="heading-bold" style={{ fontSize: 18, color: colors.textPrimary }}>อันดับ</AppText>
        </View>
        <TouchableOpacity>
          <AppText style={{ fontSize: 13, color: colors.primary }}>ดูทั้งหมด</AppText>
        </TouchableOpacity>
      </View>

      {/* Group Tabs */}
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity 
            style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 }, selectedGroupId === 'friends' ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.cardBorder }]} 
            onPress={() => {
              if (selectedGroupId !== 'friends') Haptics.selectionAsync();
              setSelectedGroupId('friends');
            }}
          >
            <AppText style={{ fontSize: 13, color: selectedGroupId === 'friends' ? '#fff' : colors.textPrimary }}>เพื่อน</AppText>
          </TouchableOpacity>
          {userGroups.map((group: any) => {
            const isActive = group.id === selectedGroupId;
            return (
              <TouchableOpacity 
                key={group.id} 
                style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 }, isActive ? { backgroundColor: colors.primary, borderColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.cardBorder }]} 
                onPress={() => {
                  if (!isActive) Haptics.selectionAsync();
                  setSelectedGroupId(group.id);
                }}
              >
                <AppText style={{ fontSize: 13, color: isActive ? '#fff' : colors.textPrimary }}>{group.name}</AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Leaderboard List */}
      <View style={{ backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' }}>
        {displayList.map((userObj: any, idx: number) => {
          if (!userObj) {
            return (
              <View key={`empty-${idx}`} style={[{ flexDirection: 'row', alignItems: 'center', padding: 16 }, idx < 3 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
                <AppText variant="heading-bold" style={{ width: 24, fontSize: 16, color: colors.textSecondary, textAlign: 'center', marginRight: 12 }}>-</AppText>
                <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: colors.background }}>
                  <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 2 }}>---</AppText>
                  <AppText style={{ fontSize: 12, color: colors.textSecondary }}>- ก้าว · - กม.</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="body-bold" style={{ fontSize: 15, color: colors.textSecondary }}>-</AppText>
                  <AppText style={{ fontSize: 12, color: colors.textSecondary }}>kcal -</AppText>
                </View>
              </View>
            );
          }

          return (
            <View key={userObj.id} style={[{ flexDirection: 'row', alignItems: 'center', padding: 16 }, idx < 3 && { borderBottomWidth: 1, borderBottomColor: colors.cardBorder }]}>
              <AppText variant="heading-bold" style={{ width: 24, fontSize: 16, color: rankColor(userObj.rank), textAlign: 'center', marginRight: 12 }}>{userObj.rank}</AppText>
              <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: userObj.isMe ? colors.primary : colors.background }}>
                <AppText variant="body-bold" style={{ fontSize: 14, color: userObj.isMe ? '#fff' : colors.textPrimary }}>{userObj.name.substring(0, 2).toUpperCase()}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant={userObj.isMe ? "body-bold" : "body-regular"} style={{ fontSize: 15, color: userObj.isMe ? colors.primary : colors.textPrimary, marginBottom: 2 }}>{userObj.name}</AppText>
                <AppText style={{ fontSize: 12, color: colors.textSecondary }}>{userObj.steps || 0} ก้าว · {userObj.distance || 0} กม.</AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="body-bold" style={{ fontSize: 15, color: userObj.isMe ? colors.primary : colors.textPrimary }}>{userObj.points}</AppText>
                <AppText style={{ fontSize: 12, color: colors.textSecondary }}>kcal {userObj.calories || 0}</AppText>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// --- DashboardEvents ---
export const DashboardEvents = ({ events, colors }: any) => {
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Ionicons name="flash" size={20} color={colors.warning} />
        <AppText variant="heading-bold" style={{ fontSize: 18, color: colors.textPrimary }}>กิจกรรมที่กำลังดำเนินการ</AppText>
      </View>
      
      {events.length === 0 ? (
        <View style={{ paddingVertical: 20 }}>
          <EmptyState icon="calendar-outline" title="ไม่มีกิจกรรม" subtitle="คุณยังไม่มีกิจกรรมที่กำลังจะมาถึงในช่วงนี้" />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {events.map((event: any) => (
            <TouchableOpacity 
              key={event.id} 
              activeOpacity={0.7}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ backgroundColor: `${colors.primary}20`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    <AppText style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>กำลังจะมาถึง</AppText>
                  </View>
                </View>
                <AppText variant="body-bold" style={{ fontSize: 15, color: colors.textPrimary, marginBottom: 6 }}>{event.title}</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <AppText style={{ fontSize: 12, color: colors.textSecondary }}>{event.date}</AppText>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                    <AppText style={{ fontSize: 12, color: colors.textSecondary }}>48 คน</AppText>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

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
