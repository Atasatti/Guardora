const encoder = new TextEncoder();
const decoder = new TextDecoder();

type SessionPayload = {
  id: string;
  email?: string;
  role?: string;
  iat: number;
  exp: number;
};

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function textToBase64Url(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlToBytes(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
  secret: string,
  maxAgeSeconds = 60 * 60 * 24 * 30
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = textToBase64Url(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  );
  const body = textToBase64Url(
    JSON.stringify({
      ...payload,
      iat: now,
      exp: now + maxAgeSeconds,
    })
  );
  const unsignedToken = `${header}.${body}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(unsignedToken)
  );

  return `${unsignedToken}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string,
  secret: string
): Promise<boolean> {
  try {
    const [headerPart, payloadPart, signaturePart, extraPart] = token.split(".");
    if (!headerPart || !payloadPart || !signaturePart || extraPart) {
      return false;
    }

    const header = JSON.parse(
      decoder.decode(base64UrlToBytes(headerPart))
    ) as { alg?: string };
    if (header.alg !== "HS256") {
      return false;
    }

    const payload = JSON.parse(
      decoder.decode(base64UrlToBytes(payloadPart))
    ) as Partial<SessionPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof payload.id !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= now
    ) {
      return false;
    }

    const key = await importHmacKey(secret);
    return crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signaturePart),
      encoder.encode(`${headerPart}.${payloadPart}`)
    );
  } catch {
    return false;
  }
}
