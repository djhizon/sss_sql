import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SssHeader, SssFooter } from "@/components/SssHeader";
import { submitApplication, checkIsAdmin } from "@/lib/applications.functions";
import type { ApplicationInput } from "@/lib/applications.schema";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { DigitBoxes } from "@/components/DigitBoxes";
import { SplitName, SplitAddress, ClearableInput } from "@/components/SplitInputs";
import testData from "@/lib/testData.json";

export const Route = createFileRoute("/_authenticated/apply")({
  head: () => ({ meta: [{ title: "Apply for Housing Loan — SSS Portal" }] }),
  component: ApplyPage,
});

const empty: ApplicationInput = {
  ap_ss_num: "",
  ap_crn: "",
  ap_dob: "",
  ap_taxpayer_id_number: "",
  applicant_name: "",
  ap_sex: "M",
  ap_civil_status: "S",
  ap_local_address: "",
  ap_tel_no: "",
  ap_mobile_no: "",
  ap_email_add: "",
  ap_foreign_address: "",
  country: "",
  sp_ss_num: "",
  sp_crn: "",
  sp_dob: "",
  sp_taxpayerid: "",
  spouse_name: "",
  sp_employernum: "",
  sp_employertaxid: "",
  sp_typeofemployer: "",
  sp_employername: "",
  ap_employer_num: "",
  ap_employer_taxid: "",
  ap_typeofemployer: "B",
  ap_employer_name: "",
  ap_occupation: "",
  ap_employer_address: "",
  ap_employer_tel_no: "",
  ap_employer_email_add: "",
  ap_employer_website: "",
};

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

function Field({ label, hint, required, children, className = "" }: { label: string; hint?: string; required?: boolean; children: React.ReactNode; className?: string; }) {
  return (
    <div className={className}>
      <label className="sss-label flex items-baseline">
        {label} {required && <span className="text-red-500 font-bold ml-0.5 mr-1">*</span>} {hint && <span className="sss-hint ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ApplyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<ApplicationInput>(empty);
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [nextAppNumber, setNextAppNumber] = useState<string>("Loading...");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    
    async function fetchNextAppNum() {
      const { data } = await supabase.from("applications").select("app_number").order("app_number", { ascending: false }).limit(1);
      if (data && data.length > 0) {
        setNextAppNumber(String(data[0].app_number + 1).padStart(12, "0"));
      } else {
        setNextAppNumber("000000000001");
      }
    }
    fetchNextAppNum();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const { data: adminData } = useQuery({ queryKey: ["is-admin"], queryFn: () => checkIsAdmin() });

  function set<K extends keyof ApplicationInput>(k: K, v: ApplicationInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handlePrefill() {
    const rawData = testData as Record<string, any>[];
    
    const storedIndices = JSON.parse(localStorage.getItem("sss_unused_indices") || "[]");
    
    let pool = storedIndices;
    if (!Array.isArray(pool) || pool.length === 0) {
      pool = Array.from({ length: rawData.length }, (_, i) => i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    const pickedIndex = pool.pop();
    if (pickedIndex === undefined) {
      toast.error("No more random test data available.");
      return;
    } else {
      localStorage.setItem("sss_unused_indices", JSON.stringify(pool));
    }

    const rowData = rawData[pickedIndex];

    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr === "N/A") return "";
      const [m, d, y] = dateStr.split("/");
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    };

    const parseSmartName = (rawName: string) => {
      if (!rawName || rawName === "N/A") return "";
      const rawParts = rawName.split(",").map((s: string) => s.trim());
      if (rawParts.length <= 1) return rawName;

      const suffixes = ["JR", "JR.", "SR", "SR.", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
      
      let last = rawParts[0] || "";
      let first = rawParts[1] || "";
      let middle = rawParts[2] || "";
      let suffixCandidate = rawParts.slice(3).join(" ").trim();
      
      if (!suffixCandidate) {
        return `${last}, ${first}, ${middle}, `;
      }

      const isSuffix = suffixes.includes(suffixCandidate.toUpperCase());
      
      if (isSuffix) {
        return `${last}, ${first}, ${middle}, ${suffixCandidate}`;
      } else {
        middle = middle ? `${middle} ${suffixCandidate}` : suffixCandidate;
        return `${last}, ${first}, ${middle}, `;
      }
    };

    const parseSmartAddress = (rawAddress: string, isLocal: boolean = true) => {
      if (!rawAddress || rawAddress === "N/A") return "";
      const rawParts = rawAddress.split(",").map((s: string) => s.trim());
      if (rawParts.length < 2) return rawAddress;
      
      let room = "", house = "", street = "", sub = "", brgy = "", city = "", prov = "", zip = "";
      
      if (isLocal) {
        const zipIndex = rawParts.findIndex((p: string) => /^\d{4,5}$/.test(p));
        if (zipIndex !== -1) {
          zip = rawParts[zipIndex];
          rawParts.splice(zipIndex, 1);
        }
      } else {
        if (rawParts.length > 0) zip = rawParts.pop() || "";
      }
      
      if (rawParts.length > 0) prov = rawParts.pop() || "";
      if (rawParts.length > 0) city = rawParts.pop() || "";
      if (rawParts.length > 0) brgy = rawParts.pop() || "";
      if (rawParts.length > 0) sub = rawParts.pop() || "";
      if (rawParts.length > 0) street = rawParts.pop() || "";
      if (rawParts.length > 0) house = rawParts.pop() || "";
      if (rawParts.length > 0) room = rawParts.join(", ");

      if (!isLocal) {
        if (!room) room = "N/A";
        if (!house) house = "N/A";
        if (!street) street = "N/A";
        if (!sub) sub = "N/A";
        if (!brgy) brgy = "N/A";
        if (!city) city = "N/A";
        if (!prov) prov = "N/A";
        if (!zip) zip = "N/A";
      }
      
      return [room, house, street, sub, brgy, city, prov, zip].join(", ");
    };

    const cleanDigits = (val: string, max: number) => {
      if (!val || val === "N/A") return "";
      return val.replace(/[^0-9]/g, "").slice(0, max);
    };

    setNextAppNumber(String(rowData["APP_NUMBER"] || "000000000001").padStart(12, '0'));

    setForm({
      ap_ss_num: cleanDigits(rowData["AP_SS_NUM"], 10),
      ap_crn: cleanDigits(rowData["AP_CRN"], 12),
      ap_dob: formatDate(rowData["AP_DOB"]),
      ap_taxpayer_id_number: cleanDigits(rowData["AP_TAXPAYER_ID_NUMBER"], 12),
      applicant_name: parseSmartName(rowData["APPLICANT_NAME"]),
      ap_sex: (rowData["AP_SEX"] === "N/A" || !rowData["AP_SEX"]) ? "M" : (rowData["AP_SEX"] as "M" | "F"),
      ap_civil_status: (rowData["AP_CIVIL_STATUS"] === "N/A" || !rowData["AP_CIVIL_STATUS"]) ? "S" : (rowData["AP_CIVIL_STATUS"] as "S" | "M" | "W" | "SE"),
      ap_local_address: parseSmartAddress(rowData["Applicant's complete residential address in the Philippines. (RM./FLR./UNIT NO. & BLDG. NAME, HOUSE/LOT & BLK NO., STREET NAME, SUBDIVISION, BARANGAY/DISTRICT/LOCALITY, CITY/MUNICIPALITY, PROVINCE, POSTAL CODE (NNNN))"], true),
      ap_tel_no: cleanDigits(rowData["AP_TEL._NO."], 15),
      ap_mobile_no: cleanDigits(rowData["AP_MOBILE_NO."], 11),
      ap_email_add: rowData["AP_EMAIL_ADD"] || "",
      ap_foreign_address: rowData["Applicant's foreign residential address. (RM./FLR./UNIT NO. & BLDG. NAME, HOUSE/LOT & BLK NO., STREET NAME, SUBDIVISION, BARANGAY/DISTRICT/LOCALITY, CITY/MUNICIPALITY, PROVINCE, POSTAL CODE) (FOR OVERSEAS FILIPINO WORKER)"] === "N/A" ? "" : parseSmartAddress(rowData["Applicant's foreign residential address. (RM./FLR./UNIT NO. & BLDG. NAME, HOUSE/LOT & BLK NO., STREET NAME, SUBDIVISION, BARANGAY/DISTRICT/LOCALITY, CITY/MUNICIPALITY, PROVINCE, POSTAL CODE) (FOR OVERSEAS FILIPINO WORKER)"], false),
      country: rowData["COUNTRY"] === "N/A" ? "" : rowData["COUNTRY"],
      
      sp_ss_num: cleanDigits(rowData["SP_SS_NUM"], 10),
      sp_crn: cleanDigits(rowData["SP_CRN"], 12),
      sp_dob: formatDate(rowData["SP_DOB"]),
      sp_taxpayerid: cleanDigits(rowData["SP_TAXPAYERID"], 12),
      spouse_name: parseSmartName(rowData["SPOUSE_NAME"]),
      sp_employernum: cleanDigits(rowData["SP_EMPLOYERNUM"], 13),
      sp_employertaxid: cleanDigits(rowData["SP_EMPLOYERTAXID"], 12),
      sp_typeofemployer: (rowData["SP_TYPEOFEMPLOYER"] === "N/A" || !rowData["SP_TYPEOFEMPLOYER"]) ? "" : (rowData["SP_TYPEOFEMPLOYER"] as "B" | "H"),
      sp_employername: rowData["SP_EMPLOYERNAME"] || "",
      
      ap_employer_num: cleanDigits(rowData["AP_EMPLOYER_NUM"], 13),
      ap_employer_taxid: cleanDigits(rowData["AP_EMPLOYER_TAXID"], 12),
      ap_typeofemployer: (rowData["AP_TYPEOFEMPLOYER"] === "N/A" || !rowData["AP_TYPEOFEMPLOYER"]) ? "B" : (rowData["AP_TYPEOFEMPLOYER"] as "B" | "H"),
      ap_employer_name: rowData["AP_EMPLOYER_NAME"] || "",
      ap_occupation: rowData["AP_OCCUPATION/CURRENT_POSITION"] || "",
      ap_employer_address: rowData["Complete business address of the applicant's employer. (RM./FLR./UNIT NO. & BLDG. NAME, HOUSE/LOT & BLK NO., STREET NAME, SUBDIVISION, BARANGAY/DISTRICT/LOCALITY, CITY/MUNICIPALITY, PROVINCE, POSTAL CODE)"] === "N/A" ? "" : parseSmartAddress(rowData["Complete business address of the applicant's employer. (RM./FLR./UNIT NO. & BLDG. NAME, HOUSE/LOT & BLK NO., STREET NAME, SUBDIVISION, BARANGAY/DISTRICT/LOCALITY, CITY/MUNICIPALITY, PROVINCE, POSTAL CODE)"], false),
      ap_employer_tel_no: rowData["AP_EMPLOYER_TEL_NO"] || "",
      ap_employer_email_add: rowData["AP_EMPLOYER_EMAIL_ADD"] || "",
      ap_employer_website: rowData["AP_EMPLOYER_WEBSITE"] || "",
    });
    toast.success("Random synthetic data row pre-filled!");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Required simple fields
    const requiredFields = {
      "SS Number": form.ap_ss_num,
      "Date of Birth": form.ap_dob,
      "Full Name": form.applicant_name,
      "Mobile Number": form.ap_mobile_no,
      "Local Address": form.ap_local_address,
      "Email Address": form.ap_email_add,
      "Employer Number": form.ap_employer_num,
      "Employer Taxpayer ID Number": form.ap_employer_taxid,
      "Occupation": form.ap_occupation,
      "Employer Name": form.ap_employer_name,
      "Employer Address": form.ap_employer_address,
      "Employer Telephone": form.ap_employer_tel_no,
      "Employer Email": form.ap_employer_email_add,
    };
    for (const [name, val] of Object.entries(requiredFields)) {
      if (!val || String(val).trim() === "") {
        toast.error(`${name} is required.`);
        return;
      }
    }

    // Digit length validations (stripping dashes)
    const checkDigits = (name: string, val: string | undefined | null, length: number, required: boolean = false) => {
      if (!val && !required) return null;
      const digits = (val || "").replace(/-/g, "").trim();
      if (digits.length > 0 && digits.length !== length) {
        return `${name} must be exactly ${length} digits. (Currently ${digits.length})`;
      }
      if (required && digits.length !== length) {
        return `${name} is required and must be exactly ${length} digits.`;
      }
      return null;
    };

    const digitErrors = [
      checkDigits("Applicant SS Number", form.ap_ss_num, 10, true),
      checkDigits("Applicant Taxpayer ID", form.ap_taxpayer_id_number, 12, false),
      checkDigits("Applicant Mobile Number", form.ap_mobile_no, 11, true),
      checkDigits("Spouse SS Number", form.sp_ss_num, 10, false),
      checkDigits("Spouse Taxpayer ID", form.sp_taxpayerid, 12, false),
      checkDigits("Spouse Employer Number", form.sp_employernum, 13, false),
      checkDigits("Spouse Employer Tax ID", form.sp_employertaxid, 12, false),
      checkDigits("Employer Number", form.ap_employer_num, 13, true),
      checkDigits("Employer Taxpayer ID", form.ap_employer_taxid, 12, true),
    ].filter(Boolean);

    if (digitErrors.length > 0) {
      toast.error(digitErrors[0] as string);
      return;
    }

    if (form.ap_dob) {
      const birthDate = new Date(form.ap_dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age < 18 || age > 60) {
        toast.error(`Applicant must be between 18 and 60 years old. Current age: ${age}`);
        return;
      }
    }
    
    if (form.ap_local_address) {
      const parts = form.ap_local_address.split(",").map(s => s.trim());
      const pc = parts[parts.length - 1] || "";
      if (!/^\d{4}$/.test(pc)) {
        toast.error("Local Address must end with exactly a 4-digit postal code (e.g. '1630').");
        return;
      }
    }

    const payload = { ...form };
    if (payload.ap_employer_website) {
       let site = payload.ap_employer_website.toLowerCase().trim();
       if (!site.startsWith("http://") && !site.startsWith("https://")) site = "https://" + site;
       payload.ap_employer_website = site;
    }
    if (payload.ap_employer_num) payload.ap_employer_num = payload.ap_employer_num.replace(/-/g, "").trim();
    if (payload.sp_employernum) payload.sp_employernum = payload.sp_employernum.replace(/-/g, "").trim();

    setBusy(true);
    try {
      const res = await submitApplication({ data: payload });
      toast.success(`Application #${res.app_number} submitted`);
      navigate({ to: "/application/$id", params: { id: String(res.app_number) } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setBusy(false);
    }
  }

  const input = (
    k: keyof ApplicationInput,
    extra: React.InputHTMLAttributes<HTMLInputElement> & { forceLowercase?: boolean } = {},
  ) => {
    const { forceLowercase, ...props } = extra;
    return (
      <ClearableInput
        className="sss-input"
        style={forceLowercase || props.type === "email" ? { textTransform: "lowercase" } : undefined}
        value={(form[k] as string) ?? ""}
        onChange={(val) => {
          let v = val;
          if (forceLowercase || props.type === "email") v = v.toLowerCase();
          set(k, v as never);
        }}
        {...props}
      />
    );
  };

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col relative">
      {busy && (
        <div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-sss-gold border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-white font-extrabold text-xl tracking-widest uppercase">Submitting to Database</div>
        </div>
      )}

      <SssHeader user={user} isAdmin={mounted ? adminData?.isAdmin : false} />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 relative">
        {mounted && adminData?.isAdmin && (
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handlePrefill}
              className="px-5 py-2.5 bg-blue-50 text-blue-700 text-sm font-bold uppercase tracking-wide hover:bg-blue-100 border border-blue-200 rounded-md shadow-sm text-center transition-all active:scale-95 flex items-center gap-2"
            >
              <div className="w-4 h-4 bg-white border border-blue-300 rounded-sm flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              PREFILL WITH SYNTHETIC DATA
            </button>
          </div>
        )}

        <div className="border border-sss-form-border bg-white shadow-md rounded-xl overflow-hidden">
          <div className="text-center py-6 border-b border-sss-form-border bg-gradient-to-b from-[#f8fafc] to-white">
            <div className="text-xs text-sss-label font-semibold tracking-widest">REPUBLIC OF THE PHILIPPINES</div>
            <div className="text-base font-bold tracking-widest text-gray-800">SOCIAL SECURITY SYSTEM</div>
            <div className="text-xl md:text-2xl font-extrabold tracking-wider mt-2 mb-1 text-sss-navy">APPLICATION FOR HOUSING LOAN</div>
            <div className="text-[10px] text-gray-400 font-medium">MEL-01750 (09-2022)</div>
            {mounted && (
              <div className="text-sm font-bold mt-4 text-sss-navy-dark border border-gray-200 inline-block px-4 py-1.5 rounded-md bg-white shadow-sm">
                Application No: <span className="text-sss-navy tracking-widest">{nextAppNumber}</span>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit}>
            <div className="bg-sss-navy text-white text-sm font-bold uppercase py-3 px-6 tracking-widest shadow-inner">
              Part I — To Be Filled Out by Member-Applicant
            </div>

            <div className="bg-sss-section-bg text-sss-navy-dark text-xs font-bold uppercase py-2.5 px-6 border-y border-sss-form-border tracking-wider shadow-sm">
              A. Principal Applicant's Information
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="SS Number" required className="md:col-span-4">
                <DigitBoxes format="##-#######-#" value={form.ap_ss_num} onChange={(v) => set("ap_ss_num", v)} required />
              </Field>
              <Field label="Common Reference No." className="md:col-span-4">
                <DigitBoxes format="####-#######-#" value={form.ap_crn} onChange={(v) => set("ap_crn", v)} />
              </Field>

              <Field label="Date of Birth" hint="(YYYY-MM-DD)" required>
                <input type="date" required className="sss-input" value={form.ap_dob} onChange={(e) => set("ap_dob", e.target.value)} />
              </Field>
              <Field label="Taxpayer ID No." className="md:col-span-3">
                <DigitBoxes format="###-###-###-###" value={form.ap_taxpayer_id_number} onChange={(v) => set("ap_taxpayer_id_number", v)} />
              </Field>

              <Field label="Full Name" hint="(LAST, FIRST, MIDDLE, SUFFIX)" className="md:col-span-4" required>
                <SplitName value={form.applicant_name} onChange={(v) => set("applicant_name", v)} required />
              </Field>

              <Field label="Sex" required>
                <select className="sss-input" required value={form.ap_sex} onChange={(e) => set("ap_sex", e.target.value as "M" | "F")}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </Field>
              <Field label="Civil Status" required>
                <select className="sss-input" required value={form.ap_civil_status} onChange={(e) => set("ap_civil_status", e.target.value as never)}>
                  <option value="S">Single</option>
                  <option value="M">Married</option>
                  <option value="W">Widowed</option>
                  <option value="SE">Separated</option>
                </select>
              </Field>
              <Field label="Mobile Number" className="md:col-span-4 lg:col-span-2" required>
                <DigitBoxes format="####-#######" value={form.ap_mobile_no} onChange={(v) => set("ap_mobile_no", v)} required />
              </Field>

              <Field label="Local Address" className="md:col-span-4" required>
                <SplitAddress isLocalAddress={true} value={form.ap_local_address} onChange={(v) => set("ap_local_address", v)} required />
              </Field>

              <Field label="Telephone No." hint="(area + tel)">{input("ap_tel_no")}</Field>
              <Field label="Email Address" className="md:col-span-2" required>{input("ap_email_add", { type: "email", required: true })}</Field>
              
              <Field label="Foreign Address" hint="(for Overseas Filipino Worker)" className="md:col-span-4">
                <SplitAddress value={form.ap_foreign_address || ""} onChange={(v) => set("ap_foreign_address", v)} />
              </Field>

              <Field label="Country" hint="(for OFW)" className="relative md:col-span-2">
                <div ref={dropdownRef} className="relative">
                  <ClearableInput
                    className="sss-input"
                    value={countrySearch || (form.country as string) || ""}
                    onChange={(val) => {
                      setCountrySearch(val);
                      set("country", val);
                      setShowCountryDropdown(true);
                    }}
                    onFocus={() => setShowCountryDropdown(true)}
                    placeholder="E.G. UNITED STATES"
                  />
                  {showCountryDropdown && filteredCountries.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-sss-form-border shadow-lg max-h-48 overflow-y-auto">
                      {filteredCountries.map(c => (
                        <div
                          key={c}
                          className="px-3 py-1.5 text-sm hover:bg-sss-navy/10 cursor-pointer"
                          onClick={() => {
                            set("country", c);
                            setCountrySearch("");
                            setShowCountryDropdown(false);
                          }}
                        >
                          {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Field>
            </div>

            <div className="bg-sss-section-bg text-sss-navy-dark text-xs font-bold uppercase py-2.5 px-6 border-y border-sss-form-border tracking-wider shadow-sm">
              B. Spouse of Principal Applicant's Information (If Applicable)
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="SS Number" className="md:col-span-4 lg:col-span-2">
                <DigitBoxes format="##-#######-#" value={form.sp_ss_num || ""} onChange={(v) => set("sp_ss_num", v)} />
              </Field>
              <Field label="Common Reference No." className="md:col-span-4 lg:col-span-2">
                <DigitBoxes format="####-#######-#" value={form.sp_crn || ""} onChange={(v) => set("sp_crn", v)} />
              </Field>

              <Field label="Date of Birth" hint="(YYYY-MM-DD)">
                <input type="date" className="sss-input" value={form.sp_dob} onChange={(e) => set("sp_dob", e.target.value)} />
              </Field>
              <Field label="Taxpayer ID No." className="md:col-span-3">
                <DigitBoxes format="###-###-###-###" value={form.sp_taxpayerid || ""} onChange={(v) => set("sp_taxpayerid", v)} />
              </Field>
              <Field label="Spouse Full Name" className="md:col-span-4">
                <SplitName value={form.spouse_name || ""} onChange={(v) => set("spouse_name", v)} />
              </Field>
              <Field label="Employer Number" className="md:col-span-4 lg:col-span-2">
                <DigitBoxes format="##-########-###" value={form.sp_employernum || ""} onChange={(v) => set("sp_employernum", v)} />
              </Field>
              <Field label="Employer Tax ID" className="md:col-span-4 lg:col-span-2">
                <DigitBoxes format="###-###-###-###" value={form.sp_employertaxid || ""} onChange={(v) => set("sp_employertaxid", v)} />
              </Field>
              <Field label="Type of Employer" className="md:col-span-4 lg:col-span-2">
                <select className="sss-input" value={form.sp_typeofemployer} onChange={(e) => set("sp_typeofemployer", e.target.value as never)}>
                  <option value="">—</option>
                  <option value="B">Business</option>
                  <option value="H">Household</option>
                </select>
              </Field>
              <Field label="Employer Name" className="md:col-span-4 lg:col-span-2">{input("sp_employername")}</Field>
            </div>

            <div className="bg-sss-section-bg text-sss-navy-dark text-xs font-bold uppercase py-2.5 px-6 border-y border-sss-form-border tracking-wider shadow-sm">
              C. Principal Applicant's Employer Information
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
              <Field label="Employer Number" required className="md:col-span-4 lg:col-span-2">
                <DigitBoxes format="##-########-###" value={form.ap_employer_num || ""} onChange={(v) => set("ap_employer_num", v)} required />
              </Field>
              <Field label="Taxpayer ID Number" required className="md:col-span-4 lg:col-span-2">
                <DigitBoxes format="###-###-###-###" value={form.ap_employer_taxid || ""} onChange={(v) => set("ap_employer_taxid", v)} required />
              </Field>
              <Field label="Type of Employer" required>
                <select className="sss-input" required value={form.ap_typeofemployer} onChange={(e) => set("ap_typeofemployer", e.target.value as never)}>
                  <option value="B">Business</option>
                  <option value="H">Household</option>
                </select>
              </Field>
              <Field label="Occupation / Position" required className="md:col-span-3">{input("ap_occupation", { required: true })}</Field>
              <Field label="Employer Name" required className="md:col-span-4">{input("ap_employer_name", { required: true })}</Field>
              <Field label="Employer Address" required className="md:col-span-4">
                <SplitAddress value={form.ap_employer_address || ""} onChange={(v) => set("ap_employer_address", v)} required />
              </Field>
              <Field label="Telephone No." required>{input("ap_employer_tel_no", { required: true })}</Field>
              <Field label="Email Address" required className="md:col-span-2">{input("ap_employer_email_add", { type: "email", required: true })}</Field>
              <Field label="Website">{input("ap_employer_website", { forceLowercase: true })}</Field>
            </div>

            <div className="p-6 border-t border-sss-form-border flex justify-end gap-3 bg-gray-50/80 mt-2 rounded-b-xl">
              <button
                type="button"
                onClick={() => navigate({ to: "/dashboard" })}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 text-sm uppercase font-bold tracking-wider hover:bg-gray-300 transition-colors rounded-md"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                className="px-8 py-2.5 bg-sss-navy text-white text-sm uppercase font-bold tracking-wider hover:bg-sss-navy-dark transition-colors disabled:opacity-60 flex items-center shadow-sm rounded-md"
              >
                {busy && (
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {busy ? "Submitting Application..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <SssFooter />
    </div>
  );
}
