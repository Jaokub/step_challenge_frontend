import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { AppText, EmptyState, Skeleton, MonthYearPicker } from '../../components';
import { gradients } from '../../constants/theme';

const { width } = Dimensions.get('window');
const GRAD_START = { x: 0, y: 0 };
const GRAD_END = { x: 1, y: 1 };

// ── Shared helpers ────────────────────────────────────────────

/** Fills its children with the brand gradient when `active`, else a flat card bg. */
const ActiveBg = ({ active, colors, style, children }: any) =>
  active ? (
    <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={style}>
      {children}
    </LinearGradient>
  ) : (
    <View style={[style, { backgroundColor: colors.card }]}>{children}</View>
  );

/** Renders text painted with the brand gradient. */
const GradientText = ({ children, style }: any) => (
  <MaskedView maskElement={<AppText variant="heading-extraBold" style={style}>{children}</AppText>}>
    <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END}>
      <AppText variant="heading-extraBold" style={[style, { opacity: 0 }]}>{children}</AppText>
    </LinearGradient>
  </MaskedView>
);

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.goodMorning';
  if (h < 17) return 'dashboard.goodAfternoon';
  return 'dashboard.goodEvening';
};

// ── DashboardHeader ───────────────────────────────────────────
export const DashboardHeader = ({
  timeframe, setTimeframe, selectedDate, setSelectedDate,
  selectedWeek, setSelectedWeek, refMonth, refYear, setRefMonthYear,
  goToPrevMonth, goToNextMonth, dayTabs, colors, username,
}: any) => {
  const { t, i18n } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const monthsFull = t('months.full', { returnObjects: true }) as string[];
  const weekdayMin = t('weekdays.min', { returnObjects: true }) as string[];
  const displayYear = i18n.language === 'th' ? refYear + 543 : refYear;
  const monthLabel = `${monthsFull[refMonth]} ${displayYear}`;
  const initials = (username || 'U').substring(0, 2).toUpperCase();

  // Auto-centre the selected day tab
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scrollRef.current || timeframe !== 'Daily') return;
      const index = parseInt(selectedDate, 10) - 1;
      if (index < 0) return;
      const itemWidth = 52;
      const offset = index * itemWidth - width / 2 + itemWidth / 2 + 20;
      scrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [timeframe, refMonth, refYear, selectedDate]);

  return (
    <View>
      {/* Greeting */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>{t(greetingKey())} 👋</AppText>
          <AppText variant="heading-bold" style={{ color: colors.textPrimary, fontSize: 25, marginTop: 2 }} numberOfLines={1}>{username}</AppText>
        </View>
        <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="body-bold" style={{ color: colors.onPrimary, fontSize: 15 }}>{initials}</AppText>
        </LinearGradient>
      </View>

      {/* Month navigation */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 14 }}>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); goToPrevMonth(); }} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.7} style={{ minWidth: 150, alignItems: 'center' }}>
          <AppText variant="heading-bold" style={{ fontSize: 18, color: colors.textPrimary }}>{monthLabel}</AppText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); goToNextMonth(); }} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Timeframe toggle */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: 999, padding: 5, gap: 4 }}>
          {(['Daily', 'Weekly', 'Monthly'] as const).map((tf) => {
            const isActive = timeframe === tf;
            const label = tf === 'Daily' ? t('dashboard.daily') : tf === 'Weekly' ? t('dashboard.weekly') : t('dashboard.monthly');
            return (
              <TouchableOpacity key={tf} style={{ flex: 1, borderRadius: 999, overflow: 'hidden' }} activeOpacity={0.8}
                onPress={() => { if (!isActive) Haptics.selectionAsync(); setTimeframe(tf); }}>
                <ActiveBg active={isActive} colors={colors} style={{ paddingVertical: 9, alignItems: 'center' }}>
                  <AppText variant="body-bold" style={{ fontSize: 14, color: isActive ? colors.onPrimary : colors.textSecondary }}>{label}</AppText>
                </ActiveBg>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Sub-tabs */}
      <View style={{ marginBottom: 4, height: 60, justifyContent: 'center' }}>
        {timeframe === 'Daily' && (
          <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}>
            {dayTabs.map((tab: any) => {
              const isActive = tab.day.toString() === selectedDate;
              return (
                <TouchableOpacity key={tab.day} onPress={() => { if (!isActive) Haptics.selectionAsync(); setSelectedDate(tab.day.toString()); }} style={{ alignItems: 'center', gap: 3 }} activeOpacity={0.8}>
                  <ActiveBg active={isActive} colors={colors} style={{ width: 44, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    <AppText style={{ fontSize: 10, color: isActive ? colors.onPrimary : (tab.isToday ? colors.primary : colors.textSecondary) }}>{weekdayMin[tab.weekdayIndex]}</AppText>
                    <AppText variant="body-bold" style={{ fontSize: 16, color: isActive ? colors.onPrimary : (tab.isToday ? colors.primary : colors.textPrimary) }}>{tab.day}</AppText>
                  </ActiveBg>
                  {tab.isToday && !isActive && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        {timeframe === 'Weekly' && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8 }}>
            {['Last week', 'This week'].map((wk) => {
              const isActive = wk === selectedWeek;
              const label = wk === 'This week' ? t('dashboard.thisWeek') : t('dashboard.lastWeek');
              return (
                <TouchableOpacity key={wk} style={{ flex: 1, borderRadius: 14, overflow: 'hidden' }} activeOpacity={0.8}
                  onPress={() => { if (!isActive) Haptics.selectionAsync(); setSelectedWeek(wk); }}>
                  <ActiveBg active={isActive} colors={colors} style={{ paddingVertical: 16, alignItems: 'center' }}>
                    <AppText variant="body-bold" style={{ fontSize: 14, color: isActive ? colors.onPrimary : colors.textSecondary }}>{label}</AppText>
                  </ActiveBg>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {timeframe === 'Monthly' && (
          <View style={{ paddingHorizontal: 20 }}>
            <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
              <AppText variant="body-bold" style={{ fontSize: 14, color: colors.onPrimary }}>{monthsFull[refMonth]} {displayYear}</AppText>
            </LinearGradient>
          </View>
        )}
      </View>

      <MonthYearPicker
        visible={pickerOpen}
        initialMonth={refMonth}
        initialYear={refYear}
        onClose={() => setPickerOpen(false)}
        onSelect={(m, y) => setRefMonthYear(m, y)}
      />
    </View>
  );
};

// ── DashboardStats ────────────────────────────────────────────
export const DashboardStats = ({ stats, svgProps, colors, isLoading, timeframe }: any) => {
  const { t } = useTranslation();
  const { SV_SIZE, SV_STROKE, SV_RADIUS, SV_CIRCUMFERENCE, strokeDashoffset, currentSteps, goal } = svgProps;

  const progressPercent = Math.min(100, Math.floor((currentSteps / goal) * 100));
  const goalLabel = timeframe === 'Weekly' ? t('dashboard.goalWeekly') : timeframe === 'Monthly' ? t('dashboard.goalMonthly') : t('dashboard.goalDaily');
  const goalDetail = t('dashboard.goalOf', { current: currentSteps.toLocaleString(), goal: goal.toLocaleString() });

  return (
    <View style={{ paddingHorizontal: 20 }}>
      {/* Goal card */}
      <LinearGradient colors={gradients.goalCard as any} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 22, borderWidth: 1, borderColor: 'rgba(56,232,198,0.18)', marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <AppText style={{ color: colors.primaryLight, fontSize: 13, marginBottom: 8 }}>{goalLabel}</AppText>
          <View style={{ minHeight: 48, justifyContent: 'center' }}>
            {isLoading ? (
              <Skeleton width={90} height={46} borderRadius={8} />
            ) : (
              <GradientText style={{ fontSize: 46, lineHeight: 50 }}>{progressPercent}%</GradientText>
            )}
          </View>
          <AppText style={{ color: colors.primaryLight, fontSize: 13, marginTop: 8 }}>{goalDetail}</AppText>
        </View>

        <View style={{ width: 104, height: 104, marginLeft: 12 }}>
          <Svg width={104} height={104} viewBox={`0 0 ${SV_SIZE} ${SV_SIZE}`}>
            <Defs>
              <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={gradients.primary[0]} />
                <Stop offset="1" stopColor={gradients.primary[1]} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={SV_SIZE / 2} cy={SV_SIZE / 2} r={SV_RADIUS} stroke="rgba(255,255,255,0.08)" strokeWidth={SV_STROKE} fill="none" />
            {!isLoading && (
              <Circle cx={SV_SIZE / 2} cy={SV_SIZE / 2} r={SV_RADIUS} stroke="url(#ringGrad)" strokeWidth={SV_STROKE} fill="none" strokeLinecap="round" strokeDasharray={SV_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} transform={`rotate(-90 ${SV_SIZE / 2} ${SV_SIZE / 2})`} />
            )}
          </Svg>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <AppText style={{ fontSize: 28 }}>🏃</AppText>
          </View>
        </View>
      </LinearGradient>

      {/* Stat cards */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        {[
          { icon: 'footsteps', iconColor: colors.primary, bgColor: 'rgba(52,224,192,0.14)', value: currentSteps.toLocaleString(), label: t('dashboard.steps') },
          { icon: 'flame', iconColor: colors.warning, bgColor: 'rgba(255,169,77,0.14)', value: Number(stats.activeCalories || 0).toLocaleString(), label: t('dashboard.kcal') },
          { icon: 'location', iconColor: '#4dabf7', bgColor: 'rgba(77,171,247,0.14)', value: Number(stats.distance || 0).toFixed(2), label: t('dashboard.km') },
        ].map(({ icon, iconColor, bgColor, value, label }) => (
          <View key={label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 22, padding: 16, gap: 10, minHeight: 108 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon as any} size={18} color={iconColor} />
            </View>
            <View style={{ minHeight: 24, justifyContent: 'center' }}>
              {isLoading ? <Skeleton width="80%" height={22} borderRadius={6} /> : <AppText variant="heading-bold" style={{ fontSize: 19, color: colors.textPrimary, lineHeight: 24 }}>{value}</AppText>}
            </View>
            <AppText style={{ fontSize: 12, color: colors.textSecondary }}>{label}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── DashboardLeaderboard ──────────────────────────────────────
export const DashboardLeaderboard = ({ leaderboard, selectedGroupId, setSelectedGroupId, userGroups, colors, isLoading }: any) => {
  const { t } = useTranslation();

  let displayList: any[] = [];
  if (leaderboard && leaderboard.length > 0) {
    const myUser = leaderboard.find((u: any) => u.isMe);
    const top3 = leaderboard.slice(0, 3);
    const isMeInTop3 = top3.some((u: any) => u.isMe);
    displayList = isMeInTop3 || !myUser ? leaderboard.slice(0, 4) : [...top3, myUser];
  }
  while (displayList.length < 3) displayList.push(null);

  const chip = (active: boolean, key: string, label: string, onPress: () => void) => (
    <TouchableOpacity key={key} onPress={onPress} activeOpacity={0.8} style={{ borderRadius: 999, overflow: 'hidden' }}>
      <ActiveBg active={active} colors={colors} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <AppText variant={active ? 'body-bold' : 'body-medium'} style={{ fontSize: 13, color: active ? colors.onPrimary : colors.textSecondary }}>{label}</AppText>
      </ActiveBg>
    </TouchableOpacity>
  );

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <AppText variant="heading-bold" style={{ fontSize: 17, color: colors.textPrimary }}>{t('dashboard.ranking')}</AppText>
        <TouchableOpacity><AppText variant="body-semiBold" style={{ fontSize: 13, color: colors.primary }}>{t('dashboard.seeAll')}</AppText></TouchableOpacity>
      </View>

      {/* Group chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
        {chip(selectedGroupId === 'friends', 'friends', t('dashboard.friends'), () => { if (selectedGroupId !== 'friends') Haptics.selectionAsync(); setSelectedGroupId('friends'); })}
        {userGroups?.map((g: any) => chip(g.id === selectedGroupId, g.id, g.name, () => { if (g.id !== selectedGroupId) Haptics.selectionAsync(); setSelectedGroupId(g.id); }))}
      </ScrollView>

      {/* Rows */}
      <View style={{ gap: 10 }}>
        {isLoading
          ? [1, 2, 3].map((i) => (
              <View key={`s-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 20, padding: 13 }}>
                <Skeleton width={16} height={18} borderRadius={4} />
                <Skeleton width={38} height={38} borderRadius={13} />
                <View style={{ flex: 1, gap: 6 }}><Skeleton width={110} height={14} borderRadius={4} /><Skeleton width={80} height={11} borderRadius={4} /></View>
                <Skeleton width={36} height={16} borderRadius={4} />
              </View>
            ))
          : displayList.map((u: any, idx: number) => {
              if (!u) {
                return (
                  <View key={`e-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 20, padding: 13, opacity: 0.5 }}>
                    <AppText variant="body-bold" style={{ width: 16, fontSize: 16, color: colors.textSecondary }}>{idx + 1}</AppText>
                    <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}><AppText style={{ fontSize: 14, color: colors.textSecondary }}>—</AppText></View>
                  </View>
                );
              }
              const isFirst = u.rank === 1;
              const Row = (
                <>
                  <AppText variant="body-bold" style={{ width: 16, fontSize: 16, color: isFirst || u.isMe ? colors.primary : colors.textSecondary }}>{u.rank}</AppText>
                  {u.isMe ? (
                    <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
                      <AppText variant="body-bold" style={{ fontSize: 13, color: colors.onPrimary }}>{u.name.substring(0, 2).toUpperCase()}</AppText>
                    </LinearGradient>
                  ) : (
                    <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                      <AppText variant="body-bold" style={{ fontSize: 13, color: colors.textPrimary }}>{u.name.substring(0, 2).toUpperCase()}</AppText>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <AppText variant="body-bold" style={{ fontSize: 14, color: u.isMe ? colors.primary : colors.textPrimary }}>{u.name}{u.isMe ? ` · ${t('dashboard.you')}` : ''}</AppText>
                    <AppText style={{ fontSize: 11, color: colors.textSecondary }}>{Number(u.steps || 0).toLocaleString()} {t('dashboard.steps')} · {Number(u.distance || 0).toFixed(1)} {t('dashboard.km')}</AppText>
                  </View>
                  <AppText variant="heading-bold" style={{ fontSize: 15, color: colors.textPrimary }}>{u.points} pt</AppText>
                </>
              );
              return isFirst ? (
                <LinearGradient key={u.id} colors={['rgba(56,232,198,0.14)', 'rgba(182,242,74,0.06)'] as any} start={GRAD_START} end={GRAD_END} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 13, borderWidth: 1, borderColor: 'rgba(56,232,198,0.3)' }}>
                  {Row}
                </LinearGradient>
              ) : (
                <View key={u.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 20, padding: 13 }}>
                  {Row}
                </View>
              );
            })}
      </View>
    </View>
  );
};

// ── DashboardEvents ───────────────────────────────────────────
export const DashboardEvents = ({ events = [], colors }: any) => {
  const { t } = useTranslation();
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Ionicons name="flash" size={18} color={colors.primary} />
        <AppText variant="heading-bold" style={{ fontSize: 17, color: colors.textPrimary }}>{t('dashboard.ongoingActivities')}</AppText>
      </View>

      {events.length === 0 ? (
        <View style={{ paddingVertical: 20 }}>
          <EmptyState icon="calendar-outline" title={t('dashboard.noActivitiesTitle')} subtitle={t('dashboard.noActivitiesSubtitle')} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {events.map((event: any) => (
            <TouchableOpacity key={event.id} activeOpacity={0.7} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={{ backgroundColor: colors.card, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                  <View style={{ backgroundColor: 'rgba(52,224,192,0.14)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    <AppText variant="body-semiBold" style={{ fontSize: 11, color: colors.primary }}>{t('dashboard.upcoming')}</AppText>
                  </View>
                </View>
                <AppText variant="body-bold" style={{ fontSize: 15, color: colors.textPrimary, marginBottom: 6 }}>{event.title}</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <AppText style={{ fontSize: 12, color: colors.textSecondary }}>{event.date}</AppText>
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

const styles = StyleSheet.create({});
