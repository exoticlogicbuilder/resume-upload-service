const { spawn } = require('child_process');
const path = require('path');

console.log('Installing cors...');
const npm = spawn('npm', ['install', 'cors', '--save'], {
  cwd: __dirname,
  stdio: 'inherit'
});

npm.on('close', (code) => {
  console.log(`npm install exited with code ${code}`);
  
  // Check if cors was installed
  const fs = require('fs');
  try {
    const corsPath = path.join(__dirname, 'node_modules', 'cors');
    if (fs.existsSync(corsPath)) {
      console.log('SUCCESS: cors module found at', corsPath);
    } else {
      console.log('FAILED: cors module not found after installation');
    }
  } catch (err) {
    console.error('Error checking cors installation:', err);
  }
});

npm.on('error', (err) => {
  console.error('Error spawning npm:', err);
});