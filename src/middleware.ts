import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/middleware/adminAuth'

export async function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname

  // Handle admin routes
  if (path.startsWith('/admin')) {
    // Don't check auth for login page
    if (path === '/admin/login') {
      return NextResponse.next()
    }

    // Check admin authentication for all other admin routes
    const token = request.cookies.get('admin_token')?.value || null
    const isAuthenticated = await verifyAdminToken(token)

    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return NextResponse.next()
  }

  // Handle non-admin routes
  const isStarted = process.env.START === 'true'

  // Don't redirect if already on coming-soon page
  if (path === '/coming-soon') {
    return NextResponse.next()
  }

  // If START is false, redirect non-admin routes to coming-soon page
  if (!isStarted) {
    return NextResponse.redirect(new URL('/coming-soon', request.url))
  }

  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 