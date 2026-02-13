import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook/register",
  "/error",
]);

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return;
  }

  // Redirect unauthenticated users to sign-in
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Handle admin route protection
  if (isAdminRoute(req)) {
    try {
      const user = await fetch(
        `https://api.clerk.com/v1/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          },
        }
      ).then(res => res.json());

      const role = user?.public_metadata?.role;

      if (role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

    } catch {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
