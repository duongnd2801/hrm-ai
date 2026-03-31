import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('hrm_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Nếu chưa login (không có token), chỉ cho phép vào /login
  if (!token && !pathname.startsWith('/login') && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Nếu đã login mà vào /login, chuyển sang dashboard
  if (token && (pathname.startsWith('/login') || pathname === '/')) {
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
