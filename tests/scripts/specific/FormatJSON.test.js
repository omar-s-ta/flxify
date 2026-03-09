const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('Format JSON', () => {
  const script = loadScript('FormatJSON.js');

  it('formats compact JSON with indentation', () => {
    const state = new MockBoopState('{"name":"test","value":1}');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('{\n  "name": "test",\n  "value": 1\n}');
  });

  it('formats nested JSON', () => {
    const state = new MockBoopState('{"a":{"b":{"c":1}}}');
    script.execute(requireShim, state);
    const parsed = JSON.parse(state.fullText);
    expect(parsed.a.b.c).toBe(1);
    expect(state.fullText).toContain('\n');
  });

  it('posts error for invalid JSON', () => {
    const state = new MockBoopState('not json');
    script.execute(requireShim, state);
    expect(state.errors).toContain('Invalid JSON');
  });

  it('handles JSON arrays', () => {
    const state = new MockBoopState('[1,2,3]');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('[\n  1,\n  2,\n  3\n]');
  });
});

describe('Minify JSON', () => {
  const script = loadScript('MinifyJSON.js');

  it('removes whitespace from formatted JSON', () => {
    const input = '{\n  "name": "test",\n  "value": 1\n}';
    const state = new MockBoopState(input);
    script.execute(requireShim, state);
    expect(state.fullText).toBe('{"name":"test","value":1}');
  });

  it('minifies already compact JSON unchanged', () => {
    const state = new MockBoopState('{"a":1}');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('{"a":1}');
  });
});
