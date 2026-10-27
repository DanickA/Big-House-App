interface AttemptData {
  count: number;
  resetAt: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutos

const attemptsMap = new Map<string, AttemptData>();

export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
} {
  const normalizedKey = key.toLowerCase().trim();
  const now = Date.now();
  const data = attemptsMap.get(normalizedKey);

  if (!data) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (now > data.resetAt) {
    attemptsMap.delete(normalizedKey);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  if (data.count >= MAX_ATTEMPTS) {
    const lockoutRemainingSeconds = Math.ceil((data.resetAt - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - data.count),
  };
}

export function recordFailedLoginAttempt(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutRemainingSeconds?: number;
} {
  const normalizedKey = key.toLowerCase().trim();
  const now = Date.now();
  const data = attemptsMap.get(normalizedKey);

  if (!data || now > data.resetAt) {
    attemptsMap.set(normalizedKey, {
      count: 1,
      resetAt: now + LOCKOUT_MS,
    });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  data.count += 1;
  data.resetAt = now + LOCKOUT_MS; // Extiende la ventana

  if (data.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutRemainingSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - data.count),
  };
}

export function clearLoginRateLimit(key: string): void {
  attemptsMap.delete(key.toLowerCase().trim());
}
