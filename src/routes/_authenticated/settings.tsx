import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, User, Mail, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

type TabId = "personal" | "email" | "actions";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

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
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast.success("Confirmation emails have been sent to both your old and new email addresses.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update email address.");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "personal", label: "Personal Information", icon: <User className="w-4 h-4" /> },
    { id: "email", label: "Change Email", icon: <Mail className="w-4 h-4" /> },
    { id: "actions", label: "Account Actions", icon: <Shield className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <SssHeader user={user} isAdmin={adminData?.isAdmin} />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold text-sss-navy-dark tracking-tight mb-6">Account Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
            <nav className="flex flex-col">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left
                    ${activeTab === tab.id 
                      ? "bg-blue-50 text-sss-navy border-l-4 border-sss-navy" 
                      : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 w-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {activeTab === "personal" && (
                  <div className="bg-white border border-gray-200 rounded-md shadow-sm">
                    <div className="sss-section-header rounded-t-md">Personal Information</div>
                    <div className="p-6">
                      <p className="text-sm text-muted-foreground mb-6">
                        These are the details you provided when registering for your SSS account.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 max-w-2xl">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">First Name</label>
                          <div className="text-sm font-medium text-gray-900">{user?.user_metadata?.first_name || "—"}</div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Last Name</label>
                          <div className="text-sm font-medium text-gray-900">{user?.user_metadata?.last_name || "—"}</div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Birthdate</label>
                          <div className="text-sm font-medium text-gray-900">{user?.user_metadata?.birthdate ? new Date(user.user_metadata.birthdate).toLocaleDateString() : "—"}</div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                          <div className="text-sm font-medium text-gray-900">{user?.user_metadata?.phone || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "email" && (
                  <div className="bg-white border border-gray-200 rounded-md shadow-sm">
                    <div className="sss-section-header rounded-t-md">Change Email</div>
                    <div className="p-6">
                      <p className="text-sm text-muted-foreground mb-6">
                        Changing your email address will require you to verify the change via a secure link sent to both your old and new email inboxes.
                      </p>
                      
                      <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-sm">
                        <div>
                          <label className="sss-label">New Email Address</label>
                          <input
                            type="email"
                            required
                            className="w-full border border-sss-form-border bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-sss-navy rounded-md"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <button
                          disabled={loading || email === currentEmail}
                          className="w-full py-2 bg-sss-navy text-white text-sm font-bold tracking-wide uppercase hover:bg-sss-navy-dark disabled:opacity-50 rounded-md"
                        >
                          {loading ? "Updating..." : "Update Email"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {activeTab === "actions" && (
                  <div className="bg-white border border-gray-200 rounded-md shadow-sm">
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
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out Securely
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      <SssFooter />
    </div>
  );
}
