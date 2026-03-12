'use strict';

/**
 * Toast notifications — ephemeral messages that appear at the bottom-right of
 * the screen and auto-dismiss after a configurable timeout.
 *
 * Two variants:
 *   showInfo(screen, message, theme)   — info color background, 3-second lifetime
 *   showError(screen, message, theme)  — error color background, 4-second lifetime
 *
 * Implementation details:
 *   - Each toast is a new blessed.box so multiple toasts can stack.
 *   - The box is created, rendered, then destroyed after the timeout.
 *   - A destroy guard prevents double-destroy if the screen closes first.
 *   - The theme parameter is optional; falls back to generic terminal colors.
 */

/**
 * Show a toast notification.
 *
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {string}  message       - Text to display
 * @param {'info'|'error'} type   - Visual style
 * @param {number}  [duration]    - Milliseconds before auto-dismiss (default: 3000)
 * @param {object}  [theme]       - Theme object from themes.js (optional)
 */
function showToast(screen, message, type, duration, theme) {
  var blessed = require('neo-blessed');

  var ms = duration || (type === 'error' ? 4000 : 3000);

  // Use theme colors if available, otherwise fall back to named terminal colors
  var bgHex, fgHex;
  if (theme) {
    bgHex = type === 'error' ? theme.colorError : theme.colorInfo;
    fgHex = '#ffffff';
  }
  var bgColor = bgHex || (type === 'error' ? 'red' : 'green');
  var fgColor = fgHex || 'white';

  // Truncate long messages so the box doesn't overflow
  var maxLen = Math.min(screen.width - 4, 60);
  var text = ' ' + String(message).slice(0, maxLen - 2) + ' ';

  var box = blessed.box({
    parent: screen,
    bottom: 1,           // sit just above the status bar
    right: 1,
    width: text.length + 2,
    height: 1,
    tags: false,
    content: text,
    style: {
      fg: fgColor,
      bg: bgColor,
      bold: true
    }
  });

  screen.render();

  var destroyed = false;

  function cleanup() {
    if (destroyed) return;
    destroyed = true;
    try {
      box.destroy();
      screen.render();
    } catch (_e) {
      // Screen may have been destroyed — safe to ignore
    }
  }

  setTimeout(cleanup, ms);
}

/**
 * Show an info toast.
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {string} message
 * @param {object} [theme]  - Theme object from themes.js (optional)
 */
function showInfo(screen, message, theme) {
  showToast(screen, message, 'info', undefined, theme);
}

/**
 * Show an error toast.
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {string} message
 * @param {object} [theme]  - Theme object from themes.js (optional)
 */
function showError(screen, message, theme) {
  showToast(screen, message, 'error', undefined, theme);
}

module.exports = { showInfo: showInfo, showError: showError, showToast: showToast };
