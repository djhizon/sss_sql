import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, User, Mail, Shield, Lock, Moon, Sun, Monitor } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ThemeProvider";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { useQuery } from "@tanstack/react-query";
import { checkIsAdmin } from "@/lib/applications.functions";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — SSS Member Portal" },
      { name: "description", content: "Update your SSS member account settings." },
    ],
  }),
  component: SettingsPage,
});

type TabId = "personal" | "email" | "password" | "appearance" | "actions";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const isLengthValid = password.length >= 8;
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  
  const { theme, setTheme } = useTheme();

  const { data: adminData } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
  });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
        if (data.user.email) {
          setCurrentEmail(data.user.email);
          setEmail(data.user.email);
        }
      }
    });
  }, []);

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (email === currentEmail) {
      toast.info("This is already your current email address.");
      return;
    }
    
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Not authenticated");

      const response = await fetch('/api/request-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session.access_token}`
        },
        body: JSON.stringify({ newEmail: email })
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error("Server returned an invalid response. Please try again.");
      }
      
      if (!response.ok) throw new Error(result.error || "Failed to update email address");

      toast.success("Confirmation sent to your CURRENT email address.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update email address.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEmail) return;
    
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(currentEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      toast.success("A password reset link has been sent to your email address.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send password reset link.");
    } finally {
      setLoadingPassword(false);
    }
  }

  const tabs = [
    { id: "personal", label: "Personal Information", icon: <User className="w-4 h-4" /> },
    { id: "email", label: "Change Email", icon: <Mail className="w-4 h-4" /> },
    { id: "password", label: "Change Password", icon: <Lock className="w-4 h-4" /> },
    { id: "appearance", label: "Appearance", icon: <Moon className="w-4 h-4" /> },
    { id: "actions", label: "Account Actions", icon: <Shield className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-muted/50">
      <SssHeader user={user} isAdmin={adminData?.isAdmin} />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">Account Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 bg-card border border-border rounded-md overflow-hidden shadow-sm">
            <nav className="flex flex-col relative">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabId)}
                    className={`relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left z-10
                      ${isActive 
                        ? "text-primary font-bold" 
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    {tab.icon}
                    <span className="relative z-10">{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="settingsActiveTab"
                        className="absolute inset-0 bg-blue-50 border-l-4 border-[#0038a8] z-0"
                        initial={false}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full">
            {activeTab === "personal" && (
              <div className="bg-card text-card-foreground border border-border rounded-md shadow-sm">
                <div className="sss-section-header rounded-t-md">Personal Information</div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-6">
                    These are the details you provided when registering for your SSS account.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 max-w-2xl">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">First Name</label>
                      <div className="text-sm font-medium text-foreground">{user?.user_metadata?.first_name || "—"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Last Name</label>
                      <div className="text-sm font-medium text-foreground">{user?.user_metadata?.last_name || "—"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Birthdate</label>
                      <div className="text-sm font-medium text-foreground">{user?.user_metadata?.birthdate ? new Date(user.user_metadata.birthdate).toLocaleDateString() : "—"}</div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Phone Number</label>
                      <div className="text-sm font-medium text-foreground">{user?.user_metadata?.phone || "—"}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="bg-card text-card-foreground border border-border rounded-md shadow-sm">
                <div className="sss-section-header rounded-t-md">Change Email</div>
                <div className="p-6">
                  <div className="bg-blue-50/50 border-l-4 border-[#0038a8] p-4 rounded-md mb-6">
                    <p className="text-sm text-foreground">
                      <strong>Security Notice:</strong> To protect your account, you will receive an authorization link at your <strong>CURRENT</strong> email address. Once authorized, your email will be instantly updated and a notification will be sent to your new address. 
                    </p>
                  </div>
                  
                  <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-sm">
                    <div>
                      <label className="sss-label">New Email Address</label>
                      <input
                        type="email"
                        required
                        className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-2 focus:outline-primary rounded-md"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <button
                      disabled={loading || email === currentEmail}
                      className="w-full py-2 bg-[#0038a8] text-white text-sm font-bold tracking-wide uppercase hover:bg-[#002879] disabled:opacity-50 rounded-md shadow-sm transition-colors"
                    >
                      {loading ? "Updating..." : "Update Email"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className="bg-card text-card-foreground border border-border rounded-md shadow-sm">
                <div className="sss-section-header rounded-t-md">Change Password</div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-6">
                    For your security, changing your password requires verifying your current email address.
                    Click the button below and we will send you a secure link to choose a new password.
                  </p>
                  
                  <div className="max-w-sm">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={loadingPassword}
                      className="w-full py-2 bg-[#0038a8] text-white text-sm font-bold tracking-wide uppercase hover:bg-[#002879] disabled:opacity-50 rounded-md shadow-sm transition-colors"
                    >
                      {loadingPassword ? "Sending..." : "Send Password Reset Link"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-card text-card-foreground border border-border rounded-md shadow-sm">
                <div className="sss-section-header rounded-t-md">Appearance Settings</div>
                <div className="p-6 space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Customize how the SSS Member Portal looks on your device.
                  </p>
                  
                  <div className="flex items-center justify-between py-4 border-t border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-md text-primary">
                        {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold">Dark Mode</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Switch to a dark, high-contrast theme</p>
                      </div>
                    </div>
                    <Switch 
                      checked={theme === "dark"} 
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "actions" && (
              <div className="bg-card text-card-foreground border border-border rounded-md shadow-sm">
                <div className="sss-section-header rounded-t-md">Account Actions</div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-6">
                    Manage your current session and security.
                  </p>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/auth";
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-foreground text-sm font-semibold hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out Securely
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <SssFooter />
    </div>
  );
}
