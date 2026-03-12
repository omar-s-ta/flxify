'use strict';

/**
 * Screen layout — creates the three main panels plus the editor and line-number gutter:
 *
 *   Row 0      : top bar       (height 1)
 *   Rows 1..N-2: [ gutter | editor ]  (fills middle)
 *   Row N-1    : status bar    (height 1)
 *
 * Returns all created components so app.js can wire up logic.
 */

var topBarModule = require('./top-bar.js');
var statusBarModule = require('./status-bar.js');
var lineNumbersModule = require('../editor/line-numbers.js');
var editorModule = require('../editor/editor.js');

/**
 * Build the full layout on the given blessed screen.
 *
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} [opts]
 * @param {string} [opts.theme]     - Initial theme name (display string for status bar)
 * @param {object} [opts.themeObj]  - Initial theme object from themes.js
 * @returns {{
 *   topBar:      object,
 *   lineNumbers: object,
 *   editor:      object,
 *   statusBar:   object
 * }}
 */
function createLayout(screen, opts) {
  var theme    = (opts && opts.theme)    || 'standard-dark';
  var themeObj = (opts && opts.themeObj) || null;

  // --- Top bar ---
  var topBar = topBarModule.createTopBar(screen, themeObj);

  // --- Line number gutter ---
  // Width is computed from total line count; starts at 4 for an empty buffer (1 line)
  var lineNumbers = lineNumbersModule.createLineNumbers(screen, { totalLines: 1 });
  var gutterWidth = lineNumbers.getWidth();

  // --- Editor ---
  var editor = editorModule.createEditor(screen, { gutterLeft: gutterWidth });

  // Apply initial theme colors to editor and gutter if a theme object was provided
  if (themeObj) {
    editor.applyTheme(themeObj);
    lineNumbers.applyTheme(themeObj);
  }

  // --- Status bar ---
  var statusBar = statusBarModule.createStatusBar(screen, {
    mode:     'NORMAL',
    line:     1,
    col:      1,
    theme:    theme,
    themeObj: themeObj
  });

  // --- Wire editor cursor → status bar ---
  editor.onCursorMove = function (line1, col1) {
    statusBar.setCursorPos(line1, col1);
    // Sync gutter on every cursor move (covers scroll changes too)
    lineNumbers.update(
      editor.getScrollTop(),
      editor.buffer.getCursor().line,
      editor.buffer.getLineCount()
    );
  };

  // --- Wire editor mode change → status bar ---
  editor.onModeChange = function (modeLabel) {
    statusBar.setMode(modeLabel);
  };

  // --- Initial gutter render ---
  lineNumbers.update(0, 0, 1);

  return {
    topBar: topBar,
    lineNumbers: lineNumbers,
    editor: editor,
    statusBar: statusBar
  };
}

module.exports = { createLayout: createLayout };
