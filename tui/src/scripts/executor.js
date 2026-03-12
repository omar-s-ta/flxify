'use strict';

/**
 * executor — executes a Flxify script against text and returns the result.
 *
 * Translates between the BoopState-based script API and the TUI's buffer API.
 * Wraps script execution in try/catch to handle the known misbehaving scripts
 * (MinifyJSON, SumAll, HexToASCII — see CLAUDE.md gotcha #28).
 *
 * Result object shape:
 * {
 *   action: 'replaceAll' | 'replaceSelection' | 'insert' | 'none',
 *   text:   string,          // present for replaceAll / replaceSelection / insert
 *   errors: string[],        // postError() messages
 *   infos:  string[],        // postInfo() messages
 *   error:  string           // fatal execution error (replaces action/text/errors/infos)
 * }
 */

var BoopState = require('./boop-state.js');

/**
 * Execute a script and compute the change to apply to the editor.
 *
 * @param {object} script          - Script object with .execute(require, state)
 * @param {string} fullText        - Full document text from the editor
 * @param {string|null} selectedText - Currently selected text, or null if none
 * @param {function} flxifyRequire - The @flxify/ require shim
 * @returns {{action: string, text?: string, errors: string[], infos: string[], error?: string}}
 */
function executeScript(script, fullText, selectedText, flxifyRequire) {
  var state = new BoopState(fullText, selectedText);

  try {
    script.execute(flxifyRequire, state);
  } catch (e) {
    return {
      error: 'Error: ' + (e && e.message ? e.message : 'Script execution failed'),
      errors: [],
      infos: []
    };
  }

  var result = {
    errors: state._errors,
    infos: state._infos
  };

  if (state._insertText !== null) {
    // Generator script: insert at cursor (no text was selected, or script chose insert)
    result.action = 'insert';
    result.text = state._insertText;
  } else if (state._isSelection && state._selection !== selectedText) {
    // Transform script with active selection: replace only the selection
    result.action = 'replaceSelection';
    result.text = state._selection;
  } else if (state._fullText !== fullText) {
    // Transform script: replace the whole buffer
    result.action = 'replaceAll';
    result.text = state._fullText;
  } else {
    // Script reported info/error but made no text changes
    result.action = 'none';
  }

  return result;
}

module.exports = { executeScript: executeScript };
