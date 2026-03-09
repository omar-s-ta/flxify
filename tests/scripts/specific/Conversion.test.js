const { createRequire, loadScript } = require('../../helpers/script-loader');
const { MockBoopState } = require('../../helpers/mock-state');

const requireShim = createRequire();

describe('JSON to YAML', () => {
  const script = loadScript('JSONToYAML.js');

  it('converts simple JSON object to YAML', () => {
    const state = new MockBoopState('{"name":"test","value":1}');
    script.execute(requireShim, state);
    expect(state.fullText).toContain('name: test');
    expect(state.fullText).toContain('value: 1');
  });

  it('posts error for invalid JSON', () => {
    const state = new MockBoopState('not json');
    script.execute(requireShim, state);
    expect(state.errors).toContain('Invalid JSON');
  });
});

describe('YAML to JSON', () => {
  const script = loadScript('YAMLToJSON.js');

  it('converts simple YAML to JSON', () => {
    const state = new MockBoopState('name: test\nvalue: 1');
    script.execute(requireShim, state);
    const result = JSON.parse(state.fullText);
    expect(result.name).toBe('test');
    expect(result.value).toBe(1);
  });

  it('round-trips with JSON to YAML', () => {
    const toYaml = loadScript('JSONToYAML.js');
    const original = '{"key":"value","num":42}';

    const yamlState = new MockBoopState(original);
    toYaml.execute(requireShim, yamlState);

    const jsonState = new MockBoopState(yamlState.fullText);
    script.execute(requireShim, jsonState);

    const result = JSON.parse(jsonState.fullText);
    expect(result.key).toBe('value');
    expect(result.num).toBe(42);
  });

  it('posts error for invalid YAML', () => {
    const state = new MockBoopState('{{invalid yaml');
    script.execute(requireShim, state);
    expect(state.errors).toContain('Invalid YAML');
  });
});

describe('CSV to JSON', () => {
  const script = loadScript('CSVToJSON.js');

  it('converts CSV with headers to JSON array', () => {
    const state = new MockBoopState('name,age\nAlice,30\nBob,25');
    script.execute(requireShim, state);
    const result = JSON.parse(state.fullText);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[0].age).toBe('30');
    expect(result[1].name).toBe('Bob');
  });
});

describe('JSON to CSV', () => {
  const script = loadScript('JSONToCSV.js');

  it('converts JSON array to CSV', () => {
    const input = '[{"name":"Alice","age":30},{"name":"Bob","age":25}]';
    const state = new MockBoopState(input);
    script.execute(requireShim, state);
    expect(state.fullText).toContain('name,age');
    expect(state.fullText).toContain('"Alice"');
    expect(state.fullText).toContain('"Bob"');
  });

  it('posts error for invalid JSON', () => {
    const state = new MockBoopState('not json');
    script.execute(requireShim, state);
    expect(state.errors.length).toBeGreaterThan(0);
  });
});
