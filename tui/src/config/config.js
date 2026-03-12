'use strict';

/**
 * Persistent configuration — reads and writes ~/.config/flxify/config.json.
 *
 * Currently stores:
 *   { theme: 'standard-dark' }
 *
 * Failures are silently ignored so a missing or corrupted config file does not
 * prevent the app from starting.
 */

var fs = require('fs');
var path = require('path');
var os = require('os');

var CONFIG_DIR = path.join(os.homedir(), '.config', 'flxify');
var CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Load the config object from disk.
 * Returns a default config if the file does not exist or cannot be parsed.
 * @returns {{ theme: string }}
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (_e) {
    // Silently ignore missing or malformed config
  }
  return { theme: 'standard-dark' };
}

/**
 * Persist the config object to disk.
 * Creates the config directory if it does not exist.
 * @param {{ theme: string }} config
 */
function saveConfig(config) {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (_e) {
    // Non-fatal — silently ignore write failures
  }
}

/**
 * Get the saved theme name, defaulting to 'standard-dark'.
 * @returns {string}
 */
function getTheme() {
  return loadConfig().theme || 'standard-dark';
}

/**
 * Save the theme name to the config file.
 * @param {string} name
 */
function setTheme(name) {
  var config = loadConfig();
  config.theme = name;
  saveConfig(config);
}

module.exports = {
  loadConfig: loadConfig,
  saveConfig: saveConfig,
  getTheme: getTheme,
  setTheme: setTheme
};
