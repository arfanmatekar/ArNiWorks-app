export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">Terms</p>
      <h1 className="mt-2 text-4xl font-black text-[#123A72]">Platform terms of use</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-slate-600">
        <p>
          Users of ArNiWorks agree to provide accurate profile information, comply with relevant laws, and use the platform for legitimate freelance or hiring activities.
        </p>
        <p>
          Clients and freelancers are responsible for project scope, communication, deadlines, and review quality. ArNiWorks supports dispute escalation and moderation workflows, but does not act as a guaranteed payment intermediary unless separately enabled in a verified payment integration.
        </p>
        <p>
          Any fraudulent behavior, abusive messaging, or misuse of project data may result in account restrictions and platform moderation actions.
        </p>
      </div>
    </div>
  );
}
