const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..');
const standaloneDir = path.join(sourceDir, '.next', 'standalone');
const staticSourceDir = path.join(sourceDir, '.next', 'static');
const staticDestDir = path.join(standaloneDir, '.next', 'static');
const publicSourceDir = path.join(sourceDir, 'public');
const publicDestDir = path.join(standaloneDir, 'public');

console.log('Preparing deployment files...');

// Ensure standalone directory exists (it should after build)
if (!fs.existsSync(standaloneDir)) {
  console.error('Error: .next/standalone directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Function to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy .next/static
if (fs.existsSync(staticSourceDir)) {
  console.log('Copying .next/static...');
  copyDir(staticSourceDir, staticDestDir);
} else {
  console.warn('Warning: .next/static not found.');
}

// Copy public
if (fs.existsSync(publicSourceDir)) {
  console.log('Copying public folder...');
  copyDir(publicSourceDir, publicDestDir);
} else {
  console.warn('Warning: public folder not found.');
}

console.log('Deployment preparation complete! Upload the contents of ".next/standalone" to your server.');
