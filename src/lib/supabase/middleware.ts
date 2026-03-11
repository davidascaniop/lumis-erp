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
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/register") &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/portal") &&
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

  // Rutas de superadmin — verificar rol (excepto registro)
  if (
    user &&
    request.nextUrl.pathname.startsWith("/superadmin") &&
    !request.nextUrl.pathname.startsWith("/register-admin") &&
    !request.nextUrl.pathname.startsWith("/login-admin")
  ) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("auth_id", user.id)
      .single();

    if (userData?.role !== "superadmin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
