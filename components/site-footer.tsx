import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-sky-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div><p className="font-bold text-[#123A72]">ArNiWorks</p><p className="mt-1 text-sm text-slate-500">Your Skills. Your World.</p></div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
          <a href="mailto:support@arniworks.com" className="hover:text-[#1769E0]">Contact</a>
          <a href="mailto:support@arniworks.com?subject=Help%20center" className="hover:text-[#1769E0]">Help Center</a>
          <Link href="/privacy-policy" className="hover:text-[#1769E0]">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#1769E0]">Terms</Link>
        </nav>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} ArNiWorks</p>
      </div>
    </footer>
  );
}
