/**
 * MockBoopState — mirrors the real BoopState API for testing.
 *
 * Usage:
 *   const state = new MockBoopState('input text');
 *   scriptExecute(require, state);
 *   expect(state.fullText).toBe('expected output');
 */
class MockBoopState {
  constructor(fullText = '', selection = null) {
    this._fullText = fullText;
    this._selection = selection;
    this._insertedText = null;
    this.errors = [];
    this.infos = [];
  }

  get fullText() {
    return this._fullText;
  }

  set fullText(value) {
    this._fullText = value;
  }

  get selection() {
    return this._selection;
  }

  set selection(value) {
    this._selection = value;
  }

  get isSelection() {
    return this._selection !== null && this._selection !== undefined;
  }

  get text() {
    if (this.isSelection) {
      return this._selection;
    }
    return this._fullText;
  }

  set text(value) {
    if (this.isSelection) {
      this._selection = value;
    } else {
      this._fullText = value;
    }
  }

  insert(text) {
    this._insertedText = text;
  }

  get insertedText() {
    return this._insertedText;
  }

  postError(message) {
    this.errors.push(message);
  }

  postInfo(message) {
    this.infos.push(message);
  }
}

module.exports = { MockBoopState };
