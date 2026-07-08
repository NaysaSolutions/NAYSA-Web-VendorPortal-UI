import React, { useState } from "react";

export default function VendorLogin({ form, setForm, onSubmit, error, notice, loading }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden px-4 pt-6 pb-20 text-slate-900 sm:px-6 lg:px-8" style={{ backgroundImage: "url('/NAYSABG.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
      <div className="pointer-events-none absolute inset-0 bg-slate-950/35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/55 via-sky-950/25 to-blue-900/20" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(56,189,248,.25),transparent_28%),radial-gradient(circle_at_75%_30%,rgba(147,197,253,.16),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-8.5rem)] w-full max-w-7xl items-center justify-center">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-[1.08fr_.92fr]">
          <section className="hidden lg:block">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/50 bg-white/16 px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.28em] text-white shadow-xl backdrop-blur-md">NAYSA-SOLUTIONS INCORPORATED</div>
            <h1 className="whitespace-nowrap text-4xl font-black uppercase leading-none tracking-[0.06em] text-white drop-shadow-[0_5px_18px_rgba(0,0,0,.45)] xl:text-5xl 2xl:text-6xl">WE MAKE LIFE EASIER</h1>
            <p className="mt-5 max-w-2xl text-2xl font-bold uppercase tracking-[0.18em] text-sky-100 drop-shadow-[0_3px_12px_rgba(0,0,0,.45)]">THROUGH BUSINESS APPLICATIONS</p>
            <div className="my-7 h-1 w-28 rounded-full bg-sky-400 shadow-[0_0_22px_rgba(56,189,248,.8)]" />
            <p className="max-w-2xl text-base font-medium leading-8 text-white/95 drop-shadow-[0_2px_10px_rgba(0,0,0,.55)]">One login page for authorized personnel and vendor temporary accounts.</p>
          </section>

          <section className="flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <div className="mb-4 flex flex-col items-center text-center">
                <img src="/naysa_logo.png" alt="NAYSA Logo" className="mb-1 w-36 drop-shadow-[0_6px_18px_rgba(0,0,0,.35)] md:w-40" />
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_15px_rgba(0,0,0,.5)] md:text-3xl">Vendor Onboarding Portal</h1>
                <p className="mt-2 text-sm font-medium text-white/85">Sign in using your User ID and Password.</p>
              </div>

              <div className="relative w-full rounded-3xl p-7" style={{ background: "rgba(255,255,255,0.90)", border: "1px solid rgba(255,255,255,0.68)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", boxShadow: "0 24px 70px rgba(2,6,23,.32), inset 0 1px 0 rgba(255,255,255,.9)" }}>
                <form onSubmit={onSubmit} noValidate className="space-y-4">
                  <LoginInput label="User ID" value={form.userId} onChange={(value) => setForm((prev) => ({ ...prev, userId: value }))} placeholder="Enter your user ID" autoComplete="username" />
                  <LoginInput label="Password" type={showPassword ? "text" : "password"} value={form.password} onChange={(value) => setForm((prev) => ({ ...prev, password: value }))} placeholder="Enter your password" autoComplete="current-password" right={<button type="button" onClick={() => setShowPassword((prev) => !prev)} className="text-xs font-bold text-sky-700 hover:text-blue-700">{showPassword ? "Hide" : "Show"}</button>} />

                  {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">{notice}</div>}
                  {error && <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">{error}</div>}

                  <button type="submit" disabled={loading} className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" style={{ background: "linear-gradient(135deg,#0369a1 0%,#1d4ed8 100%)" }}>
                    {loading ? "Signing In..." : <>Sign In <span aria-hidden="true">→</span></>}
                  </button>
                </form>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">Login Information</p>
                  <div className="mt-3 space-y-2 text-xs leading-5 text-slate-600">
                    {/* <p>Authorized personnel are validated from the Laravel users table.</p> */}
                    <p>Vendors must open the registration link, enter the email access key, create a temporary account, then sign in here.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 z-30 w-full">
        <div className="w-full border-t border-white/20 bg-slate-950/75 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="text-center text-xs font-semibold tracking-wide text-white sm:text-sm">© 2026 NAYSA-SOLUTIONS, INC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function LoginInput({ label, value, onChange, type = "text", placeholder, autoComplete, right }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-700">{label}</span>
        {right}
      </div>
      <input type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20" />
    </label>
  );
}
