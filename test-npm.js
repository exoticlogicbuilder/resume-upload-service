const { execSync } = require('child_process');

try {
  console.log('Testing npm...');
  const version = execSync('npm --version', { encoding: 'utf8' });
  console.log('npm version:', version.trim());
  
  console.log('Installing cors...');
  const installResult = execSync('npm install cors --save', { encoding: 'utf8' });
  console.log('Install result:', installResult);
  
  console.log('Checking node_modules...');
  const lsResult = execSync('ls node_modules | grep cors', { encoding: 'utf8' });
  console.log('cors found:', lsResult.trim());
} catch (error) {
  console.error('Error:', error.message);
  console.error('stdout:', error.stdout);
  console.error('stderr:', error.stderr);
}