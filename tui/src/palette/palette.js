'use strict';

/**
 * Command palette widget — a blessed overlay triggered by Ctrl+B.
 *
 * Layout (centered, floating above the editor):
 *
 *   +-----------------------------------------------+
 *   |  > search query here_                          |
 *   +-----------------------------------------------+
 *   |  Format JSON                                   |
 *   |    Formats JSON with proper indentation        |
 *   |------------------------------------------------|
 *   |  Base64 Encode                                 |
 *   |    Encode text to Base64                       |
 *   +-----------------------------------------------+
 *
 * Key bindings while palette is open:
 *   Typing     — updates search query, re-filters list
 *   Up/Down    — navigate results
 *   Enter      — execute selected script
 *   Escape     — close without executing
 *   Ctrl+B/P   — close without executing (toggle)
 *
 * The palette renders at most MAX_VISIBLE items to keep the overlay small.
 * Each item renders the script name on one line and the description (dimmed)
 * on the next line.
 */

var fuzzySearch = require('./fuzzy-search.js');
var executor = require('../scripts/executor.js');

// Maximum number of visible result entries at a time
var MAX_VISIBLE = 8;
// Each script takes 2 lines (name + description)
var ITEM_HEIGHT = 2;

/**
 * Create the command palette.
 *
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} opts
 * @param {Array}    opts.scripts        - Loaded script objects
 * @param {function} opts.flxifyRequire  - @flxify/ require shim
 * @param {object}   opts.editor         - Editor API object (getText/setText/pause/resume)
 * @param {function} [opts.onResult]     - Called with result object after execution
 * @param {object}   [opts.theme]        - Initial theme object from themes.js
 * @returns {{ show: function, hide: function, isVisible: function, applyTheme: function }}
 */
function createPalette(screen, opts) {
  var blessed = require('neo-blessed');

  var scripts = opts.scripts || [];
  var flxifyRequire = opts.flxifyRequire;
  var editor = opts.editor;
  var onResult = opts.onResult || function () {};
  var currentTheme = opts.theme || null;

  var visible = false;
  var query = '';
  var filteredScripts = [];
  var selectedIndex = 0;
  var scrollOffset = 0;

  // ---------------------------------------------------------------------------
  // Overlay container
  // ---------------------------------------------------------------------------

  // Calculate dimensions
  function overlayWidth() {
    return Math.min(60, Math.floor(screen.width * 0.8));
  }

  function overlayHeight() {
    // Fixed height: search input (1) + divider (1) + MAX_VISIBLE items + border (2)
    // Always use MAX_VISIBLE so the box doesn't shrink/grow as results change
    return MAX_VISIBLE * ITEM_HEIGHT + 4;
  }

  function overlayLeft() {
    return Math.floor((screen.width - overlayWidth()) / 2);
  }

  function overlayTop() {
    return Math.floor(screen.height * 0.15);
  }

  // The outer container box
  var container = blessed.box({
    parent: screen,
    top: 2,
    left: 2,
    width: 60,
    height: 10,
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: currentTheme ? currentTheme.border : 'white' },
      fg: currentTheme ? currentTheme.paletteItemText : 'white',
      bg: currentTheme ? currentTheme.bgPalette : 'black'
    },
    hidden: true
  });

  // Search input line (top line of the container, inside the border)
  var searchBox = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    width: '100%-2',
    height: 1,
    tags: false,
    style: {
      fg: currentTheme ? currentTheme.paletteInputText : 'white',
      bg: currentTheme ? currentTheme.paletteInputBg : 'black'
    }
  });

  // Divider line below search input
  var divider = blessed.line({
    parent: container,
    top: 1,
    left: 0,
    orientation: 'horizontal',
    style: { fg: currentTheme ? currentTheme.border : 'white' }
  });

  // Results list area
  var resultsBox = blessed.box({
    parent: container,
    top: 2,
    left: 0,
    width: '100%-2',
    height: '100%-2',
    tags: true,
    style: {
      fg: currentTheme ? currentTheme.paletteItemText : 'white',
      bg: currentTheme ? currentTheme.bgPalette : 'black'
    }
  });

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  function renderSearch() {
    searchBox.setContent('> ' + query + '_');
  }

  /**
   * Re-filter scripts and re-render the results list.
   */
  function renderResults() {
    filteredScripts = fuzzySearch.searchScripts(scripts, query);
    // Clamp selectedIndex
    if (selectedIndex >= filteredScripts.length) {
      selectedIndex = Math.max(0, filteredScripts.length - 1);
    }

    var lines = [];
    var maxVisible = Math.min(MAX_VISIBLE, filteredScripts.length);

    // Scroll down if selected item is below visible window
    if (selectedIndex >= scrollOffset + maxVisible) {
      scrollOffset = selectedIndex - maxVisible + 1;
    }
    // Scroll up if selected item is above visible window
    if (selectedIndex < scrollOffset) {
      scrollOffset = selectedIndex;
    }
    // Clamp scrollOffset
    if (scrollOffset < 0) scrollOffset = 0;

    // Available text width: container width minus border (2) minus resultsBox inset (2)
    var textWidth = overlayWidth() - 4;

    for (var i = 0; i < maxVisible; i++) {
      var scriptIdx = scrollOffset + i;
      if (scriptIdx >= filteredScripts.length) break;
      var s = filteredScripts[scriptIdx];
      var isSelected = scriptIdx === selectedIndex;

      // Truncate text to prevent wrapping (which breaks the 2-line-per-item layout)
      var nameText = ' ' + s.name;
      var descText = '  ' + (s.description || '');
      if (nameText.length > textWidth) nameText = nameText.slice(0, textWidth);
      if (descText.length > textWidth) descText = descText.slice(0, textWidth);

      var nameLine;
      var descLine;

      if (isSelected) {
        if (currentTheme) {
          nameLine = '{' + currentTheme.paletteSelectedText + '-fg}{' + currentTheme.bgSelected + '-bg}' + escapeTags(nameText) + '{/}';
          descLine = '{' + currentTheme.paletteSelectedDesc + '-fg}{' + currentTheme.bgSelected + '-bg}' + escapeTags(descText) + '{/}';
        } else {
          nameLine = '{white-fg}{black-bg}' + escapeTags(nameText) + '{/}';
          descLine = '{white-fg}{black-bg}' + escapeTags(descText) + '{/}';
        }
      } else {
        if (currentTheme) {
          nameLine = '{' + currentTheme.paletteItemText + '-fg}' + escapeTags(nameText) + '{/}';
          descLine = '{' + currentTheme.paletteItemDesc + '-fg}' + escapeTags(descText) + '{/}';
        } else {
          nameLine = '{white-fg}' + escapeTags(nameText) + '{/}';
          descLine = '{gray-fg}' + escapeTags(descText) + '{/}';
        }
      }

      lines.push(nameLine);
      lines.push(descLine);
    }

    if (filteredScripts.length === 0) {
      var noResultsColor = currentTheme ? currentTheme.textMuted : 'gray';
      lines.push('{' + noResultsColor + '-fg} No results{/}');
    }

    resultsBox.setContent(lines.join('\n'));
  }

  function escapeTags(text) {
    return String(text).replace(/[{}]/g, function(ch) {
      return ch === '{' ? '{open}' : '{close}';
    });
  }

  function updateLayout() {
    var w = overlayWidth();
    var h = overlayHeight();
    var l = overlayLeft();
    var t = overlayTop();

    container.top = t;
    container.left = l;
    container.width = w;
    container.height = h;
  }

  function fullRender() {
    updateLayout();
    renderSearch();
    renderResults();
    screen.render();
  }

  // ---------------------------------------------------------------------------
  // Script execution
  // ---------------------------------------------------------------------------

  function executeSelected() {
    if (filteredScripts.length === 0) return;
    if (selectedIndex < 0 || selectedIndex >= filteredScripts.length) return;

    var script = filteredScripts[selectedIndex];

    // Get current buffer content + any active selection from the editor
    var fullText = editor.getText();
    var selectedText = getEditorSelection();

    var result = executor.executeScript(script, fullText, selectedText, flxifyRequire);

    // Pass result to the caller (app.js handles the actual buffer mutations)
    onResult(result);
  }

  /**
   * Get the currently selected text from the editor (if visual mode is active).
   * Returns null if no selection exists.
   * @returns {string|null}
   */
  function getEditorSelection() {
    try {
      var vim = editor.vim;
      if (vim && (vim.mode === 'visual' || vim.mode === 'visual-line')) {
        var buf = editor.buffer;
        var selRange = vim.selection.getRange(buf);
        if (selRange) {
          return extractRangeText(buf, selRange, vim.selection.isLine);
        }
      }
    } catch (_e) {
      // If anything goes wrong reading selection, fall back to null
    }
    return null;
  }

  /**
   * Extract text for a selection range from the buffer.
   * @param {object} buf
   * @param {{ startLine, startCol, endLine, endCol }} range
   * @param {boolean} isLine  - true for visual-line mode
   * @returns {string}
   */
  function extractRangeText(buf, range, isLine) {
    var lines = [];
    for (var i = range.startLine; i <= range.endLine; i++) {
      var lineText = buf.getLine(i);
      if (isLine) {
        lines.push(lineText);
      } else {
        var sc = (i === range.startLine) ? range.startCol : 0;
        var ec = (i === range.endLine)   ? range.endCol + 1 : lineText.length;
        lines.push(lineText.slice(sc, ec));
      }
    }
    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Keyboard handling (attached while palette is visible)
  // ---------------------------------------------------------------------------

  /**
   * Handle a keypress event while the palette is open.
   * Returns true if the key was consumed, false if it should propagate.
   */
  function handleKey(ch, key) {
    var full = key && key.full;

    if (full === 'escape' || full === 'C-b' || full === 'C-p') {
      hide();
      return;
    }

    if (full === 'enter' || full === 'return') {
      executeSelected();
      hide();
      return;
    }

    if (full === 'up' || (ch === 'k' && key && key.ctrl)) {
      selectedIndex = Math.max(0, selectedIndex - 1);
      fullRender();
      return;
    }

    if (full === 'down' || (ch === 'j' && key && key.ctrl)) {
      selectedIndex = Math.min(filteredScripts.length - 1, selectedIndex + 1);
      fullRender();
      return;
    }

    if (full === 'backspace') {
      query = query.slice(0, -1);
      selectedIndex = 0;
      fullRender();
      return;
    }

    // Printable character — append to query
    if (ch && !key.ctrl && !key.meta && ch.length === 1) {
      var code = ch.charCodeAt(0);
      if (code >= 32) {
        query += ch;
        selectedIndex = 0;
        fullRender();
      }
    }
  }

  // We attach key handling to the screen while visible
  var _keyHandler = null;

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  function show() {
    if (visible) return;
    visible = true;
    query = '';
    selectedIndex = 0;
    scrollOffset = 0;
    filteredScripts = fuzzySearch.searchScripts(scripts, '');

    container.show();
    fullRender();

    // Pause editor so its keypress handler ignores input
    editor.pause();

    // Attach our keypress handler to the screen
    _keyHandler = function (ch, key) {
      handleKey(ch, key);
    };
    screen.on('keypress', _keyHandler);
  }

  function hide() {
    if (!visible) return;
    visible = false;

    container.hide();
    screen.render();

    // Remove our keypress handler
    if (_keyHandler) {
      screen.removeListener('keypress', _keyHandler);
      _keyHandler = null;
    }

    // Resume editor
    editor.resume();
  }

  function isVisible() {
    return visible;
  }

  // Handle terminal resize while open
  screen.on('resize', function () {
    if (visible) {
      updateLayout();
      screen.render();
    }
  });

  /**
   * Apply a new theme to all palette widgets. Updates colors and re-renders
   * if the palette is currently visible.
   * @param {object} newTheme  - Theme object from themes.js
   */
  function applyTheme(newTheme) {
    currentTheme = newTheme;
    container.style.fg = newTheme.paletteItemText;
    container.style.bg = newTheme.bgPalette;
    container.style.border.fg = newTheme.border;
    searchBox.style.fg = newTheme.paletteInputText;
    searchBox.style.bg = newTheme.paletteInputBg;
    divider.style.fg = newTheme.border;
    resultsBox.style.fg = newTheme.paletteItemText;
    resultsBox.style.bg = newTheme.bgPalette;
    if (visible) {
      fullRender();
    }
  }

  return {
    show: show,
    hide: hide,
    isVisible: isVisible,
    applyTheme: applyTheme
  };
}

module.exports = { createPalette: createPalette };
