import { NextRequest, NextResponse } from 'next/server';
import { SITE_NAME } from '@/lib/site';

/**
 * HTTP Basic Auth gate for the internal /testing page.
 * Credentials are configurable via env; defaults are provided for local use.
 *   TESTING_AUTH_USER      (default: "testing")
 *   TESTING_AUTH_PASSWORD  (default: "refugeesupport2026")
 */
export function middleware(req: NextRequest) {
  const expectedUser = process.env.TESTING_AUTH_USER ?? 'testing';
  const expectedPass = process.env.TESTING_AUTH_PASSWORD ?? 'refugeesupport2026';

  const header = req.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const separator = decoded.indexOf(':');
      const user = decoded.slice(0, separator);
      const pass = decoded.slice(separator + 1);
      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${SITE_NAME} Testing", charset="UTF-8"`,
    },
  });
}

export const config = {
  matcher: ['/testing', '/testing/:path*'],
};
