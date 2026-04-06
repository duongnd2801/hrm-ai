import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get('hrm_access')?.value;
  const refreshToken = request.cookies.get('hrm_refresh')?.value;
  const hasAuth = accessToken || refreshToken;
  const { pathname } = request.nextUrl;

  // 1. Nếu chưa login (không có token nào), chỉ cho phép vào /login
  if (!hasAuth && !pathname.startsWith('/login') && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Nếu đã có token mà cố tình vào /login, chuyển sang dashboard
  if (hasAuth && (pathname.startsWith('/login') || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
