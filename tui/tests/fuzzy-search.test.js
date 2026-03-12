'use strict';

// fuzzy-search unit tests
// Run: cd tui && npm test

var fuzzySearch = require('../src/palette/fuzzy-search.js');
var fuzzyScore = fuzzySearch.fuzzyScore;
var searchScripts = fuzzySearch.searchScripts;

// ---------------------------------------------------------------------------
// fuzzyScore
// ---------------------------------------------------------------------------

describe('fuzzyScore — basic tiers', function () {
  it('returns 100 for exact match (case-insensitive)', function () {
    expect(fuzzyScore('format json', 'format json')).toBe(100);
    expect(fuzzyScore('FORMAT JSON', 'format json')).toBe(100);
    expect(fuzzyScore('Format JSON', 'format json')).toBe(100);
  });

  it('returns 80 for starts-with match', function () {
    expect(fuzzyScore('format', 'format json')).toBe(80);
    expect(fuzzyScore('FORMAT', 'format json')).toBe(80);
  });

  it('returns 60 for contains match', function () {
    expect(fuzzyScore('json', 'format json')).toBe(60);
    expect(fuzzyScore('JSON', 'Format JSON')).toBe(60);
  });

  it('returns 20+ for subsequence match', function () {
    var score = fuzzyScore('fj', 'format json');
    expect(score).toBeGreaterThanOrEqual(20);
    expect(score).toBeLessThan(60);
  });

  it('returns 0 for no match', function () {
    expect(fuzzyScore('xyz', 'format json')).toBe(0);
    expect(fuzzyScore('zzz', 'format json')).toBe(0);
  });

  it('returns 0 for empty query', function () {
    expect(fuzzyScore('', 'format json')).toBe(0);
  });

  it('returns 0 for empty text', function () {
    expect(fuzzyScore('json', '')).toBe(0);
  });
});

describe('fuzzyScore — tier ordering', function () {
  it('exact > starts-with > contains > subsequence', function () {
    var exactScore   = fuzzyScore('json', 'json');
    var startsScore  = fuzzyScore('jso', 'json');
    var containsScore = fuzzyScore('son', 'json'); // contains but not starts-with
    var subseqScore  = fuzzyScore('jsn', 'json'); // subsequence

    expect(exactScore).toBeGreaterThan(startsScore);
    expect(startsScore).toBeGreaterThan(containsScore);
    expect(containsScore).toBeGreaterThan(subseqScore);
    expect(subseqScore).toBeGreaterThan(0);
  });
});

describe('fuzzyScore — consecutive bonus', function () {
  it('consecutive subsequence match scores higher than non-consecutive', function () {
    // 'abc' is entirely consecutive in 'abcdef' vs scattered in 'axbxcx'
    var consecutiveScore = fuzzyScore('abc', 'abcdef');
    var scatteredScore   = fuzzyScore('abc', 'axbxcx');
    // Both are subsequence matches; consecutive should score higher
    expect(consecutiveScore).toBeGreaterThan(scatteredScore);
  });
});

describe('fuzzyScore — case insensitivity', function () {
  it('query uppercase matches lowercase text', function () {
    expect(fuzzyScore('JSON', 'format json')).toBe(60);
  });

  it('mixed case query', function () {
    expect(fuzzyScore('ForMat', 'format json')).toBe(80);
  });
});

// ---------------------------------------------------------------------------
// searchScripts
// ---------------------------------------------------------------------------

var SAMPLE_SCRIPTS = [
  { name: 'Format JSON',    description: 'Formats JSON with indentation', tags: 'json,format,pretty' },
  { name: 'Base64 Encode',  description: 'Encode text to Base64',         tags: 'base64,encode' },
  { name: 'Sort Lines',     description: 'Sort lines alphabetically',     tags: 'sort,lines' },
  { name: 'Upper Case',     description: 'Convert text to uppercase',     tags: 'case,upper' },
  { name: 'Lower Case',     description: 'Convert text to lowercase',     tags: 'case,lower' },
  { name: 'UUID Generator', description: 'Generate a UUID v4',            tags: 'uuid,generate,random' }
];

describe('searchScripts — empty query', function () {
  it('returns first 50 scripts when query is empty string', function () {
    var result = searchScripts(SAMPLE_SCRIPTS, '');
    expect(result).toEqual(SAMPLE_SCRIPTS);
  });

  it('returns first 50 of a large set', function () {
    var large = [];
    for (var i = 0; i < 100; i++) {
      large.push({ name: 'Script ' + i, description: '', tags: '' });
    }
    var result = searchScripts(large, '');
    expect(result.length).toBe(50);
  });
});

describe('searchScripts — filtering', function () {
  it('finds Format JSON by exact name query', function () {
    var result = searchScripts(SAMPLE_SCRIPTS, 'format json');
    expect(result[0].name).toBe('Format JSON');
  });

  it('finds Base64 Encode by starts-with query', function () {
    var result = searchScripts(SAMPLE_SCRIPTS, 'base64');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].name).toBe('Base64 Encode');
  });

  it('finds scripts by tag', function () {
    var result = searchScripts(SAMPLE_SCRIPTS, 'uuid');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].name).toBe('UUID Generator');
  });

  it('finds scripts by description keyword', function () {
    var result = searchScripts(SAMPLE_SCRIPTS, 'alphabetically');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].name).toBe('Sort Lines');
  });

  it('returns empty array when nothing matches', function () {
    var result = searchScripts(SAMPLE_SCRIPTS, 'xxxxxxxxnotfound');
    expect(result).toEqual([]);
  });
});

describe('searchScripts — ranking', function () {
  it('name match ranked higher than tag-only match', function () {
    // 'case' appears in both name ('Upper Case', 'Lower Case') and tags
    // but name match should dominate
    var result = searchScripts(SAMPLE_SCRIPTS, 'upper');
    expect(result[0].name).toBe('Upper Case');
  });

  it('exact name match ranked first', function () {
    var result = searchScripts(SAMPLE_SCRIPTS, 'sort lines');
    expect(result[0].name).toBe('Sort Lines');
  });
});

describe('searchScripts — edge cases', function () {
  it('handles scripts with empty description and tags', function () {
    var sparse = [
      { name: 'My Tool', description: '', tags: '' }
    ];
    var result = searchScripts(sparse, 'my');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('My Tool');
  });

  it('handles empty scripts array', function () {
    var result = searchScripts([], 'json');
    expect(result).toEqual([]);
  });

  it('is case-insensitive for queries', function () {
    var result1 = searchScripts(SAMPLE_SCRIPTS, 'JSON');
    var result2 = searchScripts(SAMPLE_SCRIPTS, 'json');
    expect(result1.map(function (s) { return s.name; }))
      .toEqual(result2.map(function (s) { return s.name; }));
  });
});
