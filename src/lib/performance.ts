/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom metrics
 */

export interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  fcp?: number; // First Contentful Paint
  tti?: number; // Time to Interactive
}

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (!('web-vital' in window)) {
    // Use native Web Vitals API if available
    if ('PerformanceObserver' in window) {
      observeWebVitals();
    }
  }
};

/**
 * Observe Web Vitals using PerformanceObserver
 */
const observeWebVitals = () => {
  try {
    // Observe Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('[Performance] LCP:', lastEntry.renderTime || lastEntry.loadTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log('[Performance] FID:', entry.processingDuration);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observe Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let cls = 0;
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        });
        console.log('[Performance] CLS:', cls);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  } catch (error) {
    console.error('[Performance] Error observing Web Vitals:', error);
  }
};

/**
 * Get current performance metrics
 */
export const getPerformanceMetrics = (): PerformanceMetrics => {
  const metrics: PerformanceMetrics = {};

  if ('performance' in window) {
    const perfData = window.performance.timing;
    const perfNav = window.performance.navigation;

    // Time to First Byte
    metrics.ttfb = perfData.responseStart - perfData.fetchStart;

    // First Contentful Paint
    metrics.fcp = perfData.responseEnd - perfData.fetchStart;

    // Time to Interactive (approximation)
    metrics.tti = perfData.loadEventEnd - perfData.fetchStart;
  }

  return metrics;
};

/**
 * Log performance metrics to console
 */
export const logPerformanceMetrics = () => {
  const metrics = getPerformanceMetrics();
  console.table({
    'TTFB (ms)': metrics.ttfb?.toFixed(2),
    'FCP (ms)': metrics.fcp?.toFixed(2),
    'TTI (ms)': metrics.tti?.toFixed(2),
  });
};

/**
 * Measure function execution time
 */
export const measureExecutionTime = async <T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.error(`[Performance] ${name} failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Request Idle Callback polyfill
 */
export const requestIdleCallback = (callback: IdleRequestCallback, options?: IdleRequestOptions) => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }

  const start = Date.now();
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    } as IdleDeadline);
  }, 1);
};

/**
 * Cancel Idle Callback
 */
export const cancelIdleCallback = (id: number) => {
  if ('cancelIdleCallback' in window) {
    return window.cancelIdleCallback(id);
  }
  clearTimeout(id);
};
