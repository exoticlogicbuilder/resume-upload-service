console.log('Starting debug server...');

try {
  console.log('1. Testing dotenv...');
  const dotenv = require('dotenv');
  console.log('dotenv loaded successfully');
  dotenv.config();
  console.log('dotenv.config() executed');
  
  console.log('2. Testing express...');
  const express = require('express');
  console.log('express loaded successfully');
  
  console.log('3. Testing cors...');
  const cors = require('cors');
  console.log('cors loaded successfully');
  
  console.log('4. Creating app...');
  const app = express();
  console.log('app created successfully');
  
  console.log('5. Using cors middleware...');
  app.use(cors());
  console.log('cors middleware applied');
  
  console.log('6. Testing app.listen...');
  const server = app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
  
  console.log('7. Server setup complete');
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}