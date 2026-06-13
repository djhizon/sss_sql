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
} from "@/lib/applications.functions";
import { toast } from "sonner";
import { Check, X, Search } from "lucide-react";
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
            className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider ${activeTab === "applications" ? "border-b-2 border-[#0038a8] text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-2 px-2 text-sm font-bold uppercase tracking-wider ${activeTab === "users" ? "border-b-2 border-[#0038a8] text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Users
          </button>
        </div>

        {activeTab === "applications" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Admin — Application Queue</h2>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex flex-wrap gap-2 text-xs uppercase">
                {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatus(s); setVisibleAppsCount(getInitialVisibleCount()); }}
                    className={`px-4 py-2 border whitespace-nowrap transition-all rounded-md font-bold shadow-sm ${status === s ? "bg-[#0038a8] text-white border-[#0038a8]" : "border-sss-form-border bg-sss-form-bg hover:bg-muted text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <div className="relative flex items-center w-full sm:w-80">
                  <Search className="absolute left-2.5 w-4 h-4 text-gray-400 z-10" />
                  <ClearableInput 
                    placeholder="Search Name or App #..." 
                    value={searchTerm}
                    onChange={(val) => { setSearchTerm(val); setVisibleAppsCount(getInitialVisibleCount()); }}
                    className="sss-input text-sm py-1.5 pl-9 w-full"
                  />
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
          <div className="border border-sss-form-border bg-sss-form-bg shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-sss-section-bg text-foreground text-sm font-bold uppercase py-4 px-6 border-b border-sss-form-border tracking-wider shrink-0">
              Applications
            </div>
            <div className="p-0 overflow-auto flex-1 flex flex-col">
              {isLoading ? (
                <div className="p-6 text-sm text-center text-muted-foreground">Loading…</div>
              ) : filteredRows.length === 0 ? (
                <div className="p-6 text-sm text-center text-muted-foreground">No applications match your criteria.</div>
              ) : (
                <>
                  <table className="w-full text-sm">
                    <thead className="bg-sss-section-bg border-b border-sss-form-border text-left">
                      <tr>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-sss-label">#</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-sss-label">Applicant</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-sss-label">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sss-form-border">
                      {filteredRows.slice(0, visibleAppsCount).map((r) => (
                        <tr
                          key={r.app_number}
                          onClick={() => setSelected(r.app_number)}
                          className={`cursor-pointer transition-colors ${selected === r.app_number ? "bg-muted/80" : "hover:bg-muted/50"}`}
                        >
                          <td className="px-4 py-3 font-mono text-muted-foreground">{r.app_number}</td>
                          <td className="px-4 py-3 font-medium text-foreground">{formatName(r.applicant_name)}</td>
                          <td className="px-4 py-3 uppercase text-xs">
                            <span className={statusBadge(r.status)}>{r.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRows.length > getInitialVisibleCount() && (
                    <div className="p-3 bg-sss-section-bg border-t border-sss-form-border flex justify-center mt-auto shrink-0">
                      {visibleAppsCount < filteredRows.length ? (
                        <button 
                          onClick={() => setVisibleAppsCount(prev => prev + 10)}
                          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide"
                        >
                          Show More <span className="text-muted-foreground/60">▼</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => setVisibleAppsCount(getInitialVisibleCount())}
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

          <div className="border border-sss-form-border bg-sss-form-bg shadow-sm rounded-xl overflow-hidden flex flex-col">
            <div className="bg-sss-section-bg text-foreground text-sm font-bold uppercase py-4 px-6 border-b border-sss-form-border tracking-wider">
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

                  <div className="pt-4 border-t border-gray-200 mt-auto flex justify-end">
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
          <div className="border border-sss-form-border bg-sss-form-bg shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-sss-section-bg text-foreground text-sm font-bold uppercase py-4 px-6 border-b border-sss-form-border tracking-wider shrink-0">
              Registered Users
            </div>
            <div className="p-0 overflow-auto flex-1 flex flex-col">
              {loadingUsers ? (
                <div className="p-6 text-sm text-center text-muted-foreground">Loading users…</div>
              ) : users.length === 0 ? (
                <div className="p-6 text-sm text-center text-muted-foreground">No users found.</div>
              ) : (
                <>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-sss-section-bg border-b border-sss-form-border">
                      <tr>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-sss-label">Name</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-sss-label">Email</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-sss-label">Phone</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-sss-label">Birthdate</th>
                        <th className="px-4 py-3 text-xs uppercase font-bold text-sss-label w-32">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sss-form-border">
                      {users.slice(0, visibleUsersCount).map((u: any) => (
                        <tr key={u.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-medium text-foreground">{u.first_name} {u.last_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.birthdate || "—"}</td>
                          <td className="px-4 py-3">
                            <select 
                              className={`sss-input text-xs py-1 px-2 pr-8 w-full font-bold uppercase ${u.role === 'admin' ? 'bg-primary/20 text-primary border-primary/30' : ''}`}
                              value={u.role}
                              disabled={roleMutation.isPending && roleMutation.variables?.userId === u.id}
                              onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value as "admin" | "user" })}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length > getInitialVisibleCount() && (
                    <div className="p-3 bg-sss-section-bg border-t border-sss-form-border flex justify-center mt-auto shrink-0">
                      {visibleUsersCount < users.length ? (
                        <button 
                          onClick={() => setVisibleUsersCount(prev => prev + 10)}
                          className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide"
                        >
                          Show More <span className="text-muted-foreground/60">▼</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => setVisibleUsersCount(getInitialVisibleCount())}
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
        )}
      </main>
      <SssFooter />
    </div>
  );
}
