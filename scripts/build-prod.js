const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
const prodSchemaPath = path.join(projectRoot, 'prisma', 'schema.prod.prisma');
const devSchemaBackupPath = path.join(projectRoot, 'prisma', 'schema.dev.backup');

console.log('🚀 Starting Production Build Process (MySQL Target)...');

// 1. Backup Dev Schema (SQLite)
if (fs.existsSync(schemaPath)) {
  console.log('📦 Backing up development schema...');
  fs.copyFileSync(schemaPath, devSchemaBackupPath);
} else {
  console.error('❌ Error: prisma/schema.prisma not found!');
  process.exit(1);
}

// 2. Use Prod Schema (MySQL)
console.log('🔄 Switching to MySQL schema for build...');
fs.copyFileSync(prodSchemaPath, schemaPath);

try {
  // 3. Generate Prisma Client for MySQL
  console.log('🛠️  Generating Prisma Client (MySQL)...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: projectRoot });

  // 4. Run Build (calls next build -> postbuild -> prepare-deploy.js)
  console.log('🏗️  Running npm run build...');
  execSync('npm run build', { stdio: 'inherit', cwd: projectRoot });

  console.log('✅ Build successful!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // 5. Restore Dev Schema
  if (fs.existsSync(devSchemaBackupPath)) {
    console.log('🔙 Restoring development schema (SQLite)...');
    fs.copyFileSync(devSchemaBackupPath, schemaPath);
    fs.unlinkSync(devSchemaBackupPath);
    
    // 6. Regenerate Prisma Client for SQLite (so local dev works immediately)
    console.log('🛠️  Regenerating Prisma Client (SQLite)...');
    try {
        execSync('npx prisma generate', { stdio: 'inherit', cwd: projectRoot });
    } catch (e) {
        console.warn('⚠️ Warning: Failed to regenerate dev client. Run "npx prisma generate" manually if needed.');
    }
  }
}
