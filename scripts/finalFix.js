const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, replacer) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const newContent = replacer(content);
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
        }
    }
}

// 1. Fix depth for imports
function fixDepth(dir, isComponent) {
  if (isComponent) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDepth(fullPath, isComponent);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceFileContent(fullPath, (content) => {
         // check if there is an incorrect import from '../src/components' when it should be '../../src/components'
         // How deep is this file relative to mobile/app ?
         const relative = path.relative(path.join(__dirname, '../app'), fullPath);
         const depth = relative.split(path.sep).length - 1; // number of directories deep
         const correctPrefix = '../'.repeat(depth + 1) + 'src/components';
         return content.replace(/import\s+\{\s*AppText\s*\}\s+from\s+['"]([^'"]+)['"]/g, (match, p1) => {
             if (p1.endsWith('src/components')) {
                 return `import { AppText } from '${correctPrefix}'`;
             }
             return match;
         });
      });
    }
  }
}
fixDepth(path.join(__dirname, '../app'), false);

// 2. Fix AppText.tsx typing
replaceFileContent(path.join(__dirname, '../src/components/AppText.tsx'), (content) => {
    return content.replace('let fontFamily = fonts.body.regular;', 'let fontFamily: string = fonts.body.regular;');
});

// 3. Fix AnimatedCounter.tsx
replaceFileContent(path.join(__dirname, '../src/components/AnimatedCounter.tsx'), (content) => {
    return content.replace('AppTextStyle', 'TextStyle');
});

console.log('Fixed');
