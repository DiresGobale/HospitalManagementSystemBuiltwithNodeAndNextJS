/**
 * Ethiopian Standard Validation Utilities for HMS Hospital System
 */

// Ethiopian standard mobile phone pattern:
// Local: 09XXXXXXXX (Ethio Telecom) or 07XXXXXXXX (Safaricom Ethiopia) -> 10 digits
// International: +2519XXXXXXXX or +2517XXXXXXXX -> 13 chars, or 2519... -> 12 chars
export const ETHIOPIAN_PHONE_REGEX = /^(?:\+251|251|0)?([97]\d{8})$/;

/**
 * Filter phone input in real-time: allows only digits and an optional leading '+'
 */
export function sanitizePhoneInput(val: string): string {
  // Allow leading '+', then only digits
  const hasPlus = val.startsWith('+');
  const digitsOnly = val.replace(/\D/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Validate phone number against Ethiopian telecommunications standards
 */
export function validateEthiopianPhone(phone: string): {
  isValid: boolean;
  message: string;
  normalized: string;
  valid: boolean;
  error: string;
  normalizedPhone: string;
} {
  const trimmed = phone.trim();
  if (!trimmed) {
    const msg = 'Phone number is required.';
    return {
      isValid: false,
      message: msg,
      normalized: '',
      valid: false,
      error: msg,
      normalizedPhone: '',
    };
  }

  const clean = trimmed.replace(/[\s\-]/g, '');
  const match = clean.match(ETHIOPIAN_PHONE_REGEX);

  if (!match) {
    const msg = 'Must be a valid Ethiopian phone number (e.g. 0911234567, 0712345678, or +251911234567).';
    return {
      isValid: false,
      message: msg,
      normalized: clean,
      valid: false,
      error: msg,
      normalizedPhone: clean,
    };
  }

  // Normalize to standard local format (09... or 07...)
  const core9Digits = match[1];
  const normalized = `0${core9Digits}`;

  return {
    isValid: true,
    message: '',
    normalized,
    valid: true,
    error: '',
    normalizedPhone: normalized,
  };
}

/**
 * Filter person's name in real-time: permits ONLY alphabetic characters, spaces, and valid name marks (' - .)
 * Blocks any numbers (0-9) or invalid special characters.
 * Supports Latin and Ethiopic Ge'ez script (\u1200-\u137F).
 */
export function sanitizeNameInput(val: string): string {
  return val.replace(/[^A-Za-z\s.'\-\u1200-\u137F]/g, '');
}

/**
 * Validate person full name: only characters, minimum 2 characters, no numbers
 */
export function validatePersonName(name: string): {
  isValid: boolean;
  message: string;
  valid: boolean;
  error: string;
} {
  const trimmed = name.trim();
  if (!trimmed) {
    const msg = 'Full name is required.';
    return { isValid: false, message: msg, valid: false, error: msg };
  }
  if (trimmed.length < 2) {
    const msg = 'Full name must be at least 2 characters.';
    return { isValid: false, message: msg, valid: false, error: msg };
  }
  if (/\d/.test(trimmed)) {
    const msg = 'Name cannot contain numeric digits (0-9).';
    return { isValid: false, message: msg, valid: false, error: msg };
  }
  const namePattern = /^[A-Za-z\s.'\-\u1200-\u137F]+$/;
  if (!namePattern.test(trimmed)) {
    const msg = 'Name can only contain alphabetic characters and spaces.';
    return { isValid: false, message: msg, valid: false, error: msg };
  }
  return { isValid: true, message: '', valid: true, error: '' };
}
