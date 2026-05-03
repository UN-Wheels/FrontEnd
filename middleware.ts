import { NextRequest, NextResponse } from 'next/server';
const PUBLIC_PATHS = ['/', '/login', '/register'];
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;
  const isPublic = PUBLIC_PATHS.includes(pathname);
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
