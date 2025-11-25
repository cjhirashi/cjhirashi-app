/**
 * Auth Layout - Glassmorphic Design (Cyan theme)
 * Used for all /auth/* routes (login, signup, forgot-password, etc.)
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none" />

      {/* Animated gradient blobs */}
      <div className="fixed top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none" />
      <div className="fixed top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="fixed -bottom-8 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none" />

      {/* Content */}
      <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 md:p-10">
        {children}
      </div>
    </div>
  );
}
