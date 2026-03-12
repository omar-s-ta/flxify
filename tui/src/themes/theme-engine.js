'use strict';

/**
 * Theme Engine — manages the active theme and provides color helpers.
 *
 * Blessed supports hex colors in style objects (box.style.bg = '#1e1e1e')
 * and in content tags ('{#d4d4d4-fg}text{/}').
 *
 * This module provides:
 *   - Theme selection and cycling
 *   - Color tag helpers (fgColor, bgColor, colorize)
 *   - getCurrentTheme() returns the full theme object for widget styling
 */

var themes = require('./themes');

var THEME_KEYS = Object.keys(themes);
var DISPLAY_NAMES = {
  'standard-light': 'Standard Light',
  'standard-dark': 'Standard Dark',
  'cyber-neon': 'Cyber Neon',
  'nordic-frost': 'Nordic Frost',
  'monokai-pro': 'Monokai Pro',
  'oled-stealth': 'OLED Stealth'
};
var currentTheme = 'standard-dark';

/**
 * Get the theme object by name. Falls back to standard-dark if name is unknown.
 * @param {string} name
 * @returns {object}
 */
function getTheme(name) {
  return themes[name] || themes['standard-dark'];
}

/**
 * Get the currently active theme object.
 * @returns {object}
 */
function getCurrentTheme() {
  return themes[currentTheme];
}

/**
 * Get the currently active theme name.
 * @returns {string}
 */
function getCurrentThemeName() {
  return currentTheme;
}

/**
 * Set the active theme by name.
 * @param {string} name
 * @returns {boolean} true if the theme exists and was applied, false otherwise
 */
function setTheme(name) {
  if (themes[name]) {
    currentTheme = name;
    return true;
  }
  return false;
}

/**
 * Cycle to the next theme in the list. Wraps around from last to first.
 * @returns {string} The new theme name
 */
function cycleTheme() {
  var idx = THEME_KEYS.indexOf(currentTheme);
  var next = THEME_KEYS[(idx + 1) % THEME_KEYS.length];
  currentTheme = next;
  return next;
}

/**
 * Get all valid theme keys.
 * @returns {string[]}
 */
function getThemeKeys() {
  return THEME_KEYS.slice();
}

/**
 * Get the human-readable display name for a theme key.
 * @param {string} name  - Theme key (e.g., 'standard-dark')
 * @returns {string} Display name (e.g., 'Standard Dark')
 */
function getDisplayName(name) {
  return DISPLAY_NAMES[name] || name;
}

/**
 * Produce a blessed foreground color tag for the given hex color.
 * Usage: fgColor('#d4d4d4') → '{#d4d4d4-fg}'
 * @param {string} hex
 * @returns {string}
 */
function fgColor(hex) {
  return '{' + hex + '-fg}';
}

/**
 * Produce a blessed background color tag for the given hex color.
 * Usage: bgColor('#1e1e1e') → '{#1e1e1e-bg}'
 * @param {string} hex
 * @returns {string}
 */
function bgColor(hex) {
  return '{' + hex + '-bg}';
}

/**
 * Wrap text in blessed fg/bg color tags, closed with {/}.
 * @param {string} text
 * @param {string|null} fgHex  - Foreground hex color, or null to skip
 * @param {string|null} bgHex  - Background hex color, or null to skip
 * @returns {string}
 */
function colorize(text, fgHex, bgHex) {
  var open = '';
  if (fgHex) open += '{' + fgHex + '-fg}';
  if (bgHex) open += '{' + bgHex + '-bg}';
  return open + text + '{/}';
}

module.exports = {
  getTheme: getTheme,
  getCurrentTheme: getCurrentTheme,
  getCurrentThemeName: getCurrentThemeName,
  getDisplayName: getDisplayName,
  setTheme: setTheme,
  cycleTheme: cycleTheme,
  getThemeKeys: getThemeKeys,
  fgColor: fgColor,
  bgColor: bgColor,
  colorize: colorize
};
