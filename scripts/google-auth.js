#!/usr/bin/env node

// One-time OAuth flow to obtain GOOGLE_REFRESH_TOKEN with all required scopes.
// Usage: node scripts/google-auth.js <CLIENT_ID> <CLIENT_SECRET>
// After running, open the printed URL in your browser, sign in with the Sentinel
// Google account, grant all permissions, and the refresh token will be printed.

import http from 'node:http';
import { URL } from 'node:url';

const CLIENT_ID = process.argv[2];
const CLIENT_SECRET = process.argv[3];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Usage: node scripts/google-auth.js <CLIENT_ID> <CLIENT_SECRET>');
  process.exit(1);
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/meetings.space.readonly',
].join(' ');

const REDIRECT_URI = 'http://localhost:3456/callback';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3456');
  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end();
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400);
    res.end('No code received');
    return;
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();

  if (tokens.refresh_token) {
    console.log('\n=== SUCCESS ===');
    console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('===============\n');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>Success!</h1><p>Refresh token obtained. Close this tab and check your terminal.</p>');
  } else {
    console.error('Error:', JSON.stringify(tokens, null, 2));
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end('<h1>Error</h1><pre>' + JSON.stringify(tokens, null, 2) + '</pre>');
  }

  server.close();
});

server.listen(3456, () => {
  console.log('Open this URL in your browser and log in with the Sentinel Google account:\n');
  console.log(authUrl);
  console.log('\nWaiting for callback...');
});
