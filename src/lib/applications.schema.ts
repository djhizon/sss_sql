import { z } from "zod";

export const applicationInputSchema = z.object({
  // A
  ap_ss_num: z.string().trim().min(10).max(12),
  ap_crn: z.string().trim().max(14).optional().or(z.literal("")),
  ap_dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
  ap_taxpayer_id_number: z.string().trim().max(15).optional().or(z.literal("")),
  applicant_name: z.string().trim().min(1).max(120),
  ap_sex: z.enum(["M", "F"]),
  ap_civil_status: z.enum(["S", "M", "W", "SE"]),
  ap_local_address: z.string().trim().min(1).max(255),
  ap_tel_no: z.string().trim().max(13).optional().or(z.literal("")),
  ap_mobile_no: z.string().trim().min(7).max(13),
  ap_email_add: z.string().trim().email().max(120).optional().or(z.literal("")),
  ap_foreign_address: z.string().trim().max(255).optional().or(z.literal("")),
  country: z.string().trim().max(60).optional().or(z.literal("")),

  // B
  sp_ss_num: z.string().trim().max(12).optional().or(z.literal("")),
  sp_crn: z.string().trim().max(14).optional().or(z.literal("")),
  sp_dob: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  sp_taxpayerid: z.string().trim().max(15).optional().or(z.literal("")),
  spouse_name: z.string().trim().max(120).optional().or(z.literal("")),
  sp_employernum: z.string().trim().max(13).optional().or(z.literal("")),
  sp_employertaxid: z.string().trim().max(15).optional().or(z.literal("")),
  sp_typeofemployer: z.enum(["B", "H"]).optional().or(z.literal("")),
  sp_employername: z.string().trim().max(120).optional().or(z.literal("")),

  // C
  ap_employer_num: z.string().trim().min(1).max(13),
  ap_employer_taxid: z.string().trim().min(1).max(15),
  ap_typeofemployer: z.enum(["B", "H"]),
  ap_employer_name: z.string().trim().min(1).max(120),
  ap_occupation: z.string().trim().min(1).max(60),
  ap_employer_address: z.string().trim().min(1).max(255),
  ap_employer_tel_no: z.string().trim().min(1).max(13),
  ap_employer_email_add: z.string().trim().email().max(120).optional().or(z.literal("")),
  ap_employer_website: z.string().trim().max(120).optional().or(z.literal("")),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
