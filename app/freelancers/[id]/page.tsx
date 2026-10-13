import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Freelancer = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  portfolio_url: string | null;
  skills: string[];
  experience_level: string | null;
  hourly_rate: number | null;
  currency: string;
};
type Review = { id: string; rating: number; comment: string | null; created_at: string };

export default async function FreelancerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isSupabaseConfigured()) {
    return <main className="mx-auto max-w-3xl px-4 py-12"><p role="alert" className="rounded-xl bg-sky-50 p-5 text-sm">Connect Supabase to view real freelancer profiles.</p></main>;
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url,bio,portfolio_url,skills,experience_level,hourly_rate,currency")
    .eq("id", id)
    .eq("account_type", "freelancer")
    .maybeSingle();

  if (error) {
    console.error("Unable to load freelancer profile:", error.message);
    return <main className="mx-auto max-w-4xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">This profile could not be loaded.</p></main>;
  }
  if (!data) notFound();
  const profile = data as Freelancer;

  const { data: reviewData, error: reviewError } = await supabase
    .from("reviews")
    .select("id,rating,comment,created_at")
    .eq("recipient_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (reviewError) {
    console.error("Unable to load freelancer reviews:", reviewError.message);
    return <main className="mx-auto max-w-4xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Verified reviews could not be loaded.</p></main>;
  }
  const reviews = (reviewData ?? []) as Review[];
  const rating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/freelancers" className="text-sm font-semibold text-[#1769E0]">← Back to freelancers</Link>
      <article className="mt-6 rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center gap-5">{profile.avatar_url ? <Image src={profile.avatar_url} alt="" width={88} height={88} unoptimized className="h-20 w-20 rounded-full object-cover sm:h-22 sm:w-22" /> : <span className="grid h-20 w-20 place-items-center rounded-full bg-sky-100 text-2xl font-bold text-[#1769E0]">{profile.full_name.slice(0, 1).toUpperCase()}</span>}<div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1769E0]">Freelancer profile</p><h1 className="mt-1 text-3xl font-black text-[#123A72]">{profile.full_name}</h1><p className="mt-1 text-sm capitalize text-slate-600">{profile.experience_level ?? "Independent"} freelancer</p></div></div>
        <p className="mt-6 whitespace-pre-wrap text-sm leading-7 text-slate-700">{profile.bio || "This freelancer has not added a bio yet."}</p>
        <h2 className="mt-7 font-bold text-[#123A72]">Skills</h2>
        <div className="mt-3 flex flex-wrap gap-2">{profile.skills.map((skill) => <span key={skill} className="rounded-full bg-sky-50 px-3 py-1.5 text-xs text-[#1769E0]">{skill}</span>)}</div>
        <div className="mt-7 grid gap-5 rounded-xl bg-slate-50 p-5 sm:grid-cols-3">
          <div><p className="text-xs text-slate-500">Hourly rate</p><p className="mt-1 font-bold text-[#123A72]">{profile.hourly_rate ? `${new Intl.NumberFormat("en", { style: "currency", currency: profile.currency, maximumFractionDigits: 2 }).format(profile.hourly_rate)}/hr` : "Rate on request"}</p></div>
          <div><p className="text-xs text-slate-500">Completed-project rating</p><p className="mt-1 font-bold text-[#123A72]">{rating === null ? "No reviews yet" : `★ ${rating.toFixed(1)} · ${reviews.length} reviews`}</p></div>
          <div>{profile.portfolio_url ? <><p className="text-xs text-slate-500">Portfolio</p><a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="mt-1 inline-block break-all text-sm font-semibold text-[#1769E0]">Visit portfolio ↗</a></> : <p className="text-sm text-slate-500">No portfolio link shared.</p>}</div>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3"><Link href="/signup?role=client" className="rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white">Create a client account</Link><Link href={`/report?user=${encodeURIComponent(profile.id)}`} className="text-sm text-slate-600 underline">Report this profile</Link></div>
      </article>
      <section className="mt-8"><h2 className="text-xl font-bold text-[#123A72]">Completed-project reviews</h2>{reviews.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-200 p-5 text-sm text-slate-600">No verified reviews have been submitted for completed projects.</p> : <div className="mt-4 space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-xl border border-sky-100 bg-white p-5"><div className="flex items-center justify-between gap-3"><span className="font-semibold text-amber-700">{"★".repeat(review.rating)}<span className="sr-only"> {review.rating} out of 5</span></span><time className="text-xs text-slate-500" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time></div>{review.comment && <p className="mt-3 text-sm leading-6 text-slate-700">{review.comment}</p>}</article>)}</div>}</section>
    </main>
  );
}
