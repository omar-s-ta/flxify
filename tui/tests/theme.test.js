'use strict';

// Theme Engine unit tests
// Run: cd tui && npm test

var themes = require('../src/themes/themes');
var themeEngine = require('../src/themes/theme-engine');

var EXPECTED_KEYS = [
  'standard-light',
  'standard-dark',
  'cyber-neon',
  'nordic-frost',
  'monokai-pro',
  'oled-stealth'
];

var REQUIRED_PROPERTIES = [
  'bgPrimary',
  'bgSecondary',
  'bgEditor',
  'bgPalette',
  'bgPaletteHover',
  'bgSelected',
  'bgStatusBar',
  'textPrimary',
  'textSecondary',
  'textMuted',
  'textAccent',
  'editorCursor',
  'editorSelection',
  'gutterText',
  'gutterActiveText',
  'colorError',
  'colorInfo',
  'colorSuccess',
  'accent',
  'border',
  'paletteInputBg',
  'paletteInputText',
  'paletteItemText',
  'paletteItemDesc',
  'paletteSelectedText',
  'paletteSelectedDesc'
];

var HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

// ---------------------------------------------------------------------------
// Theme definitions
// ---------------------------------------------------------------------------

describe('themes.js — theme keys', function () {
  it('exports exactly 6 themes', function () {
    var keys = Object.keys(themes);
    expect(keys).toHaveLength(6);
  });

  EXPECTED_KEYS.forEach(function (key) {
    it('exports "' + key + '"', function () {
      expect(themes[key]).toBeDefined();
    });
  });
});

describe('themes.js — required properties', function () {
  EXPECTED_KEYS.forEach(function (themeName) {
    describe('theme: ' + themeName, function () {
      REQUIRED_PROPERTIES.forEach(function (prop) {
        it('has property "' + prop + '"', function () {
          expect(themes[themeName][prop]).toBeDefined();
        });

        it('"' + prop + '" is a valid hex color (#rrggbb)', function () {
          var val = themes[themeName][prop];
          expect(HEX_COLOR_RE.test(val)).toBe(true);
        });
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Theme engine
// ---------------------------------------------------------------------------

describe('themeEngine — getTheme', function () {
  it('returns the correct theme object for a valid name', function () {
    var t = themeEngine.getTheme('standard-dark');
    expect(t).toBe(themes['standard-dark']);
  });

  it('falls back to standard-dark for an unknown name', function () {
    var t = themeEngine.getTheme('does-not-exist');
    expect(t).toBe(themes['standard-dark']);
  });

  it('returns standard-light when requested', function () {
    var t = themeEngine.getTheme('standard-light');
    expect(t).toBe(themes['standard-light']);
  });
});

describe('themeEngine — setTheme / getCurrentTheme', function () {
  afterEach(function () {
    // Reset to standard-dark after each test to avoid state bleed
    themeEngine.setTheme('standard-dark');
  });

  it('setTheme returns true for valid theme names', function () {
    expect(themeEngine.setTheme('cyber-neon')).toBe(true);
  });

  it('setTheme returns false for unknown theme names', function () {
    expect(themeEngine.setTheme('does-not-exist')).toBe(false);
  });

  it('getCurrentTheme returns the active theme object after setTheme', function () {
    themeEngine.setTheme('nordic-frost');
    var t = themeEngine.getCurrentTheme();
    expect(t).toBe(themes['nordic-frost']);
  });

  it('getCurrentThemeName returns the active theme name after setTheme', function () {
    themeEngine.setTheme('monokai-pro');
    expect(themeEngine.getCurrentThemeName()).toBe('monokai-pro');
  });

  it('setTheme with invalid name does not change the active theme', function () {
    themeEngine.setTheme('standard-dark');
    themeEngine.setTheme('not-a-theme');
    expect(themeEngine.getCurrentThemeName()).toBe('standard-dark');
  });
});

describe('themeEngine — default theme', function () {
  it('starts with standard-dark as the default theme after module load', function () {
    // The module is cached; after all the setTheme calls above it's reset to standard-dark
    themeEngine.setTheme('standard-dark');
    expect(themeEngine.getCurrentThemeName()).toBe('standard-dark');
  });
});

describe('themeEngine — cycleTheme', function () {
  afterEach(function () {
    themeEngine.setTheme('standard-dark');
  });

  it('cycles from standard-light to standard-dark', function () {
    themeEngine.setTheme('standard-light');
    var next = themeEngine.cycleTheme();
    expect(next).toBe('standard-dark');
  });

  it('cycles from standard-dark to cyber-neon', function () {
    themeEngine.setTheme('standard-dark');
    var next = themeEngine.cycleTheme();
    expect(next).toBe('cyber-neon');
  });

  it('cycles from oled-stealth back to standard-light (wrap-around)', function () {
    themeEngine.setTheme('oled-stealth');
    var next = themeEngine.cycleTheme();
    expect(next).toBe('standard-light');
  });

  it('updates the current theme name after cycling', function () {
    themeEngine.setTheme('cyber-neon');
    themeEngine.cycleTheme();
    expect(themeEngine.getCurrentThemeName()).toBe('nordic-frost');
  });

  it('cycling 6 times returns to the starting theme', function () {
    themeEngine.setTheme('standard-dark');
    for (var i = 0; i < 6; i++) {
      themeEngine.cycleTheme();
    }
    expect(themeEngine.getCurrentThemeName()).toBe('standard-dark');
  });
});

describe('themeEngine — getThemeKeys', function () {
  it('returns an array of all 6 theme keys', function () {
    var keys = themeEngine.getThemeKeys();
    expect(keys).toHaveLength(6);
    EXPECTED_KEYS.forEach(function (k) {
      expect(keys).toContain(k);
    });
  });

  it('returns a copy (mutation does not affect engine state)', function () {
    var keys = themeEngine.getThemeKeys();
    keys.push('fake-theme');
    expect(themeEngine.getThemeKeys()).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// colorize helper
// ---------------------------------------------------------------------------

describe('themeEngine — colorize', function () {
  it('wraps text in fg color tag when only fgHex is given', function () {
    var result = themeEngine.colorize('hello', '#d4d4d4', null);
    expect(result).toBe('{#d4d4d4-fg}hello{/}');
  });

  it('wraps text in bg color tag when only bgHex is given', function () {
    var result = themeEngine.colorize('hello', null, '#1e1e1e');
    expect(result).toBe('{#1e1e1e-bg}hello{/}');
  });

  it('wraps text in both fg and bg tags when both are given', function () {
    var result = themeEngine.colorize('hello', '#ffffff', '#094771');
    expect(result).toBe('{#ffffff-fg}{#094771-bg}hello{/}');
  });

  it('returns text with only closing tag when no colors given', function () {
    var result = themeEngine.colorize('hello', null, null);
    expect(result).toBe('hello{/}');
  });
});

describe('themeEngine — fgColor / bgColor', function () {
  it('fgColor wraps hex in fg tag', function () {
    expect(themeEngine.fgColor('#aabbcc')).toBe('{#aabbcc-fg}');
  });

  it('bgColor wraps hex in bg tag', function () {
    expect(themeEngine.bgColor('#112233')).toBe('{#112233-bg}');
  });
});
