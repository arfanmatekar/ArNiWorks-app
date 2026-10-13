import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportForm } from "@/components/report-form";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Report a platform issue" };
export const dynamic = "force-dynamic";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; user?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-sky-50 p-5 text-sm">Connect Supabase before submitting a report.</p></main>;
  }
  const params = await searchParams;
  const isUuid = (value?: string) =>
    Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
  const projectId = isUuid(params.project) ? params.project : undefined;
  const reportedUserId = isUuid(params.user) ? params.user : undefined;
  if (!projectId && !reportedUserId) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Choose a project or account to report.</p></main>;
  }

  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Unable to verify report submission session:", error.message);
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account could not be verified.</p></main>;
  }
  if (!user) redirect("/login");
  if (reportedUserId === user.id) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">You cannot report your own account.</p></main>;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/dashboard" className="text-sm font-semibold text-[#1769E0]">← Back to your workspace</Link>
      <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769E0]">Trust and safety</p>
        <h1 className="mt-2 text-3xl font-black text-[#123A72]">Report an issue</h1>
        <p className="mb-6 mt-3 text-sm leading-6 text-slate-600">Reports are private and visible only to you and authorized administrators.</p>
        <ReportForm projectId={projectId ?? ""} reportedUserId={reportedUserId ?? ""} />
      </section>
    </main>
  );
}
