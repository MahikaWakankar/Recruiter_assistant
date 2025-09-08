// server/config/googleAuth.js
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Read the credentials file path from environment variable
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!credentialsPath) {
  throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable is not set');
}

// Create auth client using the credentials file
const auth = new google.auth.GoogleAuth({
  keyFile: credentialsPath,
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets'
  ]
});

export default auth;
