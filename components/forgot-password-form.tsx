"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm", className)} {...props}>
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-8">
          {success ? (
            <>
              {/* Success Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  Check Your Email
                </h1>
                <p className="text-cyan-300/60 text-sm">
                  Password reset instructions sent
                </p>
              </div>

              {/* Success Message */}
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300">
                    If you registered using your email and password, you will receive a password reset email shortly.
                  </p>
                </div>
                <p className="text-sm text-cyan-300/70">
                  Check your inbox and follow the link to reset your password. If you don&apos;t see the email, check your spam folder.
                </p>
              </div>

              {/* Back to login */}
              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
                <span className="text-xs text-cyan-300/50">Or</span>
                <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
              </div>

              <p className="mt-6 text-center text-sm text-cyan-300/70">
                <Link
                  href="/auth/login"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Back to login
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Form Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                  Reset Password
                </h1>
                <p className="text-cyan-300/60 text-sm">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleForgotPassword} className="space-y-6">
                {/* Email field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-cyan-100 font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800/50 border-cyan-500/30 text-cyan-100 placeholder:text-cyan-300/40 focus:border-cyan-400 focus:ring-cyan-400/20 rounded-lg"
                  />
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-white border-r-white" />
                      Sending...
                    </span>
                  ) : (
                    "Send reset email"
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
                <span className="text-xs text-cyan-300/50">Or</span>
                <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
              </div>

              {/* Login link */}
              <p className="text-center text-sm text-cyan-300/70">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
