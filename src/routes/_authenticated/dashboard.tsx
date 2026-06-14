import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { listMyApplications, checkIsAdmin, userDeleteApplication } from "@/lib/applications.functions";
import { formatName, statusBadge } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Applications — SSS Portal" }] }),
  component: Dashboard,
});

function Dashboard() {
  const getInitialVisibleCount = () => typeof window !== "undefined" && window.innerWidth >= 768 ? 13 : 10;
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [visibleCount, setVisibleCount] = useState(getInitialVisibleCount);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () => listMyApplications(),
  });
  
  const qc = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (id: number) => userDeleteApplication({ data: { id } }),
    onSuccess: () => {
      toast.success("Application moved to trash.");
      qc.invalidateQueries({ queryKey: ["my-applications"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete application.");
    }
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

        <div className="border border-sss-form-border bg-white shadow-sm rounded-xl overflow-hidden mt-2 flex-1 flex flex-col h-full">
          <div className="bg-gray-50/80 text-sss-navy-dark text-sm font-bold uppercase py-4 px-6 border-b border-sss-form-border tracking-wider shrink-0">
            Application History
          </div>
          <div className="p-0 flex-1 flex flex-col overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-gray-500">Loading your applications…</div>
            ) : apps.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500">
                <p className="text-lg font-medium text-gray-700 mb-2">No applications found</p>
                No applications yet. Click "New Application" to begin.
              </div>
            ) : (
              <>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-left">
                      <th className="px-6 py-3 text-xs uppercase font-bold text-gray-500 tracking-wider">App Number</th>
                      <th className="px-6 py-3 text-xs uppercase font-bold text-gray-500 tracking-wider">Applicant</th>
                      <th className="px-6 py-3 text-xs uppercase font-bold text-gray-500 tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-xs uppercase font-bold text-gray-500 tracking-wider">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {apps.slice(0, visibleCount).map((a) => (
                      <tr key={a.app_number} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-700 font-medium">{String(a.app_number).padStart(12, '0')}</td>
                        <td className="px-6 py-4 text-gray-800">{formatName(a.applicant_name)}</td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(a.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={statusBadge(a.status)}>{a.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to="/application/$id"
                              params={{ id: String(a.app_number) }}
                              className="text-[#0038a8] font-semibold hover:underline text-sm"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to move this application to trash?")) {
                                  deleteMutation.mutate(a.app_number);
                                }
                              }}
                              disabled={deleteMutation.isPending && deleteMutation.variables === a.app_number}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {apps.length > getInitialVisibleCount() && (
                  <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-center mt-auto shrink-0">
                    {visibleCount < apps.length ? (
                      <button 
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-wide"
                      >
                        Show More <span className="text-gray-400">▼</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => setVisibleCount(getInitialVisibleCount())}
                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-wide"
                      >
                        Show Less <span className="text-gray-400">▲</span>
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
