/**
 * Password Policy - Production-grade password strength requirements
 */

export interface PasswordCheck {
  valid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong" | "very-strong";
}

const POLICY = {
  minLength: 10,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  commonPasswords: [
    "password", "123456789", "qwerty", "abc123", "password1",
    "letmein", "welcome", "admin123", "iloveyou", "sunshine",
    "trustno1", "princess", "football", "shadow", "master",
  ],
};

export function validatePassword(password: string): PasswordCheck {
  const errors: string[] = [];

  if (password.length < POLICY.minLength) {
    errors.push(`At least ${POLICY.minLength} characters`);
  }
  if (password.length > POLICY.maxLength) {
    errors.push(`No more than ${POLICY.maxLength} characters`);
  }
  if (POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("One uppercase letter");
  }
  if (POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("One lowercase letter");
  }
  if (POLICY.requireNumber && !/\d/.test(password)) {
    errors.push("One number");
  }
  if (POLICY.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push("One special character (!@#$%^&*...)");
  }
  if (POLICY.commonPasswords.some(cp => password.toLowerCase().includes(cp))) {
    errors.push("Must not contain common passwords");
  }

  const score = calculateStrength(password);
  const strength: PasswordCheck["strength"] =
    score >= 4 ? "very-strong" : score >= 3 ? "strong" : score >= 2 ? "fair" : "weak";

  return { valid: errors.length === 0, errors, strength };
}

function calculateStrength(password: string): number {
  let score = 0;
  if (password.length >= 10) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

export const PASSWORD_REQUIREMENTS = [
  `At least ${POLICY.minLength} characters`,
  "One uppercase letter (A-Z)",
  "One lowercase letter (a-z)",
  "One number (0-9)",
  "One special character (!@#$%^&*...)",
];
