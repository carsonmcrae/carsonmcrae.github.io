/**
 * Purpose: Close the header's Products menu the way people expect a menu to close.
 * Scope: Escape (returning focus to the menu button), a click outside it, and tabbing away from it.
 * Does NOT belong: Opening the menu (the native <details> element does that without this script), theme handling, or remote requests.
 */
document.querySelectorAll('.nav-menu').forEach(menu => {
  const summary = menu.querySelector('summary');
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    summary.focus();
  });
  // Only a focus move to another element closes it: a mouse click can blur without one.
  menu.addEventListener('focusout', event => {
    if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false;
  });
  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
});
