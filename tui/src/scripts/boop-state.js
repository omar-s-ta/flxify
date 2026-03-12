'use strict';

/**
 * BoopState — the script API bridge for the TUI.
 *
 * Scripts receive a BoopState instance as the `state` argument to their
 * `main(state)` function. This class mirrors the VS Code extension's
 * implementation: it accepts the selected text string directly (not character
 * offsets), which is simpler and matches how Vim visual mode works.
 *
 * Key behaviour:
 *   state.text  — reads/writes `state._selection` if selection is active,
 *                 otherwise reads/writes `state._fullText`.  This lets most
 *                 scripts be one-liners that handle both modes automatically.
 *   state.insert(text) — queue text for insertion at the cursor position
 *                        (used by generator scripts, e.g. UUID Generator).
 *   state.postError(msg) / state.postInfo(msg) — collect messages shown as
 *                        toasts in the TUI after execution.
 */
function BoopState(fullText, selection) {
  this._fullText = fullText;
  this._selection = selection;
  this._isSelection = selection !== null && selection !== undefined && selection.length > 0;
  this._insertText = null;
  this._errors = [];
  this._infos = [];
}

// --- fullText ---

Object.defineProperty(BoopState.prototype, 'fullText', {
  get: function () { return this._fullText; },
  set: function (val) { this._fullText = val; }
});

// --- selection ---

Object.defineProperty(BoopState.prototype, 'selection', {
  get: function () { return this._selection; },
  set: function (val) { this._selection = val; }
});

// --- isSelection ---

Object.defineProperty(BoopState.prototype, 'isSelection', {
  get: function () { return this._isSelection; }
});

// --- text (smart read/write) ---

Object.defineProperty(BoopState.prototype, 'text', {
  get: function () {
    return this._isSelection ? this._selection : this._fullText;
  },
  set: function (val) {
    if (this._isSelection) {
      this._selection = val;
    } else {
      this._fullText = val;
    }
  }
});

/**
 * Queue a toast error message. Collected and shown after script execution.
 * @param {string} msg
 */
BoopState.prototype.postError = function (msg) {
  this._errors.push(String(msg));
};

/**
 * Queue a toast info message. Collected and shown after script execution.
 * @param {string} msg
 */
BoopState.prototype.postInfo = function (msg) {
  this._infos.push(String(msg));
};

/**
 * Mark text for insertion at the current cursor position.
 * Used by generator scripts (UUID, Lorem Ipsum, etc.) when no text is selected.
 * @param {string} text
 */
BoopState.prototype.insert = function (text) {
  this._insertText = text;
};

module.exports = BoopState;
