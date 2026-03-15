import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const ACCESS_COOKIE = 'site_access';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (MAINTENANCE_MODE) {
    if (pathname === '/onderhoud') return NextResponse.next();
    return NextResponse.redirect(new URL('/onderhoud', request.url));
  }

  if (pathname === '/toegang' || pathname === '/onderhoud') {
    return NextResponse.next();
  }

  const siteKey = process.env.SITE_ACCESS_KEY;
  if (siteKey) {
    const accessCookie = request.cookies.get(ACCESS_COOKIE);
    if (accessCookie?.value !== siteKey) {
      return NextResponse.redirect(new URL('/toegang', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
