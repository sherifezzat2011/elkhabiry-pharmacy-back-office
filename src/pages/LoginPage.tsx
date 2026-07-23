import { LockKeyhole, Mail } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";

export function LoginPage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="grid min-h-screen place-items-center bg-brand-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-brand-100 bg-white p-7 shadow-soft">
        <div className="mb-7 text-center">
          <BrandLogo className="mx-auto h-28 w-48" />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">El Khabiry Back Office</h1>
          <p className="mt-2 text-sm text-slate-500">Secure access to pharmacy operations</p>
          <p className="mt-2 text-sm font-semibold text-brand-700" lang="ar">نظام إدارة وتشغيل صيدليات الخبيري</p>
        </div>

        <form className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              <Mail className="h-4 w-4 text-slate-400" />
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" type="email" autoComplete="email" />
            </span>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <span className="mt-2 flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              <LockKeyhole className="h-4 w-4 text-slate-400" />
              <input className="min-w-0 flex-1 bg-transparent text-sm outline-none" type="password" autoComplete="current-password" />
            </span>
          </label>

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="inline-flex items-center gap-2 text-slate-600">
              <input className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" type="checkbox" />
              Remember me
            </label>
            <button type="button" className="font-semibold text-brand-700 hover:text-brand-800">
              Forgot password?
            </button>
          </div>

          <Button className="w-full" variant="primary" type="submit">Sign In</Button>
        </form>

        <footer className="mt-7 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          El Khabiry Pharmacy &copy; 2018-{currentYear}
          <span className="mt-1 block">Internal use only</span>
        </footer>
      </section>
    </main>
  );
}
