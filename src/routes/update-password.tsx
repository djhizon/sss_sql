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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const isLengthValid = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

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
    if (!isLengthValid || !hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
      toast.error("Please ensure your password meets all requirements.");
      return;
    }
    
    setLoading(true);
    try {
      // First check if the new password is the same as the old password
      const session = await supabase.auth.getSession();
      const userEmail = session.data.session?.user?.email;
      
      if (userEmail) {
        // We try to sign in with the NEW password. If it succeeds, it means the new password is the old password!
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: password,
        });

        if (!signInError) {
          toast.error("Your new password cannot be the same as your old password.");
          setLoading(false);
          return;
        }
      }

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
      <main className="flex-1 flex items-start justify-center px-4 py-10 bg-gray-50/50">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-sss-section-bg border-b border-gray-200 px-6 py-4 font-bold text-sm tracking-widest text-sss-label uppercase text-center">
            Create New Password
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-6">
              Please enter your new secure password below.
            </p>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="sss-label">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    className="sss-input pr-10 font-sans normal-case tracking-normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password Requirements Popover */}
                {(isPasswordFocused || (!isLengthValid || !hasLowercase || !hasUppercase || !hasNumber || !hasSymbol)) && password.length > 0 && (
                  <div className="mt-2 w-full bg-white border border-gray-200 shadow-sm rounded p-4 text-xs">
                    <p className="font-bold text-gray-500 mb-2 tracking-wide text-[10px] uppercase">Password Must</p>
                    <ul className="space-y-1.5">
                      <li className={`flex items-center gap-2 ${isLengthValid ? "text-green-600" : "text-gray-600"}`}>
                        <span className="w-3 text-center">{isLengthValid ? "✓" : "•"}</span> Be at least 8 characters
                      </li>
                      <li className={`flex items-center gap-2 ${hasUppercase ? "text-green-600" : "text-gray-600"}`}>
                        <span className="w-3 text-center">{hasUppercase ? "✓" : "•"}</span> Contain at least one uppercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${hasLowercase ? "text-green-600" : "text-gray-600"}`}>
                        <span className="w-3 text-center">{hasLowercase ? "✓" : "•"}</span> Contain at least one lowercase letter
                      </li>
                      <li className={`flex items-center gap-2 ${hasNumber ? "text-green-600" : "text-gray-600"}`}>
                        <span className="w-3 text-center">{hasNumber ? "✓" : "•"}</span> Contain at least one number
                      </li>
                      <li className={`flex items-center gap-2 ${hasSymbol ? "text-green-600" : "text-gray-600"}`}>
                        <span className="w-3 text-center">{hasSymbol ? "✓" : "•"}</span> Contain at least one symbol
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <div>
                <label className="sss-label">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    className="sss-input pr-10 font-sans normal-case tracking-normal"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <button
                disabled={loading}
                className="w-full mt-4 py-3 bg-sss-navy text-white text-sm font-bold tracking-wide uppercase hover:bg-sss-navy-dark disabled:opacity-60 rounded-lg transition-colors shadow-sm"
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
