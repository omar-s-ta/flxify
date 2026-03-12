'use strict';

/**
 * Status bar widget — height 1, anchored to bottom of screen.
 * Shows: mode indicator (NORMAL/INSERT/VISUAL), cursor position, theme name.
 *
 * Theme support:
 *   applyTheme(theme) updates fg/bg colors and re-renders.
 *   The mode label renders with the accent color as background for emphasis.
 */

/**
 * Create the status bar blessed box.
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} [initialState]
 * @param {string} [initialState.mode]      - Editor mode: NORMAL, INSERT, VISUAL
 * @param {number} [initialState.line]      - Cursor line (1-based)
 * @param {number} [initialState.col]       - Cursor column (1-based)
 * @param {string} [initialState.theme]     - Theme name for display
 * @param {object} [initialState.themeObj]  - Theme object from themes.js
 * @returns {{ box: object, setMode: function, setCursorPos: function, setTheme: function, applyTheme: function }}
 */
function createStatusBar(screen, initialState) {
  var blessed = require('neo-blessed');

  var state = {
    mode:     (initialState && initialState.mode)     || 'NORMAL',
    line:     (initialState && initialState.line)     || 1,
    col:      (initialState && initialState.col)      || 1,
    theme:    (initialState && initialState.theme)    || 'standard-dark',
    themeObj: (initialState && initialState.themeObj) || null,
    modified: false
  };

  var box = blessed.box({
    parent: screen,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    style: {
      fg: state.themeObj ? state.themeObj.textPrimary : 'white',
      bg: state.themeObj ? state.themeObj.bgStatusBar : 'blue'
    }
  });

  function render() {
    var t = state.themeObj;

    var modeText = ' ' + state.mode + ' ';
    var modifiedIndicator = state.modified ? ' [+]' : '';
    var cursorInfo = '  Ln ' + state.line + ', Col ' + state.col + modifiedIndicator;
    var themeInfo = state.theme + ' ';

    var width = screen.width;

    var modeLabel;
    if (t) {
      // Render mode with accent bg + dark text for emphasis
      modeLabel = '{' + t.textPrimary + '-fg}{' + t.accent + '-bg}' + modeText + '{/}';
    } else {
      modeLabel = modeText;
    }

    var left = modeLabel + cursorInfo;
    var right = themeInfo;

    // Calculate raw character length of left (without blessed tags)
    var leftRaw = modeText + cursorInfo;
    var padding = width - leftRaw.length - right.length;
    if (padding < 1) padding = 1;
    var spaces = new Array(padding + 1).join(' ');

    box.setContent(left + spaces + right);
    screen.render();
  }

  render();

  // Re-render on resize
  screen.on('resize', function () {
    render();
  });

  /**
   * Set the editor mode label (NORMAL, INSERT, VISUAL).
   * @param {string} mode
   */
  function setMode(mode) {
    state.mode = mode;
    render();
  }

  /**
   * Set cursor position display.
   * @param {number} line - 1-based line number
   * @param {number} col  - 1-based column number
   */
  function setCursorPos(line, col) {
    state.line = line;
    state.col = col;
    render();
  }

  /**
   * Set the theme name display string.
   * @param {string} name
   */
  function setTheme(name) {
    state.theme = name;
    render();
  }

  /**
   * Apply a new theme to the status bar. Updates colors and re-renders.
   * @param {object} newTheme  - Theme object from themes.js
   * @param {string} themeName - Theme key name (for display)
   */
  function applyTheme(newTheme, themeName) {
    state.themeObj = newTheme;
    if (themeName) state.theme = themeName;
    box.style.fg = newTheme.textPrimary;
    box.style.bg = newTheme.bgStatusBar;
    render();
  }

  /**
   * Set the modified indicator.
   * @param {boolean} modified - true shows [+], false hides it
   */
  function setModified(modified) {
    state.modified = !!modified;
    render();
  }

  return {
    box: box,
    setMode: setMode,
    setCursorPos: setCursorPos,
    setTheme: setTheme,
    applyTheme: applyTheme,
    setModified: setModified
  };
}

module.exports = { createStatusBar: createStatusBar };
