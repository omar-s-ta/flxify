'use strict';

/**
 * fuzzy-search — fuzzy scoring for the command palette.
 *
 * Ported directly from the web app's app.js scoring logic. Produces identical
 * search results to the web app so the palette behaviour is consistent across
 * all Flxify platforms.
 *
 * Scoring:
 *   100 — exact match (case-insensitive)
 *    80 — starts-with match
 *    60 — contains match
 *    20+ — subsequence match (bonus for consecutive character runs)
 *     0 — no match
 *
 * Weighted field scoring:
 *   name (×0.9), tags (×0.6), description (×0.2)
 * The final score is the maximum across fields, which means a name-exact match
 * (90) beats a tags-starts-with match (48) — matching user intuition.
 */

/**
 * Compute a fuzzy match score between a query string and a target string.
 *
 * @param {string} query  - The search input (may be empty)
 * @param {string} text   - The field value to match against
 * @returns {number}  Score in range [0, 100]
 */
function fuzzyScore(query, text) {
  if (!query) return 0;

  var q = query.toLowerCase();
  var t = (text || '').toLowerCase();

  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.indexOf(q) !== -1) return 60;

  // Subsequence match with consecutive-character bonus
  var qi = 0;
  var score = 0;
  var consecutive = 0;

  for (var ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
      consecutive++;
      score += consecutive;
    } else {
      consecutive = 0;
    }
  }

  // Only return a non-zero score if every character of the query was matched
  return qi === q.length ? 20 + score : 0;
}

/**
 * Filter and rank a list of scripts based on a query string.
 *
 * @param {Array<{name: string, description: string, tags: string}>} scripts
 * @param {string} query  - Search query from the palette input
 * @returns {Array}  Filtered+ranked scripts (only positive-scoring ones)
 */
function searchScripts(scripts, query) {
  if (!query) {
    // No query — return the first 50 scripts in their default sorted order
    return scripts.slice(0, 50);
  }

  var results = [];

  for (var i = 0; i < scripts.length; i++) {
    var s = scripts[i];

    var nameScore = fuzzyScore(query, s.name) * 0.9;
    var tagScore  = fuzzyScore(query, s.tags) * 0.6;
    var descScore = fuzzyScore(query, s.description) * 0.2;

    var score = Math.max(nameScore, tagScore, descScore);

    if (score > 0) {
      results.push({ script: s, score: score });
    }
  }

  // Sort descending by score, then alphabetically for ties
  results.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.script.name.localeCompare(b.script.name);
  });

  return results.map(function (r) { return r.script; });
}

module.exports = { fuzzyScore: fuzzyScore, searchScripts: searchScripts };
