import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RATE_LIMIT_WINDOWS = {
  api: { max: 120, windowMs: 60_000 },
  unauthorized: { max: 20, windowMs: 60_000 },
} as const;

type RateLimitBucket = keyof typeof RATE_LIMIT_WINDOWS;

interface RateLimitState {
  count: number;
  resetAt: number;
}

const PUBLIC_PATHS = new Set(["/login"]);
const rateLimitStore = new Map<string, RateLimitState>();

function setSecurityHeaders(response: NextResponse) {
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    scriptSrc,
    "connect-src 'self' https: wss: ws:",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  return response;
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [firstIp] = forwarded.split(",");
    return firstIp?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(request: NextRequest, bucket: RateLimitBucket) {
  const { max, windowMs } = RATE_LIMIT_WINDOWS[bucket];
  const key = `${bucket}:${getClientIp(request)}`;
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (current.count >= max) {
    return true;
  }

  current.count += 1;
  return false;
}

function getSupabaseAuthConfig() {
  const url = process.env.SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

function buildUnauthenticatedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (nextPath !== "/login") {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}

function buildForbiddenResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "You are not allowed to access this app." }, { status: 403 });
  }
  return new NextResponse("You are not allowed to access this app.", { status: 403 });
}

function buildMisconfiguredResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { message: "Server authentication is not configured. Missing Supabase env vars." },
      { status: 500 },
    );
  }
  return new NextResponse("Server authentication is not configured.", { status: 500 });
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/") && isRateLimited(request, "api")) {
    return setSecurityHeaders(
      NextResponse.json(
        { message: "Too many requests. Please try again in a minute." },
        { status: 429 },
      ),
    );
  }

  const authConfig = getSupabaseAuthConfig();
  if (!authConfig) {
    return setSecurityHeaders(buildMisconfiguredResponse(request));
  }

  let response = NextResponse.next();
  const supabase = createServerClient(authConfig.url, authConfig.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isPublicPath = PUBLIC_PATHS.has(request.nextUrl.pathname);

  if (!user) {
    if (isPublicPath) {
      return setSecurityHeaders(response);
    }
    if (isRateLimited(request, "unauthorized")) {
      return setSecurityHeaders(
        NextResponse.json(
          { message: "Too many unauthorized attempts. Please try again later." },
          { status: 429 },
        ),
      );
    }
    return setSecurityHeaders(buildUnauthenticatedResponse(request));
  }

  const ownerEmail = process.env.APP_OWNER_EMAIL?.trim().toLowerCase();
  if (ownerEmail) {
    const userEmail = user.email?.trim().toLowerCase() ?? "";
    if (userEmail !== ownerEmail) {
      return setSecurityHeaders(buildForbiddenResponse(request));
    }
  }

  if (isPublicPath) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const destination = nextParam && nextParam.startsWith("/") ? nextParam : "/";
    return setSecurityHeaders(NextResponse.redirect(new URL(destination, request.url)));
  }

  return setSecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
