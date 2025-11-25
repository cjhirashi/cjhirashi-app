import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { ConnectSupabaseSteps } from "@/components/tutorial/connect-supabase-steps";
import { SignUpUserSteps } from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />

      {/* Animated gradient blobs */}
      <div className="fixed top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none" />
      <div className="fixed top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="fixed -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none" />

      <div className="relative flex flex-col items-center">
        {/* Navigation */}
        <nav className="w-full flex justify-center backdrop-blur-sm bg-slate-900/30 border-b border-cyan-500/20 h-16 sticky top-0 z-40">
          <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center">
              <Link href="/" className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                CJHirashi
              </Link>
              <div className="flex items-center gap-2">
                <DeployButton />
              </div>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 w-full flex flex-col gap-16 items-center py-20">
          <div className="flex-1 flex flex-col gap-16 max-w-5xl p-5">
            {/* Hero Section */}
            <section className="space-y-8">
              <div className="text-center space-y-6">
                <Hero />
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Build with Speed
                  </h1>
                  <p className="text-cyan-300/70 text-lg md:text-xl max-w-2xl mx-auto">
                    A powerful Next.js and Supabase starter template with glassmorphic design and authentication built-in.
                  </p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!hasEnvVars ? (
                  <div className="rounded-lg border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl p-4 text-center text-cyan-300/70">
                    <EnvVarWarning />
                  </div>
                ) : (
                  <>
                    <Link
                      href="/protected"
                      className="px-8 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition-all duration-200 text-center"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/auth/login"
                      className="px-8 py-3 rounded-lg border border-cyan-500/50 bg-slate-900/50 hover:bg-slate-800/50 text-cyan-300 font-semibold transition-all duration-200 text-center"
                    >
                      Login
                    </Link>
                  </>
                )}
              </div>
            </section>

            {/* Steps Section */}
            <section className="space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-cyan-100">Get Started</h2>
                <p className="text-cyan-300/60">Follow these steps to set up your project</p>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
                {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full flex items-center justify-center border-t border-cyan-500/20 mx-auto text-center text-xs gap-8 py-12 bg-slate-900/30 backdrop-blur-sm">
          <p className="text-cyan-300/70">
            Powered by{" "}
            <a
              href="https://supabase.com/?utm_source=create-next-app&utm_medium=template&utm_term=nextjs"
              target="_blank"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              rel="noreferrer"
            >
              Supabase
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
