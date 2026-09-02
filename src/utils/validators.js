// src/utils/validators.js

export function validateMobile(str) {
  if (!str || !/^\d{10}$/.test(str)) {
    return { valid: false, error: 'Please enter a valid 10-digit mobile number' };
  }
  return { valid: true, error: null };
}

export function validateRequired(value, fieldName) {
  if (!value || String(value).trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateAmount(value) {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) {
    return 'Amount must be greater than zero';
  }
  return null;
}

export function validatePositiveInt(value) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < 1) {
    return 'Value must be a positive integer';
  }
  return null;
}

export function validateDriverMobile(str) {
  if (!str || !/^\d{10}$/.test(str)) {
    return 'Driver mobile must be exactly 10 digits';
  }
  return null;
}
