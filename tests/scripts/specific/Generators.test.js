const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('UUID Generator', () => {
  const script = loadScript('UUIDGenerator.js');

  it('inserts a UUID when no selection', () => {
    const state = new MockBoopState('');
    script.execute(requireShim, state);
    expect(state.insertedText).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('generates a UUID v4 (version nibble = 4)', () => {
    const state = new MockBoopState('');
    script.execute(requireShim, state);
    const uuid = state.insertedText;
    expect(uuid[14]).toBe('4');
  });

  it('generates multiple UUIDs when a number is selected', () => {
    const state = new MockBoopState('', '3');
    script.execute(requireShim, state);
    const uuids = state.selection.split('\n');
    expect(uuids).toHaveLength(3);
    for (const uuid of uuids) {
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    }
  });
});

describe('Lorem Ipsum', () => {
  const script = loadScript('LoremIpsum.js');

  it('inserts text when no selection', () => {
    const state = new MockBoopState('');
    script.execute(requireShim, state);
    expect(state.insertedText).toBeTruthy();
    expect(state.insertedText.length).toBeGreaterThan(50);
  });

  it('generates text ending with a period', () => {
    const state = new MockBoopState('');
    script.execute(requireShim, state);
    expect(state.insertedText.endsWith('.')).toBe(true);
  });

  it('replaces selection when text is selected', () => {
    const state = new MockBoopState('existing text', 'replace me');
    script.execute(requireShim, state);
    expect(state.selection).toBeTruthy();
    expect(state.selection.length).toBeGreaterThan(50);
  });
});

describe('ULID Generator', () => {
  const script = loadScript('ULIDGenerator.js');
  const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

  it('inserts a ULID when no selection', () => {
    const state = new MockBoopState('');
    script.execute(requireShim, state);
    expect(state.insertedText).toMatch(ULID_REGEX);
  });

  it('generates a ULID that is exactly 26 characters', () => {
    const state = new MockBoopState('');
    script.execute(requireShim, state);
    expect(state.insertedText).toHaveLength(26);
  });

  it('uses only valid Crockford Base32 characters', () => {
    const state = new MockBoopState('');
    script.execute(requireShim, state);
    const ulid = state.insertedText;
    // Crockford Base32 excludes I, L, O, U
    expect(ulid).not.toMatch(/[ILOUilou]/);
    expect(ulid).toMatch(ULID_REGEX);
  });

  it('generates multiple ULIDs when a number is selected', () => {
    const state = new MockBoopState('', '3');
    script.execute(requireShim, state);
    const ulids = state.selection.split('\n');
    expect(ulids).toHaveLength(3);
    for (const ulid of ulids) {
      expect(ulid).toMatch(ULID_REGEX);
    }
  });

  it('caps generation at 1000', () => {
    const state = new MockBoopState('', '2000');
    script.execute(requireShim, state);
    const ulids = state.selection.split('\n');
    expect(ulids).toHaveLength(1000);
  });

  it('generates unique ULIDs', () => {
    const state = new MockBoopState('', '10');
    script.execute(requireShim, state);
    const ulids = state.selection.split('\n');
    const unique = new Set(ulids);
    expect(unique.size).toBe(10);
  });
});
