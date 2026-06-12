import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('src');
const FEATURES_DIR = path.join(SRC_DIR, 'features');
const APP_DIR = path.resolve('app');

const subDirsToFlatten = ['components', 'hooks', 'services', 'utils'];

function traverseDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      traverseDir(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

// 1. Identify all files to be moved
const moves = []; // { oldPath, newPath }
const featureNames = fs.readdirSync(FEATURES_DIR).filter(f => fs.statSync(path.join(FEATURES_DIR, f)).isDirectory());

for (const feature of featureNames) {
  const featurePath = path.join(FEATURES_DIR, feature);
  for (const subDir of subDirsToFlatten) {
    const subDirPath = path.join(featurePath, subDir);
    if (fs.existsSync(subDirPath)) {
      const files = traverseDir(subDirPath);
      for (const file of files) {
        const fileName = path.basename(file);
        const newPath = path.join(featurePath, fileName);
        moves.push({ oldPath: file, newPath });
      }
    }
  }
}

// Create lookup maps
const oldToNew = new Map(moves.map(m => [m.oldPath, m.newPath]));
const newToOld = new Map(moves.map(m => [m.newPath, m.oldPath]));

// 2. Perform the moves
for (const move of moves) {
  console.log(`Moving ${move.oldPath} -> ${move.newPath}`);
  fs.renameSync(move.oldPath, move.newPath);
}

// Delete empty subdirs
for (const feature of featureNames) {
  const featurePath = path.join(FEATURES_DIR, feature);
  for (const subDir of subDirsToFlatten) {
    const subDirPath = path.join(featurePath, subDir);
    if (fs.existsSync(subDirPath)) {
      fs.rmSync(subDirPath, { recursive: true, force: true });
    }
  }
}

// Get all TS/TSX files
const allSourceFiles = [...traverseDir(SRC_DIR), ...traverseDir(APP_DIR)].filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

// Build a Set of all known old paths for quick lookup
const allOldPathsSet = new Set();
for (const f of allSourceFiles) {
  const oldP = newToOld.get(f) || f;
  allOldPathsSet.add(oldP);
}

function resolveOldImport(oldCurrentDir, importStr) {
  const exts = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
  for (const ext of exts) {
    const attempt = path.resolve(oldCurrentDir, importStr + ext);
    if (allOldPathsSet.has(attempt)) return attempt;
  }
  return null;
}

// 3. Fix imports
for (const currentFile of allSourceFiles) {
  const oldCurrentPath = newToOld.get(currentFile) || currentFile;
  const oldCurrentDir = path.dirname(oldCurrentPath);
  
  let content = fs.readFileSync(currentFile, 'utf8');
  let changed = false;

  const importRegex = /(import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, type, importStr) => {
    // Only resolve relative imports
    if (!importStr.startsWith('.')) return match;

    const oldTargetAbs = resolveOldImport(oldCurrentDir, importStr);
    
    if (oldTargetAbs) {
      const newTargetAbs = oldToNew.get(oldTargetAbs) || oldTargetAbs;
      let newRelative = path.relative(path.dirname(currentFile), newTargetAbs);
      
      // Remove extension for TS/TSX
      if (!importStr.endsWith('.ts') && !importStr.endsWith('.tsx')) {
        newRelative = newRelative.replace(/\.tsx?$/, '');
        newRelative = newRelative.replace(/\/index$/, '');
        newRelative = newRelative.replace(/\\index$/, '');
      }

      // Ensure it starts with ./ or ../
      newRelative = newRelative.replace(/\\/g, '/');
      if (!newRelative.startsWith('.')) {
        newRelative = './' + newRelative;
      }

      if (newRelative !== importStr) {
        changed = true;
        return match.replace(importStr, newRelative);
      }
    }
    return match;
  });

  if (changed) {
    console.log(`Updated imports in ${currentFile}`);
    fs.writeFileSync(currentFile, content, 'utf8');
  }
}
console.log("Flattening complete.");
