const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('JWT Decode', () => {
  const script = loadScript('JWTDecode.js');

  // A valid JWT with header: {"alg":"HS256","typ":"JWT"}, payload: {"sub":"1234567890","name":"John Doe","iat":1516239022}
  const validJWT =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  it('decodes a valid JWT into header, payload, and signature', () => {
    const state = new MockBoopState(validJWT);
    script.execute(requireShim, state);
    const result = JSON.parse(state.fullText);
    expect(result.header.alg).toBe('HS256');
    expect(result.header.typ).toBe('JWT');
    expect(result.payload.sub).toBe('1234567890');
    expect(result.payload.name).toBe('John Doe');
    expect(result.signature).toBeTruthy();
  });

  it('posts error for invalid token (not 3 parts)', () => {
    const state = new MockBoopState('not.a.valid.jwt.token');
    script.execute(requireShim, state);
    expect(state.errors.length).toBeGreaterThan(0);
  });

  it('posts error for non-JWT text', () => {
    const state = new MockBoopState('just some text');
    script.execute(requireShim, state);
    expect(state.errors.length).toBeGreaterThan(0);
  });
});
