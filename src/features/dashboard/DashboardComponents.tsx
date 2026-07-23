import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, View, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { AppText, EmptyState, Skeleton, MonthYearPicker, GradientText, StepsValue, CustomModal, PrimaryButton, OutlineButton } from '../../components';
import { gradients, layout, dashboardAccents, spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { addDays, startOfWeek } from './dateRangeCalculator';
import { useScanAccess } from '../scan/useScanAccess';

const { width } = Dimensions.get('window');
const GRAD_START = { x: 0, y: 0 };
const GRAD_END = { x: 1, y: 1 };
const LB_ROW_HEIGHT = 64; // fixed leaderboard row height (skeleton == data, no shift)

// ── Shared helpers ────────────────────────────────────────────

/** Fills its children with the brand gradient when `active`, else a recessed groove. */
const ActiveBg = ({ active, colors, style, children }: any) =>
  active ? (
    <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={style}>
      {children}
    </LinearGradient>
  ) : (
    <View style={[style, { backgroundColor: colors.inputBackground }]}>{children}</View>
  );

const greetingKey = () => {
  const h = new Date().getHours();
  if (h < 12) return 'dashboard.goodMorning';
  if (h < 17) return 'dashboard.goodAfternoon';
  return 'dashboard.goodEvening';
};

/** "8-14 ก.ค. 2569" when the week sits in one month, else "29 มิ.ย. - 5 ก.ค. 2569". */
const weekRangeLabel = (weekStart: Date, weekEnd: Date, monthsShort: string[], yearSuffix: string) => {
  if (weekStart.getMonth() === weekEnd.getMonth()) {
    return `${weekStart.getDate()}-${weekEnd.getDate()} ${monthsShort[weekEnd.getMonth()]}${yearSuffix}`;
  }
  return `${weekStart.getDate()} ${monthsShort[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthsShort[weekEnd.getMonth()]}${yearSuffix}`;
};

// ── DashboardHeader ───────────────────────────────────────────
// Unit-aware nav: the label + prev/next arrows above the day strip adapt to the
// active timeframe (day / week / month) but are all driven by one `anchorDate`
// (see useDashboard.ts), so switching modes keeps whatever context you were in.
export const DashboardHeader = ({
  timeframe, setTimeframe, anchorDate,
  refMonth, refYear, goToPrev, goToNext,
  setAnchorDay, setAnchorMonthYear,
  dayTabs, colors, username,
}: any) => {
  const { t, i18n } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const monthsFull = t('months.full', { returnObjects: true }) as string[];
  const monthsShort = t('months.short', { returnObjects: true }) as string[];
  const weekdayMin = t('weekdays.min', { returnObjects: true }) as string[];
  const weekdayFull = t('weekdays.full', { returnObjects: true }) as string[];
  const toDisplayYear = (y: number) => (i18n.language === 'th' ? y + 543 : y);
  const initials = (username || 'U').substring(0, 2).toUpperCase();
  const { requestScanAccess, showExplainer, closeExplainer } = useScanAccess();

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

  // Day strip collapses/expands as `timeframe` leaves/re-enters Daily. Content stays
  // mounted throughout (unlike the mockup's DOM, RN doesn't need the unmount timer to
  // keep the exit symmetric with the entrance) — only the wrapper's box animates.
  const dailyProgress = useSharedValue(timeframe === 'Daily' ? 1 : 0);
  useEffect(() => {
    dailyProgress.value = withTiming(timeframe === 'Daily' ? 1 : 0, {
      duration: 340,
      easing: Easing.bezier(0.2, 0.9, 0.3, 1),
    });
  }, [timeframe, dailyProgress]);
  const dayStripAnimStyle = useAnimatedStyle(() => ({
    maxHeight: dailyProgress.value * 64,
    marginBottom: dailyProgress.value * layout.sectionGap,
    opacity: dailyProgress.value,
    transform: [
      { scaleY: 0.6 + dailyProgress.value * 0.4 },
      { translateY: (1 - dailyProgress.value) * -10 },
    ],
  }));

  // Scrollable strip through the whole month, auto-centered on the selected
  // day whenever it changes (including on first mount, where it lands on
  // today — see useDashboard.ts's initial `anchorDate`).
  const DAY_CELL_WIDTH = 44;
  const DAY_ITEM_STRIDE = DAY_CELL_WIDTH + 8; // cell + row gap
  const selectedDay = anchorDate.getDate();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scrollRef.current || timeframe !== 'Daily') return;
      const index = dayTabs.findIndex((tab: any) => tab.day === selectedDay);
      if (index < 0) return;
      // Center on the tab's own width, not the stride (stride also counts the
      // trailing gap, which isn't part of the tab itself — using it here was
      // overshooting by (gap/2)px and left-biasing the centered tab).
      const offset = index * DAY_ITEM_STRIDE - width / 2 + DAY_CELL_WIDTH / 2 + layout.screenPaddingX;
      scrollRef.current.scrollTo({ x: Math.max(0, offset), animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [timeframe, refMonth, refYear, selectedDay, dayTabs]);

  return (
    <View>
      {/* Greeting */}
      <View style={{ paddingHorizontal: layout.screenPaddingX, paddingTop: layout.screenPaddingX, marginBottom: layout.headerGap, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <AppText style={{ color: colors.textSecondary, fontSize: 13 }}>{t(greetingKey())} 👋</AppText>
          <AppText variant="heading-bold" style={{ color: colors.textPrimary, fontSize: 25, lineHeight: 32, marginTop: 2 }} numberOfLines={1}>{username}</AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); requestScanAccess(); }}
            activeOpacity={0.8}
            style={{ width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}
            accessibilityLabel={t('scan.title')}
          >
            <Ionicons name="qr-code-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="body-bold" style={{ color: colors.onPrimary, fontSize: 15 }}>{initials}</AppText>
          </LinearGradient>
        </View>
      </View>

      <CustomModal
        visible={showExplainer}
        onClose={closeExplainer}
        title={t('scan.permissionDeniedTitle')}
        description={t('scan.permissionDeniedBody')}
      >
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <OutlineButton title={t('common.cancel')} onPress={closeExplainer} style={{ flex: 1 }} />
          <PrimaryButton
            title={t('scan.openSettingsAction')}
            onPress={() => { closeExplainer(); Linking.openSettings(); }}
            style={{ flex: 1 }}
          />
        </View>
      </CustomModal>

      {/* Unit-aware nav — label + step size follow the active timeframe */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPaddingX, marginBottom: layout.headerGap }}>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); goToPrev(); }} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.inputBackground, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setPickerOpen(true)} activeOpacity={0.7} style={{ flex: 1, paddingHorizontal: 4, alignItems: 'center' }}>
          <AppText variant="heading-bold" style={{ fontSize: 18, lineHeight: 24, color: colors.textPrimary, textAlign: 'center' }} numberOfLines={1}>{topLabel}</AppText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); goToNext(); }} style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.inputBackground, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Timeframe toggle */}
      <View style={{ paddingHorizontal: layout.screenPaddingX, marginBottom: layout.headerGap }}>
        <View style={{ flexDirection: 'row', backgroundColor: colors.inputBackground, borderRadius: 999, padding: 5, gap: 4 }}>
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

      {/* Day strip — only meaningful in Daily mode; folds away for Weekly/Monthly */}
      <Animated.View style={[{ overflow: 'hidden' }, dayStripAnimStyle]} pointerEvents={timeframe === 'Daily' ? 'auto' : 'none'}>
        <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.screenPaddingX, gap: 8, alignItems: 'center' }}>
          {dayTabs.map((tab: any) => {
            const isActive = tab.day === selectedDay;
            return (
              <TouchableOpacity key={tab.day} onPress={() => { if (!isActive) Haptics.selectionAsync(); setAnchorDay(tab.day); }} style={{ alignItems: 'center', gap: 3 }} activeOpacity={0.8}>
                <ActiveBg active={isActive} colors={colors} style={{ width: DAY_CELL_WIDTH, height: 56, borderRadius: 14, borderWidth: 1, borderColor: isActive ? 'transparent' : colors.cardBorder, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                  <AppText style={{ fontSize: 10, lineHeight: 12, color: isActive ? colors.onPrimary : (tab.isToday ? colors.primary : colors.textSecondary) }}>{weekdayMin[tab.weekdayIndex]}</AppText>
                  <AppText variant="body-bold" style={{ fontSize: 16, lineHeight: 20, color: isActive ? colors.onPrimary : (tab.isToday ? colors.primary : colors.textPrimary) }}>{tab.day}</AppText>
                </ActiveBg>
                {tab.isToday && !isActive && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

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

// ── DashboardStats ────────────────────────────────────────────
export const DashboardStats = ({ stats, svgProps, colors, isLoading, timeframe }: any) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { SV_SIZE, SV_STROKE, SV_RADIUS, SV_CIRCUMFERENCE, strokeDashoffset, currentSteps, goal } = svgProps;

  const tone = isDark ? 'dark' : 'light';
  const goalCardColors = isDark ? gradients.goalCard : gradients.goalCardLight;
  const goalTextColors = isDark ? gradients.goalText : gradients.goalTextLight;
  const goalLabelColor = dashboardAccents.goalLabel[tone];
  const ringTrack = dashboardAccents.ringTrack[tone];

  const progressPercent = Math.min(100, Math.floor((currentSteps / goal) * 100));
  const goalLabel = timeframe === 'Weekly' ? t('dashboard.goalWeekly') : timeframe === 'Monthly' ? t('dashboard.goalMonthly') : t('dashboard.goalDaily');
  const goalDetail = t('dashboard.goalOf', { current: currentSteps.toLocaleString(), goal: goal.toLocaleString() });

  const primaryTint = isDark ? 'rgba(52,224,192,0.14)' : 'rgba(13,148,136,0.14)';
  const kcalTint = isDark ? 'rgba(255,169,77,0.14)' : 'rgba(255,169,77,0.16)';
  const kmTint = isDark ? 'rgba(77,171,247,0.14)' : 'rgba(77,171,247,0.16)';

  return (
    <View style={{ paddingHorizontal: layout.screenPaddingX }}>
      {/* Goal card */}
      <LinearGradient colors={goalCardColors as any} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 26, padding: 22, borderWidth: 1, borderColor: dashboardAccents.goalCardBorder[tone], marginBottom: layout.sectionGap, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <AppText style={{ color: goalLabelColor, fontSize: 13, marginBottom: 8 }}>{goalLabel}</AppText>
          <View style={{ height: 50, justifyContent: 'center' }}>
            {isLoading ? (
              <Skeleton width={96} height={46} borderRadius={8} />
            ) : (
              <GradientText colors={goalTextColors} style={{ fontSize: 46, lineHeight: 50 }}>{progressPercent}%</GradientText>
            )}
          </View>
          <AppText style={{ color: goalLabelColor, fontSize: 13, marginTop: 8 }}>{goalDetail}</AppText>
        </View>

        <View style={{ width: 104, height: 104, marginLeft: 12 }}>
          <Svg width={104} height={104} viewBox={`0 0 ${SV_SIZE} ${SV_SIZE}`}>
            <Defs>
              <SvgLinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={gradients.primary[0]} />
                <Stop offset="1" stopColor={gradients.primary[1]} />
              </SvgLinearGradient>
            </Defs>
            <Circle cx={SV_SIZE / 2} cy={SV_SIZE / 2} r={SV_RADIUS} stroke={ringTrack} strokeWidth={SV_STROKE} fill="none" />
            {!isLoading && (
              <Circle cx={SV_SIZE / 2} cy={SV_SIZE / 2} r={SV_RADIUS} stroke="url(#ringGrad)" strokeWidth={SV_STROKE} fill="none" strokeLinecap="round" strokeDasharray={SV_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset} transform={`rotate(-90 ${SV_SIZE / 2} ${SV_SIZE / 2})`} />
            )}
          </Svg>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <AppText style={{ fontSize: 28, lineHeight: 34 }}>🏃</AppText>
          </View>
        </View>
      </LinearGradient>

      {/* Stat cards — recessed grey (colors.inputBackground) in both themes */}
      <View style={{ flexDirection: 'row', gap: layout.cardGap, marginBottom: layout.sectionGap }}>
        {[
          { icon: 'footsteps', iconColor: colors.primary, bgColor: primaryTint, value: currentSteps.toLocaleString(), label: t('dashboard.steps') },
          { icon: 'flame', iconColor: dashboardAccents.kcalIcon[tone], bgColor: kcalTint, value: Number(stats.activeCalories || 0).toLocaleString(), label: t('dashboard.kcal') },
          { icon: 'location', iconColor: dashboardAccents.kmIcon[tone], bgColor: kmTint, value: Number(stats.distance || 0).toFixed(2), label: t('dashboard.km') },
        ].map(({ icon, iconColor, bgColor, value, label }) => (
          <View key={label} style={{ flex: 1, backgroundColor: colors.inputBackground, borderRadius: 22, padding: 16, gap: 10, minHeight: 108 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: bgColor, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon as any} size={18} color={iconColor} />
            </View>
            <View style={{ height: 24, justifyContent: 'center' }}>
              {isLoading ? <Skeleton width="80%" height={22} borderRadius={6} /> : <AppText variant="heading-bold" style={{ fontSize: 19, lineHeight: 24, color: colors.textPrimary }}>{value}</AppText>}
            </View>
            <AppText style={{ fontSize: 12, lineHeight: 16, color: colors.textSecondary }}>{label}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
};

// ── DashboardLeaderboard ──────────────────────────────────────
export const DashboardLeaderboard = ({ leaderboard, selectedGroupId, setSelectedGroupId, userGroups, colors, isLoading }: any) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const tone = isDark ? 'dark' : 'light';
  const rank1Fill = dashboardAccents.rank1Fill[tone];
  const rank1Border = dashboardAccents.rank1Border[tone];
  const avatarMuted = dashboardAccents.avatarMuted[tone];

  let displayList: any[] = [];
  if (leaderboard && leaderboard.length > 0) {
    const myUser = leaderboard.find((u: any) => u.isMe);
    const top3 = leaderboard.slice(0, 3);
    const isMeInTop3 = top3.some((u: any) => u.isMe);
    displayList = isMeInTop3 || !myUser ? leaderboard.slice(0, 4) : [...top3, myUser];
  }
  while (displayList.length < 4) displayList.push(null);

  const chip = (active: boolean, key: string, label: string, onPress: () => void) => (
    <TouchableOpacity key={key} onPress={onPress} activeOpacity={0.8} style={{ borderRadius: 999, overflow: 'hidden' }}>
      <ActiveBg active={active} colors={colors} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <AppText variant={active ? 'body-bold' : 'body-medium'} style={{ fontSize: 13, color: active ? colors.onPrimary : colors.textSecondary }}>{label}</AppText>
      </ActiveBg>
    </TouchableOpacity>
  );

  return (
    <View style={{ paddingHorizontal: layout.screenPaddingX, marginBottom: layout.sectionGap }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: layout.headerGap }}>
        <AppText variant="heading-bold" style={{ fontSize: 17, lineHeight: 22, color: colors.textPrimary }}>{t('dashboard.ranking')}</AppText>
        <TouchableOpacity><AppText variant="body-semiBold" style={{ fontSize: 13, color: colors.primary }}>{t('dashboard.seeAll')}</AppText></TouchableOpacity>
      </View>

      {/* Group chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: layout.headerGap }}>
        {chip(selectedGroupId === 'friends', 'friends', t('dashboard.friends'), () => { if (selectedGroupId !== 'friends') Haptics.selectionAsync(); setSelectedGroupId('friends'); })}
        {userGroups?.map((g: any) => chip(g.id === selectedGroupId, g.id, g.name, () => { if (g.id !== selectedGroupId) Haptics.selectionAsync(); setSelectedGroupId(g.id); }))}
      </ScrollView>

      {/* Rows — fixed height so skeleton and data never shift */}
      <View style={{ gap: 10 }}>
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <View key={`s-${i}`} style={{ height: LB_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.inputBackground, borderRadius: 20, paddingHorizontal: 15 }}>
                <Skeleton width={16} height={18} borderRadius={4} />
                <Skeleton width={38} height={38} borderRadius={13} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width={110} height={15} borderRadius={4} />
                  <Skeleton width={80} height={12} borderRadius={4} />
                </View>
                <Skeleton width={40} height={16} borderRadius={4} />
              </View>
            ))
          : displayList.map((u: any, idx: number) => {
              if (!u) {
                return (
                  <View key={`e-${idx}`} style={{ height: LB_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.inputBackground, borderRadius: 20, paddingHorizontal: 15, opacity: 0.5 }}>
                    <AppText variant="body-bold" style={{ width: 16, fontSize: 16, lineHeight: 20, color: colors.textSecondary }}>{idx + 1}</AppText>
                    <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: avatarMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}><AppText style={{ fontSize: 14, lineHeight: 18, color: colors.textSecondary }}>—</AppText></View>
                  </View>
                );
              }
              const highlight = u.isMe;
              const Row = (
                <>
                  <AppText variant="body-bold" style={{ width: 16, fontSize: 16, lineHeight: 20, color: u.isMe ? colors.primary : colors.textSecondary }}>{u.rank}</AppText>
                  {u.isMe ? (
                    <LinearGradient colors={gradients.primary as any} start={GRAD_START} end={GRAD_END} style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
                      <AppText variant="body-bold" style={{ fontSize: 13, color: colors.onPrimary }}>{u.name.substring(0, 2).toUpperCase()}</AppText>
                    </LinearGradient>
                  ) : (
                    <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: avatarMuted, alignItems: 'center', justifyContent: 'center' }}>
                      <AppText variant="body-bold" style={{ fontSize: 13, color: colors.textPrimary }}>{u.name.substring(0, 2).toUpperCase()}</AppText>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <AppText variant="body-bold" style={{ fontSize: 14, lineHeight: 18, color: u.isMe ? colors.primary : colors.textPrimary }} numberOfLines={1}>{u.name}{u.isMe ? ` · ${t('dashboard.you')}` : ''}</AppText>
                    <AppText style={{ fontSize: 11, lineHeight: 15, color: colors.textSecondary }}>
                      {Number(u.distance || 0).toFixed(1)} {t('dashboard.km')} · {Math.round(u.calories || 0)} {t('dashboard.kcal')}
                    </AppText>
                  </View>
                  <StepsValue value={Number(u.steps || 0)} size={15} color={colors.textPrimary} />
                </>
              );
              return highlight ? (
                <LinearGradient key={u.id} colors={rank1Fill as any} start={GRAD_START} end={GRAD_END} style={{ height: LB_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, paddingHorizontal: 15, borderWidth: 1, borderColor: rank1Border }}>
                  {Row}
                </LinearGradient>
              ) : (
                <View key={u.id} style={{ height: LB_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.inputBackground, borderRadius: 20, paddingHorizontal: 15 }}>
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
    <View style={{ paddingHorizontal: layout.screenPaddingX, paddingBottom: 30 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: layout.headerGap }}>
        <Ionicons name="flash" size={18} color={colors.primary} />
        <AppText variant="heading-bold" style={{ fontSize: 17, lineHeight: 22, color: colors.textPrimary }}>{t('dashboard.ongoingActivities')}</AppText>
      </View>

      {events.length === 0 ? (
        <View style={{ paddingVertical: 20 }}>
          <EmptyState icon="calendar-outline" title={t('dashboard.noActivitiesTitle')} subtitle={t('dashboard.noActivitiesSubtitle')} />
        </View>
      ) : (
        <View style={{ gap: layout.cardGap }}>
          {events.map((event: any) => (
            <TouchableOpacity key={event.id} activeOpacity={0.7} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={{ backgroundColor: colors.inputBackground, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                  <View style={{ backgroundColor: `${colors.primary}24`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                    <AppText variant="body-semiBold" style={{ fontSize: 11, lineHeight: 15, color: colors.primary }}>{t('dashboard.upcoming')}</AppText>
                  </View>
                </View>
                <AppText variant="body-bold" style={{ fontSize: 15, lineHeight: 20, color: colors.textPrimary, marginBottom: 6 }}>{event.title}</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <AppText style={{ fontSize: 12, lineHeight: 16, color: colors.textSecondary }}>{event.date}</AppText>
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
