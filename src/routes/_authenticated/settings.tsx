import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, User, Mail, Shield } from "lucide-react";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { useQuery } from "@tanstack/react-query";
import { checkIsAdmin } from "@/lib/applications.functions";
import { motion, AnimatePresence } from "framer-motion";

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
    { id: "personal", label: "Personal Information", count: null },
    { id: "email", label: "Change Email", count: null },
    { id: "actions", label: "Account Actions", count: null },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <SssHeader user={user} isAdmin={adminData?.isAdmin} />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 overflow-hidden">
        <h1 className="text-2xl font-bold text-[#1a365d] tracking-tight mb-8">Account Settings</h1>
        
        <div className="flex flex-col">
          {/* Horizontal Tab Header matching the reference image */}
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`relative px-5 py-3 text-sm font-bold transition-colors rounded-t-lg
                  ${activeTab === tab.id 
                    ? "bg-white text-[#1a365d]" 
                    : "text-gray-500 hover:text-gray-700 bg-transparent"
                  }
                `}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#e09f3e]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Content Area with Slide Transition */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {activeTab === "personal" && (
                  <div className="bg-white border border-gray-200 rounded-b-md rounded-tr-md shadow-sm">
                    <div className="bg-[#1a365d] text-white p-4 font-bold rounded-t-md">Personal Information</div>
                    <div className="p-6">
                      <p className="text-sm text-gray-500 mb-6">
                        These are the details you provided when registering for your SSS account.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8 max-w-2xl">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">First Name</label>
                          <div className="text-sm font-bold text-[#1a365d]">{user?.user_metadata?.first_name || "—"}</div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Last Name</label>
                          <div className="text-sm font-bold text-[#1a365d]">{user?.user_metadata?.last_name || "—"}</div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Birthdate</label>
                          <div className="text-sm font-bold text-[#1a365d]">{user?.user_metadata?.birthdate ? new Date(user.user_metadata.birthdate).toLocaleDateString() : "—"}</div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                          <div className="text-sm font-bold text-[#1a365d]">{user?.user_metadata?.phone || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "email" && (
                  <div className="bg-white border border-gray-200 rounded-b-md rounded-tr-md shadow-sm">
                    <div className="bg-[#1a365d] text-white p-4 font-bold rounded-t-md">Change Email</div>
                    <div className="p-6">
                      <p className="text-sm text-gray-500 mb-6">
                        Changing your email address will require you to verify the change via a secure link sent to both your old and new email inboxes.
                      </p>
                      
                      <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-sm">
                        <div>
                          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 block">New Email Address</label>
                          <input
                            type="email"
                            required
                            className="w-full border border-gray-300 rounded bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <button
                          disabled={loading || email === currentEmail}
                          className="w-full py-2.5 bg-[#e09f3e] text-white text-sm font-bold tracking-wide rounded hover:bg-[#c98e37] disabled:opacity-60 transition-colors shadow-sm"
                        >
                          {loading ? "Updating..." : "Update Email"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {activeTab === "actions" && (
                  <div className="bg-white border border-gray-200 rounded-b-md rounded-tr-md shadow-sm">
                    <div className="bg-[#1a365d] text-white p-4 font-bold rounded-t-md">Account Actions</div>
                    <div className="p-6">
                      <p className="text-sm text-gray-500 mb-6">
                        Manage your current session and security.
                      </p>
                      <button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.href = "/auth";
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded text-[#1a365d] text-sm font-bold hover:bg-gray-50 transition-colors"
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
