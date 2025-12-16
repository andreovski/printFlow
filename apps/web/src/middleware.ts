import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  // Public routes that don't require authentication
  const isPublicRoute =
    request.nextUrl.pathname.startsWith('/auth/sign-in') ||
    request.nextUrl.pathname.startsWith('/auth/sign-up') ||
    request.nextUrl.pathname.startsWith('/approval') ||
    request.nextUrl.pathname.startsWith('/a/') ||
    request.nextUrl.pathname.startsWith('/api/uploadthing');

  // 1. Unauthenticated users trying to access protected routes
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  // 2. Authenticated users
  if (token) {
    // Decode token to check organization
    let hasOrganization = false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      hasOrganization = !!payload.organizationId;
    } catch (_e) {
      // Invalid token, let it proceed to be handled by API or sign out
    }

    const isAuthPage =
      request.nextUrl.pathname === '/auth/sign-in' || request.nextUrl.pathname === '/auth/sign-up';
    const isSetupPage = request.nextUrl.pathname === '/auth/setup-organization';

    // 2a. User with organization trying to access auth pages or setup page
    if (hasOrganization && (isAuthPage || isSetupPage)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 2b. User WITHOUT organization trying to access protected routes (except setup page)
    if (!hasOrganization && !isSetupPage && !isPublicRoute) {
      return NextResponse.redirect(new URL('/auth/setup-organization', request.url));
    }

    // 2c. User WITHOUT organization trying to access auth pages (sign-in/sign-up)
    // Should we redirect them to setup? Yes, if they are already logged in.
    if (!hasOrganization && isAuthPage) {
      return NextResponse.redirect(new URL('/auth/setup-organization', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
