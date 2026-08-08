/**
 * Hashing.
 *
 * SHA-1/256/384/512 come from Web Crypto, which is available in every target
 * (and in Electron's sandboxed renderer). MD5 is not in Web Crypto at all — it's
 * deliberately excluded as obsolete — so it is implemented here rather than
 * pulled in as a dependency, because file-checksum verification is exactly the
 * legacy case people still need it for.
 */

export type HashAlgorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const HASH_ALGORITHMS: readonly HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// ─── MD5 (RFC 1321) ───────────────────────────────────────────────────────

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
  14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21, 6, 10, 15, 21,
];

/** K[i] = floor(2^32 × |sin(i + 1)|) — the RFC's sine-derived constants. */
const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32));

const rotl32 = (value: number, shift: number) => (value << shift) | (value >>> (32 - shift));

function md5Bytes(input: Uint8Array): string {
  const originalBitLength = input.length * 8;

  // Pad to a multiple of 64 bytes: a 0x80 byte, zeros, then the 64-bit length.
  const paddedLength = (((input.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;

  const view = new DataView(padded.buffer);
  // Little-endian length, low word first. Lengths above 2^32 bits (512MB) would
  // need the high word; hashing input that large in a browser tab is not a case
  // this tool supports.
  view.setUint32(paddedLength - 8, originalBitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(originalBitLength / 2 ** 32), true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const words = new Int32Array(16);

  for (let chunk = 0; chunk < paddedLength; chunk += 64) {
    for (let i = 0; i < 16; i += 1) words[i] = view.getInt32(chunk + i * 4, true);

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i += 1) {
      let f: number;
      let g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      const temp = d;
      d = c;
      c = b;
      // |0 keeps the intermediate in int32 range; JS numbers would otherwise
      // lose the low bits once the sum exceeds 2^53.
      const sum = (a + f + (MD5_K[i] ?? 0) + (words[g] ?? 0)) | 0;
      b = (b + rotl32(sum, MD5_S[i] ?? 0)) | 0;
      a = temp;
    }

    a0 = (a0 + a) | 0;
    b0 = (b0 + b) | 0;
    c0 = (c0 + c) | 0;
    d0 = (d0 + d) | 0;
  }

  const out = new DataView(new ArrayBuffer(16));
  out.setInt32(0, a0, true);
  out.setInt32(4, b0, true);
  out.setInt32(8, c0, true);
  out.setInt32(12, d0, true);

  return toHex(out.buffer);
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function hashBytes(bytes: Uint8Array, algorithm: HashAlgorithm): Promise<string> {
  if (algorithm === 'MD5') return md5Bytes(bytes);

  // Copy into a fresh buffer: a Uint8Array view over a larger ArrayBuffer would
  // otherwise hash the whole backing store.
  const copy = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest(algorithm, copy);
  return toHex(digest);
}

export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  return hashBytes(new TextEncoder().encode(text), algorithm);
}

/** All five digests at once, in the canonical display order. */
export async function hashTextAll(text: string): Promise<Record<HashAlgorithm, string>> {
  const bytes = new TextEncoder().encode(text);
  const entries = await Promise.all(
    HASH_ALGORITHMS.map(async (algorithm) => [algorithm, await hashBytes(bytes, algorithm)] as const),
  );
  return Object.fromEntries(entries) as Record<HashAlgorithm, string>;
}

export async function hashFile(file: File, algorithm: HashAlgorithm): Promise<string> {
  const buffer = await file.arrayBuffer();
  return hashBytes(new Uint8Array(buffer), algorithm);
}

/** Constant-shape comparison that ignores case and surrounding whitespace,
 *  which is how hashes appear when pasted from a checksum file. */
export function hashesMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== '';
}
