'use strict';

/**
 * Top bar widget — height 1, anchored to top of screen.
 * Shows "Flxify" branding on the left and keyboard shortcut hints on the right.
 *
 * Theme support:
 *   applyTheme(theme) updates fg/bg colors without recreating the box.
 *   The theme object is expected to have bgSecondary and textPrimary properties.
 */

/**
 * Create the top bar blessed box.
 * @param {import('neo-blessed').Widgets.Screen} screen
 * @param {object} [theme]  - Initial theme object (from themes.js)
 * @returns {{ box: object, update: function, applyTheme: function }}
 */
function createTopBar(screen, theme) {
  var blessed = require('neo-blessed');

  var currentTheme = theme || null;

  var box = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    tags: true,
    style: {
      fg: currentTheme ? currentTheme.textPrimary : 'white',
      bg: currentTheme ? currentTheme.bgSecondary : 'blue'
    }
  });

  function render() {
    var width = screen.width;
    var brand = ' Flxify';
    var hints = 'Ctrl+B: Palette  Ctrl+T: Theme  Ctrl+Q: Quit ';
    // Pad the space between brand and hints
    var padding = width - brand.length - hints.length;
    if (padding < 1) padding = 1;
    var spaces = new Array(padding + 1).join(' ');
    box.setContent(brand + spaces + hints);
    screen.render();
  }

  /**
   * Apply a new theme to the top bar. Updates fg/bg and re-renders.
   * @param {object} newTheme  - Theme object from themes.js
   */
  function applyTheme(newTheme) {
    currentTheme = newTheme;
    box.style.fg = newTheme.textPrimary;
    box.style.bg = newTheme.bgSecondary;
    render();
  }

  render();

  // Re-render on resize
  screen.on('resize', function () {
    render();
  });

  return {
    box: box,
    update: render,
    applyTheme: applyTheme
  };
}

module.exports = { createTopBar: createTopBar };
