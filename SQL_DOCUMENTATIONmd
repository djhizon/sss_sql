# SQL Architecture & Queries Compendium

This document outlines the dual-layered SQL architecture of the SSS Housing Loan Portal. In a Supabase and React ecosystem, database operations are divided into two distinct paradigms: **Raw SQL Migrations** (Backend Structure) and **JavaScript Query Abstractions** (Frontend Operations).

---

## 1. Raw SQL & Database Migrations (Backend)

The foundational structure, security policies, and automated triggers of the database are strictly managed via version-controlled migration files written in PostgreSQL. 

**What are Migrations?**
Migrations are sequential `.sql` scripts that incrementally build the database architecture. By storing these scripts in the `supabase/migrations/` directory rather than executing ad-hoc queries via a web UI, the entire database infrastructure becomes reproducible, peer-reviewable, and safely deployable across different environments.

These scripts are executed on the Supabase server to establish tables, relationships, Row Level Security (RLS) rules, and Remote Procedure Calls (RPC).

### Migration History (`supabase/migrations/`)

1. **`20260605233324_initial_schema_and_roles.sql` (Initial Schema & Roles)**
   - The foundational script establishing the core architecture.
   - Creates the `applications` and `user_roles` tables.
   - Defines custom PostgreSQL ENUM types (`app_role`, `application_status`).
   - Establishes cascading foreign keys referencing the `auth.users` system table.
   - Implements strict Row Level Security (RLS) policies to ensure data isolation between tenants.

2. **`20260605233344_revoke_public_function_execution.sql` (Security Hardening)**
   - Hardens database security by revoking public `EXECUTE` privileges from internal administrative functions (e.g., `set_updated_at`, `handle_new_user`).
   - Prevents unauthorized execution of backend logic via the anonymous REST API.

3. **`20260613145620_web_crud_features.sql` (Web CRUD Features)**
   - Implements non-destructive administrative capabilities.
   - Alters the `applications` table to support soft-deletions (`is_deleted`).
   - Introduces secure RPC functions (`check_email_used`) to allow the frontend to verify email availability without exposing the `auth.users` table.
   - Creates an administrative RPC function (`delete_user`) to securely hard-delete user accounts.

---

## 2. JavaScript Query Abstractions (Frontend)

Instead of passing raw SQL strings from the client, the React application utilizes the Supabase JavaScript Client to construct strongly-typed, dynamic queries. These queries are translated into REST API calls and evaluated against the backend RLS policies in real-time.

Below is a compendium of exact literal database queries pulled directly from the source code. They can be searched globally within the codebase for reference.

### Application Submissions & Editing (Found in `src/lib/applications.functions.ts`)

1. **Insert New Application** (Line ~19)
   ```typescript
   const { data: row, error } = await supabase
     .from("applications")
     .insert(payload as never)
     .select("app_number")
     .single();
   ```
   *Description:* Saves a new housing loan application to the database and returns the generated `app_number` primary key.

2. **Update Existing Application** (Line ~34)
   ```typescript
   let query = supabase.from("applications").update(cleanOptional(validated) as never).eq("app_number", id);
   ```
   *Description:* Modifies fields of an existing application. Additional constraints (such as validating user ownership or pending status) are conditionally chained below this execution.

3. **Soft Delete Application** (Line ~165)
   ```typescript
   const { error } = await supabase
     .from("applications")
     .update({ is_deleted: true } as never)
     .eq("app_number", id)
     .eq("user_id", userData.user.id);
   ```
   *Description:* Mutates the `is_deleted` flag to remove the application from active views while preserving historical data.

### User Dashboard & Views (Found in `src/lib/applications.functions.ts`)

4. **List Authenticated User's Applications** (Line ~49)
   ```typescript
   const { data, error } = await supabase
     .from("applications")
     .select("app_number, applicant_name, status, created_at")
     .eq("user_id", userData.user.id)
     .neq("is_deleted", true)
     .order("created_at", { ascending: false });
   ```
   *Description:* Fetches all non-deleted applications strictly belonging to the active JWT session.

5. **Retrieve Application Details** (Line ~62)
   ```typescript
   const { data: row, error } = await supabase
     .from("applications")
     .select("*")
     .eq("app_number", id)
     .maybeSingle();
   ```
   *Description:* Retrieves all columns for a targeted application ID, enforcing RLS read policies.

### Administrative Queue Management (Found in `src/lib/applications.functions.ts`)

6. **Admin List All Applications** (Line ~88)
   ```typescript
   let q = supabase
     .from("applications")
     .select("app_number, applicant_name, ap_ss_num, status, created_at, user_id")
     .order("created_at", { ascending: false });
   ```
   *Description:* Unrestricted base query (authorized via admin RLS policy) fetching applications for the admin queue. Dynamically filtered by status downstream.

7. **Execute Administrative Decision** (Line ~108)
   ```typescript
   const { error } = await supabase
     .from("applications")
     .update({
       status: data.decision,
       decided_by: userData.user.id,
       decided_at: new Date().toISOString(),
       decision_notes: data.notes ?? null,
     } as never)
     .eq("app_number", data.id);
   ```
   *Description:* Mutates the application status to approved/rejected and commits the administrative signature, timestamp, and notes.

### Role & Identity Management (Found in `src/lib/applications.functions.ts`)

8. **Validate Administrative Access** (Line ~75)
   ```typescript
   const { data, error } = await supabase
     .from("user_roles")
     .select("role")
     .eq("user_id", userData.user.id)
     .eq("role", "admin")
     .maybeSingle();
   ```
   *Description:* Authorizes UI elements by verifying the existence of an 'admin' role record for the active session.

9. **List All System Users** (Line ~125)
   ```typescript
   const { data, error } = await supabase
     .from("admin_users_view")
     .select("*")
     .order("last_name", { ascending: true });
   ```
   *Description:* Fetches a complete list of registered users and roles from a secure, read-only database view.

10. **Demote Admin to Standard User** (Line ~144)
    ```typescript
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "admin");
    ```
    *Description:* Strips administrative privileges by deleting the role association.

11. **Promote User to Admin** (Line ~152)
    ```typescript
    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id, role" });
    ```
    *Description:* Grants administrative privileges via upsert operation.

### Remote Procedure Calls (RPC) (Found in `src/routes/auth.tsx` and `src/routes/_authenticated/settings.tsx`)

12. **Check Email Existence During Registration** (Found in `src/routes/auth.tsx`)
    ```typescript
    const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', { check_email: email });
    ```
    *Description:* Securely queries the `auth.users` system table via an elevated RPC function to prevent registration collisions.

13. **Check Email Availability During Account Update** (Found in `src/routes/_authenticated/settings.tsx`)
    ```typescript
    const { data: emailUsed } = await supabase.rpc('check_email_used', { target_email: newEmail });
    ```
    *Description:* Elevated RPC query to validate email availability before committing account profile modifications.

14. **Hard Delete User Account** (Found in `src/components/AdminUsersTable.tsx`)
    ```typescript
    await supabase.rpc('delete_user', { target_user_id: userId });
    ```
    *Description:* Allows an authorized Administrator to permanently execute a cascade deletion of a user account and all associated applications.

### Application Sequence Preview (Found in `src/routes/_authenticated/apply.tsx`)

15. **Predict Next Application Number Sequence** (Line ~150)
    ```typescript
    const { data } = await supabase
      .from("applications")
      .select("app_number")
      .lt("app_number", 100000000) // exclude synthetic entries with artificially large numbers
      .order("app_number", { ascending: false })
      .limit(1);
    ```
    *Description:* Queries the database for the current maximum sequential application number to generate an accurate UI preview of the upcoming Postgres `BIGSERIAL` sequence ID.

### Authentication & Account Security (GoTrue API) (Found in `src/routes/auth.tsx`)

16. **Register Account & Metadata** (Line ~94)
    ```typescript
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
{{ ... }}
          birthdate: birthdate
        }
      },
    });
    ```
    *Description:* Dispatches registration payload to the Supabase GoTrue service, committing demographic metadata to a securely isolated JSONB column.

17. **Issue Authentication Token** (Line ~128)
    ```typescript
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    ```
    *Description:* Validates credentials against hashed storage and issues a secure JWT session token for subsequent authenticated requests.

18. **Commit Password Modification** (Found in `src/routes/update-password.tsx` line ~14)
    ```typescript
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    ```
    *Description:* Overwrites the active user's existing cryptographic password hash.

19. **Dispatch Password Reset Workflow** (Found in `src/routes/auth.tsx` line ~121)
    ```typescript
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    ```
    *Description:* Generates a temporary recovery token and dispatches a secure reset link to the user's registered inbox.
