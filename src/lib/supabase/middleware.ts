import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    request.nextUrl.pathname !== "/" &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/register") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/portal") &&
    !request.nextUrl.pathname.startsWith("/landing-page") &&
    !request.nextUrl.pathname.startsWith("/register-admin") &&
    !request.nextUrl.pathname.startsWith("/login-admin")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register" ||
      request.nextUrl.pathname === "/")
  ) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    const url = request.nextUrl.clone();
    url.pathname =
      userData?.role === "superadmin" ? "/superadmin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // Rutas de superadmin — verificar rol o permisos (excepto registro/login de admin)
  if (
    user &&
    request.nextUrl.pathname.startsWith("/superadmin") &&
    !request.nextUrl.pathname.startsWith("/register-admin") &&
    !request.nextUrl.pathname.startsWith("/login-admin")
  ) {
    const { data: userData } = await supabase
      .from("users")
      .select("role, permissions")
      .eq("auth_id", user.id)
      .single();

    if (userData?.role !== "superadmin") {
      let isAllowed = false;
      const p = typeof userData?.permissions === 'string' ? JSON.parse(userData?.permissions || '{}') : (userData?.permissions || {});
      const path = request.nextUrl.pathname;

      // Mapeo ruta → permiso (alineado con sidebar)
      if (path === "/superadmin" && p.command_center) isAllowed = true;
      if (path.startsWith("/superadmin/finanzas") && p.finances) isAllowed = true;
      if (path.startsWith("/superadmin/reportes") && p.reports) isAllowed = true;
      if (path.startsWith("/superadmin/clientes") && p.clients) isAllowed = true;
      if (path.startsWith("/superadmin/semillas") && p.daily_seed) isAllowed = true;
      if (path.startsWith("/superadmin/comunicacion") && p.communication) isAllowed = true;
      if (path.startsWith("/superadmin/usuarios") && p.users) isAllowed = true;
      if (path.startsWith("/superadmin/config") && p.configuration) isAllowed = true;
      
      // Permitir acceso base al layout si tiene ALGÚN permiso
      if (path === "/superadmin" && Object.values(p).some(Boolean)) isAllowed = true;

      if (!isAllowed) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
