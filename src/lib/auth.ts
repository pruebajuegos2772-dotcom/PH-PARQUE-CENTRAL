import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "ph_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 días

export type SessionUser = {
  id: number;
  email: string;
  role: "administrador" | "propietario";
  name: string;
  unit: string;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PHASE) {
    console.warn(
      "SESSION_SECRET no está configurado. Usa un valor temporal; configura SESSION_SECRET en Vercel.",
    );
  }
  return "dev-placeholder-secret-cambia-esto-parque-central";
}

function base64urlEncode(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function base64urlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

/** Hash scrypt con sal aleatoria. Formato: `sal:hash` en hexadecimal. */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  try {
    const actual = scryptSync(password, salt, 64);
    const expectedBuf = Buffer.from(expected, "hex");
    if (actual.length !== expectedBuf.length) return false;
    return timingSafeEqual(actual, expectedBuf);
  } catch {
    return false;
  }
}

export function normalizeRole(role: string | null | undefined): SessionUser["role"] {
  return role === "administrador" ? "administrador" : "propietario";
}

export function createSessionToken(user: Omit<SessionUser, never>) {
  const payload = { ...user, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const data = base64urlEncode(JSON.stringify(payload));
  const signature = createHmac("sha256", getSecret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string | null | undefined): SessionUser | null {
  if (!token || !token.includes(".")) return null;
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;
  const expected = createHmac("sha256", getSecret()).update(data).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  } catch {
    return false as unknown as null;
  }
  try {
    const payload = JSON.parse(base64urlDecode(data)) as SessionUser & { exp: number };
    if (!payload?.id || !payload?.email) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return {
      id: payload.id,
      email: payload.email,
      role: normalizeRole(payload.role),
      name: payload.name ?? "Usuario",
      unit: payload.unit ?? "",
    };
  } catch {
    return null;
  }
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function getSessionFromRequest(request: Request): SessionUser | null {
  const header = request.headers.get("cookie");
  const cookies = parseCookies(header);
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

export function buildSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

/** Normaliza montos escritos con coma decimal ("5,45") o punto ("5.45"). */
export function parseAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  return Number(normalized);
}
