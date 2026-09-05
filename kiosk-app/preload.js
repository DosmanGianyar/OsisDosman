// Preload script for Bilik Suara DOSMAN Kiosk
window.addEventListener('DOMContentLoaded', () => {
  // Disable right click context menu in DOM
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  // Disable common developer shortcut keys in DOM
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
      (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });
});
