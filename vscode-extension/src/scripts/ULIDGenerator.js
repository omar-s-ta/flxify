/**
  {
    "api": 1,
    "name": "ULID Generator",
    "description": "Generates random ULIDs (Universally Unique Lexicographically Sortable Identifiers). Select a number to generate multiple (max 1000)",
    "author": "Flxify",
    "icon": "shuffle",
    "tags": "ulid,id,generate,random,sortable"
  }
**/

function main(state) {
  var CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  function encodeTime(now, len) {
    var str = '';
    for (var i = len - 1; i >= 0; i--) {
      var mod = now % 32;
      str = CROCKFORD[mod] + str;
      now = Math.floor((now - mod) / 32);
    }
    return str;
  }

  function encodeRandom(len) {
    var bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    var str = '';
    for (var i = 0; i < len; i++) {
      str += CROCKFORD[bytes[i] % 32];
    }
    return str;
  }

  function generateULID() {
    var now = Date.now();
    var timestamp = encodeTime(now, 10);
    var random = encodeRandom(16);
    return timestamp + random;
  }

  if (state.isSelection) {
    var count = 1;
    var trimmed = state.text.trim();
    if (trimmed.length > 0 && !isNaN(trimmed) && parseInt(trimmed) > 0) {
      count = parseInt(trimmed);
      if (count > 1000) count = 1000;
    }
    var ulids = [];
    for (var i = 0; i < count; i++) {
      ulids.push(generateULID());
    }
    state.text = ulids.join('\n');
  } else {
    state.insert(generateULID());
  }
}
