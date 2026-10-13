import Image from "next/image";
import Link from "next/link";
import { freelancers as demoFreelancers } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Find freelancers",
  description: "Discover real independent professionals by skill, experience and hourly rate.",
};
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; currency?: string; min?: string; max?: string }>;
type FreelancerProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  portfolio_url: string | null;
  skills: string[];
  experience_level: string | null;
  hourly_rate: number | null;
  currency: "INR" | "USD" | "EUR";
};
type ProfileReview = { recipient_id: string; rating: number };

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export default async function FreelancersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100).toLocaleLowerCase();
  const currency = ["INR", "USD", "EUR"].includes(params.currency ?? "") ? params.currency : "";
  const min = Number(params.min);
  const max = Number(params.max);
  const configured = isSupabaseConfigured();
  let profiles: FreelancerProfile[] = [];
  let profileError = "";
  let reviews: ProfileReview[] = [];

  if (configured) {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,avatar_url,bio,portfolio_url,skills,experience_level,hourly_rate,currency")
        .eq("account_type", "freelancer")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        console.error("Unable to load freelancer directory:", error.message);
        profileError = "Freelancer profiles could not be loaded. Check the Supabase schema and connection.";
      } else {
        profiles = (data ?? []) as FreelancerProfile[];
        if (profiles.length) {
          const { data: reviewData, error: reviewQueryError } = await supabase
            .from("reviews")
            .select("recipient_id,rating")
            .in("recipient_id", profiles.map((profile) => profile.id));
          if (reviewQueryError) {
            console.error("Unable to load completed-project reviews:", reviewQueryError.message);
            profileError = "Freelancer profiles loaded, but verified review ratings could not be loaded.";
          } else {
            reviews = (reviewData ?? []) as ProfileReview[];
          }
        }
      }
    } catch (error) {
      console.error("Unable to connect to the freelancer directory:", error);
      profileError = "Freelancer profiles could not be loaded. Check the Supabase connection.";
    }
  }

  const results = profiles.filter((profile) => {
    const matchesQuery = !query || [profile.full_name, profile.bio ?? "", ...profile.skills].join(" ").toLocaleLowerCase().includes(query);
    const matchesCurrency = !currency || profile.currency === currency;
    const matchesMin = !Number.isFinite(min) || params.min === undefined || (profile.hourly_rate ?? 0) >= min;
    const matchesMax = !Number.isFinite(max) || params.max === undefined || (profile.hourly_rate ?? Number.POSITIVE_INFINITY) <= max;
    return matchesQuery && matchesCurrency && matchesMin && matchesMax;
  });
  const ratings = new Map<string, { count: number; total: number }>();
  for (const review of reviews) {
    const current = ratings.get(review.recipient_id) ?? { count: 0, total: 0 };
    current.count += 1;
    current.total += review.rating;
    ratings.set(review.recipient_id, current);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">The talent directory</p><h1 className="mt-2 text-3xl font-black text-[#123A72] sm:text-4xl">Meet independent talent</h1><p className="mt-2 text-sm text-slate-600">Discover real freelancer profiles and completed-project reviews.</p></div><Link href="/signup?role=freelancer" className="rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white">Create your profile</Link></div>

      <form action="/freelancers" method="get" className="mb-8 grid gap-3 rounded-2xl border border-sky-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs font-medium text-slate-600 lg:col-span-2">Search skills or name<input name="q" defaultValue={params.q} maxLength={100} placeholder="e.g. Figma, writing, React" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label>
        <label className="text-xs font-medium text-slate-600">Currency<select name="currency" defaultValue={currency} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Any currency</option><option value="INR">INR ₹</option><option value="USD">USD $</option><option value="EUR">EUR €</option></select></label>
        <label className="text-xs font-medium text-slate-600">Minimum hourly rate<input name="min" type="number" min="0" step="0.01" defaultValue={params.min} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label>
        <div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-xs font-medium text-slate-600">Maximum rate<input name="max" type="number" min="0" step="0.01" defaultValue={params.max} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /></label><button type="submit" className="rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white">Search</button></div>
      </form>

      <section aria-labelledby="real-freelancers">
        <div className="mb-4 flex items-center justify-between"><h2 id="real-freelancers" className="text-xl font-bold text-[#123A72]">Real freelancer profiles</h2><span className="text-sm text-slate-500">{results.length} {results.length === 1 ? "profile" : "profiles"}</span></div>
        {profileError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">{profileError}</p>}
        {!configured ? <p className="rounded-xl border border-sky-100 bg-sky-50 p-5 text-sm text-slate-700">Connect Supabase to browse real freelancer profiles. The homepage contains clearly marked demo profiles for illustration only.</p> : results.length === 0 && !profileError ? <p className="rounded-xl border border-dashed border-sky-200 p-7 text-sm text-slate-600">{profiles.length ? "No profiles match these filters." : "No public freelancer profiles yet. Create a freelancer account to join the directory."}</p> : null}
        {results.length > 0 && <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{results.map((profile) => {
          const rating = ratings.get(profile.id);
          return <article key={profile.id} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">{profile.avatar_url ? <Image src={profile.avatar_url} alt="" width={56} height={56} unoptimized className="h-14 w-14 rounded-full object-cover" /> : <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-full bg-sky-100 text-lg font-bold text-[#1769E0]">{profile.full_name.slice(0, 1).toUpperCase()}</span>}<div><h3 className="font-bold text-[#123A72]">{profile.full_name}</h3><p className="text-xs capitalize text-slate-500">{profile.experience_level ?? "Independent"} freelancer</p></div></div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{profile.bio || "This freelancer has not added a bio yet."}</p>
            <div className="mt-4 flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="rounded-full bg-sky-50 px-2.5 py-1 text-xs text-[#1769E0]">{skill}</span>)}</div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div><p className="text-xs text-slate-500">Hourly rate</p><p className="font-bold text-[#123A72]">{profile.hourly_rate ? `${money(profile.hourly_rate, profile.currency)}/hr` : "Rate on request"}</p></div>
              <p className="text-xs text-slate-600">{rating ? `★ ${(rating.total / rating.count).toFixed(1)} · ${rating.count} verified ${rating.count === 1 ? "review" : "reviews"}` : "No completed-project reviews yet"}</p>
            </div>
            <div className="mt-4 flex items-center justify-between">{profile.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#1769E0]">Portfolio ↗</a>}<Link href={`/freelancers/${profile.id}`} className="ml-auto rounded-lg border border-sky-200 px-3 py-2 text-xs font-semibold text-[#1769E0]">View profile</Link></div>
          </article>;
        })}</div>}
      </section>

      <section className="mt-12 border-t border-slate-200 pt-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-800">Demo content · not real members</p>
        <h2 className="mt-2 text-xl font-bold text-slate-700">Sample profiles</h2>
        <p className="mt-1 text-sm text-slate-500">Illustrative profiles, rates and ratings only. They are not connected to login, messaging or reviews.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">{demoFreelancers.slice(0, 2).map((person) => <article key={person.id} className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5"><h3 className="font-semibold text-slate-700">{person.name} · DEMO</h3><p className="mt-1 text-sm text-slate-500">{person.role} · {person.skills.join(", ")}</p></article>)}</div>
      </section>
    </main>
  );
}
