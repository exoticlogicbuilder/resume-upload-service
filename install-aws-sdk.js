const { execSync } = require('child_process');
const fs = require('fs');

console.log('Installing AWS SDK modules...');

try {
  // Install AWS SDK modules
  const awsModules = [
    '@aws-sdk/client-s3',
    '@aws-sdk/s3-request-presigner'
  ];
  
  awsModules.forEach(module => {
    console.log(`Installing ${module}...`);
    try {
      execSync(`npm install ${module}`, { stdio: 'inherit' });
      console.log(`${module} installed successfully`);
    } catch (err) {
      console.error(`Failed to install ${module}:`, err.message);
    }
  });
  
  console.log('AWS SDK installation complete');
  
} catch (error) {
  console.error('Installation error:', error.message);
}