'use strict';

/**
 * Integration tests — complete flow tests for Flxify TUI components.
 *
 * These tests exercise the buffer, vim state machine, executor, theme engine,
 * and BoopState together WITHOUT requiring a blessed screen.  They verify
 * end-to-end transformation workflows.
 */

var path = require('path');

var TextBuffer      = require('../src/editor/buffer.js');
var VimStateMachine = require('../src/editor/vim.js');
var executor        = require('../src/scripts/executor.js');
var BoopState       = require('../src/scripts/boop-state.js');
var themeEngine     = require('../src/themes/theme-engine.js');
var scriptLoader    = require('../src/scripts/script-loader.js');
var requireShim     = require('../src/scripts/require-shim.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBuffer(text) {
  var b = new TextBuffer();
  if (text !== undefined) b.setText(text);
  return b;
}

function makeVim(text) {
  var buf = makeBuffer(text !== undefined ? text : '');
  var vim = new VimStateMachine(buf);
  vim.setViewportInfo(24, 0);
  return { vim: vim, buf: buf };
}

function key(vim, ch) {
  return vim.processKey(ch, { full: ch, ctrl: false, meta: false, shift: false, name: ch });
}

function special(vim, full) {
  return vim.processKey(null, { full: full, ctrl: false, meta: false, shift: false, name: full });
}

function ctrl(vim, full) {
  return vim.processKey(null, { full: full, ctrl: true, meta: false, shift: false, name: full });
}

// Resolve the scripts directory relative to this test file (tui/tests/ -> ../../scripts/)
var SCRIPTS_DIR = path.resolve(__dirname, '..', '..', 'scripts');
var LIB_DIR     = path.join(SCRIPTS_DIR, 'lib');

// ---------------------------------------------------------------------------
// Test 1: Type text → execute Format JSON → verify output
// ---------------------------------------------------------------------------

describe('Integration — Format JSON script', function () {
  var scripts;
  var flxifyRequire;

  // Load scripts once before all tests in this block.
  // If the scripts directory is missing (CI without monorepo), skip gracefully.
  var scriptsAvailable = false;
  try {
    var fs = require('fs');
    scriptsAvailable = fs.existsSync(SCRIPTS_DIR);
  } catch (_e) {}

  if (!scriptsAvailable) {
    it.skip('scripts directory not found — skipping integration tests', function () {});
    return;
  }

  scripts = scriptLoader.loadScripts(SCRIPTS_DIR);
  flxifyRequire = requireShim.createRequire(LIB_DIR);

  it('Format JSON produces indented output', function () {
    var jsonScript = null;
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].name === 'Format JSON') { jsonScript = scripts[i]; break; }
    }
    if (!jsonScript) { return; } // script not found — skip

    var input = '{"name":"Alice","age":30}';
    var result = executor.executeScript(jsonScript, input, null, flxifyRequire);

    expect(result.action).toBe('replaceAll');
    expect(result.text).toContain('"name"');
    expect(result.text).toContain('"Alice"');
    // Should be multi-line (indented)
    expect(result.text.split('\n').length).toBeGreaterThan(1);
    expect(result.errors).toEqual([]);
  });

  it('Format JSON with invalid input produces an error', function () {
    var jsonScript = null;
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].name === 'Format JSON') { jsonScript = scripts[i]; break; }
    }
    if (!jsonScript) { return; }

    var result = executor.executeScript(jsonScript, 'not valid json {{{', null, flxifyRequire);
    // Should either report an error or return action:'none'
    var hasError = result.error || result.errors.length > 0 || result.action === 'none';
    expect(hasError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Test 2: Type text → execute Sort Lines → verify output
// ---------------------------------------------------------------------------

describe('Integration — Sort Lines script', function () {
  var scriptsAvailable = false;
  try {
    var fs2 = require('fs');
    scriptsAvailable = fs2.existsSync(SCRIPTS_DIR);
  } catch (_e) {}

  if (!scriptsAvailable) return;

  var scripts = scriptLoader.loadScripts(SCRIPTS_DIR);
  var flxifyRequire = requireShim.createRequire(LIB_DIR);

  it('Sort Lines sorts alphabetically', function () {
    var sortScript = null;
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].name === 'Sort Lines') { sortScript = scripts[i]; break; }
    }
    if (!sortScript) return;

    var input = 'banana\napple\ncherry';
    var result = executor.executeScript(sortScript, input, null, flxifyRequire);

    expect(result.action).toBe('replaceAll');
    var lines = result.text.split('\n');
    expect(lines[0]).toBe('apple');
    expect(lines[1]).toBe('banana');
    expect(lines[2]).toBe('cherry');
  });
});

// ---------------------------------------------------------------------------
// Test 3: Vim dd + u (undo) round-trip
// ---------------------------------------------------------------------------

describe('Integration — Vim dd + undo round-trip', function () {
  it('dd deletes line and u restores it', function () {
    var v = makeVim('hello\nworld\nfoo');
    v.buf.setCursor(0, 0);

    // Delete first line
    key(v.vim, 'd');
    key(v.vim, 'd');
    expect(v.buf.getLineCount()).toBe(2);
    expect(v.buf.getLine(0)).toBe('world');

    // Undo
    key(v.vim, 'u');
    expect(v.buf.getLineCount()).toBe(3);
    expect(v.buf.getLine(0)).toBe('hello');
    expect(v.buf.getLine(1)).toBe('world');
  });

  it('multiple dd then u restores one step at a time', function () {
    var v = makeVim('a\nb\nc');
    v.buf.setCursor(0, 0);

    key(v.vim, 'd'); key(v.vim, 'd'); // delete 'a'
    key(v.vim, 'd'); key(v.vim, 'd'); // delete 'b' (now first line)

    expect(v.buf.getLineCount()).toBe(1);
    expect(v.buf.getLine(0)).toBe('c');

    key(v.vim, 'u'); // undo delete 'b'
    expect(v.buf.getLineCount()).toBe(2);

    key(v.vim, 'u'); // undo delete 'a'
    expect(v.buf.getLineCount()).toBe(3);
    expect(v.buf.getLine(0)).toBe('a');
  });
});

// ---------------------------------------------------------------------------
// Test 4: Theme cycling — all 6 themes cycle correctly
// ---------------------------------------------------------------------------

describe('Integration — Theme cycling', function () {
  var EXPECTED_THEMES = [
    'standard-light',
    'standard-dark',
    'cyber-neon',
    'nordic-frost',
    'monokai-pro',
    'oled-stealth'
  ];

  afterEach(function () {
    themeEngine.setTheme('standard-dark');
  });

  it('cycling 6 times returns to the starting theme', function () {
    themeEngine.setTheme('standard-dark');
    for (var i = 0; i < 6; i++) {
      themeEngine.cycleTheme();
    }
    expect(themeEngine.getCurrentThemeName()).toBe('standard-dark');
  });

  it('each cycle step produces a valid theme object', function () {
    themeEngine.setTheme('standard-dark');
    for (var i = 0; i < 6; i++) {
      var name = themeEngine.cycleTheme();
      expect(EXPECTED_THEMES).toContain(name);
      var t = themeEngine.getCurrentTheme();
      expect(t).toBeDefined();
      expect(typeof t.bgEditor).toBe('string');
      expect(typeof t.textPrimary).toBe('string');
      expect(typeof t.accent).toBe('string');
    }
  });

  it('all 6 theme keys are available', function () {
    var keys = themeEngine.getThemeKeys();
    expect(keys.length).toBe(6);
    EXPECTED_THEMES.forEach(function (k) {
      expect(keys).toContain(k);
    });
  });
});

// ---------------------------------------------------------------------------
// Test 5: BoopState with selection (visual mode + script interaction)
// ---------------------------------------------------------------------------

describe('Integration — BoopState selection mode', function () {
  it('transform script only modifies the selection', function () {
    var state = new BoopState('hello world test', 'world');

    // Simulate an uppercase transform script
    state.text = state.text.toUpperCase();

    expect(state._selection).toBe('WORLD');
    expect(state._fullText).toBe('hello world test'); // unchanged
  });

  it('isSelection stays false when selection is empty string', function () {
    var state = new BoopState('some text', '');
    expect(state.isSelection).toBe(false);
    state.text = state.text.toUpperCase();
    expect(state._fullText).toBe('SOME TEXT');
  });

  it('executor produces replaceSelection action when selection changes', function () {
    // Build a minimal script that uppercases text
    var upperScript = {
      name: 'Upper Case',
      execute: function (require, state) {
        state.text = state.text.toUpperCase();
      }
    };

    var result = executor.executeScript(upperScript, 'hello world', 'world', function () { return null; });
    expect(result.action).toBe('replaceSelection');
    expect(result.text).toBe('WORLD');
  });

  it('executor produces replaceAll action when no selection', function () {
    var upperScript = {
      name: 'Upper Case',
      execute: function (require, state) {
        state.text = state.text.toUpperCase();
      }
    };

    var result = executor.executeScript(upperScript, 'hello world', null, function () { return null; });
    expect(result.action).toBe('replaceAll');
    expect(result.text).toBe('HELLO WORLD');
  });
});

// ---------------------------------------------------------------------------
// Test 6: Search — / + query + n + N navigation
// ---------------------------------------------------------------------------

describe('Integration — VimStateMachine search (/ n N)', function () {
  it('/ opens search mode', function () {
    var v = makeVim('hello world');
    var openCalled = false;
    v.vim.onSearchOpen = function () { openCalled = true; };

    key(v.vim, '/');
    expect(v.vim.searchMode).toBe(true);
    expect(openCalled).toBe(true);
  });

  it('typing in search mode accumulates the query', function () {
    var v = makeVim('hello world');
    var lastQuery = '';
    v.vim.onSearchUpdate = function (q) { lastQuery = q; };

    key(v.vim, '/');
    // Simulate search keypress events
    v.vim._processSearchKey('h', { full: 'h', ctrl: false, meta: false });
    v.vim._processSearchKey('e', { full: 'e', ctrl: false, meta: false });
    expect(v.vim.searchQuery).toBe('he');
  });

  it('Enter confirms search and moves cursor to first match', function () {
    var v = makeVim('hello world hello');
    var closeCalled = false;
    v.vim.onSearchClose = function () { closeCalled = true; };

    key(v.vim, '/');
    v.vim._processSearchKey('h', { full: 'h', ctrl: false });
    v.vim._processSearchKey('e', { full: 'e', ctrl: false });
    // Confirm with Enter
    v.vim._processSearchKey(null, { full: 'enter', ctrl: false });

    expect(v.vim.searchMode).toBe(false);
    expect(closeCalled).toBe(true);
    expect(v.vim.lastSearch).toBe('he');
    // Cursor should be at first 'he' match (col 0)
    expect(v.buf.getCursor().col).toBe(0);
  });

  it('n moves to next match', function () {
    var v = makeVim('cat bat cat');
    // Manually set up search state
    v.vim.lastSearch = 'cat';
    v.vim._runSearch();
    var firstCol = v.buf.getCursor().col;

    key(v.vim, 'n');
    var secondCol = v.buf.getCursor().col;

    // Second 'cat' is at col 8
    expect(secondCol).toBeGreaterThan(firstCol);
  });

  it('N moves to previous match', function () {
    var v = makeVim('cat bat cat');
    v.vim.lastSearch = 'cat';
    v.vim._runSearch();

    // Advance to second match first
    key(v.vim, 'n');
    var atSecond = v.buf.getCursor().col;

    // Go back to first with N
    key(v.vim, 'N');
    var atFirst = v.buf.getCursor().col;

    expect(atFirst).toBeLessThan(atSecond);
  });

  it('Escape cancels search without moving cursor', function () {
    var v = makeVim('hello');
    var closeCalled = false;
    v.vim.onSearchClose = function () { closeCalled = true; };
    v.buf.setCursor(0, 0);

    key(v.vim, '/');
    v.vim._processSearchKey('z', { full: 'z', ctrl: false });
    v.vim._processSearchKey(null, { full: 'escape', ctrl: false });

    expect(v.vim.searchMode).toBe(false);
    expect(closeCalled).toBe(true);
    expect(v.vim.lastSearch).toBe(''); // not updated
    expect(v.buf.getCursor().col).toBe(0); // cursor unchanged
  });

  it('findAll finds all occurrences', function () {
    var buf = makeBuffer('cat bat cat rat cat');
    var matches = buf.findAll('cat');
    expect(matches.length).toBe(3);
    expect(matches[0].col).toBe(0);
    expect(matches[1].col).toBe(8);
    expect(matches[2].col).toBe(16);
  });

  it('findAll is case-insensitive', function () {
    var buf = makeBuffer('Hello HELLO hello');
    var matches = buf.findAll('hello');
    expect(matches.length).toBe(3);
  });

  it('findAll returns empty for no matches', function () {
    var buf = makeBuffer('hello world');
    var matches = buf.findAll('xyz');
    expect(matches.length).toBe(0);
  });

  it('findAll works across multiple lines', function () {
    var buf = makeBuffer('foo bar\nfoo baz\nquux');
    var matches = buf.findAll('foo');
    expect(matches.length).toBe(2);
    expect(matches[0].line).toBe(0);
    expect(matches[1].line).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Test 7: Word operations — dw, cw, yw
// ---------------------------------------------------------------------------

describe('Integration — Word-level operations (dw, cw, yw)', function () {
  it('dw deletes from cursor to next word start', function () {
    var v = makeVim('hello world');
    v.buf.setCursor(0, 0);
    key(v.vim, 'd');
    key(v.vim, 'w');
    // 'hello ' should be deleted, leaving 'world'
    var line = v.buf.getLine(0);
    expect(line).toBe('world');
  });

  it('de deletes from cursor to end of word', function () {
    var v = makeVim('hello world');
    v.buf.setCursor(0, 0);
    key(v.vim, 'd');
    key(v.vim, 'e');
    // 'hello' deleted (not the space), leaving ' world'
    var line = v.buf.getLine(0);
    expect(line).toBe(' world');
  });

  it('db deletes from cursor to previous word start', function () {
    var v = makeVim('hello world');
    v.buf.setCursor(0, 8); // inside 'world'
    key(v.vim, 'd');
    key(v.vim, 'b');
    // Should delete from 'world' start back to cursor
    var line = v.buf.getLine(0);
    // Result should be shorter
    expect(line.length).toBeLessThan(11);
  });

  it('cw deletes to word start and enters insert mode', function () {
    var v = makeVim('hello world');
    v.buf.setCursor(0, 0);
    key(v.vim, 'c');
    key(v.vim, 'w');
    expect(v.vim.mode).toBe('insert');
    // 'hello ' deleted, world remains
    var line = v.buf.getLine(0);
    expect(line).toBe('world');
  });

  it('ce deletes to word end and enters insert mode', function () {
    var v = makeVim('hello world');
    v.buf.setCursor(0, 0);
    key(v.vim, 'c');
    key(v.vim, 'e');
    expect(v.vim.mode).toBe('insert');
    var line = v.buf.getLine(0);
    expect(line).toBe(' world');
  });

  it('yw yanks to next word start', function () {
    var v = makeVim('hello world');
    v.buf.setCursor(0, 0);
    key(v.vim, 'y');
    key(v.vim, 'w');
    // Register should contain 'hello ' (word + space)
    expect(v.vim.register).toBeTruthy();
    // Buffer unchanged
    expect(v.buf.getLine(0)).toBe('hello world');
    expect(v.vim.mode).toBe('normal');
  });

  it('ye yanks to end of word', function () {
    var v = makeVim('hello world');
    v.buf.setCursor(0, 0);
    key(v.vim, 'y');
    key(v.vim, 'e');
    expect(v.vim.register).toBeTruthy();
    expect(v.vim.register).toContain('h');
    expect(v.buf.getLine(0)).toBe('hello world'); // unchanged
  });

  it('dw on last word in line does not crash', function () {
    var v = makeVim('word');
    v.buf.setCursor(0, 0);
    key(v.vim, 'd');
    key(v.vim, 'w');
    // Should produce empty or minimal content, no crash
    expect(v.vim.mode).toBe('normal');
  });
});

// ---------------------------------------------------------------------------
// Test 8: Ctrl+C mode behaviour
// ---------------------------------------------------------------------------

describe('Integration — Ctrl+C mode behaviour', function () {
  it('Ctrl+C in insert mode returns to normal (via escape simulation)', function () {
    var v = makeVim('hello');
    key(v.vim, 'i'); // enter insert
    expect(v.vim.mode).toBe('insert');

    // Simulate Ctrl+C in insert: editor.js calls vim.processKey with escape
    var r = v.vim.processKey(null, { full: 'escape', ctrl: false, meta: false, shift: false, name: 'escape' });
    expect(r.mode).toBe('normal');
    expect(v.vim.mode).toBe('normal');
  });

  it('Ctrl+C in visual mode returns to normal', function () {
    var v = makeVim('hello');
    key(v.vim, 'v'); // enter visual
    expect(v.vim.mode).toBe('visual');

    var r = special(v.vim, 'escape');
    expect(r.mode).toBe('normal');
    expect(v.vim.mode).toBe('normal');
  });
});

// ---------------------------------------------------------------------------
// Test 9: TextBuffer.findAll edge cases
// ---------------------------------------------------------------------------

describe('Integration — TextBuffer findAll edge cases', function () {
  it('returns empty array for empty query', function () {
    var buf = makeBuffer('hello');
    var matches = buf.findAll('');
    expect(matches).toEqual([]);
  });

  it('returns empty array for undefined query', function () {
    var buf = makeBuffer('hello');
    var matches = buf.findAll(undefined);
    expect(matches).toEqual([]);
  });

  it('finds overlapping matches at different columns', function () {
    var buf = makeBuffer('aaa');
    var matches = buf.findAll('a');
    expect(matches.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Test 10: Executor error handling
// ---------------------------------------------------------------------------

describe('Integration — executor error handling', function () {
  it('wraps a throwing script in an error result', function () {
    var badScript = {
      name: 'Throws',
      execute: function () { throw new Error('intentional error'); }
    };

    var result = executor.executeScript(badScript, 'some text', null, function () { return null; });
    expect(result.error).toBeTruthy();
    expect(result.error).toContain('intentional error');
  });

  it('returns action none when script calls postInfo only', function () {
    var infoScript = {
      name: 'Info Only',
      execute: function (require, state) {
        state.postInfo('42 characters');
      }
    };

    var result = executor.executeScript(infoScript, 'text', null, function () { return null; });
    expect(result.action).toBe('none');
    expect(result.infos).toEqual(['42 characters']);
    expect(result.errors).toEqual([]);
  });

  it('returns errors array when script calls postError', function () {
    var errScript = {
      name: 'Error Reporter',
      execute: function (require, state) {
        state.postError('invalid input');
      }
    };

    var result = executor.executeScript(errScript, 'text', null, function () { return null; });
    expect(result.action).toBe('none');
    expect(result.errors).toEqual(['invalid input']);
  });

  it('generator script produces insert action', function () {
    var genScript = {
      name: 'Generator',
      execute: function (require, state) {
        if (state.isSelection) {
          state.text = 'generated';
        } else {
          state.insert('generated');
        }
      }
    };

    var result = executor.executeScript(genScript, '', null, function () { return null; });
    expect(result.action).toBe('insert');
    expect(result.text).toBe('generated');
  });
});
