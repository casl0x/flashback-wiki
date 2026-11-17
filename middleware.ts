import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { canAccess, levelFromRole, sectionFromPath } from "@/lib/admin/permissions";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api(.*)",
  "/__clerk/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  console.log("sessionClaims complet:", JSON.stringify(sessionClaims));

  if (userId && !isOnboardingRoute(req) && !isPublicRoute(req)) {
    const onboardingComplete = (sessionClaims?.metadata as { onboardingComplete?: boolean })?.onboardingComplete;
    console.log("onboardingComplete:", onboardingComplete);
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // --- Admin check ---
  if (isAdminRoute(req)) {
    if (!userId) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
    });
    const membership = memberships.data.find(
      (m) => m.organization.id === process.env.NEXT_PUBLIC_CLERK_ADMIN_ORG_ID,
    );
    if (!membership) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    // Les éditeurs (rôle autre que org:admin) n'ont accès qu'à certaines sections.
    const section = sectionFromPath(req.nextUrl.pathname);
    if (!section || !canAccess(levelFromRole(membership.role), section)) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};