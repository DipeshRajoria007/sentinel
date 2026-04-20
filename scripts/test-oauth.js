#!/usr/bin/env node
// Quick diagnostic: tests that GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and
// GOOGLE_REFRESH_TOKEN in .env are a valid combination.

import 'dotenv/config';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

console.log('Client ID:', CLIENT_ID ? `${CLIENT_ID.slice(0, 20)}...` : '(missing)');
console.log('Client Secret:', CLIENT_SECRET ? `${CLIENT_SECRET.slice(0, 8)}...` : '(missing)');
console.log('Refresh Token:', REFRESH_TOKEN ? `${REFRESH_TOKEN.slice(0, 20)}...` : '(missing)');

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
  console.error('\nMissing credentials in .env');
  process.exit(1);
}

console.log('\nAttempting to refresh access token...');

const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }),
});

const data = await res.json();

if (res.ok) {
  console.log('\n=== SUCCESS ===');
  console.log('Access token obtained:', data.access_token.slice(0, 20) + '...');
  console.log('Expires in (s):', data.expires_in);
  console.log('Scope:', data.scope);
  if (!data.scope?.includes('meetings.space.readonly')) {
    console.warn('\nWARNING: meetings.space.readonly scope is NOT in the token — Meet API will fail');
  }
} else {
  console.error('\n=== FAILED ===');
  console.error('Status:', res.status);
  console.error('Error:', data);
}
