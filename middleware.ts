import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareSupabaseClient(request);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isDashboard && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthPage && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.searchParams.delete('next');
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup']
};
