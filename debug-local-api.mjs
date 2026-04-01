import fetch from 'node-fetch';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';

// Simulate an Admin JWT Token locally (since we know the JWT secret is random or default in dev)
// Or better yet, we can craft it if we know the JWT_SECRET from .env!
const envPath = path.resolve('d:/Cloud iDrive/Cloud-Drive_webellzinnovation@gmail.com/Ai studio/alpha-dentkart/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const jwtSecretMatch = envContent.match(/JWT_SECRET=(.*)/);
const jwtSecret = jwtSecretMatch ? jwtSecretMatch[1].trim() : 'change_me_to_a_random_string_min_32_characters';

const adminToken = jwt.sign(
    { id: 'admin123', role: 'admin', email: 'admin@alphadentkart.com' },
    jwtSecret,
    { expiresIn: '1h' }
);

async function testLocalApi() {
  console.log('--- Debugging Dev API ---');
  const baseUrl = 'http://localhost:3005/api/v1'; // or 3000 if not proxying

  try {
    console.log('Attempting to update order wp-38429...');
    const updateRes = await fetch(`${baseUrl}/orders/wp-38429/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${adminToken}` // Using the created admin token
      },
      body: JSON.stringify({ status: 'Delivered' })
    });

    console.log(`Response Status: ${updateRes.status} ${updateRes.statusText}`);
    const data = await updateRes.text();
    console.log(`Response Body:`, data);
  } catch (e) {
    console.error('Update error:', e);
  }
}

testLocalApi();
