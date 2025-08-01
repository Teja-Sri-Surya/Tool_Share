import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Define protected routes
const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  // Temporarily disable middleware to allow Django session-based auth
  // TODO: Update to work with Django session authentication
  return NextResponse.next();
  
  // Original JWT-based middleware (commented out)
  /*
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token')?.value;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If accessing protected route without token, redirect to login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If accessing auth routes with valid token, redirect to dashboard
  if (isAuthRoute && token) {
    try {
      jwt.verify(token, JWT_SECRET);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch {
      // Invalid token, continue to auth page
    }
  }

  return NextResponse.next();
  */
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
}; 