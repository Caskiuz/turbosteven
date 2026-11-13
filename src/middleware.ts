import { NextRequest, NextResponse } from "next/server";
import { verificarToken, NOMBRE_COOKIE } from "@/lib/sesion";

const PROTEGIDAS = ["/dashboard", "/pedidos", "/clientes", "/taller", "/usuarios", "/historial", "/comanda"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sesion = await verificarToken(req.cookies.get(NOMBRE_COOKIE)?.value);

  const protegida = PROTEGIDAS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // con sesión, el login no tiene sentido
  if (pathname === "/login" && sesion) {
    return NextResponse.redirect(new URL(sesion.rol === "taller" ? "/taller" : "/dashboard", req.url));
  }

  if (!protegida) return NextResponse.next();

  if (!sesion) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // puertas por rol (además de la verificación server-side en cada API)
  const esAdmin = sesion.rol === "admin";
  const esVendedor = sesion.rol === "vendedor";
  const esTaller = sesion.rol === "taller";

  if (pathname.startsWith("/usuarios") && !esAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/historial") && esTaller) {
    return NextResponse.redirect(new URL("/taller", req.url));
  }
  if (pathname.startsWith("/clientes") && esTaller) {
    return NextResponse.redirect(new URL("/taller", req.url));
  }
  if (pathname.startsWith("/dashboard") && esTaller) {
    return NextResponse.redirect(new URL("/taller", req.url));
  }
  if (pathname.startsWith("/pedidos/nuevo") && esTaller) {
    return NextResponse.redirect(new URL("/taller", req.url));
  }
  if (esTaller && pathname.startsWith("/pedidos")) {
    // el taller navega pedidos pero la vista es la suya; permitido
    return NextResponse.next();
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|brand|favicon|icon|apple-icon|robots|sitemap).*)",
  ],
};
