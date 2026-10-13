import Link from "next/link";
import { categories, projects as demoProjects } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Find freelance projects",
  description: "Search live freelance projects by skill, category, budget and deadline.",
};

type SearchParams = Promise<{
  q?: string;
  category?: string;
  currency?: string;
  min?: string;
  max?: string;
  since?: string;
}>;

type MarketplaceProject = {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: "INR" | "USD" | "EUR";
  deadline: string | null;
  requirements: string[];
  created_at: string;
};

function money(amount: number, currency: MarketplaceProject["currency"]) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const category = params.category ?? "";
  const currency = ["INR", "USD", "EUR"].includes(params.currency ?? "")
    ? params.currency
    : "";
  const minimum = Number(params.min);
  const maximum = Number(params.max);
  const since = params.since ?? "";

  let projects: MarketplaceProject[] = [];
  let loadError = "";
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from("projects")
        .select("id,title,description,category,budget,currency,deadline,requirements,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Failed to load published marketplace projects:", error.message);
        loadError = "Live projects could not be loaded. Check the Supabase schema and connection, then try again.";
      } else {
        projects = (data ?? []) as MarketplaceProject[];
      }
    } catch (error) {
      console.error("Failed to connect to the marketplace database:", error);
      loadError = "Live projects could not be loaded. Check the Supabase connection, then try again.";
    }
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const filteredProjects = projects.filter((project) => {
    const matchesQuery =
      !normalizedQuery ||
      [project.title, project.description, project.category, ...project.requirements]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    const matchesCategory = !category || project.category === category;
    const matchesCurrency = !currency || project.currency === currency;
    const matchesMinimum = !Number.isFinite(minimum) || params.min === undefined || project.budget >= minimum;
    const matchesMaximum = !Number.isFinite(maximum) || params.max === undefined || project.budget <= maximum;
    const matchesDate = !since || project.created_at.slice(0, 10) >= since;
    return matchesQuery && matchesCategory && matchesCurrency && matchesMinimum && matchesMaximum && matchesDate;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">The marketplace</p>
          <h1 className="mt-2 text-4xl font-black text-[#123A72]">Find your next project</h1>
          <p className="mt-2 text-sm text-slate-600">Search published opportunities shared by ArNiWorks clients.</p>
        </div>
        <Link href="/signup?role=client" className="inline-flex w-fit rounded-xl bg-[#1769E0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d5ed9]">
          Post a project
        </Link>
      </div>

      <form action="/projects" method="get" className="mb-8 grid gap-3 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <label className="text-xs font-medium text-slate-600 lg:col-span-2">Search skills or projects<input name="q" defaultValue={query} maxLength={100} placeholder="e.g. React, writing, design" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1769E0]" /></label>
        <label className="text-xs font-medium text-slate-600">Category<select name="category" defaultValue={category} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Currency<select name="currency" defaultValue={currency} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"><option value="">Any currency</option><option value="INR">INR ₹</option><option value="USD">USD $</option><option value="EUR">EUR €</option></select></label>
        <label className="text-xs font-medium text-slate-600">Minimum budget<input name="min" type="number" min="0" step="0.01" defaultValue={params.min} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800" /></label>
        <label className="text-xs font-medium text-slate-600">Posted since<input name="since" type="date" defaultValue={since} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800" /></label>
        <label className="text-xs font-medium text-slate-600">Maximum budget<input name="max" type="number" min="0" step="0.01" defaultValue={params.max} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800" /></label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5"><button type="submit" className="rounded-lg bg-[#1769E0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d5ed9]">Apply filters</button><Link href="/projects" className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-sky-300">Clear filters</Link></div>
      </form>

      <section aria-labelledby="live-projects-heading">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 id="live-projects-heading" className="text-xl font-bold text-[#123A72]">Live client projects</h2>
          <span className="text-sm text-slate-500">{filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"}</span>
        </div>
        {loadError ? (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{loadError}</p>
        ) : !configured ? (
          <p className="rounded-xl border border-sky-100 bg-sky-50 p-5 text-sm leading-6 text-slate-700">Live listings require Supabase setup. Configure the public Supabase URL and anon key, then run <code>supabase/schema.sql</code> to publish and browse projects.</p>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sky-200 bg-white p-8 text-center">
            <h3 className="font-semibold text-[#123A72]">{projects.length ? "No projects match those filters" : "No live projects yet"}</h3>
            <p className="mt-2 text-sm text-slate-600">{projects.length ? "Try adjusting your search or clearing the filters." : "Published opportunities from ArNiWorks clients will appear here."}</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredProjects.map((project) => (
              <article key={project.id} className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-[#1769E0]">{project.category}</span>
                <h3 className="mt-4 text-xl font-bold text-[#123A72]">{project.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{project.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">{project.requirements.map((skill) => <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{skill}</span>)}</div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div><span className="block text-xs text-slate-500">Budget</span><strong className="text-lg text-[#123A72]">{money(project.budget, project.currency)}</strong></div>
                  <div><span className="block text-xs text-slate-500">Deadline</span><strong className="text-sm text-slate-700">{project.deadline ?? "To be agreed"}</strong></div>
                  <Link href={`/projects/${project.id}`} className="rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0d5ed9]">View project</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 border-t border-slate-200 pt-7" aria-labelledby="sample-projects-heading">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Demo content · not live listings</p>
        <h2 id="sample-projects-heading" className="mt-2 text-xl font-bold text-slate-700">Sample project briefs</h2>
        <p className="mt-1 text-sm text-slate-500">Illustrations of the opportunities clients may post; they cannot receive proposals.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {demoProjects.slice(0, 2).map((project) => (
            <article key={project.id} className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <span className="text-xs font-semibold text-slate-500">{project.category} · SAMPLE</span>
              <h3 className="mt-2 font-semibold text-slate-700">{project.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{project.description}</p>
              <p className="mt-3 text-sm font-medium text-slate-600">{money(project.budget, project.currency)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
