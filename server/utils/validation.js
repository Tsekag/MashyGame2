export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username) {
  const normalized = username.trim();
  if (normalized.length < 3 || normalized.length > 20) return false;
  const usernameRegex = /^(?=.{3,20}$)[\p{L}\p{N}][\p{L}\p{N} _.'-]{2,19}$/u;
  return usernameRegex.test(normalized);
}
