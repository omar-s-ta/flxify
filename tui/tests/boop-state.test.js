'use strict';

// BoopState unit tests
// Run: cd tui && npm test

var BoopState = require('../src/scripts/boop-state.js');

// ---------------------------------------------------------------------------
// Constructor + isSelection flag
// ---------------------------------------------------------------------------

describe('BoopState — constructor', function () {
  it('creates with fullText only (no selection)', function () {
    var s = new BoopState('hello world', null);
    expect(s._fullText).toBe('hello world');
    expect(s._selection).toBeNull();
    expect(s._isSelection).toBe(false);
    expect(s._insertText).toBeNull();
    expect(s._errors).toEqual([]);
    expect(s._infos).toEqual([]);
  });

  it('creates with empty string selection — isSelection is false', function () {
    var s = new BoopState('hello', '');
    expect(s._isSelection).toBe(false);
  });

  it('creates with non-empty selection — isSelection is true', function () {
    var s = new BoopState('hello world', 'world');
    expect(s._isSelection).toBe(true);
    expect(s._selection).toBe('world');
  });

  it('creates with undefined selection — isSelection is false', function () {
    var s = new BoopState('hi', undefined);
    expect(s._isSelection).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// text getter (smart read)
// ---------------------------------------------------------------------------

describe('BoopState — text getter', function () {
  it('returns fullText when no selection', function () {
    var s = new BoopState('full text', null);
    expect(s.text).toBe('full text');
  });

  it('returns selection when selection is active', function () {
    var s = new BoopState('full text', 'selected');
    expect(s.text).toBe('selected');
  });
});

// ---------------------------------------------------------------------------
// text setter (smart write)
// ---------------------------------------------------------------------------

describe('BoopState — text setter (no selection)', function () {
  it('writes to fullText when no selection active', function () {
    var s = new BoopState('hello', null);
    s.text = 'world';
    expect(s._fullText).toBe('world');
    expect(s._selection).toBeNull();
  });

  it('one-liner transform: state.text = transform(state.text)', function () {
    var s = new BoopState('hello', null);
    s.text = s.text.toUpperCase();
    expect(s._fullText).toBe('HELLO');
  });
});

describe('BoopState — text setter (with selection)', function () {
  it('writes to selection when selection is active', function () {
    var s = new BoopState('hello world', 'world');
    s.text = 'WORLD';
    expect(s._selection).toBe('WORLD');
    // fullText is unchanged
    expect(s._fullText).toBe('hello world');
  });

  it('one-liner transform on selection only', function () {
    var s = new BoopState('abc DEF ghi', 'DEF');
    s.text = s.text.toLowerCase();
    expect(s._selection).toBe('def');
    expect(s._fullText).toBe('abc DEF ghi'); // unchanged
  });
});

// ---------------------------------------------------------------------------
// fullText property
// ---------------------------------------------------------------------------

describe('BoopState — fullText property', function () {
  it('get returns the full text', function () {
    var s = new BoopState('hello', null);
    expect(s.fullText).toBe('hello');
  });

  it('set updates fullText directly', function () {
    var s = new BoopState('hello', null);
    s.fullText = 'goodbye';
    expect(s.fullText).toBe('goodbye');
  });
});

// ---------------------------------------------------------------------------
// selection property
// ---------------------------------------------------------------------------

describe('BoopState — selection property', function () {
  it('get returns the selection string', function () {
    var s = new BoopState('hello world', 'world');
    expect(s.selection).toBe('world');
  });

  it('set updates selection directly', function () {
    var s = new BoopState('hello world', 'world');
    s.selection = 'WORLD';
    expect(s._selection).toBe('WORLD');
  });
});

// ---------------------------------------------------------------------------
// isSelection property (read-only)
// ---------------------------------------------------------------------------

describe('BoopState — isSelection', function () {
  it('is false when no selection', function () {
    var s = new BoopState('text', null);
    expect(s.isSelection).toBe(false);
  });

  it('is true when selection is non-empty string', function () {
    var s = new BoopState('text', 'sel');
    expect(s.isSelection).toBe(true);
  });

  it('is not writable', function () {
    var s = new BoopState('text', 'sel');
    // Attempting to set should not change the value (it has no setter)
    try {
      s.isSelection = false;
    } catch (_e) {
      // strict mode throws; non-strict silently ignores
    }
    expect(s.isSelection).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// postError / postInfo
// ---------------------------------------------------------------------------

describe('BoopState — postError', function () {
  it('accumulates error messages', function () {
    var s = new BoopState('', null);
    s.postError('bad input');
    s.postError('another error');
    expect(s._errors).toEqual(['bad input', 'another error']);
  });

  it('coerces non-string to string', function () {
    var s = new BoopState('', null);
    s.postError(42);
    expect(s._errors[0]).toBe('42');
  });
});

describe('BoopState — postInfo', function () {
  it('accumulates info messages', function () {
    var s = new BoopState('hello', null);
    s.postInfo('5 characters');
    s.postInfo('another info');
    expect(s._infos).toEqual(['5 characters', 'another info']);
  });

  it('does not affect errors array', function () {
    var s = new BoopState('', null);
    s.postInfo('info only');
    expect(s._errors).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// insert()
// ---------------------------------------------------------------------------

describe('BoopState — insert', function () {
  it('stores insert text', function () {
    var s = new BoopState('existing content', null);
    s.insert('new uuid here');
    expect(s._insertText).toBe('new uuid here');
  });

  it('does not modify fullText', function () {
    var s = new BoopState('existing', null);
    s.insert('uuid-1234');
    expect(s._fullText).toBe('existing');
  });

  it('stores null by default (before insert() is called)', function () {
    var s = new BoopState('text', null);
    expect(s._insertText).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Interaction patterns (simulating real script patterns)
// ---------------------------------------------------------------------------

describe('BoopState — script usage patterns', function () {
  it('transform pattern (no selection): state.text = transform(state.text)', function () {
    var s = new BoopState('hello world', null);
    // Simulate a typical transform script
    s.text = s.text.split(' ').map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join(' ');
    expect(s._fullText).toBe('Hello World');
    expect(s._errors).toEqual([]);
    expect(s._insertText).toBeNull();
  });

  it('error pattern: state.postError() called', function () {
    var s = new BoopState('not json', null);
    // Simulate a script that rejects invalid input
    try {
      JSON.parse(s.text);
    } catch (e) {
      s.postError('Invalid JSON: ' + e.message);
    }
    expect(s._errors.length).toBe(1);
    expect(s._errors[0]).toMatch(/Invalid JSON/);
    expect(s._fullText).toBe('not json'); // unchanged
  });

  it('info pattern: state.postInfo() called without changing text', function () {
    var s = new BoopState('hello world', null);
    s.postInfo(s.text.length + ' characters');
    expect(s._fullText).toBe('hello world'); // unchanged
    expect(s._infos).toEqual(['11 characters']);
  });

  it('generator pattern: state.insert() when no selection', function () {
    var s = new BoopState('', null);
    // Simulate UUID generator
    if (s.isSelection) {
      s.text = 'generated-uuid';
    } else {
      s.insert('generated-uuid');
    }
    expect(s._insertText).toBe('generated-uuid');
    expect(s._fullText).toBe(''); // unchanged
  });

  it('generator pattern: state.text = result when selection exists', function () {
    var s = new BoopState('hello world', 'placeholder');
    // Simulate UUID generator replacing selection
    if (s.isSelection) {
      s.text = 'generated-uuid';
    } else {
      s.insert('generated-uuid');
    }
    expect(s._selection).toBe('generated-uuid');
    expect(s._insertText).toBeNull(); // insert not called
  });
});
