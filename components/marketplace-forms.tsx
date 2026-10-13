"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { categories } from "@/lib/demo-data";

type ProfileData = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  portfolio_url: string | null;
  skills: string[];
  experience_level: string | null;
  hourly_rate: number | null;
  currency: string;
  company_name: string | null;
};

type ProjectData = {
  id?: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: "INR" | "USD" | "EUR";
  deadline: string | null;
  requirements: string[];
};

const projectSchema = z.object({
  title: z.string().trim().min(8).max(120),
  description: z.string().trim().min(30).max(8000),
  category: z.enum(categories as [string, ...string[]]),
  budget: z.number().finite().positive().max(100_000_000),
  currency: z.enum(["INR", "USD", "EUR"]),
  deadline: z.string().nullable(),
  requirements: z.array(z.string().trim().min(1).max(40)).max(20),
});

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{children}{hint && <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}</label>;
}

function StatusMessage({ error, success }: { error: string; success: string }) {
  if (error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>;
  if (success) return <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>;
  return null;
}

function SubmitButton({
  children,
  pending,
  disabled = pending,
}: {
  children: ReactNode;
  pending: boolean;
  disabled?: boolean;
}) {
  return <button disabled={disabled} type="submit" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#1769E0] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123A72] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Please wait…" : children}</button>;
}

function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 ${props.className ?? ""}`} />;
}

function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 ${props.className ?? ""}`} />;
}

function SupabaseSetupNotice() {
  return (
    <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
      Account access is not set up yet. Add your Supabase project URL and public anon key to <code>.env.local</code>, then run <code>supabase/schema.sql</code>. No account has been created.
    </p>
  );
}

export function LoginForm({
  confirmationError = false,
  supabaseConfigured = false,
}: {
  confirmationError?: boolean;
  supabaseConfigured?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(confirmationError ? "The email confirmation link is invalid or expired. Please sign in or request a new link." : "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const values = new FormData(event.currentTarget);
      const { error: authError } = await createClient().auth.signInWithPassword({
        email: String(values.get("email") ?? "").trim(),
        password: String(values.get("password") ?? ""),
      });
      if (authError) throw authError;
      router.replace("/dashboard");
      router.refresh();
    } catch (cause) {
      console.error("Sign-in failed:", cause);
      setError(cause instanceof Error ? cause.message : "We could not sign you in. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <section aria-labelledby="login-heading" className="mx-auto max-w-lg px-4 py-12 sm:px-6">
    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769E0]">Your workspace</p>
      <h1 id="login-heading" className="mt-2 text-3xl font-black text-[#123A72]">Welcome back</h1>
      <p className="mb-7 mt-2 text-sm text-slate-600">Sign in to continue to your ArNiWorks dashboard.</p>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email address"><FormInput name="email" type="email" autoComplete="email" required maxLength={254} /></Field>
        <Field label="Password"><FormInput name="password" type="password" autoComplete="current-password" required minLength={8} /></Field>
        {!supabaseConfigured && <SupabaseSetupNotice />}
        <StatusMessage error={error} success="" />
        <SubmitButton pending={pending} disabled={pending || !supabaseConfigured}>{supabaseConfigured ? "Sign in" : "Supabase setup required"}</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-slate-600">New to ArNiWorks? <Link className="font-semibold text-[#1769E0] hover:underline" href="/signup">Create an account</Link></p>
    </div>
  </section>;
}

export function SignupForm({
  initialRole,
  supabaseConfigured = false,
}: {
  initialRole: "freelancer" | "client";
  supabaseConfigured?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const form = event.currentTarget;
      const values = new FormData(form);
      const fullName = String(values.get("full_name") ?? "").trim();
      const accountType = String(values.get("account_type") ?? "");
      const email = String(values.get("email") ?? "").trim();
      const password = String(values.get("password") ?? "");
      if (fullName.length < 2 || fullName.length > 100) throw new Error("Enter a name between 2 and 100 characters.");
      if (accountType !== "freelancer" && accountType !== "client") throw new Error("Choose a valid account type.");
      if (password.length < 10) throw new Error("Use a password with at least 10 characters.");
      const { data, error: authError } = await createClient().auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, account_type: accountType },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) throw authError;
      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setSuccess("Account created. Check your email to confirm your address before signing in.");
        form.reset();
      }
    } catch (cause) {
      console.error("Account registration failed:", cause);
      setError(cause instanceof Error ? cause.message : "We could not create your account. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return <section aria-labelledby="signup-heading" className="mx-auto max-w-lg px-4 py-12 sm:px-6">
    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769E0]">Join the marketplace</p>
      <h1 id="signup-heading" className="mt-2 text-3xl font-black text-[#123A72]">Create your account</h1>
      <p className="mb-7 mt-2 text-sm text-slate-600">Get started as a freelancer or a client. You can complete your profile after signing up.</p>
      <form onSubmit={submit} className="space-y-5">
        <Field label="I want to"><select name="account_type" defaultValue={initialRole} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm"><option value="freelancer">Find freelance work</option><option value="client">Hire talent</option></select></Field>
        <Field label="Full name"><FormInput name="full_name" autoComplete="name" required minLength={2} maxLength={100} /></Field>
        <Field label="Email address"><FormInput name="email" type="email" autoComplete="email" required maxLength={254} /></Field>
        <Field label="Password" hint="Use at least 10 characters."><FormInput name="password" type="password" autoComplete="new-password" required minLength={10} maxLength={128} /></Field>
        {!supabaseConfigured && <SupabaseSetupNotice />}
        <StatusMessage error={error} success={success} />
        <SubmitButton pending={pending} disabled={pending || !supabaseConfigured}>{supabaseConfigured ? "Create account" : "Supabase setup required"}</SubmitButton>
        <p className="text-xs leading-5 text-slate-500">By creating an account, you agree to our <Link className="underline" href="/terms">Terms</Link> and <Link className="underline" href="/privacy-policy">Privacy Policy</Link>.</p>
      </form>
      <p className="mt-5 text-sm text-slate-600">Already have an account? <Link className="font-semibold text-[#1769E0] hover:underline" href="/login">Sign in</Link></p>
    </div>
  </section>;
}

export function ProjectForm({ project }: { project?: ProjectData }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const values = new FormData(event.currentTarget);
      const requirements = String(values.get("requirements") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
      const parsed = projectSchema.safeParse({
        title: values.get("title"),
        description: values.get("description"),
        category: values.get("category"),
        budget: Number(values.get("budget")),
        currency: values.get("currency"),
        deadline: String(values.get("deadline") ?? "") || null,
        requirements,
      });
      if (!parsed.success) throw new Error("Check the title, description, budget, category, and skills. Titles need 8+ characters and descriptions need 30+.");
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Sign in with a client account to publish a project.");
      const { error: saveError } = project?.id
        ? await supabase.from("projects").update(parsed.data).eq("id", project.id)
        : await supabase.from("projects").insert({ ...parsed.data, client_id: user.id });
      if (saveError) throw saveError;
      setSuccess(project?.id ? "Project updated." : "Project published.");
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      console.error("Unable to save project:", cause);
      setError(cause instanceof Error ? cause.message : "The project could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="mt-6 space-y-5">
    <Field label="Project title"><FormInput name="title" required minLength={8} maxLength={120} defaultValue={project?.title} placeholder="e.g. Build a Shopify storefront for our brand" /></Field>
    <Field label="Project description" hint="At least 30 characters. Share the scope and expected deliverables."><FormTextarea name="description" required minLength={30} maxLength={8000} rows={7} defaultValue={project?.description} /></Field>
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Category"><select name="category" required defaultValue={project?.category ?? ""} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm"><option value="" disabled>Select a category</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field>
      <Field label="Skills (comma separated)"><FormInput name="requirements" maxLength={500} defaultValue={project?.requirements.join(", ")} placeholder="React, Figma, SEO" /></Field>
      <Field label="Budget"><FormInput name="budget" type="number" min="1" max="100000000" step="0.01" required defaultValue={project?.budget} /></Field>
      <Field label="Currency"><select name="currency" defaultValue={project?.currency ?? "INR"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm"><option value="INR">INR · ₹</option><option value="USD">USD · $</option><option value="EUR">EUR · €</option></select></Field>
      <Field label="Target deadline" hint="Optional; set a reasonable target date."><FormInput name="deadline" type="date" min={new Date().toISOString().slice(0, 10)} defaultValue={project?.deadline ?? ""} /></Field>
    </div>
    <StatusMessage error={error} success={success} />
    <SubmitButton pending={pending}>{project?.id ? "Save project changes" : "Publish project"}</SubmitButton>
  </form>;
}

export function ProposalForm({ projectId, defaultCurrency }: { projectId: string; defaultCurrency: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const values = new FormData(event.currentTarget);
      const coverLetter = String(values.get("cover_letter") ?? "").trim();
      const price = Number(values.get("proposed_price"));
      const days = Number(values.get("estimated_delivery_days"));
      if (coverLetter.length < 40 || coverLetter.length > 4000 || !Number.isFinite(price) || price <= 0 || !Number.isInteger(days) || days < 1 || days > 3650) {
        throw new Error("Write a cover letter of at least 40 characters, and enter a valid price and delivery estimate.");
      }
      const { data: { user }, error: authError } = await createClient().auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Sign in with a freelancer account to submit a proposal.");
      const { error: insertError } = await createClient().from("applications").insert({
        project_id: projectId,
        freelancer_id: user.id,
        cover_letter: coverLetter,
        proposed_price: price,
        currency: String(values.get("currency")),
        estimated_delivery_days: days,
      });
      if (insertError) throw insertError;
      setSuccess("Your proposal was submitted.");
      router.refresh();
    } catch (cause) {
      console.error("Unable to submit proposal:", cause);
      setError(cause instanceof Error && cause.message.includes("duplicate") ? "You have already applied to this project." : cause instanceof Error ? cause.message : "Your proposal could not be submitted.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="mt-4 space-y-4">
    <Field label="Cover letter"><FormTextarea name="cover_letter" minLength={40} maxLength={4000} required rows={5} placeholder="Tell the client how you would approach this project and why you're a good fit." /></Field>
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Your price"><FormInput name="proposed_price" type="number" min="0.01" step="0.01" required /></Field>
      <Field label="Currency"><select name="currency" defaultValue={defaultCurrency} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"><option value="INR">INR</option><option value="USD">USD</option><option value="EUR">EUR</option></select></Field>
      <Field label="Delivery (days)"><FormInput name="estimated_delivery_days" type="number" min="1" max="3650" step="1" required /></Field>
    </div>
    <StatusMessage error={error} success={success} />
    <SubmitButton pending={pending}>Submit proposal</SubmitButton>
    <p className="text-xs text-slate-500">Duplicate applications are blocked. ArNiWorks does not process payments yet.</p>
  </form>;
}

export function ProfileEditor({ profile, accountType }: { profile: ProfileData; accountType: "client" | "freelancer" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const values = new FormData(event.currentTarget);
      const fullName = String(values.get("full_name") ?? "").trim();
      const bio = String(values.get("bio") ?? "").trim();
      const skills = String(values.get("skills") ?? "").split(",").map((skill) => skill.trim()).filter(Boolean);
      const portfolioUrl = String(values.get("portfolio_url") ?? "").trim();
      const currency = String(values.get("currency"));
      const rateText = String(values.get("hourly_rate") ?? "");
      const hourlyRate = rateText ? Number(rateText) : null;
      if (fullName.length < 2 || fullName.length > 100) {
        throw new Error("Full name must be between 2 and 100 characters.");
      }
      if (bio.length > 3000) {
        throw new Error(`Your bio has ${bio.length} characters. The limit is 3,000; shorten it and try again.`);
      }
      if (skills.length > 30) {
        throw new Error(`You entered ${skills.length} skills. Keep your list to 30 skills or fewer, separated by commas.`);
      }
      const longSkill = skills.find((skill) => skill.length > 40);
      if (longSkill) {
        throw new Error(`One of your skills is longer than 40 characters (${longSkill.length}). Shorten each skill and separate skills with commas.`);
      }
      if (portfolioUrl && !z.string().url().safeParse(portfolioUrl).success) throw new Error("Enter a valid portfolio URL including https://.");
      if (accountType === "freelancer" && hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 100_000_000)) throw new Error("Enter a valid hourly rate.");
      if (!["INR", "USD", "EUR"].includes(currency)) throw new Error("Select a supported currency.");

      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user || user.id !== profile.id) throw new Error("Sign in again to update this profile.");
      let avatarUrl = profile.avatar_url;
      const avatar = values.get("avatar");
      if (avatar instanceof File && avatar.size > 0) {
        if (avatar.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(avatar.type)) throw new Error("Choose a JPEG, PNG, or WebP image under 5 MB.");
        const extension = avatar.type === "image/jpeg" ? "jpg" : avatar.type.split("/")[1];
        const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(path, avatar, { contentType: avatar.type, upsert: false });
        if (uploadError) throw uploadError;
        avatarUrl = supabase.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
      }
      const update = {
        full_name: fullName,
        bio: bio || null,
        skills,
        portfolio_url: portfolioUrl || null,
        avatar_url: avatarUrl,
        experience_level: accountType === "freelancer" ? String(values.get("experience_level")) : null,
        hourly_rate: accountType === "freelancer" ? hourlyRate : null,
        currency,
        company_name: accountType === "client" ? String(values.get("company_name") ?? "").trim().slice(0, 120) || null : null,
      };
      const { error: updateError } = await supabase.from("profiles").update(update).eq("id", user.id);
      if (updateError) throw updateError;
      setSuccess("Your profile was saved.");
      router.refresh();
    } catch (cause) {
      console.error("Unable to update profile:", cause);
      setError(cause instanceof Error ? cause.message : "Your profile could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-5">
    <Field label="Full name"><FormInput name="full_name" required minLength={2} maxLength={100} defaultValue={profile.full_name} /></Field>
    <Field label="Profile photo" hint="JPEG, PNG, or WebP · up to 5 MB"><FormInput name="avatar" type="file" accept="image/jpeg,image/png,image/webp" /></Field>
    {accountType === "client" && <Field label="Company or client name"><FormInput name="company_name" maxLength={120} defaultValue={profile.company_name ?? ""} /></Field>}
    <Field label="About you" hint="A short professional introduction."><FormTextarea name="bio" rows={5} maxLength={3000} defaultValue={profile.bio ?? ""} /></Field>
    <Field label="Skills" hint="Separate up to 30 skills with commas. Keep each skill under 40 characters."><FormInput name="skills" maxLength={1200} defaultValue={profile.skills.join(", ")} placeholder="React, Figma, Content strategy" /></Field>
    <Field label="Portfolio URL"><FormInput name="portfolio_url" type="url" maxLength={2048} defaultValue={profile.portfolio_url ?? ""} placeholder="https://" /></Field>
    {accountType === "freelancer" && <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Experience level"><select name="experience_level" defaultValue={profile.experience_level ?? "intermediate"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"><option value="entry">Entry level</option><option value="intermediate">Intermediate</option><option value="expert">Expert</option></select></Field>
      <Field label="Hourly rate"><FormInput name="hourly_rate" type="number" min="0" max="100000000" step="0.01" defaultValue={profile.hourly_rate ?? ""} /></Field>
    </div>}
    <Field label="Preferred currency"><select name="currency" defaultValue={profile.currency || "INR"} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm sm:max-w-xs"><option value="INR">INR · ₹</option><option value="USD">USD · $</option><option value="EUR">EUR · €</option></select></Field>
    <StatusMessage error={error} success={success} />
    <SubmitButton pending={pending}>Save profile</SubmitButton>
  </form>;
}

export function MessageForm({ projectId, recipientId }: { projectId: string; recipientId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const form = event.currentTarget;
      const content = String(new FormData(form).get("content") ?? "").trim();
      if (!content || content.length > 4000) throw new Error("Messages must be between 1 and 4,000 characters.");
      const { data: { user }, error: authError } = await createClient().auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Sign in to send a project message.");
      const { error: insertError } = await createClient().from("messages").insert({
        project_id: projectId,
        sender_id: user.id,
        recipient_id: recipientId,
        content,
      });
      if (insertError) throw insertError;
      form.reset();
      router.refresh();
    } catch (cause) {
      console.error("Unable to send project message:", cause);
      setError(cause instanceof Error ? cause.message : "Your message could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="border-t border-slate-100 pt-4">
    <label className="sr-only" htmlFor={`message-${projectId}`}>Write a message</label>
    <textarea id={`message-${projectId}`} name="content" maxLength={4000} required rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm" placeholder="Write a message to your project partner…" />
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={pending} className="ml-auto rounded-lg bg-[#1769E0] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Sending…" : "Send message"}</button></div>
  </form>;
}

export function ReviewForm({ projectId, recipientId }: { projectId: string; recipientId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const values = new FormData(event.currentTarget);
      const rating = Number(values.get("rating"));
      const comment = String(values.get("comment") ?? "").trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 2000) throw new Error("Choose a rating from 1 to 5 and keep your comment under 2,000 characters.");
      const { data: { user }, error: authError } = await createClient().auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Sign in to leave a review.");
      const { error: insertError } = await createClient().from("reviews").insert({ project_id: projectId, reviewer_id: user.id, recipient_id: recipientId, rating, comment: comment || null });
      if (insertError) throw insertError;
      setError("");
      router.refresh();
    } catch (cause) {
      console.error("Unable to submit project review:", cause);
      setError(cause instanceof Error ? cause.message : "Your review could not be submitted.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
    <label className="text-xs text-slate-600">Rating<select name="rating" defaultValue="5" className="ml-2 rounded border border-slate-200 bg-white px-2 py-2"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Okay</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></label>
    <label className="min-w-48 flex-1 text-xs text-slate-600">Comment<input name="comment" maxLength={2000} className="mt-1 block w-full rounded border border-slate-200 px-3 py-2 text-sm" placeholder="Optional feedback" /></label>
    <button disabled={pending} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-[#1769E0] disabled:opacity-60">{pending ? "Submitting…" : "Leave review"}</button>
    {error && <p role="alert" className="w-full text-xs text-red-700">{error}</p>}
  </form>;
}

export function ReportForm({ projectId, reportedUserId }: { projectId: string; reportedUserId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const values = new FormData(event.currentTarget);
      const description = String(values.get("description") ?? "").trim();
      if (description.length < 20 || description.length > 3000) throw new Error("Describe the issue in 20–3,000 characters.");
      const { data: { user }, error: authError } = await createClient().auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Sign in to submit a report.");
      const { error: insertError } = await createClient().from("reports").insert({
        reporter_id: user.id,
        project_id: projectId || null,
        reported_user_id: reportedUserId || null,
        reason: String(values.get("reason")),
        description,
      });
      if (insertError) throw insertError;
      setSuccess("Your report was securely submitted for review.");
      router.refresh();
    } catch (cause) {
      console.error("Unable to submit report:", cause);
      setError(cause instanceof Error ? cause.message : "Your report could not be submitted.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-5">
    <Field label="Reason"><select name="reason" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"><option value="fraud">Suspected fraud</option><option value="harassment">Harassment or abuse</option><option value="spam">Spam or misleading content</option><option value="other">Other platform issue</option></select></Field>
    <Field label="What happened?"><FormTextarea name="description" required minLength={20} maxLength={3000} rows={6} /></Field>
    <StatusMessage error={error} success={success} />
    <SubmitButton pending={pending}>Submit report</SubmitButton>
  </form>;
}

async function updateRecord(table: string, id: string, values: Record<string, string>) {
  const supabase = createClient();
  const { error } = await supabase.from(table).update(values).eq("id", id);
  if (error) throw error;
}

export function ApplicationDecision({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function decide(decision: "accepted" | "rejected") {
    setPending(true);
    setError("");
    try {
      const { error: rpcError } = await createClient().rpc("respond_to_application", { requested_application_id: applicationId, decision });
      if (rpcError) throw rpcError;
      router.refresh();
    } catch (cause) {
      console.error("Unable to update application status:", cause);
      setError(cause instanceof Error ? cause.message : "The proposal decision could not be saved.");
    } finally {
      setPending(false);
    }
  }
  return <div className="flex flex-wrap gap-2"><button type="button" disabled={pending} onClick={() => void decide("accepted")} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">{pending ? "Saving…" : "Accept"}</button><button type="button" disabled={pending} onClick={() => void decide("rejected")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-60">Reject</button>{error && <p role="alert" className="basis-full text-xs text-red-700">{error}</p>}</div>;
}

export function ProjectStatusControl({ projectId, status }: { projectId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const options = status === "completed" ? ["completed"] : ["open", "in_progress", "completed", "closed"];
  async function change(nextStatus: string) {
    setPending(true);
    setError("");
    try {
      await updateRecord("projects", projectId, { status: nextStatus });
      router.refresh();
    } catch (cause) {
      console.error("Unable to update project status:", cause);
      setError(cause instanceof Error ? cause.message : "The project status could not be updated.");
    } finally {
      setPending(false);
    }
  }
  return <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor={`project-status-${projectId}`}>Project status</label><select id={`project-status-${projectId}`} disabled={pending || status === "completed"} value={status} onChange={(event) => void change(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs capitalize disabled:opacity-60">{options.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>{error && <span role="alert" className="text-xs text-red-700">{error}</span>}</div>;
}

export function AccountStatusControl({ userId, status, accountType }: { userId: string; status: string; accountType: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function change(nextStatus: string) {
    setPending(true);
    setError("");
    try {
      await updateRecord("profiles", userId, { account_status: nextStatus });
      router.refresh();
    } catch (cause) {
      console.error("Unable to update account status:", cause);
      setError(cause instanceof Error ? cause.message : "The account status could not be updated.");
    } finally {
      setPending(false);
    }
  }
  return accountType === "admin" ? <span className="text-xs text-slate-500">Administrator</span> : <div><label className="sr-only" htmlFor={`account-status-${userId}`}>Account status</label><select id={`account-status-${userId}`} disabled={pending} value={status} onChange={(event) => void change(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option value="active">Active</option><option value="suspended">Suspended</option></select>{error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}

export function ReportStatusControl({ reportId, status }: { reportId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function change(nextStatus: string) {
    setPending(true);
    setError("");
    try {
      await updateRecord("reports", reportId, { status: nextStatus });
      router.refresh();
    } catch (cause) {
      console.error("Unable to update report status:", cause);
      setError(cause instanceof Error ? cause.message : "The report status could not be updated.");
    } finally {
      setPending(false);
    }
  }
  return <div><label className="sr-only" htmlFor={`report-status-${reportId}`}>Report status</label><select id={`report-status-${reportId}`} disabled={pending} value={status} onChange={(event) => void change(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select>{error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}
