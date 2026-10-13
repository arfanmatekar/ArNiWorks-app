import Link from "next/link";
import { redirect } from "next/navigation";
import { ApplicationDecision } from "@/components/application-decision";
import { ProjectStatusControl } from "@/components/project-status-control";
import { ReviewForm } from "@/components/review-form";
import { signOutAction } from "./actions";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Your dashboard" };
export const dynamic = "force-dynamic";

type Project = {
  id: string;
  title: string;
  category: string;
  budget: number;
  currency: string;
  deadline: string | null;
  status: string;
  created_at: string;
  client_id: string;
};
type Application = {
  id: string;
  project_id: string;
  freelancer_id: string;
  cover_letter: string;
  proposed_price: number;
  currency: string;
  estimated_delivery_days: number;
  status: string;
  created_at: string;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: ["INR", "USD", "EUR"].includes(currency) ? currency : "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return <main className="mx-auto max-w-4xl px-4 py-16"><h1 className="text-3xl font-black text-[#123A72]">Connect your workspace</h1><p className="mt-3 text-sm leading-6 text-slate-600">The dashboard uses Supabase Authentication and protected database records. Configure Supabase to continue; no demo account is available.</p><Link href="/login" className="mt-5 inline-flex rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white">Sign in</Link></main>;
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Unable to verify dashboard session:", authError.message);
    return <main className="mx-auto max-w-4xl px-4 py-16"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account could not be verified. Try signing in again.</p></main>;
  }
  if (!user) redirect("/login");

  const { data: accountActive, error: accountStatusError } = await supabase.rpc("is_active_user");
  if (accountStatusError) {
    console.error("Unable to verify account status:", accountStatusError.message);
    return <main className="mx-auto max-w-4xl px-4 py-16"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account status could not be verified.</p></main>;
  }
  if (!accountActive) {
    return <main className="mx-auto max-w-4xl px-4 py-16"><h1 className="text-3xl font-black text-[#123A72]">Account access is paused</h1><p className="mt-3 text-sm leading-6 text-slate-600">This account is currently suspended from marketplace activity. Contact support if you think this is a mistake.</p><form action={signOutAction} className="mt-5"><button className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Sign out</button></form></main>;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,account_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Unable to load dashboard profile:", profileError.message);
    return <main className="mx-auto max-w-4xl px-4 py-16"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account profile could not be loaded.</p></main>;
  }
  if (!profile) {
    return <main className="mx-auto max-w-4xl px-4 py-16"><h1 className="text-3xl font-black text-[#123A72]">Profile setup incomplete</h1><p className="mt-3 text-sm text-slate-600">Your account exists, but its profile is missing. Contact support so we can help restore it securely.</p></main>;
  }
  if (profile.account_type === "admin") redirect("/admin");
  if (profile.account_type !== "client" && profile.account_type !== "freelancer") {
    return <main className="mx-auto max-w-4xl px-4 py-16"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">This account does not have a supported dashboard role.</p></main>;
  }

  const isClient = profile.account_type === "client";
  let projects: Project[] = [];
  let applications: Application[] = [];
  let projectLookup = new Map<string, Project>();
  let dataError = "";

  if (isClient) {
    const { data, error } = await supabase
      .from("projects")
      .select("id,title,category,budget,currency,deadline,status,created_at,client_id")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Unable to load client projects:", error.message);
      dataError = "Your project listings could not be loaded.";
    } else {
      projects = (data ?? []) as Project[];
      projectLookup = new Map(projects.map((project) => [project.id, project]));
    }

    if (projects.length > 0) {
      const { data: proposalData, error: proposalError } = await supabase
        .from("applications")
        .select("id,project_id,freelancer_id,cover_letter,proposed_price,currency,estimated_delivery_days,status,created_at")
        .in("project_id", projects.map((project) => project.id))
        .order("created_at", { ascending: false });
      if (proposalError) {
        console.error("Unable to load client proposals:", proposalError.message);
        dataError = "Project proposals could not be loaded.";
      } else {
        applications = (proposalData ?? []) as Application[];
      }
    }
  } else {
    const { data: proposalData, error: proposalError } = await supabase
      .from("applications")
      .select("id,project_id,freelancer_id,cover_letter,proposed_price,currency,estimated_delivery_days,status,created_at")
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false });
    if (proposalError) {
      console.error("Unable to load freelancer applications:", proposalError.message);
      dataError = "Your applications could not be loaded.";
    } else {
      applications = (proposalData ?? []) as Application[];
      const ids = [...new Set(applications.map((application) => application.project_id))];
      if (ids.length > 0) {
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("id,title,category,budget,currency,deadline,status,created_at,client_id")
          .in("id", ids);
        if (projectError) {
          console.error("Unable to load applied project details:", projectError.message);
          dataError = "Project details for your applications could not be loaded.";
        } else {
          projects = (projectData ?? []) as Project[];
          projectLookup = new Map(projects.map((project) => [project.id, project]));
        }
      }
    }
  }

  const completedProjectIds = [...new Set(
    applications
      .filter((application) => application.status === "accepted" && projectLookup.get(application.project_id)?.status === "completed")
      .map((application) => application.project_id),
  )];
  let reviewedProjectIds = new Set<string>();
  if (completedProjectIds.length > 0) {
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("project_id")
      .eq("reviewer_id", user.id)
      .in("project_id", completedProjectIds);
    if (reviewsError) {
      console.error("Unable to load your submitted project reviews:", reviewsError.message);
      dataError = "Review status could not be loaded.";
    } else {
      reviewedProjectIds = new Set((reviews ?? []).map((review) => review.project_id));
    }
  }

  const pendingApplications = applications.filter((application) => application.status === "pending").length;
  const acceptedApplications = applications.filter((application) => application.status === "accepted").length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">{isClient ? "Client workspace" : "Freelancer workspace"}</p>
          <h1 className="mt-2 text-3xl font-black text-[#123A72]">Welcome, {profile.full_name}</h1>
          <p className="mt-2 text-sm text-slate-600">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isClient ? <Link href="/dashboard/projects/new" className="rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white">Post a project</Link> : <Link href="/projects" className="rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white">Browse projects</Link>}
          <Link href="/dashboard/profile" className="rounded-lg border border-sky-200 px-4 py-2.5 text-sm font-semibold text-[#123A72]">Edit profile</Link>
          <Link href="/messages" className="rounded-lg border border-sky-200 px-4 py-2.5 text-sm font-semibold text-[#123A72]">Messages</Link>
          <form action={signOutAction}><button type="submit" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Sign out</button></form>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: isClient ? "Your project listings" : "Your proposals", value: isClient ? projects.length : applications.length },
          { label: "Pending", value: pendingApplications },
          { label: "Accepted", value: acceptedApplications },
        ].map((metric) => <article key={metric.label} className="rounded-xl border border-sky-100 bg-white p-5"><p className="text-sm text-slate-500">{metric.label}</p><p className="mt-2 text-2xl font-black text-[#123A72]">{metric.value}</p></article>)}
      </div>

      {dataError && <p role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{dataError}</p>}

      {isClient ? (
        <div className="space-y-7">
          <section>
            <h2 className="mb-4 text-xl font-bold text-[#123A72]">Your project listings</h2>
            {projects.length === 0 ? <div className="rounded-xl border border-dashed border-sky-200 p-7 text-sm text-slate-600">You have not published a project yet. <Link href="/dashboard/projects/new" className="font-semibold text-[#1769E0]">Post your first project</Link>.</div> : <div className="space-y-4">{projects.map((project) => {
              const projectApplications = applications.filter((application) => application.project_id === project.id);
              return <article key={project.id} className="rounded-xl border border-sky-100 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-[#1769E0]">{project.category} · {project.status.replace("_", " ")}</p><h3 className="mt-2 text-lg font-bold text-[#123A72]">{project.title}</h3><p className="mt-1 text-sm text-slate-600">{formatMoney(project.budget, project.currency)} · {projectApplications.length} proposals</p></div>
                  <div className="flex flex-wrap gap-2"><Link href={`/dashboard/projects/${project.id}/edit`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Edit</Link><ProjectStatusControl projectId={project.id} status={project.status} /></div>
                </div>
                {projectApplications.length > 0 && <div className="mt-5 space-y-3 border-t border-slate-100 pt-4"><h4 className="text-sm font-semibold text-[#123A72]">Proposals</h4>{projectApplications.map((application) => <div key={application.id} className="rounded-lg bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><p className="text-xs text-slate-500">Submitted {new Date(application.created_at).toLocaleDateString()}</p><span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium capitalize text-slate-700">{application.status}</span></div><p className="mt-2 text-sm text-slate-700">{application.cover_letter}</p><p className="mt-2 text-sm font-semibold text-[#123A72]">{formatMoney(application.proposed_price, application.currency)} · {application.estimated_delivery_days} days</p>{application.status === "pending" && project.status === "open" && <div className="mt-3"><ApplicationDecision applicationId={application.id} /></div>}{application.status === "accepted" && <div className="mt-3 flex flex-wrap gap-3"><Link href={`/messages?project=${encodeURIComponent(project.id)}`} className="text-sm font-semibold text-[#1769E0]">Message freelancer</Link>{project.status === "completed" && !reviewedProjectIds.has(project.id) && <ReviewForm projectId={project.id} recipientId={application.freelancer_id} />}</div>}</div>)}</div>}
              </article>;
            })}</div>}
          </section>
        </div>
      ) : (
        <section>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-bold text-[#123A72]">Your applications</h2><Link href="/projects" className="text-sm font-semibold text-[#1769E0]">Find another project →</Link></div>
          {applications.length === 0 ? <div className="rounded-xl border border-dashed border-sky-200 p-7 text-sm text-slate-600">You have not submitted any proposals yet. Explore live listings to find your first opportunity.</div> : <div className="space-y-3">{applications.map((application) => {
            const project = projectLookup.get(application.project_id);
            return <article key={application.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sky-100 bg-white p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#1769E0]">{project?.category ?? "Project"} · submitted {new Date(application.created_at).toLocaleDateString()}</p><h3 className="mt-2 font-bold text-[#123A72]">{project?.title ?? "Project details unavailable"}</h3><p className="mt-1 text-sm text-slate-600">Your proposal: {formatMoney(application.proposed_price, application.currency)} · {application.estimated_delivery_days} days</p></div><div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${application.status === "accepted" ? "bg-emerald-50 text-emerald-700" : application.status === "rejected" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>{application.status}</span>{project && <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-[#1769E0]">View project</Link>}{project && application.status === "accepted" && <Link href={`/messages?project=${encodeURIComponent(project.id)}`} className="text-sm font-semibold text-[#1769E0]">Message client</Link>}{project && project.status === "completed" && application.status === "accepted" && !reviewedProjectIds.has(project.id) && <ReviewForm projectId={project.id} recipientId={project.client_id} />}</div></article>;
          })}</div>}
        </section>
      )}
    </main>
  );
}
