/**
 * Simple throttle function that ensures a function is called at most once
 * per specified wait time. Useful for UI events like sliders.
 * Implements both leading and trailing edges.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;

  const later = () => {
    lastCallTime = Date.now();
    timeout = null;
    if (lastArgs) {
      func(...lastArgs);
      lastArgs = null;
    }
  };

  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCallTime = now;
      func(...args);
    } else {
      lastArgs = args;
      if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
    }
  };
}
