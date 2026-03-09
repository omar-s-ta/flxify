const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('MD5 Checksum', () => {
  const script = loadScript('MD5Checksum.js');

  it('produces correct MD5 hash', () => {
    const state = new MockBoopState('hello');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('5d41402abc4b2a76b9719d911017c592');
  });

  it('produces a 32-character hex string', () => {
    const state = new MockBoopState('test input');
    script.execute(requireShim, state);
    expect(state.fullText).toMatch(/^[a-f0-9]{32}$/);
  });
});

describe('SHA1 Hash', () => {
  const script = loadScript('SHA1Hash.js');

  it('produces correct SHA1 hash', () => {
    const state = new MockBoopState('hello');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d');
  });

  it('produces a 40-character hex string', () => {
    const state = new MockBoopState('test input');
    script.execute(requireShim, state);
    expect(state.fullText).toMatch(/^[a-f0-9]{40}$/);
  });
});

describe('SHA256 Hash', () => {
  const script = loadScript('SHA256Hash.js');

  it('produces correct SHA256 hash', () => {
    const state = new MockBoopState('hello');
    script.execute(requireShim, state);
    expect(state.fullText).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    );
  });

  it('produces a 64-character hex string', () => {
    const state = new MockBoopState('test input');
    script.execute(requireShim, state);
    expect(state.fullText).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('SHA512 Hash', () => {
  const script = loadScript('SHA512Hash.js');

  it('produces correct SHA512 hash', () => {
    const state = new MockBoopState('hello');
    script.execute(requireShim, state);
    expect(state.fullText).toBe(
      '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043'
    );
  });

  it('produces a 128-character hex string', () => {
    const state = new MockBoopState('test input');
    script.execute(requireShim, state);
    expect(state.fullText).toMatch(/^[a-f0-9]{128}$/);
  });
});
