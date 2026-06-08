const fs = require('fs');
const path = require('path');

function processFile(filePath, isComponent) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip AppText itself
  if (filePath.endsWith('AppText.tsx')) return;

  let originalContent = content;

  // 1. Replace <Text> and </Text> with <AppText>
  content = content.replace(/<Text([^>]*?)>/g, '<AppText$1>');
  content = content.replace(/<\/Text>/g, '</AppText>');

  // 2. Remove Text from react-native imports
  // Could be `import { View, Text, StyleSheet } from 'react-native';`
  // or multi-line. We will just use regex to remove `Text, ` or `, Text` or `Text`
  content = content.replace(/import\s+{([^}]*?)}\s+from\s+['"]react-native['"];?/g, (match, p1) => {
    let imports = p1.split(',').map(s => s.trim()).filter(Boolean);
    imports = imports.filter(i => i !== 'Text');
    if (imports.length === 0) return '';
    return `import { ${imports.join(', ')} } from 'react-native';`;
  });

  // 3. Add import for AppText
  if (originalContent.includes('<Text') || originalContent.includes('<Text>')) {
    // Determine relative path to components
    // If it's in src/components, it's `./AppText` or `../components/AppText`
    let importPath = '';
    if (isComponent) {
      importPath = `'./AppText'`;
    } else {
      // It's in app/... Need to figure out depth
      const depth = filePath.split(/\\|\//).filter(p => p === 'app' || p === '(tabs)' || p === 'group' || p === 'activity' || p === 'admin').length - 1;
      const prefix = depth === 0 ? '../src/components' : '../'.repeat(depth) + 'src/components';
      importPath = `'${prefix}'`;
    }
    
    // Add import right after react-native import
    if (!content.includes('AppText')) {
      if (isComponent) {
         content = content.replace(/(import .* from ['"]react-native['"];?)/, `$1\nimport AppText from ${importPath};`);
      } else {
         content = content.replace(/(import .* from ['"]react-native['"];?)/, `$1\nimport { AppText } from ${importPath};`);
      }
    }
  }

  // 4. Remove fontFamily: fonts.* or fontFamily: '...' from styles
  content = content.replace(/\s*fontFamily:\s*(fonts\.[a-zA-Z0-9_.]+|['"][a-zA-Z0-9_]+['"]),?/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir, isComponent) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath, isComponent);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath, isComponent);
    }
  }
}

console.log('Starting refactor...');
walkDir(path.join(__dirname, '../src/components'), true);
walkDir(path.join(__dirname, '../app'), false);
console.log('Done!');
