export function normalizePhone(raw) {
  if (!raw) return '';
  // Remove all non-digit except +
  let cleaned = raw.replace(/[^\d+]/g, '');
  // If starts with +91 and has 13 digits, format as '+91 xxxxxxxxxx'
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3)}`;
  }
  // If starts with + and has 12 or more digits, keep as is
  if (cleaned.startsWith('+') && cleaned.length >= 12) {
    return cleaned;
  }
  // If starts with country code (like 91) and has 12 digits, add +
  if (/^\d{12}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  // If 10 digits, assume Indian mobile
  if (/^\d{10}$/.test(cleaned)) {
    return `+91 ${cleaned}`;
  }
  return cleaned;
}

export function cleanLines(text) {
  if (!text) return [];
  
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}