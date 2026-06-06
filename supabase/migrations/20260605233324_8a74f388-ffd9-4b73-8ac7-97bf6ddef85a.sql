
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Application status
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

-- Applications (SSS Housing Loan, Parts A/B/C)
CREATE TABLE public.applications (
  app_number BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- A. Principal Applicant
  ap_ss_num VARCHAR(12) NOT NULL,
  ap_crn VARCHAR(14),
  ap_dob DATE NOT NULL,
  ap_taxpayer_id_number VARCHAR(15),
  applicant_name VARCHAR(120) NOT NULL,
  ap_sex CHAR(1) NOT NULL,
  ap_civil_status VARCHAR(2) NOT NULL,
  ap_local_address VARCHAR(255) NOT NULL,
  ap_tel_no VARCHAR(13),
  ap_mobile_no VARCHAR(13) NOT NULL,
  ap_email_add VARCHAR(120),
  ap_foreign_address VARCHAR(255),
  country VARCHAR(60),

  -- B. Spouse (optional)
  sp_ss_num VARCHAR(12),
  sp_crn VARCHAR(14),
  sp_dob DATE,
  sp_taxpayerid VARCHAR(15),
  spouse_name VARCHAR(120),
  sp_employernum VARCHAR(13),
  sp_employertaxid VARCHAR(15),
  sp_typeofemployer CHAR(1),
  sp_employername VARCHAR(120),

  -- C. Applicant Employer
  ap_employer_num VARCHAR(13) NOT NULL,
  ap_employer_taxid VARCHAR(15) NOT NULL,
  ap_typeofemployer CHAR(1) NOT NULL,
  ap_employer_name VARCHAR(120) NOT NULL,
  ap_occupation VARCHAR(60) NOT NULL,
  ap_employer_address VARCHAR(255) NOT NULL,
  ap_employer_tel_no VARCHAR(13) NOT NULL,
  ap_employer_email_add VARCHAR(120),
  ap_employer_website VARCHAR(120),

  -- Workflow
  status public.application_status NOT NULL DEFAULT 'pending',
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  decision_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_ap_sex CHECK (ap_sex IN ('M','F')),
  CONSTRAINT chk_ap_civil_status CHECK (ap_civil_status IN ('S','M','W','SE')),
  CONSTRAINT chk_ap_dob_age CHECK (ap_dob BETWEEN (CURRENT_DATE - INTERVAL '60 years') AND (CURRENT_DATE - INTERVAL '18 years')),
  CONSTRAINT chk_ap_email CHECK (ap_email_add IS NULL OR ap_email_add LIKE '%@%'),
  CONSTRAINT chk_ap_employer_email CHECK (ap_employer_email_add IS NULL OR ap_employer_email_add LIKE '%@%'),
  CONSTRAINT chk_sp_typeofemployer CHECK (sp_typeofemployer IS NULL OR sp_typeofemployer IN ('B','H')),
  CONSTRAINT chk_ap_typeofemployer CHECK (ap_typeofemployer IN ('B','H'))
);

CREATE INDEX idx_applications_user ON public.applications(user_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE UNIQUE INDEX uq_app_ap_crn ON public.applications(ap_crn) WHERE ap_crn IS NOT NULL;
CREATE UNIQUE INDEX uq_app_ap_tin ON public.applications(ap_taxpayer_id_number) WHERE ap_taxpayer_id_number IS NOT NULL;
CREATE UNIQUE INDEX uq_app_sp_ss ON public.applications(sp_ss_num) WHERE sp_ss_num IS NOT NULL;
CREATE UNIQUE INDEX uq_app_sp_crn ON public.applications(sp_crn) WHERE sp_crn IS NOT NULL;
CREATE UNIQUE INDEX uq_app_sp_tin ON public.applications(sp_taxpayerid) WHERE sp_taxpayerid IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.applications_app_number_seq TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Users: see and create their own
CREATE POLICY "Users view own applications" ON public.applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own applications" ON public.applications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins: update any (for approve/reject)
CREATE POLICY "Admins update applications" ON public.applications
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
