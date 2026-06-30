import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "@/components/auth/login-form";
import { ShieldCheck, BookOpen, FolderLock } from "lucide-react";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-ink-900 px-12 py-12 text-white lg:flex">
        <div className="preview-frame absolute inset-0 opacity-90" />
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-ink-950">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-display text-[17px]">Amara Hospital</span>
        </div>

        <div className="relative z-10">
          <DocumentSeal />
          <h2 className="mt-10 max-w-sm font-display text-[28px] leading-snug text-balance">
            Every policy, protocol, and record — organized, secure, and in one place.
          </h2>
          <ul className="mt-7 space-y-3 text-[13.5px] text-ink-200">
            <li className="flex items-center gap-2.5">
              <FolderLock className="h-4 w-4 text-amber-400" /> Role-based access by department &amp; folder
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-amber-400" /> Every action recorded in the audit trail
            </li>
            <li className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4 text-amber-400" /> HR · Quality · Library · Training, all searchable
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-[12px] text-ink-400">
          Access is provisioned by your administrator. Contact them if you need an account.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-paper px-6 py-12">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

function DocumentSeal() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="opacity-95">
      <rect x="14" y="22" width="62" height="78" rx="6" transform="rotate(-8 14 22)" fill="#163e36" stroke="#2f6b5f" strokeWidth="1.5" />
      <rect x="24" y="14" width="62" height="78" rx="6" transform="rotate(4 24 14)" fill="#1f5247" stroke="#2f6b5f" strokeWidth="1.5" />
      <rect x="22" y="18" width="62" height="80" rx="6" fill="#f7f5f0" />
      <line x1="32" y1="34" x2="74" y2="34" stroke="#d4e3e0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="44" x2="74" y2="44" stroke="#d4e3e0" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="54" x2="62" y2="54" stroke="#d4e3e0" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="80" cy="86" r="22" fill="#dd7a2e" stroke="#9c4a18" strokeWidth="2" />
      <path d="M71 86.5 L77.5 93 L90 78" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
