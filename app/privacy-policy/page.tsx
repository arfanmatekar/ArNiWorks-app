export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#1769E0]">Privacy Policy</p>
      <h1 className="mt-2 text-4xl font-black text-[#123A72]">Protecting user data and professional information</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-slate-600">
        <p>
          ArNiWorks processes personal data only for legitimate marketplace needs including account creation, project matching, communication, trust and safety reviews, and support.
        </p>
        <p>
          We do not expose private data to unauthorized users and use role-based access controls to ensure that freelancers can only manage their own profiles and applications, while clients manage only their own project listings.
        </p>
        <p>
          Where payment processing is introduced in a future phase, it will be handled through a verified provider using secure, PCI-aligned practices. No card details are stored in the application itself.
        </p>
      </div>
    </div>
  );
}
