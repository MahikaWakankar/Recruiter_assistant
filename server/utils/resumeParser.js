import fs from 'fs/promises';
import path from 'path';
// PDF parsing removed: pdf-parse no longer used
import mammoth from 'mammoth';
import { cleanLines, normalizePhone, validateEmail } from './textUtils.js';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_REGEX = /(\+\d{1,3}[-.\s]?)?\d{10,12}/g;

async function readTextFromFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      console.warn(`PDF files not supported. Please convert ${path.basename(filePath)} to DOCX or TXT`);
      return '';
    } else if (ext === '.docx') {
      const buffer = await fs.readFile(filePath);
      const { value } = await mammoth.extractRawText({ buffer });
      return value || '';
    } else if (ext === '.txt') {
      const buffer = await fs.readFile(filePath);
      return buffer.toString('utf8');
    }
    return '';
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return '';
  }
}

function extractEmail(text) {
  const emailMatches = text.match(EMAIL_REGEX);
  if (!emailMatches) return '';
  
  // Filter out common false positives
  const validEmails = emailMatches.filter(email => 
    validateEmail(email) && 
    !email.includes('example.com') &&
    !email.includes('test.com')
  );
  
  return validEmails[0] || '';
}

function extractPhone(text) {
  const phoneMatches = text.match(PHONE_REGEX);
  if (!phoneMatches) return '';
  
  const validPhones = phoneMatches
    .map(normalizePhone)
    .filter(phone => phone.replace(/\D/g, '').length >= 10);
  
  return validPhones[0] || '';
}

function extractName(lines, email) {
  // Try to get name from email first
  let emailName = '';
  if (email) {
    const localPart = email.split('@')[0];
    const parts = localPart.replace(/\d+/g, '').split(/[._-]+/).filter(Boolean);
    if (parts.length >= 1) {
      emailName = parts.slice(0, 2)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Look for name in first few lines
  const nameWindow = lines.slice(0, 8);
  const potentialNames = nameWindow
    .map(line => line.replace(/[^A-Za-z\s]/g, '').trim())
    .filter(line => {
      const words = line.split(/\s+/);
      return words.length >= 2 && words.length <= 4 && 
             words.every(word => word.length >= 2) &&
             /^[A-Za-z\s]+$/.test(line);
    })
    .sort((a, b) => a.length - b.length);

  return potentialNames[0] || emailName || '';
}

export async function parseResumeFile(filePath) {
  try {
    const text = await readTextFromFile(filePath);
    if (!text) {
      return { name: '', email: '', phone: '', error: 'Could not extract text' };
    }

    const lines = cleanLines(text);
    const email = extractEmail(text);
    const phone = extractPhone(text);
    const name = extractName(lines, email);

    return { name, email, phone };
  } catch (error) {
    console.error(`Parse error for ${filePath}:`, error.message);
    return { name: '', email: '', phone: '', error: error.message };
  }
}

export async function scanResumeDirectory(resumeDir) {
  try {
    const entries = await fs.readdir(resumeDir);
    const resumeFiles = entries
      .filter(file => /\.(pdf|docx|txt)$/i.test(file))
      .map(file => path.join(resumeDir, file));

    console.log(`Found ${resumeFiles.length} resume files`);

    const results = [];
    for (const filePath of resumeFiles) {
      console.log(`Processing: ${path.basename(filePath)}`);
      const parsed = await parseResumeFile(filePath);
      results.push({ ...parsed, sourceFile: filePath });
    }

    return results;
  } catch (error) {
    console.error('Error scanning directory:', error.message);
    throw new Error(`Failed to scan resume directory: ${error.message}`);
  }
}