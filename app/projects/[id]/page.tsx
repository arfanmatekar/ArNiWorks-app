import Link from "next/link";
import { notFound } from "next/navigation";
import { ProposalForm } from "@/components/proposal-form";
import { projects as demoProjects } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: "INR" | "USD" | "EUR";
  deadline: string | null;
  requirements: string[];
  status: string;
};

function money(amount: number, currency: Project["currency"]) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sample = demoProjects.find((item) => item.id === id);
  let project: Project | null = null;
  let loadError = "";

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from("projects")
        .select("id,title,description,category,budget,currency,deadline,requirements,status")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load project details:", error.message);
        loadError = "Project details could not be loaded. Please try again later.";
      } else if (data) {
        project = data as Project;
      }
    } catch (error) {
      console.error("Failed to connect to the project database:", error);
      loadError = "Project details could not be loaded. Check the Supabase connection, then try again.";
    }
  }

  if (!project && !sample && !loadError) notFound();

  if (!project && sample) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Link href="/projects" className="text-sm font-semibold text-[#1769E0]">← Back to projects</Link>
        <article className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Demo content · sample project</span>
          <h1 className="mt-3 text-3xl font-black text-[#123A72]">{sample.title}</h1>
          <p className="mt-4 text-sm leading-7 text-slate-700">{sample.description}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div><span className="block text-xs text-slate-500">Category</span><strong>{sample.category}</strong></div>
            <div><span className="block text-xs text-slate-500">Sample budget</span><strong>{money(sample.budget, sample.currency)}</strong></div>
            <div><span className="block text-xs text-slate-500">Sample deadline</span><strong>{sample.deadline}</strong></div>
          </div>
          <p className="mt-6 border-t border-amber-200 pt-4 text-sm text-amber-900">This illustration is not a live client listing and cannot receive proposals.</p>
          <Link href="/projects" className="mt-5 inline-flex rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white">Browse live projects</Link>
        </article>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <Link href="/projects" className="text-sm font-semibold text-[#1769E0]">← Back to projects</Link>
        <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{loadError}</p>
      </main>
    );
  }

  const projectCurrency = project.currency;
  const requirements = Array.isArray(project.requirements) ? project.requirements : [];
  const isOpen = project.status === "open";

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/projects" className="text-sm font-semibold text-[#1769E0]">← Back to projects</Link>
      <article className="mt-6 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-[#1769E0]">{project.category}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{project.status.replace("_", " ")}</span>
        </div>
        <h1 className="mt-4 text-3xl font-black text-[#123A72] sm:text-4xl">{project.title}</h1>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{project.description}</p>
        <div className="mt-6 grid gap-4 rounded-xl bg-sky-50 p-5 sm:grid-cols-3">
          <div><span className="block text-xs text-slate-500">Project budget</span><strong className="text-lg text-[#123A72]">{money(project.budget, projectCurrency)}</strong></div>
          <div><span className="block text-xs text-slate-500">Deadline</span><strong className="text-sm text-slate-700">{project.deadline ?? "To be agreed"}</strong></div>
          <div><span className="block text-xs text-slate-500">Currency</span><strong className="text-sm text-slate-700">{projectCurrency}</strong></div>
        </div>
        {requirements.length > 0 && <section className="mt-7"><h2 className="font-bold text-[#123A72]">Skills and requirements</h2><div className="mt-3 flex flex-wrap gap-2">{requirements.map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-700">{skill}</span>)}</div></section>}
        <section className="mt-8 border-t border-slate-100 pt-7">
          <h2 className="text-xl font-bold text-[#123A72]">Submit a proposal</h2>
          {isOpen ? <ProposalForm projectId={project.id} defaultCurrency={projectCurrency} /> : <p className="mt-3 text-sm text-slate-600">This project is no longer accepting proposals.</p>}
        </section>
      </article>
    </main>
  );
}
