import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// Read and parse .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    // Remove surrounding quotes if they exist
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
});

console.log('EMAIL_USER:', env.EMAIL_USER);
console.log('EMAIL_PASS (length):', env.EMAIL_PASS ? env.EMAIL_PASS.length : 0);
console.log('EMAIL_PASS (exact value):', JSON.stringify(env.EMAIL_PASS));

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: parseInt(env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.error('Verify error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});
