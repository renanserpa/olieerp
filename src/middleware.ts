import { type NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = await createSupabaseMiddlewareClient(request);

    // Refresh session if expired - required for Server Components
    const { data: { session } } = await supabase.auth.getSession();

    // Define public routes (accessible without login)
    const publicRoutes = ["/login", "/register", "/password-reset"]; 

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route));

    // If user is not logged in and trying to access a protected route, redirect to login
    if (!session && !isPublicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // If user is logged in and trying to access the login page, redirect to dashboard
    if (session && request.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/", request.url)); // Redirect to dashboard root
    }

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    // Em caso de erro na autenticação, permitir o acesso e deixar a página lidar com isso
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
