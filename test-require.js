console.log('Testing module resolution...');

try {
  console.log('Testing express...');
  const express = require('express');
  console.log('express found:', typeof express);
} catch (err) {
  console.log('express error:', err.message);
}

try {
  console.log('Testing cors...');
  const cors = require('cors');
  console.log('cors found:', typeof cors);
} catch (err) {
  console.log('cors error:', err.message);
}

try {
  console.log('Testing dotenv...');
  const dotenv = require('dotenv');
  console.log('dotenv found:', typeof dotenv);
} catch (err) {
  console.log('dotenv error:', err.message);
}

console.log('Module resolution test complete.');