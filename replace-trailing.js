const fs = require('fs');

const replacements = [
  {
    file: 'app/(auth)/register.tsx',
    replaces: [
      { from: /'วิศวกรรมคอมพิวเตอร์'/g, to: "t('auth.deptComputer')" },
      { from: /'วิศวกรรมไฟฟ้า'/g, to: "t('auth.deptElectrical')" },
      { from: /'วิศวกรรมเครื่องกล'/g, to: "t('auth.deptMechanical')" },
      { from: /'วิศวกรรมโยธา'/g, to: "t('auth.deptCivil')" },
      { from: /'วิศวกรรมอุตสาหกรรม'/g, to: "t('auth.deptIndustrial')" },
      { from: /'วิศวกรรมเคมี'/g, to: "t('auth.deptChemical')" },
      { from: /'วิศวกรรมสิ่งแวดล้อม'/g, to: "t('auth.deptEnvironmental')" },
      { from: /'วิศวกรรมสำรวจ'/g, to: "t('auth.deptSurvey')" },
      { from: /'วิศวกรรมโลหการ'/g, to: "t('auth.deptMetallurgical')" },
      { from: /'อื่นๆ'/g, to: "t('auth.deptOther')" }
    ]
  },
  {
    file: 'app/(tabs)/activities.tsx',
    replaces: [
      { from: /\.replace\('ไม่พบกิจกรรม', 'Search activities\.\.\.'\)/g, to: "" },
      { from: /t\('activity\.notFound'\)/g, to: "t('activity.search')" }
    ]
  },
  {
    file: 'app/(tabs)/groups.tsx',
    replaces: [
      { from: /lastActive: 'เมื่อวาน'/g, to: "lastActive: t('groups.yesterday')" },
      { from: /title="เพื่อน"/g, to: "title={t('tabs.friends')}" }
    ]
  },
  {
    file: 'app/(tabs)/profile.tsx',
    replaces: [
      { from: /value=\{\`\$\{healthSummary\.activeDays\} วัน\`\}/g, to: "value={`\${healthSummary.activeDays} \${t('profile.days')}`}" }
    ]
  },
  {
    file: 'app/(tabs)/scan.tsx',
    replaces: [
      { from: />แสกน/g, to: ">{t('scan.scanBtn')}<" },
      { from: />QR ของฉัน/g, to: ">{t('scan.myQrTab')}<" }
    ]
  },
  {
    file: 'app/activity/[id].tsx',
    replaces: [
      { from: / \/ \$\{activity.maxParticipants\} คน/g, to: " / ${activity.maxParticipants} ${t('activity.people')}" }
    ]
  },
  {
    file: 'src/features/activity/ActivityCard.tsx',
    replaces: [
      { from: /\.replace\('กำลังจะมาถึง', 'people'\)/g, to: "" },
      { from: /\{t\('dashboard\.upcoming'\)\}/g, to: "{t('activity.people')}" }
    ]
  },
  {
    file: 'src/features/dashboard/DashboardComponents.tsx',
    replaces: [
      { from: />อรอนงค์ 👋/g, to: ">{t('dashboard.hello').replace(',', '')} 👋<" },
      { from: /\.replace\(' คน \(ไม่จำกัด\)', 'people'\)/g, to: "" },
      { from: /\{t\('activity\.participantsUncapped'\)\}/g, to: "{t('activity.people')}" }
    ]
  }
];

for (const rep of replacements) {
  if (fs.existsSync(rep.file)) {
    let content = fs.readFileSync(rep.file, 'utf8');
    let modified = false;

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
