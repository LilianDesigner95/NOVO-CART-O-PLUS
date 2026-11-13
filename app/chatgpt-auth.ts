import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const TEAM_DOMAIN = "wandering-lab-de40.cloudflareaccess.com";
const EXPECTED_ISSUER = `https://${TEAM_DOMAIN}`;
const ACCESS_AUD = "05b85fd9848b9280d4a95a9fdae34fb664e649a9d95b3f1162adef6351152af3";
const ALLOWED_EMAIL = "liriosdesigner071@gmail.com";

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(bytes, char => char.charCodeAt(0));
}

async function verifiedAccessEmail(jwt: string): Promise<string | null> {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    if (header.alg !== "RS256" || typeof header.kid !== "string") return null;
    const response = await fetch(`${EXPECTED_ISSUER}/cdn-cgi/access/certs`);
    if (!response.ok) return null;
    const jwks = await response.json() as { keys?: Array<JsonWebKey & { kid?: string }> };
    const jwk = jwks.keys?.find(key => key.kid === header.kid && key.kty === "RSA");
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = Uint8Array.from(decodeBase64Url(parts[2])).buffer;
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signed);
    if (!valid) return null;
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as {
      iss?: string; aud?: string | string[]; exp?: number; nbf?: number; email?: string;
    };
    const now = Math.floor(Date.now() / 1000);
    const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (claims.iss !== EXPECTED_ISSUER || !audience.includes(ACCESS_AUD) ||
        typeof claims.exp !== "number" || claims.exp <= now ||
        (typeof claims.nbf === "number" && claims.nbf > now)) return null;
    return typeof claims.email === "string" ? claims.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const token = requestHeaders.get("cf-access-jwt-assertion");
  if (!token) return null;
  const email = await verifiedAccessEmail(token);
  if (email !== ALLOWED_EMAIL) return null;
  return { userId: email, email, displayName: "Lirios Designer", fullName: null };
}

export async function requireChatGPTUser(_returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect("/cdn-cgi/access/login");
}

export function chatGPTSignInPath(_returnTo: string): string {
  return "/cdn-cgi/access/login";
}

export function chatGPTSignOutPath(_returnTo = "/"): string {
  return "/cdn-cgi/access/logout";
}

// Portal access requires a Cloudflare Access identity with the same verified audience.
// Admin-only restrictions remain enforced separately by getChatGPTUser().
export async function getVerifiedAccessEmail():Promise<string|null>{const h=await headers();const jwt=h.get('cf-access-jwt-assertion');return jwt?verifiedAccessEmail(jwt):null}
