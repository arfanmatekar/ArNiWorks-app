import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProjectForm } from "@/components/project-form";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit project" };
export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-sky-50 p-5 text-sm">Connect Supabase before editing project listings.</p></main>;
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Unable to verify session for project editing:", authError.message);
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account could not be verified. Try signing in again.</p></main>;
  }
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Unable to check project editing permissions:", profileError.message);
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account permissions could not be checked.</p></main>;
  }
  if (profile?.account_type !== "client") redirect("/dashboard");

  const { data: project, error } = await supabase
    .from("projects")
    .select("id,title,description,category,budget,currency,deadline,requirements")
    .eq("id", id)
    .eq("client_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Unable to load project for editing:", error.message);
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Project details could not be loaded.</p></main>;
  }
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/dashboard" className="text-sm font-semibold text-[#1769E0]">← Back to dashboard</Link>
      <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769E0]">Client workspace</p>
        <h1 className="mt-2 text-3xl font-black text-[#123A72]">Edit project</h1>
        <ProjectForm project={{ ...project, requirements: project.requirements ?? [] }} />
      </section>
    </main>
  );
}
