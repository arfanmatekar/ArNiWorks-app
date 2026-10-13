import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

function LogoMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1769E0] text-sm font-black tracking-tight text-white shadow-sm">
      AN
    </span>
  );
}

export async function SiteHeader() {
  let signedIn = false;
  let name = "";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (error && error.name !== "AuthSessionMissingError") {
        console.error("Unable to verify navigation session:", error.message);
      } else if (!error) {
        signedIn = Boolean(data.user);
        name = String(data.user?.user_metadata?.full_name ?? "");
      }
    } catch (error) {
      console.error("Unable to load navigation account:", error);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/95 backdrop-blur">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" aria-label="ArNiWorks home" className="flex shrink-0 items-center gap-3">
          <LogoMark />
          <span><span className="block text-lg font-black leading-tight tracking-tight text-[#123A72]">ArNiWorks</span><span className="block text-[10px] font-medium tracking-wide text-slate-500">Your Skills. Your World.</span></span>
        </Link>
        <div className="flex w-full items-center gap-5 overflow-x-auto border-t border-slate-100 pt-3 text-sm font-medium text-slate-600 sm:w-auto sm:flex-1 sm:justify-center sm:gap-6 sm:border-0 sm:pt-0">
          <Link className="transition hover:text-[#1769E0]" href="/">Home</Link>
          <Link className="transition hover:text-[#1769E0]" href="/projects">Find Jobs</Link>
          <Link className="shrink-0 transition hover:text-[#1769E0]" href="/freelancers">Find Freelancers</Link>
          <Link className="transition hover:text-[#1769E0]" href="/about">About</Link>
          <Link className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-[#123A72] hover:border-blue-300" href={signedIn ? "/dashboard" : "/login"}>{signedIn ? (name || "Dashboard") : "Login"}</Link>
          {!signedIn && <Link className="hidden shrink-0 rounded-lg bg-[#1769E0] px-4 py-2 text-white hover:bg-[#123A72] sm:inline-flex" href="/signup">Join free</Link>}
        </div>
      </nav>
    </header>
  );
}
