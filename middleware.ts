// middleware.ts
import { auth } from './auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(req: NextRequest) {
  const session = await auth();

  if (!session) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', // Protect all routes under /dashboard
  ],
};
