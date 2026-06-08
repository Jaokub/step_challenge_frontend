const fs = require('fs');
const path = require('path');

function processFile(filePath, isComponent) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip AppText itself
  if (filePath.endsWith('AppText.tsx')) return;

  let originalContent = content;

  // 1. Remove `fonts` from imports of `theme`
  content = content.replace(/fonts,\s*/g, '');
  content = content.replace(/,\s*fonts\b/g, '');
  content = content.replace(/\{\s*fonts\s*\}/g, '{}');

  // 2. Add AppText import if not present and AppText is used
  if (content.includes('<AppText') && !content.includes('import') || (content.includes('<AppText') && !content.includes('AppText', 0, content.indexOf('<AppText')))) {
     // Check if it's already imported
     if (!content.includes('import') || !content.match(/import.*AppText/)) {
        let importPath = '';
        if (isComponent) {
          importPath = `'./AppText'`;
        } else {
          const depth = filePath.split(/\\|\//).filter(p => p === 'app' || p === '(tabs)' || p === 'group' || p === 'activity' || p === 'admin').length - 1;
          const prefix = depth === 0 ? '../src/components' : '../'.repeat(depth) + 'src/components';
          importPath = `'${prefix}'`;
        }
        
        // Add import after the last import statement or at the top
        const lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
           const endOfLine = content.indexOf('\n', lastImportIndex);
           content = content.slice(0, endOfLine + 1) + `import AppText from ${importPath};\n` + content.slice(endOfLine + 1);
        } else {
           content = `import AppText from ${importPath};\n` + content;
        }
     }
  }

  // 3. AppTextInput ? Ah, SearchBar might have <TextInput> which got matched as <Text> ? 
  // No, the regex was `<Text([^>]*?)>` which matches `<TextInput` !
  // Let's fix AppTextInput back to TextInput
  content = content.replace(/<AppTextInput/g, '<TextInput');
  content = content.replace(/<\/AppTextInput>/g, '</TextInput>');

  // 4. AppTextStyle ? AnimatedCounter had `TextStyle` imported and it got replaced? No, `Text` -> `AppText` so `TextStyle` -> `AppTextStyle` ? Wait! 
  // The regex was `/Text/g` ? No, my regex was `<Text>` but maybe I did a bad replace.
  // Wait, my first script had:
  // content = content.replace(/<Text([^>]*?)>/g, '<AppText$1>');
  // If it was <TextInput>, it became <AppTextInput>.
  // And `Animated.createAnimatedComponent(Text)` wasn't replaced by `<Text>`, so wait, the error was `Cannot find name 'AppTextStyle'` ? Let's check AnimatedCounter.tsx.

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

console.log('Starting fix...');
walkDir(path.join(__dirname, '../src/components'), true);
walkDir(path.join(__dirname, '../app'), false);
console.log('Done!');
