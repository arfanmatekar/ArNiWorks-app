import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectStatusControl } from "@/components/project-status-control";
import { ReportStatusControl } from "@/components/report-status-control";
import { AccountStatusControl } from "@/components/account-status-control";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/dashboard/actions";

export const metadata = { title: "Admin dashboard" };
export const dynamic = "force-dynamic";

type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  project_id: string | null;
  reason: string;
  description: string;
  status: string;
  created_at: string;
};
type UserSummary = { id: string; full_name: string; account_type: string; account_status: string; created_at: string };
type ProjectSummary = { id: string; title: string; status: string; created_at: string };

export default async function AdminDashboardPage() {
  if (!isSupabaseConfigured()) {
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="rounded-xl bg-sky-50 p-5 text-sm">Connect Supabase to use the administrator dashboard.</p></main>;
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Unable to verify administrator session:", authError.message);
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account could not be verified.</p></main>;
  }
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Unable to verify administrator permissions:", profileError.message);
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Administrator permissions could not be verified.</p></main>;
  }
  if (profile?.account_type !== "admin") redirect("/");

  const [
    userCount,
    projectCount,
    applicationCount,
    reviewCount,
    reportsResult,
    usersResult,
    projectsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id,reporter_id,reported_user_id,project_id,reason,description,status,created_at").order("created_at", { ascending: false }).limit(20),
    supabase.rpc("admin_list_accounts"),
    supabase.from("projects").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const queryError = userCount.error || projectCount.error || applicationCount.error || reviewCount.error || reportsResult.error || usersResult.error || projectsResult.error;
  if (queryError) {
    console.error("Unable to load administrator workspace data:", queryError.message);
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Administrator workspace data could not be loaded. Check the database schema and access policies.</p></main>;
  }

  const reports = (reportsResult.data ?? []) as Report[];
  const users = (usersResult.data ?? []) as UserSummary[];
  const projects = (projectsResult.data ?? []) as ProjectSummary[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">Restricted administrator area</p><h1 className="mt-2 text-3xl font-black text-[#123A72]">Platform oversight</h1><p className="mt-2 text-sm text-slate-600">This page is server-authorized; database policies separately enforce admin access.</p></div>
        <div className="flex gap-3"><Link href="/dashboard" className="rounded-lg border border-sky-200 px-4 py-2.5 text-sm font-semibold text-[#123A72]">Dashboard</Link><form action={signOutAction}><button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Sign out</button></form></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Accounts", value: userCount.count }, { label: "Projects", value: projectCount.count }, { label: "Proposals", value: applicationCount.count }, { label: "Reviews", value: reviewCount.count }].map((item) => <article key={item.label} className="rounded-xl border border-sky-100 bg-white p-5"><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-black text-[#123A72]">{item.value ?? 0}</p></article>)}
      </div>

      <section className="mt-9">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-[#123A72]">Reports</h2><p className="mt-1 text-sm text-slate-600">Reports submitted by authenticated users.</p></div><span className="text-sm text-slate-500">{reports.filter((report) => report.status === "open").length} open</span></div>
        {reports.length === 0 ? <p className="rounded-xl border border-dashed border-sky-200 p-6 text-sm text-slate-600">No user reports have been submitted.</p> : <div className="space-y-3">{reports.map((report) => <article key={report.id} className="rounded-xl border border-sky-100 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#1769E0]">{report.reason.replaceAll("_", " ")} · {report.status}</p><p className="mt-2 text-sm leading-6 text-slate-700">{report.description}</p><p className="mt-2 text-xs text-slate-500">Reporter: {report.reporter_id} · {new Date(report.created_at).toLocaleString()}</p>{report.reported_user_id && <p className="mt-1 text-xs text-slate-500">Reported account: {report.reported_user_id}</p>}{report.project_id && <p className="mt-1 text-xs text-slate-500">Project: <Link href={`/projects/${report.project_id}`} className="text-[#1769E0] underline">{report.project_id}</Link></p>}</div><ReportStatusControl reportId={report.id} status={report.status} /></div></article>)}</div>}
      </section>

      <div className="mt-9 grid gap-8 xl:grid-cols-2">
        <section><h2 className="mb-4 text-xl font-bold text-[#123A72]">Accounts</h2>{users.length === 0 ? <p className="rounded-xl border border-dashed border-sky-200 p-6 text-sm text-slate-600">No accounts found.</p> : <div className="overflow-hidden rounded-xl border border-sky-100 bg-white"><ul>{users.map((member) => <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-0"><div><p className="font-semibold text-[#123A72]">{member.full_name}</p><p className="mt-1 font-mono text-xs text-slate-500">{member.id}</p><p className="mt-1 text-xs capitalize text-slate-500">{member.account_type} · {member.account_status}</p></div><AccountStatusControl userId={member.id} status={member.account_status} accountType={member.account_type} /></li>)}</ul></div>}</section>
        <section><h2 className="mb-4 text-xl font-bold text-[#123A72]">Project moderation</h2>{projects.length === 0 ? <p className="rounded-xl border border-dashed border-sky-200 p-6 text-sm text-slate-600">No project listings found.</p> : <div className="space-y-3">{projects.map((project) => <article key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-100 bg-white p-4"><div><p className="font-semibold text-[#123A72]">{project.title}</p><p className="mt-1 text-xs capitalize text-slate-500">{project.status.replaceAll("_", " ")} · {new Date(project.created_at).toLocaleDateString()}</p></div><ProjectStatusControl projectId={project.id} status={project.status} /></article>)}</div>}</section>
      </div>
    </main>
  );
}
