const fs = require('fs');
const content = fs.readFileSync('package-lock.json', 'utf8');
const lines = content.split('\n');
let found = false;

lines.forEach((line, index) => {
  if (line.includes('cors')) {
    console.log(`Line ${index + 1}: ${line}`);
    found = true;
  }
});

if (!found) {
  console.log('No "cors" found in package-lock.json');
}