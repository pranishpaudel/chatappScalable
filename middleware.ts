import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwtValidationFunction from "./helpers/jwtValidationFunctionForMiddleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value || "";
  const REDIRECTION_FOR_UNAUTHENTICATED = `${request.nextUrl.origin}/auth`;

  const isJwtValid = await jwtValidationFunction(token);
  if (pathname === "/auth" && isJwtValid) {
    return NextResponse.redirect(`${request.nextUrl.origin}/profile`);
  }
  // Bypass the middleware for the /auth path
  if (pathname === "/auth") {
    return NextResponse.next();
  }

  if (!token || !isJwtValid) {
    return NextResponse.redirect(REDIRECTION_FOR_UNAUTHENTICATED);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/profile", "/auth"],
};
