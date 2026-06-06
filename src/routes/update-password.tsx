import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { toast } from "sonner";
import { Eye, EyeOff, X } from "lucide-react";

export const Route = createFileRoute("/update-password")({
  head: () => ({
    meta: [
      { title: "Update Password — SSS Member Portal" },
      { name: "description", content: "Update your secure SSS Member Portal password." },
    ],
  }),
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Ensure the user actually has a session (they clicked a recovery link)
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        toast.error("Invalid or expired password reset link.");
        navigate({ to: "/auth", replace: true });
      }
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success("Password updated successfully!");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
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
            Create New Password
          </div>
          <div className="sss-section-body">
            <p className="text-sm text-muted-foreground mb-6">
              Please enter your new secure password below. Make sure it is at least 6 characters long.
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="sss-label">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="w-full border border-sss-form-border bg-white pl-3 pr-10 py-2 text-sm font-sans normal-case tracking-normal focus:outline-2 focus:outline-sss-navy focus:outline-offset-[-1px]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="sss-label">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="w-full border border-sss-form-border bg-white pl-3 pr-10 py-2 text-sm font-sans normal-case tracking-normal focus:outline-2 focus:outline-sss-navy focus:outline-offset-[-1px]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <button
                disabled={loading}
                className="w-full py-2.5 bg-sss-navy text-white text-sm font-bold tracking-wide uppercase hover:bg-sss-navy-dark disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <SssFooter />
    </div>
  );
}
