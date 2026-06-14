import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import {
  adminListApplications,
  adminDecide,
  getApplication,
  checkIsAdmin,
  adminListUsers,
  adminUpdateUserRole,
  adminDeleteApplication,
  adminDeleteUser,
} from "@/lib/applications.functions";
import { toast } from "sonner";
import { Check, X, Search, Trash2, Download } from "lucide-react";
import { ClearableInput } from "@/components/SplitInputs";
import { formatName, statusBadge } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — SSS Portal" }] }),
  component: AdminPage,
});

type StatusFilter = "pending" | "approved" | "rejected" | "all";

function AdminPage() {
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"applications" | "users">("applications");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "alpha_asc" | "alpha_desc">("date_desc");
  const getInitialVisibleCount = () => typeof window !== "undefined" && window.innerWidth >= 768 ? 15 : 10;
  const [visibleAppsCount, setVisibleAppsCount] = useState(getInitialVisibleCount);
  const [visibleUsersCount, setVisibleUsersCount] = useState(getInitialVisibleCount);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const { data: adminData, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => checkIsAdmin(),
  });

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-apps", status],
    queryFn: () => adminListApplications({ data: { status } }),
    enabled: !!adminData?.isAdmin,
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-app", selected],
    queryFn: () => getApplication({ data: { id: selected! } }),
    enabled: selected !== null,
  });

  const decideMutation = useMutation({
    mutationFn: (args: { id: number; decision: "approved" | "rejected"; notes?: string }) =>
      adminDecide({ data: args }),
    onSuccess: (_, variables) => {
      toast.success(`Application ${variables.decision}`);
      setNotes("");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-apps"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminListUsers(),
    enabled: !!adminData?.isAdmin && activeTab === "users",
  });

  const roleMutation = useMutation({
    mutationFn: (args: { userId: string; role: "admin" | "user" }) =>
      adminUpdateUserRole({ data: args }),
    onSuccess: () => {
      toast.success("User role updated successfully");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id: number) => adminDeleteApplication({ data: { id } }),
    onSuccess: () => {
      toast.success("Application permanently deleted");
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-apps"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed")
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminDeleteUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("User permanently deleted");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete user failed")
  });

  function exportCSV() {
    if (filteredRows.length === 0) {
      toast.error("No applications to export.");
      return;
    }
    const headers = ["App Number", "Applicant Name", "SSS Number", "Status", "Submitted At"];
    const csvContent = [
      headers.join(","),
      ...filteredRows.map(r => 
        [r.app_number, `"${r.applicant_name}"`, `"${r.ap_ss_num}"`, r.status, new Date(r.created_at).toLocaleString()].join(",")
      )
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sss_applications_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredRows = useMemo(() => {
    let result = [...rows];
    if (searchTerm) {
      const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      result = result.filter(r => {
        const normName = (r.applicant_name || "").toLowerCase();
        const matchesName = searchWords.every(w => normName.includes(w));
        const lowerSearch = searchTerm.toLowerCase();
        return matchesName ||
          String(r.app_number).includes(lowerSearch) ||
          r.ap_ss_num?.includes(lowerSearch);
      });
    }
    result.sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "alpha_asc") return (a.applicant_name || "").localeCompare(b.applicant_name || "");
      if (sortBy === "alpha_desc") return (b.applicant_name || "").localeCompare(a.applicant_name || "");
      return 0;
    });
    return result;
  }, [rows, searchTerm, sortBy]);

  if (checkingAdmin) return <div className="p-8">Checking permissions…</div>;
  if (!adminData?.isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <SssHeader user={user} />
        <main className="flex-1 max-w-3xl mx-auto p-8">
          <h2 className="text-xl font-bold text-destructive">Access denied</h2>
          <p className="text-sm text-muted-foreground mt-2">
            This area is restricted to SSS administrators. Ask an existing admin to grant your
            account the <code>admin</code> role in the database (table <code>user_roles</code>).
          </p>
        </main>
        <SssFooter />
      </div>
    );
  }

  async function handleDecide(decision: "approved" | "rejected") {
    if (!selected) return;
    decideMutation.mutate({ id: selected, decision, notes });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SssHeader user={user} isAdmin />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("applications")}
            className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider ${activeTab === "applications" ? "border-b-2 border-[#0038a8] text-[#0038a8]" : "text-gray-500 hover:text-gray-800"}`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider ${activeTab === "users" ? "border-b-2 border-[#0038a8] text-[#0038a8]" : "text-gray-500 hover:text-gray-800"}`}
          >
            Users
          </button>
        </div>

        {activeTab === "applications" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-sss-navy-dark mb-4">Admin — Application Queue</h2>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex flex-wrap gap-2 text-xs uppercase">
                {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setVisibleAppsCount(getInitialVisibleCount()); }}
                    className={`px-4 py-2 border whitespace-nowrap transition-all rounded-md font-bold shadow-sm ${status === s ? "bg-[#0038a8] text-white border-[#0038a8]" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <ClearableInput 
                      value={searchTerm}
                      onChange={(val) => { setSearchTerm(val); setVisibleAppsCount(getInitialVisibleCount()); }}
                      placeholder="Search name, SSS#..."
                      className="sss-input text-sm pl-9 py-2 w-full bg-white border-gray-200"
                    />
                  </div>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wide hover:bg-gray-200 rounded-md shadow-sm transition-colors border border-gray-200"
                    title="Export currently filtered applications to CSV"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
                <select 
                  value={sortBy} 
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="sss-input text-sm py-1.5 w-full sm:w-auto"
                >
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="alpha_asc">Alphabetical (A-Z)</option>
                  <option value="alpha_desc">Alphabetical (Z-A)</option>
                </select>
              </div>
            </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 bg-white shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50/80 text-sss-navy-dark text-sm font-bold uppercase py-4 px-6 border-b border-gray-200 tracking-wider shrink-0">
              Applications
            </div>
            <div className="p-0 overflow-auto flex-1 flex flex-col">
              {isLoading ? (
                <div className="p-6 text-sm text-center text-gray-500">Loading…</div>
              ) : filteredRows.length === 0 ? (
                <div className="p-6 text-sm text-center text-gray-500">No applications match your criteria.</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-left">
                      <tr>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500">#</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500">Applicant</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRows.slice(0, visibleAppsCount).map((r) => (
                        <tr
                          key={r.app_number}
                          onClick={() => setSelected(r.app_number)}
                          className={`cursor-pointer transition-colors ${selected === r.app_number ? "bg-blue-50/80" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-4 py-3 text-gray-600">{r.app_number}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{formatName(r.applicant_name)}</td>
                          <td className="px-4 py-3 uppercase text-xs">
                            <span className={statusBadge(r.status)}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRows.length > getInitialVisibleCount() && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-center mt-auto shrink-0">
                      {visibleAppsCount < filteredRows.length ? (
                        <button 
                          onClick={() => setVisibleAppsCount(prev => prev + 10)}
                          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-wide"
                        >
                          Show More <span className="text-gray-400">▼</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => setVisibleAppsCount(getInitialVisibleCount())}
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

          <div className="border border-gray-200 bg-white shadow-sm rounded-xl overflow-hidden flex flex-col">
            <div className="bg-gray-50/80 text-sss-navy-dark text-sm font-bold uppercase py-4 px-6 border-b border-gray-200 tracking-wider">
              Review
            </div>
            <div className="p-6 flex-1 min-h-[60vh] flex flex-col">
              {!selected ? (
                <p className="text-sm text-muted-foreground">Select an application on the left.</p>
              ) : !detail ? (
                <p className="text-sm">Loading…</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="font-bold">{formatName(detail.applicant_name)}</div>
                  <div className="text-xs text-muted-foreground">
                    SS#: {detail.ap_ss_num} · DOB: {detail.ap_dob}
                  </div>
                  <div className="text-xs">{detail.ap_local_address}</div>
                  <div className="text-xs">
                    Employer: {detail.ap_employer_name} ({detail.ap_occupation})
                  </div>
                  <div className="text-xs uppercase pt-2">
                    Current status: <span className={statusBadge(detail.status)}>{detail.status}</span>
                  </div>

                  {detail.status === "pending" && (
                    <div className="pt-3 space-y-2">
                      <label className="sss-label">Decision Notes</label>
                      <textarea
                        className="sss-input min-h-20"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Reason for approval / rejection"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecide("approved")}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase font-bold rounded"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleDecide("rejected")}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 hover:bg-red-700 text-white text-xs uppercase font-bold rounded"
                        >
                          <X className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {detail.status !== "pending" && detail.decision_notes && (
                    <div className="pt-2 text-xs">
                      <div className="sss-label">Notes</div>
                      <div>{detail.decision_notes}</div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200 mt-auto flex justify-end gap-3">
                    <button
                      onClick={() => {
                        if(window.confirm("WARNING: This will permanently delete this application. Proceed?")) {
                           deleteAppMutation.mutate(detail.app_number);
                        }
                      }}
                      disabled={deleteAppMutation.isPending}
                      className="text-xs uppercase font-bold tracking-widest text-red-600 border border-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-colors rounded-md shadow-sm flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                    <Link
                      to="/application/$id"
                      params={{ id: String(detail.app_number) }}
                      className="text-xs uppercase font-bold tracking-widest text-[#0038a8] border border-[#0038a8] px-4 py-2 hover:bg-[#0038a8] hover:text-white transition-colors rounded-md shadow-sm"
                    >
                      View Full Application &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
        )}

        {activeTab === "users" && (
          <div className="border border-gray-200 bg-white shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50/80 text-sss-navy-dark text-sm font-bold uppercase py-4 px-6 border-b border-gray-200 tracking-wider shrink-0">
              Registered Users
            </div>
            <div className="p-0 overflow-auto flex-1 flex flex-col">
              {loadingUsers ? (
                <div className="p-6 text-sm text-center text-gray-500">Loading users…</div>
              ) : users.length === 0 ? (
                <div className="p-6 text-sm text-center text-gray-500">No users found.</div>
              ) : (
                <>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500">Name</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500">Email</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500">Phone</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500">Birthdate</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500 w-32">Role</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-gray-500 w-12 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.slice(0, visibleUsersCount).map((u: any) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{u.first_name} {u.last_name}</td>
                          <td className="px-4 py-3 text-gray-600">{u.email}</td>
                          <td className="px-4 py-3 text-gray-600">{u.phone || "—"}</td>
                          <td className="px-4 py-3 text-gray-600">{u.birthdate || "—"}</td>
                          <td className="px-4 py-3">
                            <select 
                              className={`sss-input text-xs py-1 px-2 pr-8 w-full font-bold uppercase ${u.role === 'admin' ? 'bg-[#e6edfa] text-[#0038a8] border-[#0038a8]/20' : 'text-gray-600'}`}
                              value={u.role}
                              disabled={roleMutation.isPending && roleMutation.variables?.userId === u.id}
                              onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value as "admin" | "user" })}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                if (window.confirm(`WARNING: This will permanently delete user ${u.email}. Proceed?`)) {
                                  deleteUserMutation.mutate(u.id);
                                }
                              }}
                              disabled={deleteUserMutation.isPending && deleteUserMutation.variables === u.id}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length > getInitialVisibleCount() && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-center mt-auto shrink-0">
                      {visibleUsersCount < users.length ? (
                        <button 
                          onClick={() => setVisibleUsersCount(prev => prev + 10)}
                          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 uppercase tracking-wide"
                        >
                          Show More <span className="text-gray-400">▼</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => setVisibleUsersCount(getInitialVisibleCount())}
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
        )}
      </main>
      <SssFooter />
    </div>
  );
}
