'use strict';

/**
 * require-shim — provides the @flxify/moduleName require shim for scripts.
 *
 * Scripts call `require('@flxify/lodash.boop')` etc. to import lib modules.
 * This factory creates a custom require function that:
 *   1. Recognises the `@flxify/` namespace prefix.
 *   2. Reads the corresponding .js file from scripts/lib/.
 *   3. Wraps it in a CommonJS sandbox (exports, module.exports).
 *   4. Caches the result so each module is evaluated only once.
 *
 * Unrecognised require paths (non-@flxify/) return null. Scripts that
 * happen to call require() for built-in Node modules are not supported
 * (and in practice none of the 111 scripts do this).
 *
 * Using new Function() is safe here — the TUI runs in plain Node.js,
 * which has no Content Security Policy restrictions.
 */

var fs = require('fs');
var path = require('path');

/**
 * Create a require function scoped to the given lib directory.
 *
 * @param {string} libDir  - Absolute path to scripts/lib/
 * @returns {function(string): any}  flxifyRequire(modulePath)
 */
function createRequire(libDir) {
  var cache = {};

  function flxifyRequire(modulePath) {
    if (typeof modulePath !== 'string') return null;
    if (!modulePath.startsWith('@flxify/')) return null;

    // Strip @flxify/ prefix and optional .js suffix to get the cache key
    var name = modulePath.replace('@flxify/', '').replace(/\.js$/, '');

    if (cache[name]) return cache[name];

    var libPath = path.join(libDir, name + '.js');

    if (!fs.existsSync(libPath)) return null;

    var source;
    try {
      source = fs.readFileSync(libPath, 'utf-8');
    } catch (_e) {
      return null;
    }

    var moduleObj = { exports: {} };

    try {
      // Wrap in CommonJS sandbox — do NOT add 'use strict' (some lib modules
      // are legacy code that may rely on non-strict behaviour)
      var wrapper = new Function('exports', 'module', 'require', source); // eslint-disable-line no-new-func
      wrapper(moduleObj.exports, moduleObj, flxifyRequire);
    } catch (_e) {
      return null;
    }

    cache[name] = moduleObj.exports;
    return cache[name];
  }

  return flxifyRequire;
}

module.exports = { createRequire: createRequire };
