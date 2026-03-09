const {
  createRequire,
  loadScript,
  listScripts,
  parseMetadata,
} = require('../helpers/script-loader');
const { MockBoopState } = require('../helpers/mock-state');

const requireShim = createRequire();
const scriptFiles = listScripts();

// ============================================================
// Suite A: Metadata Validation
// ============================================================
describe('Metadata validation', () => {
  for (const file of scriptFiles) {
    describe(file, () => {
      let script;

      beforeAll(() => {
        script = loadScript(file);
      });

      it('has valid metadata', () => {
        expect(script.metadata).toBeDefined();
        expect(script.metadata.api).toBeDefined();
        expect(script.metadata.name).toBeTruthy();
        expect(script.metadata.description).toBeTruthy();
        expect(script.metadata.icon).toBeTruthy();
        expect(script.metadata.tags).toBeTruthy();
      });

      it('has a string name', () => {
        expect(typeof script.metadata.name).toBe('string');
      });

      it('has a string description', () => {
        expect(typeof script.metadata.description).toBe('string');
      });
    });
  }
});

// ============================================================
// Suite B: Basic Execution
// ============================================================

// Scripts that expect specific input formats and may throw on arbitrary text.
const THROWS_ON_ARBITRARY_INPUT = new Set([
  'MinifyJSON.js',    // expects valid JSON
  'SumAll.js',        // expects numbers
  'HexToASCII.js',   // expects hex input
]);

describe('Basic execution', () => {
  for (const file of scriptFiles) {
    if (THROWS_ON_ARBITRARY_INPUT.has(file)) continue;

    describe(file, () => {
      let script;

      beforeAll(() => {
        script = loadScript(file);
      });

      it('runs with "Hello World" without throwing', () => {
        const state = new MockBoopState('Hello World');
        expect(() => script.execute(requireShim, state)).not.toThrow();
      });

      it('runs with empty string without throwing', () => {
        const state = new MockBoopState('');
        expect(() => script.execute(requireShim, state)).not.toThrow();
      });

      it('runs with multiline input without throwing', () => {
        const state = new MockBoopState('line one\nline two\nline three');
        expect(() => script.execute(requireShim, state)).not.toThrow();
      });
    });
  }
});
