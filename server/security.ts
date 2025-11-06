/**
 * Security utilities for input validation and sanitization
 */

/**
 * Sanitizes player name to prevent XSS attacks
 * Removes HTML tags and limits length
 */
export function sanitizePlayerName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  // Remove HTML tags and limit length
  let sanitized = name
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove remaining angle brackets
    .trim()
    .substring(0, 50); // Max 50 characters
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  return sanitized || 'Spiller';
}

/**
 * Validates room ID format
 */
export function validateRoomId(roomId: string): boolean {
  if (!roomId || typeof roomId !== 'string') {
    return false;
  }
  
  // Room ID should be 6 alphanumeric characters
  return /^[A-Z0-9]{6}$/.test(roomId.toUpperCase());
}

/**
 * Validates year input
 */
export function validateYear(year: number): boolean {
  if (typeof year !== 'number' || isNaN(year)) {
    return false;
  }
  
  // Year must be between 1900 and 2100
  return year >= 1900 && year <= 2100 && Number.isInteger(year);
}

/**
 * Rate limiting map to track requests per socket
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting configuration
 */
const RATE_LIMIT = {
  MAX_REQUESTS: 100, // Max requests per window
  WINDOW_MS: 60000, // 1 minute window
  MAX_PLAYERS_PER_ROOM: 50,
  MAX_ROOMS_PER_SOCKET: 5,
};

/**
 * Checks if socket has exceeded rate limit
 */
export function checkRateLimit(socketId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(socketId);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(socketId, {
      count: 1,
      resetTime: now + RATE_LIMIT.WINDOW_MS,
    });
    return true;
  }
  
  if (record.count >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Cleans up old rate limit records
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [socketId, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(socketId);
    }
  }
}

// Cleanup rate limits every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

export { RATE_LIMIT };

