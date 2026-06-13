import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { listMyApplications, checkIsAdmin } from "@/lib/applications.functions";
import { formatName, statusBadge } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Applications — SSS Portal" }] }),
  component: Dashboard,
});

function Dashboard() {
  const getInitialVisibleCount = () => typeof window !== "undefined" && window.innerWidth >= 768 ? 15 : 10;
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [visibleCount, setVisibleCount] = useState(getInitialVisibleCount);
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
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-xl font-bold text-sss-navy-dark">My Housing Loan Applications</h2>
            <p className="text-sm text-muted-foreground">
              Track the status of each submission. Application Number is assigned automatically.
            </p>
          </div>
          <Link
            to="/apply"
            className="px-5 py-2.5 bg-[#0038a8] text-white text-sm font-bold uppercase tracking-wide hover:bg-[#002879] rounded-md shadow-sm hover:shadow transition-all"
          >
            New Application
          </Link>
        </div>

        <div className="border border-sss-form-border bg-sss-form-bg shadow-sm rounded-xl overflow-hidden mt-2 flex-1 flex flex-col h-full">
          <div className="bg-sss-section-bg text-foreground text-sm font-bold uppercase py-4 px-6 border-b border-sss-form-border tracking-wider shrink-0">
            Application History
          </div>
          <div className="p-0 flex-1 flex flex-col overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading your applications…</div>
            ) : apps.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                <p className="text-lg font-medium text-foreground mb-2">No applications found</p>
                No applications yet. Click "New Application" to begin.
              </div>
            ) : (
              <>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-sm">
                  <thead className="bg-sss-section-bg border-b border-sss-form-border">
                    <tr className="text-left">
                      <th className="px-6 py-3 text-xs uppercase font-bold text-sss-label tracking-wider">App Number</th>
                      <th className="px-6 py-3 text-xs uppercase font-bold text-sss-label tracking-wider">Applicant</th>
                      <th className="px-6 py-3 text-xs uppercase font-bold text-sss-label tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-xs uppercase font-bold text-sss-label tracking-wider">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sss-form-border">
                    {apps.slice(0, visibleCount).map((a) => (
                      <tr key={a.app_number} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-foreground font-medium">{String(a.app_number).padStart(12, '0')}</td>
                        <td className="px-6 py-4 text-foreground">{formatName(a.applicant_name)}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={statusBadge(a.status)}>{a.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to="/application/$id"
                            params={{ id: String(a.app_number) }}
                            className="text-[#0038a8] font-semibold hover:underline text-sm"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {apps.length > getInitialVisibleCount() && (
                  <div className="p-3 bg-sss-section-bg border-t border-sss-form-border flex justify-center mt-auto shrink-0">
                    {visibleCount < apps.length ? (
                      <button 
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide"
                      >
                        Show More <span className="text-muted-foreground/60">▼</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => setVisibleCount(getInitialVisibleCount())}
                        className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide"
                      >
                        Show Less <span className="text-muted-foreground/60">▲</span>
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <SssFooter />
    </div>
  );
}
