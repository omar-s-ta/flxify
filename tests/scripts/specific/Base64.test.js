const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('Base64 Encode', () => {
  const script = loadScript('Base64Encode.js');

  it('encodes plain text to base64', () => {
    const state = new MockBoopState('Hello World');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('SGVsbG8gV29ybGQ=');
  });

  it('encodes empty string', () => {
    const state = new MockBoopState('');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('');
  });

  it('encodes special characters', () => {
    const state = new MockBoopState('foo & bar <baz>');
    script.execute(requireShim, state);
    // Result should be valid base64
    expect(state.fullText).toMatch(/^[A-Za-z0-9+/=]+$/);
  });
});

describe('Base64 Decode', () => {
  const script = loadScript('Base64Decode.js');

  it('decodes base64 to plain text', () => {
    const state = new MockBoopState('SGVsbG8gV29ybGQ=');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('Hello World');
  });

  it('round-trips with encode', () => {
    const encode = loadScript('Base64Encode.js');
    const original = 'The quick brown fox jumps over the lazy dog';

    const encState = new MockBoopState(original);
    encode.execute(requireShim, encState);

    const decState = new MockBoopState(encState.fullText);
    script.execute(requireShim, decState);

    expect(decState.fullText).toBe(original);
  });
});
