export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">About</p>
      <h1 className="mt-2 text-4xl font-black text-[#123A72]">Built for a new generation of independent work.</h1>
      <p className="mt-6 text-lg leading-8 text-slate-600">
        ArNiWorks brings together freelancers and clients from India and global markets through a premium, reliable marketplace experience. We focus on clarity, trust, and professional collaboration at every stage of the work journey.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          ["Professional matching", "Smart discovery tools surface the right fit by skill, budget, and deadline."],
          ["Secure collaboration", "Clients and freelancers can manage workflow, proposals, and status updates with confidence."],
          ["Global reach", "Built to support freelance work across India, the EU, and international markets."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-[1.5rem] border border-sky-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#123A72]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
