import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!code || !supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: Array<{
        name: string;
        value: string;
        options?: Parameters<typeof response.cookies.set>[2];
      }>) => {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Unable to complete Supabase email confirmation:", error.message);
    return NextResponse.redirect(new URL("/login?error=confirmation", request.url));
  }

  return response;
}
