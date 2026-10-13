import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileEditor } from "@/components/profile-editor";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit your profile" };
export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  if (!isSupabaseConfigured()) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-sky-50 p-5 text-sm">Connect Supabase to edit your profile.</p></main>;
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Unable to verify profile editing session:", authError.message);
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account could not be verified.</p></main>;
  }
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url,bio,portfolio_url,skills,experience_level,hourly_rate,currency,company_name,account_type")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Unable to load profile editing form:", error.message);
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your profile could not be loaded.</p></main>;
  }
  if (!profile) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account profile is missing. Contact support for help.</p></main>;
  }
  if (profile.account_type === "admin") redirect("/admin");
  if (profile.account_type !== "client" && profile.account_type !== "freelancer") redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/dashboard" className="text-sm font-semibold text-[#1769E0]">← Back to dashboard</Link>
      <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769E0]">Your account</p>
        <h1 className="mb-6 mt-2 text-3xl font-black text-[#123A72]">Edit your profile</h1>
        <ProfileEditor profile={{ ...profile, skills: profile.skills ?? [] }} accountType={profile.account_type} />
      </section>
    </main>
  );
}
