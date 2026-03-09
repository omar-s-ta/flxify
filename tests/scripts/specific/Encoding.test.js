const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('URL Encode', () => {
  const script = loadScript('URLEncode.js');

  it('encodes special URL characters', () => {
    const state = new MockBoopState('hello world & foo=bar');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('hello%20world%20%26%20foo%3Dbar');
  });

  it('leaves safe characters unchanged', () => {
    const state = new MockBoopState('hello');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('hello');
  });
});

describe('URL Decode', () => {
  const script = loadScript('URLDecode.js');

  it('decodes percent-encoded characters', () => {
    const state = new MockBoopState('hello%20world%20%26%20foo%3Dbar');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('hello world & foo=bar');
  });

  it('round-trips with URL Encode', () => {
    const encode = loadScript('URLEncode.js');
    const original = 'test value=1&other=2';

    const encState = new MockBoopState(original);
    encode.execute(requireShim, encState);

    const decState = new MockBoopState(encState.fullText);
    script.execute(requireShim, decState);

    expect(decState.fullText).toBe(original);
  });
});

describe('HTML Encode', () => {
  const script = loadScript('HTMLEncode.js');

  it('encodes HTML special characters', () => {
    const state = new MockBoopState('<div class="test">hello & world</div>');
    script.execute(requireShim, state);
    // he library uses hex entities (&#x3C;) for < and named (&amp;) for &
    expect(state.fullText).not.toContain('<div');
    expect(state.fullText).toContain('&#x');
  });
});

describe('HTML Decode', () => {
  const script = loadScript('HTMLDecode.js');

  it('decodes HTML entities', () => {
    const state = new MockBoopState('&lt;div&gt;hello &amp; world&lt;/div&gt;');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('<div>hello & world</div>');
  });

  it('round-trips with HTML Encode', () => {
    const encode = loadScript('HTMLEncode.js');
    const original = '<p>test & "value"</p>';

    const encState = new MockBoopState(original);
    encode.execute(requireShim, encState);

    const decState = new MockBoopState(encState.fullText);
    script.execute(requireShim, decState);

    expect(decState.fullText).toBe(original);
  });
});
