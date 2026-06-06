export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      applications: {
        Row: {
          ap_civil_status: string;
          ap_crn: string | null;
          ap_dob: string;
          ap_email_add: string | null;
          ap_employer_address: string;
          ap_employer_email_add: string | null;
          ap_employer_name: string;
          ap_employer_num: string;
          ap_employer_taxid: string;
          ap_employer_tel_no: string;
          ap_employer_website: string | null;
          ap_foreign_address: string | null;
          ap_local_address: string;
          ap_mobile_no: string;
          ap_occupation: string;
          ap_sex: string;
          ap_ss_num: string;
          ap_taxpayer_id_number: string | null;
          ap_tel_no: string | null;
          ap_typeofemployer: string;
          app_number: number;
          applicant_name: string;
          country: string | null;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          decision_notes: string | null;
          sp_crn: string | null;
          sp_dob: string | null;
          sp_employername: string | null;
          sp_employernum: string | null;
          sp_employertaxid: string | null;
          sp_ss_num: string | null;
          sp_taxpayerid: string | null;
          sp_typeofemployer: string | null;
          spouse_name: string | null;
          status: Database["public"]["Enums"]["application_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ap_civil_status: string;
          ap_crn?: string | null;
          ap_dob: string;
          ap_email_add?: string | null;
          ap_employer_address: string;
          ap_employer_email_add?: string | null;
          ap_employer_name: string;
          ap_employer_num: string;
          ap_employer_taxid: string;
          ap_employer_tel_no: string;
          ap_employer_website?: string | null;
          ap_foreign_address?: string | null;
          ap_local_address: string;
          ap_mobile_no: string;
          ap_occupation: string;
          ap_sex: string;
          ap_ss_num: string;
          ap_taxpayer_id_number?: string | null;
          ap_tel_no?: string | null;
          ap_typeofemployer: string;
          app_number?: number;
          applicant_name: string;
          country?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_notes?: string | null;
          sp_crn?: string | null;
          sp_dob?: string | null;
          sp_employername?: string | null;
          sp_employernum?: string | null;
          sp_employertaxid?: string | null;
          sp_ss_num?: string | null;
          sp_taxpayerid?: string | null;
          sp_typeofemployer?: string | null;
          spouse_name?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          ap_civil_status?: string;
          ap_crn?: string | null;
          ap_dob?: string;
          ap_email_add?: string | null;
          ap_employer_address?: string;
          ap_employer_email_add?: string | null;
          ap_employer_name?: string;
          ap_employer_num?: string;
          ap_employer_taxid?: string;
          ap_employer_tel_no?: string;
          ap_employer_website?: string | null;
          ap_foreign_address?: string | null;
          ap_local_address?: string;
          ap_mobile_no?: string;
          ap_occupation?: string;
          ap_sex?: string;
          ap_ss_num?: string;
          ap_taxpayer_id_number?: string | null;
          ap_tel_no?: string | null;
          ap_typeofemployer?: string;
          app_number?: number;
          applicant_name?: string;
          country?: string | null;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision_notes?: string | null;
          sp_crn?: string | null;
          sp_dob?: string | null;
          sp_employername?: string | null;
          sp_employernum?: string | null;
          sp_employertaxid?: string | null;
          sp_ss_num?: string | null;
          sp_taxpayerid?: string | null;
          sp_typeofemployer?: string | null;
          spouse_name?: string | null;
          status?: Database["public"]["Enums"]["application_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
      application_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      application_status: ["pending", "approved", "rejected"],
    },
  },
} as const;
