const fs = require('fs');
const path = require('path');

function ensureImport(filePath, isComponent) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (filePath.endsWith('AppText.tsx')) return;
  
  if (content.includes('<AppText') && !content.includes('import AppText') && !content.includes('import { AppText }')) {
    let importPath = isComponent ? "'./AppText'" : "''";
    if (!isComponent) {
      const depth = filePath.split(/\\|\//).filter(p => p === 'app' || p === '(tabs)' || p === 'group' || p === 'activity' || p === 'admin').length - 1;
      const prefix = depth === 0 ? '../src/components' : '../'.repeat(depth) + 'src/components';
      importPath = `'${prefix}'`;
    }
    
    // Add import statement at the beginning
    content = `import { AppText } from ${importPath};\n` + content;
    // Wait, the components export AppText as named export from index.ts but I did `export { default as AppText } from './AppText'`.
    // Wait, if it's imported from `../src/components`, it's a named import `import { AppText }`.
    // If it's a component importing it directly, `import AppText from './AppText'`.
    if (isComponent) {
      content = content.replace(`import { AppText } from './AppText';\n`, `import AppText from './AppText';\n`);
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Added AppText import to ${filePath}`);
  }
}

function walkDir(dir, isComponent) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, isComponent);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      ensureImport(fullPath, isComponent);
    }
  }
}

walkDir(path.join(__dirname, '../src/components'), true);
walkDir(path.join(__dirname, '../app'), false);
