import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageForm } from "@/components/message-form";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createServerClient } from "@/lib/supabase/server";

export const metadata = { title: "Project messages" };
export const dynamic = "force-dynamic";

type ProjectInfo = { id: string; title: string; client_id: string; status: string };
type AcceptedApplication = { project_id: string; freelancer_id: string };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="rounded-xl bg-sky-50 p-5 text-sm">Connect Supabase to use project messaging.</p></main>;
  }

  const { project: selectedProjectId } = await searchParams;
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Unable to verify messages session:", authError.message);
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your account could not be verified.</p></main>;
  }
  if (!user) redirect("/login");

  const { data: acceptedApps, error: applicationsError } = await supabase
    .from("applications")
    .select("project_id,freelancer_id")
    .eq("status", "accepted");
  if (applicationsError) {
    console.error("Unable to load accepted project connections:", applicationsError.message);
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Your conversations could not be loaded.</p></main>;
  }

  const applications = (acceptedApps ?? []) as AcceptedApplication[];
  const projectIds = [...new Set(applications.map((application) => application.project_id))];
  const { data: projectData, error: projectsError } = projectIds.length
    ? await supabase.from("projects").select("id,title,client_id,status").in("id", projectIds)
    : { data: [], error: null };

  if (projectsError) {
    console.error("Unable to load project conversation details:", projectsError.message);
    return <main className="mx-auto max-w-5xl px-4 py-12"><p role="alert" className="rounded-xl bg-red-50 p-5 text-sm text-red-800">Project details for your conversations could not be loaded.</p></main>;
  }

  const projects = (projectData ?? []) as ProjectInfo[];
  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const connections = applications
    .filter((application) => {
      const project = projectMap.get(application.project_id);
      return project && (project.client_id === user.id || application.freelancer_id === user.id);
    })
    .map((application) => {
      const project = projectMap.get(application.project_id)!;
      const partnerId = project.client_id === user.id ? application.freelancer_id : project.client_id;
      return { project, partnerId };
    });
  const selected = connections.find(({ project }) => project.id === selectedProjectId);

  let messages: { id: string; sender_id: string; content: string; created_at: string }[] = [];
  let conversationError = "";
  if (selected) {
    const { data, error } = await supabase
      .from("messages")
      .select("id,sender_id,content,created_at")
      .eq("project_id", selected.project.id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      console.error("Unable to load project messages:", error.message);
      conversationError = "This conversation could not be loaded.";
    } else {
      messages = data ?? [];
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">Your workspace</p>
      <h1 className="mt-2 text-3xl font-black text-[#123A72]">Project messages</h1>
      <p className="mt-2 text-sm text-slate-600">Conversations are available only between participants in projects with an accepted proposal.</p>
      <div className="mt-7 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-xl border border-sky-100 bg-white p-4">
          <h2 className="font-bold text-[#123A72]">Accepted projects</h2>
          {connections.length === 0 ? <p className="mt-3 text-sm text-slate-600">No accepted project connections yet.</p> : <ul className="mt-3 space-y-2">{connections.map(({ project }) => <li key={project.id}><Link href={`/messages?project=${encodeURIComponent(project.id)}`} className={`block rounded-lg p-3 text-sm ${project.id === selectedProjectId ? "bg-sky-50 font-semibold text-[#1769E0]" : "text-slate-700 hover:bg-slate-50"}`}>{project.title}</Link></li>)}</ul>}
        </aside>
        <section className="min-h-80 rounded-xl border border-sky-100 bg-white p-5 sm:p-6">
          {!selected ? <div className="flex min-h-64 flex-col items-center justify-center text-center"><h2 className="font-semibold text-[#123A72]">Choose a project conversation</h2><p className="mt-2 text-sm text-slate-600">Only conversations tied to your accepted projects are available here.</p></div> : <>
            <div className="border-b border-slate-100 pb-4"><p className="text-xs font-semibold uppercase tracking-wide text-[#1769E0]">Project conversation</p><h2 className="mt-1 font-bold text-[#123A72]">{selected.project.title}</h2></div>
            {conversationError ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{conversationError}</p> : <div className="max-h-[440px] space-y-3 overflow-y-auto py-5" aria-live="polite">{messages.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No messages yet. Start the conversation.</p> : messages.map((message) => <div key={message.id} className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${message.sender_id === user.id ? "ml-auto bg-[#1769E0] text-white" : "bg-slate-100 text-slate-800"}`}><p className="whitespace-pre-wrap break-words">{message.content}</p><time className={`mt-2 block text-[10px] ${message.sender_id === user.id ? "text-blue-100" : "text-slate-500"}`} dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time></div>)}</div>}
            <MessageForm projectId={selected.project.id} recipientId={selected.partnerId} />
          </>}
        </section>
      </div>
    </main>
  );
}
