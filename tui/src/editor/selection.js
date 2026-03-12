'use strict';

/**
 * Selection — tracks visual-mode selection state.
 *
 * Supports two selection types:
 *   isLine = false  — character-wise (v in Vim)
 *   isLine = true   — line-wise (V in Vim)
 *
 * The anchor is where the user pressed v/V; the active follows the cursor.
 * getRange() always returns start <= end regardless of motion direction.
 */
function Selection() {
  this.anchor = null;  // { line, col }
  this.active = null;  // { line, col }
  this.isLine = false;
}

/**
 * Start a selection at the given position.
 * @param {number} line
 * @param {number} col
 * @param {boolean} [isLine] - true for line-wise (V), false for char-wise (v)
 */
Selection.prototype.start = function (line, col, isLine) {
  this.anchor = { line: line, col: col };
  this.active = { line: line, col: col };
  this.isLine = !!isLine;
};

/**
 * Update the active (cursor) end of the selection.
 * @param {number} line
 * @param {number} col
 */
Selection.prototype.updateActive = function (line, col) {
  this.active = { line: line, col: col };
};

/**
 * @returns {boolean} Whether a selection is currently active
 */
Selection.prototype.isActive = function () {
  return this.anchor !== null;
};

/**
 * Get the normalized range of the selection.
 * Always returns { startLine, startCol, endLine, endCol } with start <= end.
 * For line-wise selections, startCol is always 0 and endCol is the line length.
 * @param {import('./buffer.js')} buffer - Used for line-wise end column calculation
 * @returns {{ startLine: number, startCol: number, endLine: number, endCol: number }}
 */
Selection.prototype.getRange = function (buffer) {
  if (!this.anchor || !this.active) {
    return { startLine: 0, startCol: 0, endLine: 0, endCol: 0 };
  }

  var a = this.anchor;
  var b = this.active;

  var startLine, startCol, endLine, endCol;

  // Normalize so start <= end
  if (a.line < b.line || (a.line === b.line && a.col <= b.col)) {
    startLine = a.line; startCol = a.col;
    endLine   = b.line; endCol   = b.col;
  } else {
    startLine = b.line; startCol = b.col;
    endLine   = a.line; endCol   = a.col;
  }

  if (this.isLine && buffer) {
    startCol = 0;
    endCol = buffer.getLine(endLine).length;
  }

  return { startLine: startLine, startCol: startCol, endLine: endLine, endCol: endCol };
};

/**
 * Extract the selected text from the buffer.
 * For character-wise selections: returns text between start and end positions.
 * For line-wise selections: returns all selected lines joined by '\n'.
 * @param {import('./buffer.js')} buffer
 * @returns {string}
 */
Selection.prototype.getText = function (buffer) {
  if (!this.isActive()) return '';
  var range = this.getRange(buffer);

  if (this.isLine) {
    return this.getSelectedLines(buffer).join('\n');
  }

  if (range.startLine === range.endLine) {
    return buffer.getLine(range.startLine).slice(range.startCol, range.endCol + 1);
  }

  var parts = [];
  parts.push(buffer.getLine(range.startLine).slice(range.startCol));
  for (var i = range.startLine + 1; i < range.endLine; i++) {
    parts.push(buffer.getLine(i));
  }
  parts.push(buffer.getLine(range.endLine).slice(0, range.endCol + 1));
  return parts.join('\n');
};

/**
 * Get the selected lines for line-wise visual mode.
 * @param {import('./buffer.js')} buffer
 * @returns {string[]}
 */
Selection.prototype.getSelectedLines = function (buffer) {
  if (!this.isActive()) return [];
  var range = this.getRange(buffer);
  var result = [];
  for (var i = range.startLine; i <= range.endLine; i++) {
    result.push(buffer.getLine(i));
  }
  return result;
};

/**
 * Clear the selection.
 */
Selection.prototype.clear = function () {
  this.anchor = null;
  this.active = null;
  this.isLine = false;
};

module.exports = Selection;
