import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/project-form";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Post a project" };
export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  if (!isSupabaseConfigured()) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl border border-sky-100 bg-sky-50 p-5 text-sm">Connect Supabase before publishing a project.</p></main>;
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Unable to verify session for new project page:", authError.message);
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account could not be verified. Try signing in again.</p></main>;
  }
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to check project permissions:", profileError.message);
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account permissions could not be checked.</p></main>;
  }
  if (profile?.account_type !== "client") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/dashboard" className="text-sm font-semibold text-[#1769E0]">← Back to dashboard</Link>
      <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769E0]">Client workspace</p>
        <h1 className="mt-2 text-3xl font-black text-[#123A72]">Post a project</h1>
        <p className="mb-7 mt-2 text-sm leading-6 text-slate-600">Share the scope, skills, budget and timing so freelancers can decide whether it’s a good fit.</p>
        <ProjectForm />
      </section>
    </main>
  );
}
