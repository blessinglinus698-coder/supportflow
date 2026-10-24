const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === "string" && email.trim().length <= 254 && EMAIL_REGEX.test(email.trim());
}

export function isNonEmptyString(value, { max } = {}) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (max && trimmed.length > max) return false;
  return true;
}

export function isOneOf(value, allowed) {
  return allowed.includes(value);
}

// bcrypt silently ignores bytes past 72, so cap password length to avoid a
// confusing situation where two different long passwords both "work"
export const PASSWORD_MAX_LENGTH = 72;