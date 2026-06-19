/**
 * Run fn once an LCP entry is available. With login prerender, LCP is usually
 * already in the buffer before React hydrates.
 */
export function afterLcp(fn) {
  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    fn();
  };

  if (typeof PerformanceObserver === 'undefined') {
    window.addEventListener('load', () => {
      const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1));
      idle(run, { timeout: 2000 });
    }, { once: true });
    return;
  }

  try {
    const observer = new PerformanceObserver(() => {
      run();
      observer.disconnect();
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(run, 3000);
  } catch {
    run();
  }
}
