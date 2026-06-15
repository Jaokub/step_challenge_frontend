const fs = require('fs');
const path = require('path');

function findHardcoded(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'i18n' && file !== 'contexts') {
        findHardcoded(fullPath);
      }
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('layout.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      const alertRegex = /Alert\.alert\(\s*(['"`])([^'"`]+)\1\s*,\s*(['"`])([^'"`]+)\3/g;
      let match;
      while ((match = alertRegex.exec(content)) !== null) {
        if (!match[2].includes('t(') && !match[4].includes('t(')) {
          console.log('HARDCODED ALERT in ' + fullPath + ': ' + match[2] + ' | ' + match[4]);
        }
      }

      const textRegex = />([^<>{]+)</g;
      while ((match = textRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if (text.length > 2 && /^[a-zA-Z]/.test(text) && !text.includes('t(') && !text.includes('router') && !text.includes('colors')) {
          console.log('HARDCODED TEXT in ' + fullPath + ': ' + text);
        }
      }

      const placeholderRegex = /placeholder=(['"])([^'"]+)\1/g;
      while ((match = placeholderRegex.exec(content)) !== null) {
        const text = match[2].trim();
        if (text.length > 2 && /^[a-zA-Z]/.test(text) && !text.includes('t(')) {
          console.log('HARDCODED PLACEHOLDER in ' + fullPath + ': ' + text);
        }
      }
    }
  }
}

console.log('Scanning app...');
findHardcoded('app');
console.log('Scanning components...');
findHardcoded('src/components');
console.log('Scanning features...');
findHardcoded('src/features');
