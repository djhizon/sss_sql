# Technical Specifications & Documentation

## 1. Overview & System Architecture
The SSS Housing Loan Portal is a modern, responsive web application that allows users to submit, edit, and manage their housing loan applications, while providing administrators with a secure dashboard to review, approve, or reject submissions.

### 1.1. High-Level System Flow
This diagram illustrates how the different components of the website interact to make the system run.

```mermaid
flowchart TD
    %% Entities
    User((Applicant / Admin))
    
    %% Hosting & Frontend
    subgraph Frontend [Vercel Hosting Layer]
        UI[React User Interface]
        ClientRouting[TanStack Router]
        DataState[TanStack Query State]
    end
    
    %% Backend Services
    subgraph Backend [Supabase BaaS]
        Auth[GoTrue Auth Service]
        DB[(PostgreSQL Database)]
        RPC[Edge RPC Functions]
    end

    %% Flow
    User -->|Visits Website| UI
    UI <-->|Page Navigation| ClientRouting
    UI <-->|Fetch/Mutate Data| DataState
    
    %% Connections
    DataState <-->|1. Authenticate (Email/Pass)| Auth
    DataState <-->|2. CRUD Operations via REST| DB
    DataState <-->|3. Secure Escalation| RPC
    RPC -->|Perform Admin Tasks| DB
    RPC -->|Bypass RLS| Auth
```

**How it works:**
1. **The User** accesses the web application, which is hosted globally and delivered quickly via **Vercel**.
2. **The Frontend (Vercel)** handles all visual components, strict form validations, and routing directly in the user's browser using React.
3. **The Backend (Supabase)** acts as the central data and identity hub. The frontend communicates with Supabase securely over the internet.
   - **Auth Service** handles login, registration, and password management.
   - **PostgreSQL DB** stores the loan applications and role data securely.

---

## 2. Technical Specifications (Tech Stack)

### 2.1. Frontend & Hosting
* **Hosting Platform:** Vercel - Provides serverless edge hosting for fast global delivery and automatic CI/CD deployments.
* **Framework:** React 18
* **Build Tool:** Vite
* **Routing:** TanStack Router (`@tanstack/react-router`) - Provides type-safe file-based routing.
* **State Management & Data Fetching:** TanStack Query (`@tanstack/react-query`)
* **Styling:** Vanilla CSS with custom utility classes and design tokens. Strict adherence to the SSS color palette.

### 2.2. Backend & Database
* **Backend-as-a-Service (BaaS):** Supabase
* **Database:** PostgreSQL
* **Authentication:** Supabase Auth (GoTrue) - Manages JWT sessions and secure email/password sign-ins.
* **Security:** Row Level Security (RLS) policies to ensure data isolation. Custom PostgreSQL RPC functions are deployed for elevated tasks.

### 2.3. Data Validation
* **Schema Validation:** Zod (`zod`) - Guarantees strict type safety and schema validation.
* **Form Inputs:** Custom masked input components (e.g., `DigitBoxes`) intercept user keystrokes to ensure lengths and formats match the database requirements exactly.

---

## 3. Database Design

### 3.1. Why isn't User Info (Name, Birthdate, etc.) attached to the User Table?
In this architecture, **Authentication Data** is strictly separated from **Application Data** for security and flexibility. 
* The **`auth.users`** table (managed by Supabase) is responsible *only* for identity validation (Email, Password Hash, and Secure Tokens).
* Personal Identifiable Information (PII) like First Name, Last Name, Birthdate, Phone Number, and SS Number are gathered specifically for a Housing Loan and are stored entirely within the **`applications`** table. This ensures that sensitive demographic data is subject to the database's strict Row Level Security (RLS) policies and is isolated to the application itself.

### 3.2. Entity-Relationship Diagram
Below is the ER diagram representing the core data architecture of the application.

```mermaid
erDiagram
    auth_users {
        uuid id PK
        varchar email
        timestamptz created_at
    }
    
    user_roles {
        uuid id PK
        uuid user_id FK "References auth.users"
        app_role role "ENUM: 'admin', 'user'"
        timestamptz created_at
    }
    
    applications {
        bigint app_number PK "Auto-incrementing BIGSERIAL"
        uuid user_id FK "References auth.users"
        application_status status "ENUM: 'pending', 'approved', 'rejected'"
        boolean is_deleted "Soft delete flag"
        varchar applicant_name "Full Name (First, Middle, Last)"
        varchar ap_ss_num "SS Number (10 digits)"
        date ap_dob "Applicant Date of Birth"
        varchar ap_mobile_no "Mobile Phone Number"
        varchar ap_civil_status "S, M, W, SE"
        varchar ap_local_address
        varchar ap_employer_name
        text decision_notes "Admin comments"
        uuid decided_by FK "References auth.users (Admin who reviewed)"
        timestamptz created_at
        timestamptz updated_at
    }
    
    auth_users ||--o{ user_roles : "assigned"
    auth_users ||--o{ applications : "submits"
    auth_users ||--o{ applications : "reviews (decided_by)"
```

### 3.1. Database Security & Triggers
* **Row Level Security (RLS):** 
  * Users can only `SELECT` and `INSERT` their own applications.
  * Only users with an `admin` role in the `user_roles` table can `UPDATE` applications (for approving/rejecting).
  * Only admins can `DELETE` applications (soft delete).
* **Triggers:**
  * `trg_applications_updated_at`: Automatically updates the `updated_at` column whenever a row is modified.
  * `on_auth_user_created`: Automatically assigns the default `'user'` role to any new signups via the `handle_new_user()` function.

---

## 4. Source Code Architecture Details

### 4.1. Core Directory Structure
* `/src/routes/`: Contains the file-based routing components driven by TanStack Router.
  * `_authenticated/`: A layout route that enforces session checks. If no user is authenticated, it redirects to `/auth`.
    * `admin.tsx`: The administrative dashboard. Restricted by `checkIsAdmin()`.
    * `apply.tsx`: The primary creation form for housing loans.
    * `dashboard.tsx`: The user's personal queue of submitted applications.
    * `edit.$id.tsx`: The interface for editing a pending application. Pre-fills existing data.
    * `application.$id.tsx`: The read-only detailed view of an application, utilized by both users and admins.
    * `settings.tsx`: Security and profile management (password resets, email updates).
* `/src/lib/`:
  * `applications.functions.ts`: Encapsulates all backend interactions (fetching, inserting, updating applications, and checking roles).
  * `applications.schema.ts`: Contains the `zod` schema definitions reflecting the database constraints.
* `/src/components/`:
  * `DigitBoxes.tsx`: A highly complex UI component that forces precise alphanumeric input mapping to predefined formats (e.g., `##-#######-#`).
  * `SplitInputs.tsx`: Contains components like `SplitName` and `SplitAddress` that present an aggregate view but split data into exact segments behind the scenes.
  * `SssHeader.tsx`: The global navigation layout.

### 4.2. Complex Data Handling
The application demands extensive data entry across multiple domains (Principal Applicant, Spouse, and Employer).
* **Synthetic Data Generation:** For testing and rapid development, `apply.tsx` features a pre-fill engine that can map synthetic JSON data into the React state instantly.
* **Form State Sanitization:** Before data hits the database, the `cleanOptional` utility maps empty strings (`""`) to `null` to respect strict database checks without causing React controlled-component errors.

### 4.3. Routing & State Paradigm
* The application is fully client-side rendered (CSR).
* Page changes do not trigger full browser reloads.
* TanStack Query intelligently caches `is-admin` checks and application payloads to avoid redundant network calls, while still automatically re-fetching when mutations (like an Edit or Status Approval) occur.
