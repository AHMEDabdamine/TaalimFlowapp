/**
 * Request throttling utilities to prevent excessive API calls
 */

type ThrottleMap = Map<string, number>;

const requestThrottleMap: ThrottleMap = new Map();

/**
 * Throttle requests by key with a minimum delay between calls
 * @param key - Unique identifier for the request type
 * @param minDelay - Minimum delay in milliseconds between requests
 * @returns true if request should proceed, false if throttled
 */
export function shouldAllowRequest(key: string, minDelay: number = 1000): boolean {
  const now = Date.now();
  const lastRequest = requestThrottleMap.get(key);
  
  if (!lastRequest || (now - lastRequest) >= minDelay) {
    requestThrottleMap.set(key, now);
    return true;
  }
  
  console.warn(`Request throttled for key: ${key}, wait ${minDelay - (now - lastRequest)}ms`);
  return false;
}

/**
 * Clear throttle history for a specific key
 */
export function clearThrottle(key: string): void {
  requestThrottleMap.delete(key);
}

/**
 * Clear all throttle history
 */
export function clearAllThrottles(): void {
  requestThrottleMap.clear();
}

/**
 * Debounce function for form submissions
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}