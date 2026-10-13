import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      confirmationError={params.error === "confirmation"}
      supabaseConfigured={isSupabaseConfigured()}
    />
  );
}
