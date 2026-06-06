import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { getApplication, checkIsAdmin } from "@/lib/applications.functions";

export const Route = createFileRoute("/_authenticated/application/$id")({
  head: () => ({ meta: [{ title: "Application — SSS Portal" }] }),
  component: ViewApp,
});

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="border-b border-dashed py-1.5 grid grid-cols-3 gap-2">
      <div className="sss-label col-span-1">{label}</div>
      <div className="col-span-2 font-mono text-sm break-words">
        {value === null || value === undefined || value === "" ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          String(value)
        )}
      </div>
    </div>
  );
}

function ViewApp() {
  const { id } = Route.useParams();
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
    
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const {
    data: app,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["application", id],
    queryFn: () => getApplication({ data: { id: Number(id) } }),
  });
  const { data: adminData } = useQuery({ queryKey: ["is-admin"], queryFn: () => checkIsAdmin() });

  return (
    <div className="min-h-screen flex flex-col">
      <SssHeader user={user} isAdmin={adminData?.isAdmin} />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <div className="mb-3 no-print">
          <Link to="/dashboard" className="text-sm text-sss-navy underline">
            ← Back to dashboard
          </Link>
        </div>

        {isLoading && <div>Loading…</div>}
        {error && <div className="text-destructive">{(error as Error).message}</div>}
        {app && (
          <div className="border-2 border-sss-form-border bg-white">
            <div className="text-center py-3 border-b-2 border-sss-form-border">
              <div className="text-xs text-sss-label">Republic of the Philippines</div>
              <div className="text-base font-bold">SOCIAL SECURITY SYSTEM</div>
              <div className="text-lg font-extrabold">APPLICATION FOR HOUSING LOAN</div>
              <div className="mt-2 text-sm">
                <span className="sss-label inline">Application No.:</span>{" "}
                <span className="font-mono text-base font-bold">{app.app_number}</span>
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider">
                Status: <span className="font-bold">{app.status}</span>
              </div>
            </div>

            <div className="sss-section-header">A. Principal Applicant</div>
            <div className="sss-section-body">
              <Row label="SS Number" value={app.ap_ss_num} />
              <Row label="CRN" value={app.ap_crn} />
              <Row label="Date of Birth" value={app.ap_dob} />
              <Row label="Taxpayer ID" value={app.ap_taxpayer_id_number} />
              <Row label="Name" value={app.applicant_name} />
              <Row label="Sex" value={app.ap_sex} />
              <Row label="Civil Status" value={app.ap_civil_status} />
              <Row label="Local Address" value={app.ap_local_address} />
              <Row label="Mobile" value={app.ap_mobile_no} />
              <Row label="Telephone" value={app.ap_tel_no} />
              <Row label="Email" value={app.ap_email_add} />
              <Row label="Foreign Address" value={app.ap_foreign_address} />
              <Row label="Country" value={app.country} />
            </div>

            <div className="sss-section-header">B. Spouse</div>
            <div className="sss-section-body">
              <Row label="SS Number" value={app.sp_ss_num} />
              <Row label="CRN" value={app.sp_crn} />
              <Row label="Date of Birth" value={app.sp_dob} />
              <Row label="Taxpayer ID" value={app.sp_taxpayerid} />
              <Row label="Spouse Name" value={app.spouse_name} />
              <Row label="Employer Number" value={app.sp_employernum} />
              <Row label="Employer Tax ID" value={app.sp_employertaxid} />
              <Row label="Type of Employer" value={app.sp_typeofemployer} />
              <Row label="Employer Name" value={app.sp_employername} />
            </div>

            <div className="sss-section-header">C. Applicant's Employer</div>
            <div className="sss-section-body">
              <Row label="Employer Number" value={app.ap_employer_num} />
              <Row label="Taxpayer ID" value={app.ap_employer_taxid} />
              <Row label="Type of Employer" value={app.ap_typeofemployer} />
              <Row label="Occupation" value={app.ap_occupation} />
              <Row label="Employer Name" value={app.ap_employer_name} />
              <Row label="Employer Address" value={app.ap_employer_address} />
              <Row label="Telephone" value={app.ap_employer_tel_no} />
              <Row label="Email" value={app.ap_employer_email_add} />
              <Row label="Website" value={app.ap_employer_website} />
            </div>

            {app.status !== "pending" && (
              <>
                <div className="sss-section-header">Decision</div>
                <div className="sss-section-body">
                  <Row label="Decided At" value={app.decided_at} />
                  <Row label="Notes" value={app.decision_notes} />
                </div>
              </>
            )}

            <div className="p-4 border-t-2 border-sss-form-border flex justify-end no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 border border-sss-form-border text-sm uppercase font-bold"
              >
                Print
              </button>
            </div>
          </div>
        )}
      </main>
      <SssFooter />
    </div>
  );
}
