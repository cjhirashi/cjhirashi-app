import { updateSession } from "@/lib/supabase/middleware";
import { protectAdminRoutes } from "@/lib/auth/middleware";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // First, update the session (handle auth refresh)
  const response = await updateSession(request);

  // If updateSession redirected, return that response
  if (response.status === 307 || response.status === 308) {
    return response;
  }

  // Then, check admin route protection
  return await protectAdminRoutes(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
