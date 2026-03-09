const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('Sort Lines', () => {
  const script = loadScript('SortLines.js');

  it('sorts lines alphabetically', () => {
    const state = new MockBoopState('cherry\napple\nbanana');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('apple\nbanana\ncherry');
  });

  it('reverses if already sorted', () => {
    const state = new MockBoopState('apple\nbanana\ncherry');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('cherry\nbanana\napple');
  });
});

describe('Natural Sort Lines', () => {
  const script = loadScript('NaturalSortLines.js');

  it('sorts with natural number ordering', () => {
    const state = new MockBoopState('item10\nitem2\nitem1');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('item1\nitem2\nitem10');
  });

  it('reverses if already naturally sorted', () => {
    const state = new MockBoopState('item1\nitem2\nitem10');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('item10\nitem2\nitem1');
  });
});

describe('Reverse Lines', () => {
  const script = loadScript('ReverseLines.js');

  it('reverses line order', () => {
    const state = new MockBoopState('first\nsecond\nthird');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('third\nsecond\nfirst');
  });

  it('handles single line', () => {
    const state = new MockBoopState('only line');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('only line');
  });
});
