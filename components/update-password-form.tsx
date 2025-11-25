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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/protected");
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
              Set New Password
            </h1>
            <p className="text-cyan-300/60 text-sm">
              Enter your new password to reset your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleForgotPassword} className="space-y-6">
            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-cyan-100 font-medium">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Saving...
                </span>
              ) : (
                "Save new password"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/20 to-transparent" />
            <span className="text-xs text-cyan-300/50">Or</span>
            <div className="flex-1 h-px bg-gradient-to-l from-cyan-500/20 to-transparent" />
          </div>

          {/* Back to login */}
          <p className="text-center text-sm text-cyan-300/70">
            Changed your mind?{" "}
            <a
              href="/auth/login"
              className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              Back to login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
