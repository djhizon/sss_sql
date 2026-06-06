import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { toast } from "sonner";
import { Eye, EyeOff, X } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SSS Member Portal" },
      { name: "description", content: "Sign in or register for the SSS Member Portal." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (mode !== "forgot_password") {
      if (password.length < 8) {
        toast.error("Password must be at least 8 characters long.");
        return;
      }
      if (!/[a-z]/.test(password)) {
        toast.error("Password must contain at least one lowercase letter.");
        return;
      }
      if (!/[A-Z]/.test(password)) {
        toast.error("Password must contain at least one uppercase letter.");
        return;
      }
      if (!/[0-9]/.test(password)) {
        toast.error("Password must contain at least one number.");
        return;
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        toast.error("Password must contain at least one symbol.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "register") {
        // Smart Lookup: Pre-flight check to see if email already exists
        // @ts-ignore - The Database types haven't been regenerated yet for this new function
        const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', { check_email: email });
        
        if (emailExists === true) {
          throw new Error("This email is already registered. Please switch to Sign In.");
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        
        if (error) throw error;
        
        toast.success(
          "Registration successful. Please check your email to verify your account before logging in.",
        );
        setEmail("");
        setPassword("");
        setMode("login");
      } else if (mode === "forgot_password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        toast.success("Password reset instructions sent to your email.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Incorrect email or password. Please try again.");
          }
          if (error.message.includes("Email not confirmed")) {
            throw new Error("Please verify your email address before signing in.");
          }
          throw error;
        }
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SssHeader />
      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="sss-section-header">
            {mode === "forgot_password" ? "Reset Password" : mode === "login" ? "Member Sign In" : "Create Member Account"}
          </div>
          <div className="sss-section-body">
            {mode !== "forgot_password" && (
              <div className="flex gap-2 mb-4 text-sm">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 py-2 border ${mode === "login" ? "bg-sss-navy text-white border-sss-navy" : "border-sss-form-border"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex-1 py-2 border ${mode === "register" ? "bg-sss-navy text-white border-sss-navy" : "border-sss-form-border"}`}
                >
                  Register
                </button>
              </div>
            )}
            
            {mode === "forgot_password" && (
              <p className="text-sm text-muted-foreground mb-4">
                Enter your email address and we will send you a link to reset your password.
              </p>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="sss-label">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full border border-sss-form-border bg-white pl-3 pr-10 py-2 text-sm font-sans normal-case tracking-normal focus:outline-2 focus:outline-sss-navy focus:outline-offset-[-1px]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              {mode !== "forgot_password" && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="sss-label !mb-0">Password</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot_password")}
                        className="text-xs text-sss-navy hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      className="w-full border border-sss-form-border bg-white pl-3 pr-16 py-2 text-sm font-sans normal-case tracking-normal focus:outline-2 focus:outline-sss-navy focus:outline-offset-[-1px]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground">
                      {password && (
                        <button
                          type="button"
                          onClick={() => setPassword("")}
                          className="hover:text-foreground"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                disabled={loading}
                className="w-full py-2.5 bg-sss-navy text-white text-sm font-bold tracking-wide uppercase hover:bg-sss-navy-dark disabled:opacity-60"
              >
                {loading ? "Please wait…" : mode === "forgot_password" ? "Send Reset Link" : mode === "login" ? "Sign In" : "Create Account"}
              </button>
              
              {mode === "forgot_password" && (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full py-2 text-sm text-sss-navy hover:underline"
                >
                  Back to Sign In
                </button>
              )}
            </form>
          </div>
          <div className="text-xs text-muted-foreground mt-4 text-center space-y-1">
            <p>By continuing, you agree to our</p>
            <p>
              <a href="https://www.sss.gov.ph/terms-of-service/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground">Terms of Service</a>
              {" | "}
              <a href="https://www.sss.gov.ph/data-privacy-notice/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground">Data Privacy Policy</a>
            </p>
          </div>
        </div>
      </main>
      <SssFooter />
    </div>
  );
}
