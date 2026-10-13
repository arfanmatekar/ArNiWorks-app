import { SignupForm } from "@/components/signup-form";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata = { title: "Create an account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const initialRole = params.role === "client" ? "client" : "freelancer";
  return (
    <SignupForm
      initialRole={initialRole}
      supabaseConfigured={isSupabaseConfigured()}
    />
  );
}
