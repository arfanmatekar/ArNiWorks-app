"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export type DashboardActionState = { error?: string; success?: string };

export async function respondToApplication(
  _previousState: DashboardActionState,
  formData: FormData,
): Promise<DashboardActionState> {
  const applicationId = formData.get("application_id");
  const decision = formData.get("decision");

  if (
    typeof applicationId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId) ||
    (decision !== "accepted" && decision !== "rejected")
  ) {
    return { error: "That proposal action is invalid." };
  }

  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) return { error: "Your account could not be verified. Please sign in again." };
  if (!user) return { error: "Sign in to manage project proposals." };

  const { error } = await supabase.rpc("respond_to_application", {
    requested_application_id: applicationId,
    decision,
  });

  if (error) {
    console.error("Unable to review project proposal:", error.message);
    return { error: "That proposal is no longer available for review. Refresh the page and try again." };
  }

  revalidatePath("/dashboard");
  return { success: `Proposal ${decision}.` };
}

export async function signOutAction() {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("We couldn’t sign you out. Please try again.");
  redirect("/login");
}
