const fs = require('fs');

const replacements = [
  {
    file: 'app/(auth)/register.tsx',
    replaces: [
      { from: /placeholder="Nickname \(Optional\)"/g, to: "placeholder={t('auth.nicknameOptional')}" }
    ]
  },
  {
    file: 'app/(tabs)/profile.tsx',
    replaces: [
      { from: /Alert\.alert\('คัดลอกสำเร็จ', 'นำ Sync Token ไปวางในคำสั่งลัด \(iOS Shortcuts\) เพื่อเริ่มซิงค์ข้อมูลก้าวเดิน'\);/g, to: "Alert.alert(t('profile.copySuccess'), t('profile.copyDesc'));" }
    ]
  },
  {
    file: 'app/(tabs)/scan.tsx',
    replaces: [
      { from: />Grant Permission</g, to: ">{t('scan.grantPermission')}<" },
      { from: />QR ของฉัน</g, to: ">{t('scan.myQr')}<" }
    ]
  },
  {
    file: 'app/admin/activity/[id]/attendees.tsx',
    replaces: [
      { from: />Total Checked-in</g, to: ">{t('admin.totalCheckedIn')}<" },
      { from: />Scan User QR</g, to: ">{t('admin.scanUserQr')}<" }
    ]
  },
  {
    file: 'app/admin/create-activity.tsx',
    replaces: [
      { from: /Alert\.alert\('Error', 'Please fill all required fields'\);/g, to: "Alert.alert(t('common.error'), t('admin.fillRequiredFields'));" },
      { from: /Alert\.alert\('Success', 'Activity created successfully!'\);/g, to: "Alert.alert(t('common.success'), t('admin.activityCreated'));" },
      { from: /placeholder="e\.g\. June Campus Run"/g, to: "placeholder={t('admin.egCampusRun')}" },
      { from: /placeholder="Describe the activity\.\.\."/g, to: "placeholder={t('admin.describeActivity')}" },
      { from: /placeholder="e\.g\. 50000"/g, to: "placeholder={t('admin.egSteps')}" }
    ]
  },
  {
    file: 'app/admin/edit-activity/[id].tsx',
    replaces: [
      { from: /Alert\.alert\('Error', 'Please fill all required fields'\);/g, to: "Alert.alert(t('common.error'), t('admin.fillRequiredFields'));" },
      { from: /Alert\.alert\('Success', 'Activity updated successfully!'\);/g, to: "Alert.alert(t('common.success'), t('admin.activityUpdated'));" },
      { from: /Alert\.alert\(\s*'Warning',\s*'Are you sure you want to delete this activity\? This action cannot be undone\.',/g, to: "Alert.alert(t('admin.deleteWarningTitle'), t('admin.deleteWarningDesc')," },
      { from: /Alert\.alert\('Deleted', 'Activity deleted\.'\);/g, to: "Alert.alert(t('admin.deleted'), t('admin.activityDeleted'));" },
      { from: /placeholder="e\.g\. June Campus Run"/g, to: "placeholder={t('admin.egCampusRun')}" },
      { from: /placeholder="Describe the activity\.\.\."/g, to: "placeholder={t('admin.describeActivity')}" },
      { from: /placeholder="e\.g\. 50000"/g, to: "placeholder={t('admin.egSteps')}" }
    ]
  },
  {
    file: 'app/admin/users.tsx',
    replaces: [
      { from: />ADMIN</g, to: ">{t('admin.roleAdmin')}<" },
      { from: />ARCHIVED</g, to: ">{t('admin.statusArchived')}<" },
      { from: /placeholder="Search users or department\.\.\."/g, to: "placeholder={t('admin.searchUsers')}" }
    ]
  },
  {
    file: 'app/leaderboard.tsx',
    replaces: [
      { from: />pts</g, to: ">{t('common.pts')}<" }
    ]
  },
  {
    file: 'app/settings.tsx',
    replaces: [
      { from: />Admin Management</g, to: ">{t('settings.adminManagement')}<" }
    ]
  },
  {
    file: 'src/components/LeaderboardItem.tsx',
    replaces: [
      { from: />pts</g, to: ">{t('common.pts')}<" }
    ]
  },
  {
    file: 'src/features/admin/AdminDashboardComponents.tsx',
    replaces: [
      { from: />Total Users</g, to: ">{t('admin.totalUsers')}<" },
      { from: />Check-in Rate</g, to: ">{t('admin.checkInRate')}<" },
      { from: />DAU \/ WAU</g, to: ">{t('admin.dauWau')}<" },
      { from: />Active \/ Ended</g, to: ">{t('admin.activeEnded')}<" },
      { from: />See All</g, to: ">{t('common.seeAll')}<" }
    ]
  },
  {
    file: 'src/features/friend/RequestCard.tsx',
    replaces: [
      { from: />Wants to be friends</g, to: ">{t('friend.wantsToBeFriends')}<" }
    ]
  },
  {
    file: 'src/features/scan/MyQRCodeView.tsx',
    replaces: [
      { from: />My QR Code</g, to: ">{t('scan.myQrCode')}<" },
      { from: />Show this code to check-in or add friend</g, to: ">{t('scan.showCodeCheckIn')}<" },
      { from: />Share Link</g, to: ">{t('scan.shareLink')}<" }
    ]
  }
];

let filesModified = 0;

for (const rep of replacements) {
  if (fs.existsSync(rep.file)) {
    let content = fs.readFileSync(rep.file, 'utf8');
    let modified = false;
    
    // Add useTranslation import if missing
    if (!content.includes("useTranslation")) {
      content = "import { useTranslation } from 'react-i18next';\n" + content;
      modified = true;
    }
    
    // Attempt to inject `const { t } = useTranslation();` inside component if not exists
    // Simple heuristic: after `export default function XYZ() {` or `const XYZ = () => {`
    if (!content.includes("const { t } = useTranslation();")) {
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
      filesModified++;
      console.log('Updated ' + rep.file);
    }
  } else {
    console.log('File not found: ' + rep.file);
  }
}

console.log('Done modifying ' + filesModified + ' files.');
