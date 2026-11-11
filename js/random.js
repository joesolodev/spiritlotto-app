// Cryptographic randomness with rejection sampling, so every value is exactly equally likely.
// Math.random is never used.
// Values are fetched from the crypto source in batches; each one is used once.
const buf = new Uint32Array(4096);
let pos = buf.length;

function nextUint32() {
  if (pos >= buf.length) {
    globalThis.crypto.getRandomValues(buf);
    pos = 0;
  }
  return buf[pos++];
}

export function randomInt(min, max) {
  const range = max - min + 1;
  const limit = Math.floor(2 ** 32 / range) * range; // largest multiple of range below 2^32
  let x;
  do {
    x = nextUint32();
  } while (x >= limit);
  return min + (x % range);
}

// `count` distinct numbers from min..max (partial Fisher-Yates), returned sorted.
export function sampleDistinct(count, min, max) {
  const pool = [];
  for (let n = min; n <= max; n++) pool.push(n);
  for (let i = 0; i < count; i++) {
    const j = randomInt(i, pool.length - 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).sort((a, b) => a - b);
}
