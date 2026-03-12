'use strict';

/**
 * LineNumbers — a narrow blessed box displayed to the left of the editor.
 *
 * Responsibilities:
 *   - Render right-aligned line numbers for the visible viewport
 *   - Highlight the current cursor line (bold)
 *   - Stay in sync with the editor's scroll position
 *
 * Layout position:
 *   top:    1  (below top bar)
 *   left:   0
 *   width:  gutterWidth (computed from total line count, minimum 4)
 *   height: screen.height - 2
 *
 * Exposed API:
 *   update(scrollTop, cursorLine, totalLines)  — re-render after any change
 *   getWidth()                                 — current gutter width (chars)
 */

/**
 * Compute gutter width from the total line count.
 * Minimum 4 chars (covers up to 9999 lines), adds 1 for padding.
 * @param {number} totalLines
 * @returns {number}
 */
function computeGutterWidth(totalLines) {
  var digits = String(totalLines).length;
  // Minimum 3 digits + 1 space separator = 4; grow as needed
  return Math.max(4, digits + 1);
}

/**
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} opts
 * @param {number} opts.totalLines   - Initial total line count
 * @returns {{ box: object, update: function, getWidth: function }}
 */
function createLineNumbers(screen, opts) {
  var blessed = require('neo-blessed');

  var totalLines = (opts && opts.totalLines) || 1;
  var gutterWidth = computeGutterWidth(totalLines);
  var activeColor = '#ffffff'; // bright white default, updated by applyTheme

  var box = blessed.box({
    parent: screen,
    top: 1,
    left: 0,
    width: gutterWidth,
    height: screen.height - 2,
    tags: true,
    style: {
      fg: 'grey',
      bg: 'black'
    }
  });

  // Keep height in sync with terminal resize
  screen.on('resize', function () {
    box.height = screen.height - 2;
    // Width may need to be recalculated externally if total lines change
    screen.render();
  });

  /**
   * Re-render the gutter based on current viewport state.
   * @param {number} scrollTop    - First visible line index (0-based)
   * @param {number} cursorLine   - Current cursor line index (0-based)
   * @param {number} newTotal     - Current total line count
   */
  function update(scrollTop, cursorLine, newTotal) {
    totalLines = newTotal;
    var newWidth = computeGutterWidth(totalLines);

    // Resize the box if gutter width needs to change
    if (newWidth !== gutterWidth) {
      gutterWidth = newWidth;
      box.width = gutterWidth;
    }

    var viewportHeight = screen.height - 2;
    var lines = [];

    for (var i = 0; i < viewportHeight; i++) {
      var lineIdx = scrollTop + i;
      if (lineIdx >= totalLines) {
        // Past end of document — show tilde for empty rows (Vim style)
        lines.push('~');
      } else {
        var numStr = String(lineIdx + 1); // 1-based display
        // Right-align within (gutterWidth - 1) chars, then add space separator
        var padded = numStr;
        var targetLen = gutterWidth - 1; // leave 1 char for separator space
        while (padded.length < targetLen) {
          padded = ' ' + padded;
        }
        // Active line: bright color + bold for clear visibility
        if (lineIdx === cursorLine) {
          lines.push('{bold}{' + activeColor + '-fg}' + padded + '{/}{/bold} ');
        } else {
          lines.push(padded + ' ');
        }
      }
    }

    box.setContent(lines.join('\n'));
  }

  /** @returns {number} Current gutter width in columns */
  function getWidth() {
    return gutterWidth;
  }

  /**
   * Apply a new theme to the gutter box. Updates fg/bg and re-renders.
   * @param {object} theme  - Theme object from themes.js
   */
  function applyTheme(theme) {
    box.style.fg = theme.gutterText;
    box.style.bg = theme.bgEditor;
    activeColor = theme.gutterActiveText || '#ffffff';
    screen.render();
  }

  return {
    box: box,
    update: update,
    getWidth: getWidth,
    applyTheme: applyTheme
  };
}

module.exports = { createLineNumbers: createLineNumbers };
