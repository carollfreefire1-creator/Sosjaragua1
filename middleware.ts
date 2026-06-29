import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

const RATE_LIMITED_PREFIXES: Array<{ prefix: string; preset: keyof typeof RATE_LIMITS }> = [
  { prefix: "/api/push/subscribe", preset: "pushSubscribe" },
  { prefix: "/api/coupons/apply", preset: "couponApply" },
  { prefix: "/api/contato", preset: "contactForm" },
  { prefix: "/api/requests", preset: "serviceRequest" },
  { prefix: "/login", preset: "login" },
  { prefix: "/cadastro", preset: "signup" },
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });
  const { pathname } = request.nextUrl;

  // ── Rate limiting básico para rotas sensíveis ──────────────────────────
  const matched = RATE_LIMITED_PREFIXES.find((r) => pathname.startsWith(r.prefix));
  if (matched) {
    const ip = getClientIp(request.headers);
    const preset = RATE_LIMITS[matched.preset];
    const result = await rateLimit({ key: `${ip}:${matched.prefix}`, ...preset });

    if (!result.success) {
      return new NextResponse(
        JSON.stringify({ error: "Muitas requisições. Tente novamente em breve." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }
  }

  // ── Sessão Supabase (necessário para SSR de cookies de auth) ───────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as any);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ── Proteção do painel administrativo ──────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    // A verificação de role === "admin" é feita em lib/admin/auth.ts (requireAdmin),
    // que tem acesso ao Prisma/banco — o middleware roda em Edge e evita essa consulta aqui.
  }

  // ── Proteção de rotas autenticadas gerais ──────────────────────────────
  if (pathname.startsWith("/conta") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/conta/:path*",
    "/login",
    "/cadastro",
    "/api/push/:path*",
    "/api/coupons/:path*",
    "/api/contato/:path*",
    "/api/requests/:path*",
  ],
};
