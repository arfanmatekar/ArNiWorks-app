import Link from "next/link";
import { categories, demoBanner, freelancers, processSteps, projects, testimonials } from "@/lib/demo-data";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(23,105,224,0.16),_transparent_28%),linear-gradient(180deg,#f4f9ff_0%,#ffffff_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(22,97,216,0.04),rgba(27,106,244,0.02))]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#123A72] shadow-sm">
              Independent work, made personal
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-[#123A72] sm:text-5xl lg:text-6xl">
              Turn Your Skills Into Opportunities.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
              Connect with top clients, discover high-converting freelance work, and grow your portfolio across India and global talent markets.
            </p>

            <form action="/projects" method="get" className="mt-8 flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-lg shadow-sky-100/80 backdrop-blur-sm sm:flex-row sm:items-center">
              <input
                name="q"
                aria-label="Search jobs or skills"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 transition placeholder:text-slate-400 focus:border-[#1769E0]"
                placeholder="Search jobs, skills and services"
              />
              <button type="submit" className="rounded-xl bg-[#1769E0] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d5ed9]">
                Search
              </button>
            </form>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center rounded-full bg-[#1769E0] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-[#0d5ed9]"
              >
                Find Freelance Work
              </Link>
              <Link
                href="/signup?role=client"
                className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-white px-6 py-3 text-sm font-semibold text-[#123A72] transition hover:border-sky-300"
              >
                Hire Talent
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-8 text-sm text-slate-600">
              <div>
                <p className="text-2xl font-black text-[#123A72]">INR</p>
                <span>India-first, global-ready</span>
              </div>
              <div>
                <p className="text-2xl font-black text-[#123A72]">USD</p>
                <span>Work across borders</span>
              </div>
              <div>
                <p className="text-2xl font-black text-[#123A72]">EUR</p>
                <span>Your currency, your choice</span>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-xl rounded-[2rem] border border-sky-100 bg-white p-6 shadow-[0_30px_80px_rgba(18,58,114,0.12)]">
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,#dbeafe_0%,#ffffff_32%,#e0f2fe_100%)] p-5">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Marketplace overview</p>
                    <p className="text-2xl font-bold text-[#123A72]">Platform snapshot</p>
                  </div>
                  <div className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Sample</div>
                </div>

                <div className="space-y-4">
                  {["Web Development", "Graphic Design", "Data Science"].map((badge, index) => (
                    <div key={badge} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white/80 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sm font-bold text-[#1769E0]">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{badge}</p>
                          <p className="text-xs text-slate-500">High-demand category</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                        Active
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl bg-[#123A72] p-5 text-white">
                  <p className="text-sm text-sky-100">Illustrative project budget</p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-3xl font-black">₹2.4L</p>
                    <p className="text-xs text-sky-100">Avg. monthly spend</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">Popular categories</p>
            <h2 className="mt-2 text-3xl font-black text-[#123A72]">Explore what clients are hiring for</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link href={`/projects?category=${encodeURIComponent(category)}`} key={category} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-[#1769E0] font-black">
                {category.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-lg font-bold text-[#123A72]">{category}</p>
              <p className="mt-2 text-sm text-slate-600">Curated specialists ready to deliver.</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white/80">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">Featured freelancers</p>
              <h2 className="mt-2 text-3xl font-black text-[#123A72]">A few introductions</h2>
            </div>
            <Link href="/freelancers" className="text-sm font-semibold text-[#1769E0]">Browse all freelancers</Link>
          </div>

          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900"><strong>DEMO CONTENT:</strong> The freelancer profiles, ratings, portfolios and review counts below are illustrative only—not real members, ratings or reviews.</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {freelancers.map((freelancer) => (
              <div key={freelancer.id} className="rounded-[1.75rem] border border-sky-100 bg-slate-50 p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1769E0,#7cc8ff)] text-lg font-black text-white shadow-md shadow-blue-200">
                    {freelancer.name
                      .split(" ")
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#123A72]">{freelancer.name}</p>
                    <p className="text-sm text-slate-500">{freelancer.role}</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-amber-600">
                  <span>★</span>
                  <span className="font-semibold text-slate-700">{freelancer.rating}</span>
                  <span className="text-slate-500">({freelancer.reviews} reviews)</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {freelancer.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-[#1769E0]">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-600">
                  <p>Portfolio: {freelancer.portfolio}</p>
                  <p>Location: {freelancer.location}</p>
                  <p>Experience: {freelancer.experience}</p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-sky-100 pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Hourly rate</p>
                    <p className="text-lg font-black text-[#123A72]">
                      {freelancer.currency === "INR" ? "₹" : freelancer.currency === "EUR" ? "€" : "$"}
                      {freelancer.rate}
                    </p>
                  </div>
                  <Link href="/freelancers" className="rounded-full bg-[#1769E0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0d5ed9]">
                    View profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">Latest projects</p>
            <h2 className="mt-2 text-3xl font-black text-[#123A72]">Fresh work opportunities</h2>
          </div>
          <Link href="/projects" className="text-sm font-semibold text-[#1769E0]">See all projects</Link>
        </div>

        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900"><strong>DEMO CONTENT:</strong> These sample listings, budgets and proposal counts are illustrative. Current live client projects appear in the marketplace.</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {projects.map((project) => (
            <article key={project.id} className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1769E0]">{project.category}</p>
                  <h3 className="mt-2 text-2xl font-bold text-[#123A72]">{project.title}</h3>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {project.proposals} proposals
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{project.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {project.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-[#1769E0]">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 pt-5 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Budget</p>
                  <p className="mt-1 text-lg font-black text-[#123A72]">
                    {project.currency === "INR" ? "₹" : project.currency === "EUR" ? "€" : "$"}
                    {project.budget}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Deadline</p>
                  <p className="mt-1 font-semibold text-slate-700">{project.deadline}</p>
                </div>
                <Link href={`/projects/${project.id}`} className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 font-semibold text-[#123A72] hover:border-sky-300">
                  View project
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="bg-[#123A72] py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">How it works</p>
            <h2 className="mt-2 text-3xl font-black">Simple workflow for serious work</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((step, index) => (
              <div key={step.title} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#1769E0] text-sm font-black text-white">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-sky-100/80">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">Testimonials</p>
          <h2 className="mt-2 text-3xl font-black text-[#123A72]">What people say about working with ArNiWorks</h2>
          <p className="mt-2 text-sm text-slate-500">{demoBanner}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((person) => (
            <blockquote key={person.name} className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-sm">
              <p className="text-lg leading-8 text-slate-700">“{person.quote}”</p>
              <footer className="mt-6 border-t border-sky-100 pt-4">
                <p className="font-bold text-[#123A72]">{person.name}</p>
                <p className="text-sm text-slate-500">{person.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </>
  );
}
