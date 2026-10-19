/**
 * Purpose: Apply and remember the visitor's portfolio color theme before the page paints.
 * Scope: System preference, a keyboard-accessible dark-mode toggle, and same-origin persistence.
 * Does NOT belong: Analytics, product app settings, remote requests, or private data.
 */
(() => {
  const root = document.documentElement;
  const key = 'carson-portfolio-theme';
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  const valid = value => value === 'dark' || value === 'light';
  let preference = null;
  try {
    const saved = localStorage.getItem(key);
    if (valid(saved)) preference = saved;
  } catch {
    // A blocked store still permits changing the theme for this page visit.
  }
  function apply() {
    const dark = (preference || (system.matches ? 'dark' : 'light')) === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111b1b' : '#f8f8f5');
    const button = document.querySelector('[data-theme-toggle]');
    if (button) button.setAttribute('aria-pressed', String(dark));
  }
  apply();
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    button.hidden = false;
    button.addEventListener('click', () => {
      preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch { /* Visit-only fallback. */ }
      apply();
    });
    apply();
  }, { once: true });
  system.addEventListener('change', () => { if (!preference) apply(); });
  window.addEventListener('pageshow', () => {
    try {
      const saved = localStorage.getItem(key);
      preference = valid(saved) ? saved : null;
    } catch { /* Retain the visit's theme when storage is unavailable. */ }
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key === key || event.key === null) {
      preference = valid(event.newValue) ? event.newValue : null;
      apply();
    }
  });
})();
