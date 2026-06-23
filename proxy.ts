import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const { pathname } = request.nextUrl;

    // 1. Protection globale : Si aucune session n'est active
    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 2. Protection fine par Rôle pour le Back-office (/admin)
    // On bloque l'accès si l'utilisateur n'est pas explicitement "admin" ou "commercial"
    if (pathname.startsWith("/admin")) {
        const userRole = session.user.role; // Récupéré grâce aux additionalFields de Better-Auth

        if (userRole !== "admin" && userRole !== "commercial") {
            // L'utilisateur est connecté mais n'a pas les droits -> Redirection vers son espace client
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
  // On élargit le matcher pour intercepter le dashboard ET le back-office admin
  matcher: ["/dashboard/:path*", "/admin/:path*"], 
};