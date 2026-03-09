/**
 * Script loader for tests — replicates the metadata parsing and module
 * loading from build_app.js so tests can run scripts the same way the
 * built app does.
 */
const fs = require('fs');
const path = require('path');

const SCRIPTS_DIR = path.join(__dirname, '..', '..', 'scripts');
const LIB_DIR = path.join(SCRIPTS_DIR, 'lib');

// ---- Module cache ----
const moduleCache = {};

/**
 * Creates a require shim that loads lib modules from scripts/lib/
 * using new Function() (non-strict mode, matching runtime behavior).
 */
function createRequire() {
  return function require(modulePath) {
    if (typeof modulePath === 'string' && modulePath.startsWith('@flxify/')) {
      var name = modulePath.replace('@flxify/', '').replace('.js', '');
      if (moduleCache[name]) return moduleCache[name];

      var filePath = path.join(LIB_DIR, name + '.js');
      if (!fs.existsSync(filePath)) {
        throw new Error('Module not found: ' + modulePath);
      }

      var source = fs.readFileSync(filePath, 'utf-8');
      var mod = { exports: {} };
      // Use new Function to match non-strict runtime behavior
      var fn = new Function('module', 'exports', source);
      fn(mod, mod.exports);
      moduleCache[name] = mod.exports;
      return mod.exports;
    }
    throw new Error('Unknown module: ' + modulePath);
  };
}

/**
 * Parses script metadata from the /** ... **\/ block.
 * Replicates the build_app.js parsing logic including trailing comma cleanup.
 */
function parseMetadata(source, filename) {
  var metaMatch = source.match(/\/\*\*([\s\S]*?)\*\*\//);
  if (!metaMatch) return null;

  var cleanedJson = metaMatch[1].trim().replace(/,\s*([\]}])/g, '$1');
  try {
    return JSON.parse(cleanedJson);
  } catch (e) {
    return null;
  }
}

/**
 * Extracts the function body after the metadata block.
 * Returns everything after the closing **\/ of the metadata comment.
 */
function extractBody(source) {
  var idx = source.indexOf('**/');
  if (idx === -1) return source;
  return source.slice(idx + 3);
}

/**
 * Loads a single script by filename and returns { metadata, execute }.
 * The execute function takes (requireShim, state) just like in app.js.
 */
function loadScript(filename) {
  var filePath = path.join(SCRIPTS_DIR, filename);
  var source = fs.readFileSync(filePath, 'utf-8');
  var metadata = parseMetadata(source, filename);

  if (!metadata) {
    throw new Error('No valid metadata in ' + filename);
  }

  var body = extractBody(source);
  // Wrap in a function that provides require and calls main(state)
  var fn = new Function('require', 'state', body + '\nmain(state);');

  return {
    metadata: metadata,
    filename: filename,
    execute: function (requireShim, state) {
      fn(requireShim, state);
    },
  };
}

/**
 * Returns an array of all script filenames in scripts/.
 */
function listScripts() {
  return fs
    .readdirSync(SCRIPTS_DIR)
    .filter(function (f) {
      return f.endsWith('.js');
    })
    .sort();
}

module.exports = { createRequire, loadScript, listScripts, parseMetadata };
