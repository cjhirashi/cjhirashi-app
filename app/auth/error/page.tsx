import Link from "next/link";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-red-500/20 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
              Oops!
            </h1>
            <p className="text-cyan-300/60 text-sm">
              Something went wrong
            </p>
          </div>

          {/* Error Message */}
          <div className="space-y-4 mb-8">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              {params?.error ? (
                <p className="text-sm text-red-300">
                  <span className="font-semibold">Error code:</span> {params.error}
                </p>
              ) : (
                <p className="text-sm text-red-300">
                  An unexpected error has occurred. Please try again.
                </p>
              )}
            </div>
            <p className="text-sm text-cyan-300/70">
              If this problem persists, please contact support or try again later.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link href="/auth/login" className="block">
              <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200">
                Back to Login
              </button>
            </Link>
            <Link href="/" className="block">
              <button className="w-full border border-cyan-500/50 bg-slate-900/50 hover:bg-slate-800/50 text-cyan-300 font-semibold py-2 rounded-lg transition-all duration-200">
                Go Home
              </button>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            <span className="text-xs text-cyan-300/50">Or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
          </div>

          {/* Help link */}
          <p className="text-center text-sm text-cyan-300/70">
            Need help?{" "}
            <a
              href="mailto:support@example.com"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
