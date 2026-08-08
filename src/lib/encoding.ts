/**
 * Base64, URL and JWT encoding helpers.
 *
 * `btoa`/`atob` operate on Latin-1, so passing them a string containing any
 * character above U+00FF throws. Everything here routes through TextEncoder /
 * TextDecoder so accented characters and emoji survive a round trip — which is
 * the bug in most hand-rolled base64 helpers.
 */

export function bytesToBase64(bytes: Uint8Array): string {
  // Chunked so a large file doesn't blow the argument limit on String.fromCharCode.
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeBase64(text: string, urlSafe = false): string {
  const base64 = bytesToBase64(new TextEncoder().encode(text));
  return urlSafe ? toUrlSafe(base64) : base64;
}

export function toUrlSafe(base64: string): string {
  // The URL-safe alphabet swaps +/ for -_ and drops the padding.
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromUrlSafe(input: string): string {
  const restored = input.replace(/-/g, '+').replace(/_/g, '/');
  // Re-pad to a multiple of four, which atob requires.
  const remainder = restored.length % 4;
  return remainder === 0 ? restored : restored + '='.repeat(4 - remainder);
}

export interface DecodeResult {
  ok: boolean
  value: string;
  error?: string;
}

export function decodeBase64(input: string): DecodeResult {
  const cleaned = input.trim().replace(/\s/g, '');
  if (cleaned === '') return { ok: true, value: '' };

  try {
    const bytes = base64ToBytes(fromUrlSafe(cleaned));
    // `fatal` makes an invalid byte sequence throw instead of silently
    // producing replacement characters, so the user is told it wasn't text.
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, value: text };
  } catch {
    return {
      ok: false,
      value: '',
      error: 'That is not valid Base64, or it decodes to binary rather than text.',
    };
  }
}

/** True when a string is plausibly Base64 — used to auto-pick decode mode. */
export function looksLikeBase64(input: string): boolean {
  const cleaned = input.trim().replace(/\s/g, '');
  if (cleaned.length < 4 || cleaned.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(cleaned);
}

// ─── Data URIs ────────────────────────────────────────────────────────────

export function toDataUri(base64: string, mimeType: string): string {
  return `data:${mimeType || 'application/octet-stream'};base64,${base64}`;
}

export function parseDataUri(input: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;,]*)(;[^,]*)?,(.*)$/s.exec(input.trim());
  if (!match) return null;
  const [, mimeType, parameters, payload] = match;
  const isBase64 = (parameters ?? '').includes('base64');
  return {
    mimeType: mimeType || 'text/plain',
    base64: isBase64 ? (payload ?? '') : bytesToBase64(new TextEncoder().encode(decodeURIComponent(payload ?? ''))),
  };
}

// ─── JWT ──────────────────────────────────────────────────────────────────

export interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

export type JwtResult = { ok: true; jwt: JwtParts } | { ok: false; error: string };

/**
 * Decode a JWT without verifying it.
 *
 * Verification would need the signing key, which this tool deliberately never
 * asks for — the point is inspecting claims locally. The UI says as much, so
 * nobody mistakes "decoded" for "trusted".
 */
export function decodeJwt(token: string): JwtResult {
  const trimmed = token.trim().replace(/^Bearer\s+/i, '');
  if (trimmed === '') return { ok: false, error: 'Paste a token to decode it.' };

  const segments = trimmed.split('.');
  if (segments.length !== 3) {
    return {
      ok: false,
      error: `A JWT has three dot-separated parts; this has ${segments.length}.`,
    };
  }

  const [headerRaw, payloadRaw, signatureRaw] = segments as [string, string, string];

  const parseSegment = (segment: string, name: string): Record<string, unknown> | string => {
    const decoded = decodeBase64(segment);
    if (!decoded.ok) return `The ${name} is not valid base64url.`;
    try {
      const parsed: unknown = JSON.parse(decoded.value);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return `The ${name} is not a JSON object.`;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return `The ${name} is not valid JSON.`;
    }
  };

  const header = parseSegment(headerRaw, 'header');
  if (typeof header === 'string') return { ok: false, error: header };

  const payload = parseSegment(payloadRaw, 'payload');
  if (typeof payload === 'string') return { ok: false, error: payload };

  return {
    ok: true,
    jwt: {
      header,
      payload,
      signature: signatureRaw,
      raw: { header: headerRaw, payload: payloadRaw, signature: signatureRaw },
    },
  };
}

/** Human explanations for the registered claims, shown beside each value. */
export const JWT_CLAIM_DESCRIPTIONS: Record<string, string> = {
  iss: 'Issuer — who created the token',
  sub: 'Subject — who the token is about',
  aud: 'Audience — who the token is intended for',
  exp: 'Expires at',
  nbf: 'Not valid before',
  iat: 'Issued at',
  jti: 'JWT ID — unique identifier for this token',
  alg: 'Signing algorithm',
  typ: 'Token type',
  kid: 'Key ID — which key signed this',
  scope: 'Granted scopes',
  azp: 'Authorised party',
  email: 'Email address',
  name: 'Display name',
};

/** Claims whose values are NumericDate (seconds since the epoch). */
export const JWT_TIME_CLAIMS = ['exp', 'nbf', 'iat', 'auth_time', 'updated_at'] as const;

export interface JwtValidity {
  expired: boolean;
  notYetValid: boolean;
  expiresAt: Date | null;
  notBefore: Date | null;
  issuedAt: Date | null;
}

export function jwtValidity(payload: Record<string, unknown>, now = Date.now()): JwtValidity {
  const seconds = (key: string): Date | null => {
    const value = payload[key];
    return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000) : null;
  };

  const expiresAt = seconds('exp');
  const notBefore = seconds('nbf');

  return {
    expired: expiresAt !== null && expiresAt.getTime() <= now,
    notYetValid: notBefore !== null && notBefore.getTime() > now,
    expiresAt,
    notBefore,
    issuedAt: seconds('iat'),
  };
}

// ─── URL ──────────────────────────────────────────────────────────────────

export interface ParsedUrl {
  protocol: string;
  host: string;
  hostname: string;
  port: string;
  pathname: string;
  hash: string;
  params: Array<{ key: string; value: string }>;
  origin: string;
}

export function parseUrl(input: string): ParsedUrl | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  try {
    // Assume https when no scheme is given, so "example.com/x" still parses.
    const url = new URL(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`);
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      hash: url.hash.replace('#', ''),
      params: [...url.searchParams.entries()].map(([key, value]) => ({ key, value })),
      origin: url.origin,
    };
  } catch {
    return null;
  }
}

export function buildUrl(parsed: ParsedUrl): string {
  const search = parsed.params
    .filter((param) => param.key !== '')
    .map((param) => `${encodeURIComponent(param.key)}=${encodeURIComponent(param.value)}`)
    .join('&');

  return [
    `${parsed.protocol}://${parsed.host}`,
    parsed.pathname,
    search ? `?${search}` : '',
    parsed.hash ? `#${parsed.hash}` : '',
  ].join('');
}
