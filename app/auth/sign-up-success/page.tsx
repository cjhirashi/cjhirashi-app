import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function Page() {
  return (
    <div className="w-full max-w-sm">
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-8">
          {/* Icon */}
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-r from-green-500/20 to-cyan-500/20 flex items-center justify-center border border-green-500/40">
            <Mail className="w-10 h-10 text-green-400" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              Thanks for signing up!
            </h1>
            <p className="text-cyan-300/60 text-sm">
              Verify your email to activate your account
            </p>
          </div>

          {/* Message */}
          <div className="space-y-4 mb-8">
            <p className="text-sm text-cyan-300/80 text-center">
              We&apos;ve sent a confirmation email to your inbox. Please click the link to activate your account and get started.
            </p>
            <p className="text-xs text-cyan-300/50 text-center">
              Don&apos;t see the email? Check your spam folder or contact support.
            </p>
          </div>

          {/* Button */}
          <Link href="/auth/login" className="block">
            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
              Go to Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            <span className="text-xs text-cyan-300/50">Or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
          </div>

          {/* Back to home */}
          <p className="text-center text-sm text-cyan-300/70">
            <Link
              href="/"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
