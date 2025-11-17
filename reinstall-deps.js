const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting dependency reinstallation...');

try {
  // Remove node_modules and package-lock.json
  console.log('Removing existing node_modules and package-lock.json...');
  if (fs.existsSync('./node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  if (fs.existsSync('./package-lock.json')) {
    fs.unlinkSync('./package-lock.json');
  }
  
  // Clear npm cache
  console.log('Clearing npm cache...');
  execSync('npm cache clean --force', { stdio: 'inherit' });
  
  // Install dependencies
  console.log('Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Check for critical modules
  const criticalModules = ['express', 'cors', 'dotenv', 'multer', 'pg'];
  const missingModules = [];
  
  criticalModules.forEach(module => {
    const modulePath = path.join(__dirname, 'node_modules', module);
    if (!fs.existsSync(modulePath)) {
      missingModules.push(module);
    }
  });
  
  if (missingModules.length > 0) {
    console.log('Missing modules:', missingModules);
    console.log('Installing missing modules individually...');
    missingModules.forEach(module => {
      console.log(`Installing ${module}...`);
      execSync(`npm install ${module} --save`, { stdio: 'inherit' });
    });
  }
  
  console.log('Dependency reinstallation complete!');
  
} catch (error) {
  console.error('Error during reinstallation:', error.message);
  process.exit(1);
}