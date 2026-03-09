const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('Upcase', () => {
  const script = loadScript('Upcase.js');

  it('converts text to uppercase', () => {
    const state = new MockBoopState('hello world');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('HELLO WORLD');
  });

  it('leaves already uppercase text unchanged', () => {
    const state = new MockBoopState('HELLO');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('HELLO');
  });
});

describe('Downcase', () => {
  const script = loadScript('Downcase.js');

  it('converts text to lowercase', () => {
    const state = new MockBoopState('HELLO WORLD');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('hello world');
  });

  it('leaves already lowercase text unchanged', () => {
    const state = new MockBoopState('hello');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('hello');
  });
});

describe('Camel Case', () => {
  const script = loadScript('CamelCase.js');

  it('converts space-separated words to camelCase', () => {
    const state = new MockBoopState('hello world');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('helloWorld');
  });

  it('converts kebab-case to camelCase', () => {
    const state = new MockBoopState('my-variable-name');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('myVariableName');
  });
});

describe('Kebab Case', () => {
  const script = loadScript('KebabCase.js');

  it('converts space-separated words to kebab-case', () => {
    const state = new MockBoopState('hello world');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('hello-world');
  });

  it('converts camelCase to kebab-case', () => {
    const state = new MockBoopState('myVariableName');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('my-variable-name');
  });
});

describe('Snake Case', () => {
  const script = loadScript('SnakeCase.js');

  it('converts space-separated words to snake_case', () => {
    const state = new MockBoopState('hello world');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('hello_world');
  });

  it('converts camelCase to snake_case', () => {
    const state = new MockBoopState('myVariableName');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('my_variable_name');
  });
});

describe('Start Case', () => {
  const script = loadScript('StartCase.js');

  it('capitalizes first letter of each word', () => {
    const state = new MockBoopState('hello world');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('Hello World');
  });

  it('converts camelCase to Start Case', () => {
    const state = new MockBoopState('helloWorld');
    script.execute(requireShim, state);
    expect(state.fullText).toBe('Hello World');
  });
});
