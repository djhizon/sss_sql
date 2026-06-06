import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — SSS Member Portal" },
      { name: "description", content: "Update your SSS member account settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setCurrentEmail(data.user.email);
        setEmail(data.user.email);
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-sss-navy tracking-tight">Account Settings</h1>
      
      <div className="bg-white border border-sss-form-border p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Update Email Address</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Changing your email address will require you to verify the change via a secure link sent to both your old and new email inboxes.
        </p>
        
        <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-sm">
          <div>
            <label className="sss-label">Email Address</label>
            <input
              type="email"
              required
              className="w-full border border-sss-form-border bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-sss-navy"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            disabled={loading || email === currentEmail}
            className="w-full py-2 bg-sss-navy text-white text-sm font-bold tracking-wide uppercase hover:bg-sss-navy-dark disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Email"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-sss-form-border p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Account Actions</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your current session.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth";
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out Securely
        </button>
      </div>
    </div>
  );
}
