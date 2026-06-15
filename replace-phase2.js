const fs = require('fs');

const replacements = [
  {
    file: 'app/(tabs)/_layout.tsx',
    replaces: [
      { from: /tabBarLabel: 'หน้าแรก'/g, to: "tabBarLabel: t('tabs.home')" },
      { from: /tabBarLabel: 'กิจกรรม'/g, to: "tabBarLabel: t('tabs.activities')" },
      { from: /tabBarLabel: 'สแกน'/g, to: "tabBarLabel: t('tabs.scan')" },
      { from: /title: "เพื่อนและกลุ่ม"/g, to: "title: t('tabs.friendsAndGroups')" },
      { from: /tabBarLabel: 'เพื่อน'/g, to: "tabBarLabel: t('tabs.friends')" },
      { from: /tabBarLabel: 'โปรไฟล์'/g, to: "tabBarLabel: t('tabs.profile')" }
    ]
  },
  {
    file: 'app/(tabs)/activities.tsx',
    replaces: [
      { from: /\{t\('activities.noActivities', 'ไม่พบกิจกรรม'\)\}/g, to: "{t('dashboard.noActivitiesTitle')}" },
      { from: /title=\{t\('activities.title', 'กิจกรรม'\)\}/g, to: "title={t('tabs.activities')}" },
      { from: /placeholder="ค้นหากิจกรรม\.\.\."/g, to: "placeholder={t('activity.notFound').replace('ไม่พบกิจกรรม', 'Search activities...')}" },
      { from: /const label = type === 'upcoming' \? 'กำลังจะมาถึง' : type === 'ongoing' \? 'กำลังดำเนินการ' : 'ผ่านมาแล้ว';/g, to: "const label = type === 'upcoming' ? t('dashboard.upcoming') : type === 'ongoing' ? t('dashboard.ongoingActivities') : 'Past';" }
    ]
  },
  {
    file: 'app/(tabs)/groups.tsx',
    replaces: [
      { from: />เพื่อนและกลุ่ม</g, to: ">{t('groups.friendsAndGroups')}<" },
      { from: />เพื่อน</g, to: ">{t('groups.friends')}<" },
      { from: />ไม่มีข้อมูลในขณะนี้</g, to: ">{t('groups.noData')}<" }
    ]
  },
  {
    file: 'app/(tabs)/profile.tsx',
    replaces: [
      { from: />กลุ่ม</g, to: ">{t('profile.groups')}<" },
      { from: />กิจกรรม</g, to: ">{t('profile.activities')}<" },
      { from: />เช็คอิน</g, to: ">{t('profile.checkins')}<" },
      { from: />สถิติเดือนนี้</g, to: ">{t('profile.thisMonthStats')}<" },
      { from: />ก้าวรายสัปดาห์</g, to: ">{t('profile.weeklySteps')}<" },
      { from: /label="แผงควบคุม \(Admin Panel\)"/g, to: "label={t('profile.adminPanel')}" },
      { from: /label="จำนวนก้าว"/g, to: "label={t('profile.totalSteps')}" },
      { from: /label="ระยะทาง \(กม\.\)"/g, to: "label={t('profile.distanceKm')}" },
      { from: /label="แคลอรี่"/g, to: "label={t('profile.calories')}" },
      { from: /label="วันที่บันทึก"/g, to: "label={t('profile.recordedDays')}" },
      { from: /label=\{t\('Privacy'\) \|\| 'ความเป็นส่วนตัว'\}/g, to: "label={t('profile.privacy')}" },
      { from: /label=\{t\('Help'\) \|\| 'ช่วยเหลือ'\}/g, to: "label={t('profile.help')}" },
      { from: /label=\{i18n.language === 'th' \? 'ภาษา' : 'Language'\}/g, to: "label={t('profile.languageLabel')}" }
    ]
  },
  {
    file: 'app/(tabs)/scan.tsx',
    replaces: [
      { from: />แสกน QR Code</g, to: ">{t('scan.scanQrCode')}<" },
      { from: />เพิ่มเพื่อนหรือลงทะเบียน Event</g, to: ">{t('scan.scanSubtitle')}<" },
      { from: />แสกน</g, to: ">{t('scan.scanBtn')}<" },
      { from: />QR ของฉัน</g, to: ">{t('scan.myQrTab')}<" },
      { from: />นำ QR Code ไว้ในกรอบ</g, to: ">{t('scan.placeQrInFrame')}<" },
      { from: />เพิ่มเพื่อน</g, to: ">{t('scan.addFriendTitle')}<" },
      { from: />แสกน QR เพื่อเพิ่มเพื่อนใหม่</g, to: ">{t('scan.addFriendDesc')}<" },
      { from: />ลงทะเบียน Event</g, to: ">{t('scan.registerEventTitle')}<" },
      { from: />แสกนเพื่อเข้าร่วมกิจกรรม</g, to: ">{t('scan.registerEventDesc')}<" },
      { from: /\|\| 'ผู้ใช้งาน'/g, to: "|| t('scan.defaultUser')" },
      { from: />ให้เพื่อนแสกน QR นี้เพื่อเพิ่มเป็นเพื่อน</g, to: ">{t('scan.shareQrFooter')}<" },
      { from: />ลิงค์เชิญ</g, to: ">{t('scan.inviteLink')}<" },
      { from: />แชร์ลิงค์</g, to: ">{t('scan.shareLinkBtn')}<" }
    ]
  },
  {
    file: 'app/activity/[id].tsx',
    replaces: [
      { from: />ไม่พบกิจกรรม</g, to: ">{t('activity.notFound')}<" },
      { from: /เริ่ม: /g, to: "{t('activity.start')} " },
      { from: /สิ้นสุด: /g, to: "{t('activity.end')} " },
      { from: /' คน \(ไม่จำกัด\)'/g, to: "t('activity.participantsUncapped')" },
      { from: /'ไม่มีคำอธิบายสำหรับกิจกรรมนี้'/g, to: "t('activity.noDescription')" },
      { from: />ผู้สร้างกิจกรรม</g, to: ">{t('activity.creator')}<" }
    ]
  },
  {
    file: 'app/health.tsx',
    replaces: [
      { from: /\{t\('health.onDate'\)\} \{new Date\(summary.bestDay.recordDate\).toLocaleDateString\(t\('settings.language'\) === 'ไทย' \? 'th-TH' : 'en-US', \{ day: 'numeric', month: 'long', year: 'numeric' \}\)\}/g, to: "{t('health.onDate')} {new Date(summary.bestDay.recordDate).toLocaleDateString(t('settings.language') === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}" },
      { from: /\{new Date\(record.recordDate\).toLocaleDateString\(t\('settings.language'\) === 'ไทย' \? 'th-TH' : 'en-US', \{/g, to: "{new Date(record.recordDate).toLocaleDateString(t('settings.language') === 'th' ? 'th-TH' : 'en-US', {" }
    ]
  },
  {
    file: 'app/leaderboard.tsx',
    replaces: [
      { from: /subtitle="เริ่มเดินและเข้าร่วมกิจกรรมเพื่อสะสมแต้มเป็นคนแรก!"/g, to: "subtitle={t('leaderboard.startWalking')}" }
    ]
  },
  {
    file: 'src/components/ErrorState.tsx',
    replaces: [
      { from: /title = 'เกิดข้อผิดพลาดบางอย่าง',/g, to: "title = 'เกิดข้อผิดพลาดบางอย่าง'," },
      { from: /message = 'ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',/g, to: "message = 'ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง'," },
      { from: /retryLabel = 'ลองใหม่อีกครั้ง',/g, to: "retryLabel = 'ลองใหม่อีกครั้ง'," }
    ]
  },
  {
    file: 'src/features/activity/ActivityCard.tsx',
    replaces: [
      { from: /const categories = \['วิ่ง', 'จักรยาน', 'โยคะ', 'ว่ายน้ำ', 'HIIT'\];/g, to: "const categories = [t('activity.run'), t('activity.bike'), t('activity.yoga'), t('activity.swim'), t('activity.hiit')];" },
      { from: /\{participants\}\/\{maxParticipants\} คน/g, to: "{participants}/{maxParticipants} {t('dashboard.upcoming').replace('กำลังจะมาถึง', 'people')}" }
    ]
  },
  {
    file: 'src/features/dashboard/DashboardComponents.tsx',
    replaces: [
      { from: />สวัสดี,</g, to: ">{t('dashboard.hello')}<" },
      { from: /const tfLabel = tf === 'Daily' \? 'วันนี้' : tf === 'Weekly' \? 'สัปดาห์' : 'เดือน';/g, to: "const tfLabel = tf === 'Daily' ? t('dashboard.daily', 'Daily') : tf === 'Weekly' ? t('dashboard.weekly', 'Weekly') : t('dashboard.monthly', 'Monthly');" },
      { from: />เป้าหมายวันนี้</g, to: ">{t('dashboard.todayGoal')}<" },
      { from: />สำเร็จ</g, to: ">{t('dashboard.achieved')}<" },
      { from: /label: 'ก้าว'/g, to: "label: t('dashboard.steps')" },
      { from: /label: 'กม\.'/g, to: "label: t('dashboard.km')" },
      { from: />อันดับ</g, to: ">{t('dashboard.ranking')}<" },
      { from: />ดูทั้งหมด</g, to: ">{t('dashboard.seeAll')}<" },
      { from: />เพื่อน</g, to: ">{t('dashboard.friends')}<" },
      { from: />กิจกรรมที่กำลังดำเนินการ</g, to: ">{t('dashboard.ongoingActivities')}<" },
      { from: /title="ไม่มีกิจกรรม"/g, to: "title={t('dashboard.noActivitiesTitle')}" },
      { from: /subtitle="คุณยังไม่มีกิจกรรมที่กำลังจะมาถึงในช่วงนี้"/g, to: "subtitle={t('dashboard.noActivitiesSubtitle')}" },
      { from: />กำลังจะมาถึง</g, to: ">{t('dashboard.upcoming')}<" },
      { from: />48 คน</g, to: ">48 {t('activity.participantsUncapped').replace(' คน (ไม่จำกัด)', 'people')}<" }
    ]
  },
  {
    file: 'src/features/friend/FriendCard.tsx',
    replaces: [
      { from: /\} ก้าว · \{/g, to: "} {t('friend.stepsCount')} · {" },
      { from: /\} กม\./g, to: "} {t('friend.kmCount')}" }
    ]
  },
  {
    file: 'src/features/friend/RankSummaryCard.tsx',
    replaces: [
      { from: />อันดับของคุณ</g, to: ">{t('friend.yourRank')}<" },
      { from: /\} ก้าว</g, to: "} {t('friend.stepsCount')}<" },
      { from: /\} กม\.</g, to: "} {t('friend.kmCount')}<" }
    ]
  }
];

for (const rep of replacements) {
  if (fs.existsSync(rep.file)) {
    let content = fs.readFileSync(rep.file, 'utf8');
    let modified = false;

    // Fix translation injection if needed
    if (rep.file !== 'src/components/ErrorState.tsx' && !content.includes("useTranslation")) {
      content = "import { useTranslation } from 'react-i18next';\n" + content;
      modified = true;
    }
    
    // Attempt to inject `const { t } = useTranslation();` inside component if not exists
    if (rep.file !== 'src/components/ErrorState.tsx' && !content.includes("const { t } = useTranslation();")) {
      content = content.replace(/((?:export default function|export function|const) [A-Za-z0-9_]+\s*=\s*(?:\([^)]*\)\s*=>\s*|function\s*\([^)]*\)\s*)\{)/, "$1\n  const { t } = useTranslation();");
      modified = true;
    }

    for (const r of rep.replaces) {
      if (content.match(r.from)) {
        content = content.replace(r.from, r.to);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(rep.file, content);
      console.log('Updated ' + rep.file);
    }
  }
}

// Special case for ErrorState which doesn't have useTranslation
let errorStatePath = 'src/components/ErrorState.tsx';
if (fs.existsSync(errorStatePath)) {
  let c = fs.readFileSync(errorStatePath, 'utf8');
  if (!c.includes('useTranslation')) {
    c = "import { useTranslation } from 'react-i18next';\n" + c;
    c = c.replace(/export function ErrorState\(\{([^\}]+)\}: ErrorStateProps\) \{/, "export function ErrorState({$1}: ErrorStateProps) {\n  const { t } = useTranslation();");
    c = c.replace(/title = 'เกิดข้อผิดพลาดบางอย่าง',/, "title = t('common.somethingWentWrong'),");
    c = c.replace(/message = 'ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',/, "message = t('common.cannotLoadData'),");
    c = c.replace(/retryLabel = 'ลองใหม่อีกครั้ง',/, "retryLabel = t('common.tryAgain'),");
    fs.writeFileSync(errorStatePath, c);
    console.log('Updated ' + errorStatePath);
  }
}

