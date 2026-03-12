'use strict';

/**
 * script-loader — discovers and compiles all Flxify scripts at runtime.
 *
 * Mirrors the VS Code extension's loadScripts() function (extension.ts lines 112-173)
 * translated to plain JavaScript CommonJS. Reads every .js file in the scripts/
 * directory, parses the metadata block (delimited by slash-star-star and star-star-slash),
 * in a new Function() to produce an execute function.
 *
 * Scripts are sorted alphabetically by name to match the web app's order.
 *
 * Edge cases handled:
 *   - Files with no metadata block are skipped (silently)
 *   - Files with invalid JSON in the metadata block are skipped
 *   - Files whose source doesn't compile (rare) are skipped
 *   - Trailing commas in JSON metadata are stripped before parsing
 */

var fs = require('fs');
var path = require('path');

/**
 * Load all scripts from the given directory.
 *
 * @param {string} scriptsDir  - Absolute path to scripts/ directory
 * @returns {Array<{name: string, description: string, tags: string, icon: string, execute: function}>}
 */
function loadScripts(scriptsDir) {
  var scripts = [];

  var files;
  try {
    files = fs.readdirSync(scriptsDir)
      .filter(function (f) { return f.endsWith('.js'); })
      .sort();
  } catch (e) {
    // Directory doesn't exist or can't be read — return empty array
    return scripts;
  }

  for (var i = 0; i < files.length; i++) {
    var filePath = path.join(scriptsDir, files[i]);

    var source;
    try {
      source = fs.readFileSync(filePath, 'utf-8');
    } catch (_e) {
      continue;
    }

    // Parse the /** { ... } **/ metadata block
    var metaMatch = source.match(/\/\*\*([\s\S]*?)\*\*\//);
    if (!metaMatch) continue;

    // Strip trailing commas before closing brackets/braces (CLAUDE.md gotcha #6)
    var cleanedJson = metaMatch[1].trim().replace(/,\s*([\]}])/g, '$1');

    var metadata;
    try {
      metadata = JSON.parse(cleanedJson);
    } catch (_e) {
      continue;
    }

    if (!metadata.name) continue;

    // Compile the script source into an execute function.
    // The function receives (require, state) and calls main(state) internally.
    // Do NOT add 'use strict' — some scripts use implicit globals (CLAUDE.md gotcha #10).
    var executeFn;
    try {
      executeFn = new Function('require', 'state', // eslint-disable-line no-new-func
        source + '\nif (typeof main === "function") main(state);'
      );
    } catch (_e) {
      continue;
    }

    scripts.push({
      name: metadata.name,
      description: metadata.description || '',
      tags: metadata.tags || '',
      icon: metadata.icon || '',
      execute: executeFn
    });
  }

  // Sort alphabetically by name (same order as web app command palette)
  scripts.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  return scripts;
}

module.exports = { loadScripts: loadScripts };
