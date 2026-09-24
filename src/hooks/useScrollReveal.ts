import { useEffect } from 'react';

/**
 * Custom hook to activate smooth scroll-reveal animations across views.
 * Observes all elements matching `.scroll-reveal` and `.scroll-reveal-scale`.
 * Automatically triggers whenever dependencies (e.g. currentTab, view content) change.
 */
export function useScrollReveal(dependencies: any[] = []): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback: reveal immediately if IntersectionObserver is unsupported
      document.querySelectorAll('.scroll-reveal, .scroll-reveal-scale').forEach((el) => {
        el.classList.add('revealed');
      });
      return;
    }

    // Small delay to ensure DOM nodes are mounted
    const timeoutId = setTimeout(() => {
      const elements = document.querySelectorAll('.scroll-reveal:not(.revealed), .scroll-reveal-scale:not(.revealed)');
      if (elements.length === 0) return;

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
              obs.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: '0px 0px -40px 0px', // trigger slightly before it reaches the very bottom
          threshold: 0.08,
        }
      );

      elements.forEach((el) => observer.observe(el));

      return () => {
        observer.disconnect();
      };
    }, 50);

    return () => clearTimeout(timeoutId);
  }, dependencies);
}
