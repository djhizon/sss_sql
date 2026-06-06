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
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");

  const isLengthValid = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

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

    if (mode === "register") {
      if (!isLengthValid || !hasLowercase || !hasUppercase || !hasNumber || !hasSymbol) {
        toast.error("Please ensure your password meets all requirements.");
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
          options: { 
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: phone,
              birthdate: birthdate
            }
          },
        });
        
        if (error) throw error;
        
        toast.success(
          "Registration successful. Please check your email to verify your account before logging in.",
        );
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setPhone("");
        setBirthdate("");
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
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/sss_bg.png')" }}
      >
        <div className="absolute inset-0 bg-[#1a365d]/85 mix-blend-multiply"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <SssHeader />
        <main className="flex-1 flex items-start justify-center px-4 py-10 mt-8">
          <div className={`w-full ${mode === "register" ? "max-w-lg" : "max-w-md"} transition-all duration-300 shadow-2xl rounded-lg overflow-hidden`}>
            
            {/* Dark Navy Header */}
            <div className="bg-[#1a365d] p-8 text-center border-b border-[#2a4a7f]">
              <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center overflow-hidden rounded-full shadow-md bg-white border-[3px] border-white">
                <img src="/sss_logo.png" alt="SSS Logo" className="w-full h-full object-cover object-center scale-[1.05]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1 tracking-wide">
                {mode === "forgot_password" ? "Reset Password" : mode === "login" ? "Sign in to Portal" : "Create Account"}
              </h2>
              <p className="text-[#a0b2c6] text-xs">
                Easily Access Your Records ONLINE!
              </p>
            </div>

            <div className="bg-white p-8">
              {mode === "forgot_password" && (
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Enter your email address and we will send you a link to reset your password.
                </p>
              )}

              <form onSubmit={onSubmit} className="space-y-5">
                {mode === "register" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">First Name</label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Last Name</label>
                      <input
                        type="text"
                        required
                        className="w-full border border-gray-300 rounded bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                )}

                <div className={mode === "register" ? "grid grid-cols-1 sm:grid-cols-2 gap-5" : ""}>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        className="w-full border border-gray-300 rounded bg-white pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                      />
                      {email && (
                        <button
                          type="button"
                          onClick={() => setEmail("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {mode === "register" && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        required
                        className="w-full border border-gray-300 rounded bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                  )}
                </div>
                
                {mode !== "forgot_password" && (
                  <div className={mode === "register" ? "grid grid-cols-1 sm:grid-cols-2 gap-5" : ""}>
                    <div>
                      <div className="flex justify-between items-end mb-1.5">
                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">Password</label>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          className="w-full border border-gray-300 rounded bg-white pl-3 pr-16 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
                          placeholder="Enter your password"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
                          {password && (
                            <button
                              type="button"
                              onClick={() => setPassword("")}
                              className="hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        {/* Password Requirements Popover */}
                        {mode === "register" && (isPasswordFocused || (!isLengthValid || !hasLowercase || !hasUppercase || !hasNumber || !hasSymbol)) && password.length > 0 && (
                          <div className="absolute top-full left-0 mt-2 w-full sm:w-[280px] bg-white border border-gray-200 shadow-xl rounded p-4 z-50 text-xs">
                            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-t border-l border-gray-200 rotate-45"></div>
                            <div className="relative z-10">
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
                          </div>
                        )}
                      </div>
                      
                      {mode === "login" && (
                        <div className="mt-2 text-right">
                          <button
                            type="button"
                            onClick={() => setMode("forgot_password")}
                            className="text-xs font-bold text-[#1a365d] hover:underline"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      )}
                    </div>
                    {mode === "register" && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">Birthdate</label>
                        <input
                          type="date"
                          required
                          className="w-full border border-gray-300 rounded bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                          value={birthdate}
                          onChange={(e) => setBirthdate(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    disabled={loading}
                    className="w-full py-3 bg-[#0f2444] text-white text-sm font-bold tracking-wide rounded hover:bg-[#1a365d] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    {loading ? "Please wait…" : mode === "forgot_password" ? "Send Reset Link" : mode === "login" ? "Log In" : "Create Account"}
                  </button>
                </div>
                
                {mode === "forgot_password" && (
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="w-full py-2 text-sm text-[#1a365d] font-bold hover:underline"
                  >
                    Back to Sign In
                  </button>
                )}
              </form>
            </div>

            {/* Enroll Now Section (Distinct bottom area) */}
            {mode !== "forgot_password" && (
              <div className="bg-[#f8f9fa] border-t border-gray-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                {mode === "login" ? (
                  <>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">New Portal user?</p>
                      <p className="text-xs text-gray-500 mt-0.5">Start here — enrollment only takes a few minutes.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setMode("register")} 
                      className="shrink-0 px-5 py-2.5 bg-[#e09f3e] text-white text-sm font-bold rounded hover:bg-[#c98e37] transition-colors shadow-sm"
                    >
                      + Enroll Now
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">Already have an account?</p>
                      <p className="text-xs text-gray-500 mt-0.5">Sign in to access your dashboard.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setMode("login")} 
                      className="shrink-0 px-5 py-2.5 bg-[#1a365d] text-white text-sm font-bold rounded hover:bg-[#0f2444] transition-colors shadow-sm"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </div>
            )}
            
          </div>
        </main>
        
        {/* Footer info below the card */}
        <div className="relative z-10 pb-8 text-white/70 text-xs text-center space-y-1">
          <p>By continuing, you agree to our</p>
          <p>
            <a href="https://www.sss.gov.ph/terms-of-service/" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">Terms of Service</a>
            {" | "}
            <a href="https://www.sss.gov.ph/data-privacy-notice/" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">Data Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
