import { SignJWT, jwtVerify } from "jose";
import { cookies as nextCookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret");
const cookieName = "session";

type SessionPayload = {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
};

export async function createSessionCookie(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const cookie = `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60};`;
  return cookie;
}

export function clearSessionCookie(): string {
  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`;
}

export async function verifySessionFromRequest(req: Request): Promise<SessionPayload | null> {
  try {
    // Prefer NextRequest cookies API if available, fallback to header parsing
    const tokenFromNext = (req as unknown as { cookies?: { get: (name: string) => { value?: string } | undefined } }).cookies?.get?.(cookieName)?.value;
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader ? cookieHeader.match(new RegExp(`(?:^|; )${cookieName}=([^;]+)`)) : null;
    let token = tokenFromNext || match?.[1];
    if (!token) {
      try {
        const store = await nextCookies();
        token = store.get(cookieName)?.value;
      } catch {
        // ignore if not in a request context that supports next/headers
      }
    }
    if (!token) {
      console.log("LOG =====> Session cookie not found");
      return null;
    }
    try {
      const { payload } = await jwtVerify(token, secret);
      return payload as unknown as SessionPayload;
    } catch (e) {
      console.log("LOG =====> Failed to verify session token");
      return null;
    }
  } catch (e) {
    console.log("LOG =====> Error reading cookies from request");
    return null;
  }
}

export async function verifySessionFromCookies(): Promise<SessionPayload | null> {
  try {
    if (typeof window !== "undefined") return null;
    const store = await nextCookies();
    const token = store.get(cookieName)?.value;
    if (!token) {
      console.log("LOG =====> Session cookie not found via next/headers");
      return null;
    }
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch (e) {
    console.log("LOG =====> Failed to verify session token from cookies");
    return null;
  }
}

export { cookieName };



// Verify session using cookies() only (server components / route handlers without a Request)
export async function verifySessionFromCookiesOnly(): Promise<SessionPayload | null> {
  try {
    if (typeof window !== "undefined") return null;
    const store = await nextCookies();
    const token = store.get(cookieName)?.value;
    if (!token) {
      return null;
    }
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
