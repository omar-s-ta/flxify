'use strict';

/**
 * Flxify TUI — Main application bootstrap.
 *
 * Creates the blessed screen, sets up the three-panel layout with the editor
 * and line-number gutter, loads all 111 scripts, wires the command palette,
 * and binds global keys (Ctrl+B/P for palette, Ctrl+T for theme cycle,
 * Ctrl+Q/C to quit, Ctrl+S to save).
 *
 * Theme priority (highest to lowest):
 *   1. --theme CLI argument
 *   2. Saved config (~/.config/flxify/config.json)
 *   3. Default: 'standard-dark'
 *
 * @param {object} options             - Parsed CLI options from bin/flxify.js
 * @param {string|null} options.theme  - Theme name (or null for default)
 * @param {string|null} options.file   - File path to open (or null)
 */
function launch(options) {
  var blessed = require('neo-blessed');
  var fs = require('fs');
  var path = require('path');
  var layout = require('./ui/layout.js');
  var toast = require('./ui/toast.js');
  var scriptLoader = require('./scripts/script-loader.js');
  var requireShim = require('./scripts/require-shim.js');
  var paletteModule = require('./palette/palette.js');
  var themeEngine = require('./themes/theme-engine.js');
  var config = require('./config/config.js');

  var file = options.file || null;

  // ---------------------------------------------------------------------------
  // Resolve the initial theme.
  //
  // Priority: --theme CLI arg > saved config > 'standard-dark'
  // ---------------------------------------------------------------------------
  var initialThemeName;
  if (options.theme && themeEngine.getThemeKeys().indexOf(options.theme) !== -1) {
    initialThemeName = options.theme;
  } else if (options.theme) {
    // Unknown theme name provided via CLI — warn and fall back to config/default
    process.stderr.write(
      'Warning: Unknown theme "' + options.theme + '". ' +
      'Valid themes: ' + themeEngine.getThemeKeys().join(', ') + '\n'
    );
    initialThemeName = config.getTheme();
  } else {
    initialThemeName = config.getTheme();
  }

  // Apply initial theme to the engine so all subsequent calls use the right theme
  themeEngine.setTheme(initialThemeName);

  // ---------------------------------------------------------------------------
  // Locate the scripts directory.
  //
  // Development mode: tui/src/app.js -> ../../scripts/ (project root scripts/)
  // npm package:      scripts/ is bundled at the same level as src/ (tui/scripts/)
  // ---------------------------------------------------------------------------
  var scriptsDir = (function () {
    // Prefer the project-root scripts/ directory (development + monorepo)
    var devPath = path.resolve(__dirname, '..', '..', 'scripts');
    if (fs.existsSync(devPath)) return devPath;

    // Fallback: scripts/ bundled inside the tui/ package itself
    var pkgPath = path.resolve(__dirname, '..', 'scripts');
    if (fs.existsSync(pkgPath)) return pkgPath;

    // Last resort: same directory as src/ (for unusual install layouts)
    return path.resolve(__dirname, 'scripts');
  }());

  var libDir = path.join(scriptsDir, 'lib');

  // ---------------------------------------------------------------------------
  // Load scripts + create require shim
  // ---------------------------------------------------------------------------
  var scripts = scriptLoader.loadScripts(scriptsDir);
  var flxifyRequire = requireShim.createRequire(libDir);

  // --- Create the blessed screen ---
  // Suppress neo-blessed terminfo warnings (Setulc parser bug on xterm-256color).
  // The warning is non-fatal — underline color is not used by Flxify.
  var _origStderrWrite = process.stderr.write;
  process.stderr.write = function (chunk) {
    if (typeof chunk === 'string' && chunk.indexOf('Setulc') !== -1) return true;
    return _origStderrWrite.apply(process.stderr, arguments);
  };

  var screen = blessed.screen({
    smartCSR: true,
    fullUnicode: true,
    title: 'Flxify'
  });

  // Restore stderr after screen init (terminfo is parsed during construction)
  process.stderr.write = _origStderrWrite;

  // ---------------------------------------------------------------------------
  // Crash recovery — restore terminal even if the app throws.
  // ---------------------------------------------------------------------------

  // Wrapper that suppresses the Setulc terminfo error during screen.destroy(),
  // which fires the same neo-blessed warning as during construction.
  function safeDestroyScreen() {
    var _origWrite = process.stderr.write;
    process.stderr.write = function (chunk) {
      if (typeof chunk === 'string' && chunk.indexOf('Setulc') !== -1) return true;
      return _origWrite.apply(process.stderr, arguments);
    };
    try {
      screen.destroy();
    } catch (_e) {}
    process.stderr.write = _origWrite;
  }

  process.on('uncaughtException', function (err) {
    safeDestroyScreen();
    process.stderr.write('Flxify crashed: ' + (err && err.message ? err.message : String(err)) + '\n');
    process.exit(1);
  });

  process.on('unhandledRejection', function (err) {
    safeDestroyScreen();
    process.stderr.write('Flxify crashed: ' + String(err) + '\n');
    process.exit(1);
  });

  // --- Build the layout (top bar + gutter + editor + status bar) ---
  var panels = layout.createLayout(screen, {
    theme: initialThemeName,
    themeObj: themeEngine.getCurrentTheme()
  });

  // Convenience aliases
  var editor = panels.editor;
  var statusBar = panels.statusBar;

  // ---------------------------------------------------------------------------
  // Modified indicator — track whether the buffer has unsaved changes.
  // ---------------------------------------------------------------------------
  var modified = false;

  /**
   * Mark the buffer as modified and update the status bar indicator.
   */
  function markModified() {
    if (!modified) {
      modified = true;
      statusBar.setModified(true);
    }
  }

  /**
   * Clear the modified flag (e.g., after a successful save).
   */
  function clearModified() {
    modified = false;
    statusBar.setModified(false);
  }

  // Wire the editor's onModified callback
  editor.onModified = markModified;

  // --- Load file if provided ---
  if (file) {
    try {
      var fileContent = fs.readFileSync(path.resolve(file), 'utf8');
      editor.setText(fileContent);
      // Loading a file is not a modification — buffer starts clean
      clearModified();
    } catch (err) {
      editor.setText(
        'Error: Could not open file: ' + file + '\n\n' + err.message
      );
      clearModified();
    }
  }

  // ---------------------------------------------------------------------------
  // File save — Ctrl+S
  // ---------------------------------------------------------------------------

  /**
   * Resolve the save path:
   *   1. If a file was opened via CLI, save back to that path.
   *   2. Otherwise, save to ~/.config/flxify/buffer.txt.
   * @returns {string} Absolute save path
   */
  function resolveSavePath() {
    if (file) {
      return path.resolve(file);
    }
    var configDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '.',
      '.config', 'flxify'
    );
    return path.join(configDir, 'buffer.txt');
  }

  /**
   * Save the editor content to disk.
   * Shows a success or error toast.
   */
  function saveFile() {
    var savePath = resolveSavePath();
    try {
      // Ensure the directory exists (important for the buffer.txt fallback)
      var saveDir = path.dirname(savePath);
      if (!fs.existsSync(saveDir)) {
        fs.mkdirSync(saveDir, { recursive: true });
      }
      fs.writeFileSync(savePath, editor.getText(), 'utf8');
      clearModified();
      var displayName = file ? path.basename(savePath) : 'buffer.txt';
      toast.showInfo(screen, 'Saved to ' + displayName, themeEngine.getCurrentTheme());
    } catch (err) {
      toast.showError(screen, 'Error saving: ' + err.message, themeEngine.getCurrentTheme());
    }
  }

  // ---------------------------------------------------------------------------
  // Quit confirmation — when buffer is modified, prompt before exit.
  // ---------------------------------------------------------------------------

  /** True while we are waiting for a y/n quit confirmation keypress. */
  var awaitingQuitConfirm = false;

  /**
   * Create a one-line confirmation bar at the bottom (above the status bar).
   * Returns a dismiss function.
   */
  var confirmBox = null;

  function showQuitConfirm() {
    if (confirmBox) return; // already showing

    var t = themeEngine.getCurrentTheme();
    confirmBox = blessed.box({
      parent: screen,
      bottom: 1,
      left: 0,
      width: '100%',
      height: 1,
      tags: true,
      content: '{bold}Unsaved changes. Quit anyway? (y/n){/bold}',
      style: {
        fg: t ? t.textPrimary : 'white',
        bg: t ? t.colorError  : 'red'
      }
    });
    awaitingQuitConfirm = true;
    editor.pause();
    screen.render();
  }

  function hideQuitConfirm() {
    if (confirmBox) {
      confirmBox.detach();
      confirmBox = null;
    }
    awaitingQuitConfirm = false;
    editor.resume();
    screen.render();
  }

  /**
   * Handle a quit attempt.  If the buffer is clean, exit immediately.
   * Otherwise show the confirmation prompt.
   */
  function attemptQuit() {
    if (!modified) {
      saveBufferOnExit();
      safeDestroyScreen();
      process.exit(0);
    }
    // Buffer is dirty — ask the user
    showQuitConfirm();
  }

  // ---------------------------------------------------------------------------
  // Search bar widget — shown at the bottom when / is pressed in Normal mode.
  // ---------------------------------------------------------------------------
  var searchBox = null;

  function showSearchBar(query) {
    var t = themeEngine.getCurrentTheme();
    if (!searchBox) {
      searchBox = blessed.box({
        parent: screen,
        bottom: 1,
        left: 0,
        width: '100%',
        height: 1,
        tags: true,
        style: {
          fg: t ? t.textPrimary    : 'white',
          bg: t ? t.paletteInputBg : 'black'
        }
      });
    }
    searchBox.setContent('/' + (query || ''));
    screen.render();
  }

  function hideSearchBar() {
    if (searchBox) {
      searchBox.detach();
      searchBox = null;
    }
    screen.render();
  }

  // Wire vim search callbacks
  editor.vim.onSearchOpen = function () {
    showSearchBar('');
  };
  editor.vim.onSearchClose = function () {
    hideSearchBar();
  };
  editor.vim.onSearchUpdate = function (query) {
    showSearchBar(query);
  };

  // ---------------------------------------------------------------------------
  // Command palette
  // ---------------------------------------------------------------------------

  /**
   * Apply a script execution result to the editor buffer.
   * Called by the palette after the user selects and runs a script.
   *
   * @param {object} result  - From executor.executeScript()
   */
  function applyResult(result) {
    if (!result) return;

    // Fatal execution error (exception in script)
    if (result.error) {
      toast.showError(screen, result.error, themeEngine.getCurrentTheme());
      return;
    }

    // Apply text change
    var action = result.action;

    if (action === 'replaceAll') {
      editor.setText(result.text);
      markModified();
    } else if (action === 'replaceSelection') {
      // Replace the current visual selection in the buffer
      applyReplaceSelection(result.text);
      markModified();
    } else if (action === 'insert') {
      // Insert at current cursor position
      applyInsert(result.text);
      markModified();
    }
    // 'none' — no text change, just show messages below

    // Show info/error toasts
    var i;
    var activeTheme = themeEngine.getCurrentTheme();
    for (i = 0; i < (result.errors || []).length; i++) {
      toast.showError(screen, result.errors[i], activeTheme);
    }
    for (i = 0; i < (result.infos || []).length; i++) {
      toast.showInfo(screen, result.infos[i], activeTheme);
    }
  }

  /**
   * Replace the currently selected text in the editor buffer.
   * If no selection is active, fall back to replaceAll.
   * @param {string} text
   */
  function applyReplaceSelection(text) {
    try {
      var vim = editor.vim;
      var buf = editor.buffer;

      if (vim && (vim.mode === 'visual' || vim.mode === 'visual-line')) {
        var selRange = vim.selection.getRange(buf);
        if (selRange) {
          buf.deleteRange(
            selRange.startLine, selRange.startCol,
            selRange.endLine,
            vim.selection.isLine ? buf.getLine(selRange.endLine).length : selRange.endCol + 1
          );
          // Insert the replacement text at the cursor (now at start of deleted range)
          var replLines = text.split('\n');
          if (replLines.length === 1) {
            buf.insertChar(text);
          } else {
            // Multi-line replacement: insert char by char + newlines
            for (var ri = 0; ri < replLines.length; ri++) {
              if (ri > 0) buf.newLine();
              var lineText = replLines[ri];
              for (var ci = 0; ci < lineText.length; ci++) {
                buf.insertChar(lineText[ci]);
              }
            }
          }
          // Exit visual mode
          vim.setMode('normal');
          editor.render();
          return;
        }
      }
    } catch (_e) {
      // Fall through to replaceAll
    }

    // Fallback: replace entire buffer
    editor.setText(text);
  }

  /**
   * Insert text at the current cursor position.
   * @param {string} text
   */
  function applyInsert(text) {
    try {
      var buf = editor.buffer;
      var lines = text.split('\n');

      if (lines.length === 1) {
        // Single-line insert: use buffer.insertChar() for each character
        for (var ci = 0; ci < text.length; ci++) {
          buf.insertChar(text[ci]);
        }
      } else {
        // Multi-line insert
        for (var li = 0; li < lines.length; li++) {
          if (li > 0) buf.newLine();
          var lineText = lines[li];
          for (var ci2 = 0; ci2 < lineText.length; ci2++) {
            buf.insertChar(lineText[ci2]);
          }
        }
      }
      editor.render();
    } catch (_e) {
      // Fallback: append to buffer text
      editor.setText(editor.getText() + text);
    }
  }

  var palette = paletteModule.createPalette(screen, {
    scripts: scripts,
    flxifyRequire: flxifyRequire,
    editor: editor,
    onResult: applyResult,
    theme: themeEngine.getCurrentTheme()
  });

  // ---------------------------------------------------------------------------
  // Theme switching — applyTheme propagates to all widgets
  // ---------------------------------------------------------------------------

  /**
   * Apply the current themeEngine theme to every widget.
   * Called on startup and whenever Ctrl+T cycles the theme.
   */
  function applyTheme() {
    var t = themeEngine.getCurrentTheme();
    var name = themeEngine.getCurrentThemeName();

    // Update all panels
    panels.topBar.applyTheme(t);
    panels.editor.applyTheme(t);
    panels.lineNumbers.applyTheme(t);
    panels.statusBar.applyTheme(t, themeEngine.getDisplayName(name));
    palette.applyTheme(t);

    screen.render();
  }

  // Apply theme to all widgets on startup (the layout already received themeObj,
  // but palette is constructed after layout, so this ensures full consistency)
  applyTheme();

  // ---------------------------------------------------------------------------
  // Optional: save buffer to ~/.config/flxify/buffer.txt on exit (silent).
  // This is distinct from the user-initiated Ctrl+S save.
  // ---------------------------------------------------------------------------
  function saveBufferOnExit() {
    try {
      var configDir = path.join(
        process.env.HOME || process.env.USERPROFILE || '.',
        '.config', 'flxify'
      );
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      var bufPath = path.join(configDir, 'buffer.txt');
      fs.writeFileSync(bufPath, editor.getText(), 'utf8');
    } catch (_e) {
      // Non-fatal
    }
  }

  // ---------------------------------------------------------------------------
  // Global key bindings
  // ---------------------------------------------------------------------------

  // Intercept quit-confirmation keypress before all other keys
  screen.on('keypress', function (ch, key) {
    if (!awaitingQuitConfirm) return;

    var full = key && key.full;
    if (ch === 'y' || ch === 'Y') {
      hideQuitConfirm();
      saveBufferOnExit();
      safeDestroyScreen();
      process.exit(0);
    } else if (ch === 'n' || ch === 'N' || full === 'escape') {
      hideQuitConfirm();
    }
    // Prevent other handlers from firing during confirmation
  });

  // Save — Ctrl+S
  screen.key(['C-s'], function () {
    if (palette.isVisible()) return;
    if (awaitingQuitConfirm) return;
    saveFile();
  });

  // Quit on Ctrl+Q — check for unsaved changes
  screen.key(['C-q'], function () {
    if (palette.isVisible()) {
      palette.hide();
      return;
    }
    if (awaitingQuitConfirm) return;
    attemptQuit();
  });

  // Ctrl+C — behaviour depends on editor mode:
  //   - Normal mode:  quit (with unsaved-changes check)
  //   - Insert mode:  return to Normal (handled in editor.js keypress)
  //   - Visual mode:  exit visual to Normal (handled in vim.js)
  //   - Palette open: close palette
  //   - Confirm open: cancel confirmation
  screen.key(['C-c'], function () {
    if (palette.isVisible()) {
      palette.hide();
      return;
    }
    if (awaitingQuitConfirm) {
      hideQuitConfirm();
      return;
    }
    // In Normal mode, Ctrl+C quits (like Ctrl+Q)
    var vim = editor.vim;
    if (vim.mode === 'normal') {
      attemptQuit();
    }
    // Insert/Visual: handled in editor.js; the screen.key handler fires after
    // keypress, so the mode transition has already happened. No further action needed here.
  });

  // Command Palette — Ctrl+B (primary, matches web app)
  screen.key(['C-b'], function () {
    if (awaitingQuitConfirm) return;
    if (palette.isVisible()) {
      palette.hide();
    } else {
      palette.show();
    }
  });

  // Command Palette — Ctrl+P (secondary, VS Code convention)
  screen.key(['C-p'], function () {
    if (awaitingQuitConfirm) return;
    if (palette.isVisible()) {
      palette.hide();
    } else {
      palette.show();
    }
  });

  // Theme Cycle — Ctrl+T
  screen.key(['C-t'], function () {
    if (palette.isVisible()) return;
    if (awaitingQuitConfirm) return;

    var newThemeName = themeEngine.cycleTheme();
    // Persist the new theme preference
    config.setTheme(newThemeName);
    // Apply to all widgets
    applyTheme();
    // Show a brief toast confirming the theme change
    toast.showInfo(screen, 'Theme: ' + themeEngine.getDisplayName(newThemeName), themeEngine.getCurrentTheme());
  });

  // --- Handle terminal resize ---
  screen.on('resize', function () {
    screen.render();
  });

  // --- Initial render ---
  screen.render();
}

module.exports = launch;
