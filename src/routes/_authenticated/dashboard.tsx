import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { listMyApplications, checkIsAdmin } from "@/lib/applications.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Applications — SSS Portal" }] }),
  component: Dashboard,
});

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-accent text-accent-foreground border-sss-gold",
    approved: "bg-emerald-100 text-emerald-900 border-emerald-700",
    rejected: "bg-red-100 text-red-900 border-red-700",
  };
  return `inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${map[status] ?? ""}`;
}

function Dashboard() {
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => listMyApplications(),
  });
  const { data: adminData } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SssHeader user={user} isAdmin={adminData?.isAdmin} />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl font-bold text-sss-navy-dark">My Housing Loan Applications</h2>
            <p className="text-sm text-muted-foreground">
              Track the status of each submission. APP_NUMBER is auto-assigned per attempt.
            </p>
          </div>
          <Link
            to="/apply"
            className="px-4 py-2 bg-sss-navy text-white text-sm font-bold uppercase tracking-wide hover:bg-sss-navy-dark"
          >
            + New Application
          </Link>
        </div>

        <div className="sss-section-header">Application History</div>
        <div className="sss-section-body p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : apps.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No applications yet. Click "New Application" to begin.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-sss-section-bg">
                <tr className="text-left">
                  <th className="px-3 py-2 text-xs uppercase text-sss-label">App Number</th>
                  <th className="px-3 py-2 text-xs uppercase text-sss-label">Applicant</th>
                  <th className="px-3 py-2 text-xs uppercase text-sss-label">Submitted</th>
                  <th className="px-3 py-2 text-xs uppercase text-sss-label">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.app_number} className="border-t">
                    <td className="px-3 py-2 font-mono">{a.app_number}</td>
                    <td className="px-3 py-2">{a.applicant_name}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className={statusBadge(a.status)}>{a.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        to="/application/$id"
                        params={{ id: String(a.app_number) }}
                        className="text-sss-navy underline text-xs"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <SssFooter />
    </div>
  );
}
