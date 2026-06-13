# System Architecture & Migration Blueprint
**Project**: SSS Housing Loan Portal
**Target Audience**: Software Architects, Migration Teams (e.g., transitioning to a Java GUI/Desktop Application)

---

## 1. High-Level Architecture Overview

This application is currently built on a **React (Vite) + TypeScript** frontend with a **Supabase (PostgreSQL)** backend as a Service (BaaS). It heavily utilizes client-side rendering and local component state, communicating with the backend via REST/RPC APIs provided by the Supabase client. 

If migrating to a **Java GUI** (e.g., JavaFX, Swing) with a dedicated Java Spring Boot backend, the following ASCII diagram maps the current architecture to a traditional tiered architecture:

```text
+-------------------------+         +-------------------------+         +-------------------------+
|     UI Layer (Views)    |         |  Business Logic (Controllers) |     |     Data Layer (Model)  |
|-------------------------|         |-------------------------|         |-------------------------|
| - Authentication Screens|         | - Auth Management       |         | - PostgreSQL Database   |
| - Dashboard (Flex Grid) | <=====> | - Form Validation Engine| <=====> | - Supabase Auth Schema  |
| - Complex Forms         |         | - Routing & State       |         | - Custom APIs (Vercel)  |
| - Admin Queue Tables    |         | - Synthetic Data Engine |         |                         |
+-------------------------+         +-------------------------+         +-------------------------+
```

---

## 2. UI Component Architecture

To replicate the current user experience in a Java GUI, the following specialized components must be recreated:

### 2.1. `DigitBoxes` (Strict Formatted Input)
* **Purpose**: Forces users to input structured numeric data into discrete visual boxes with predefined separators (e.g., `##-########-###`).
* **Behavior**: Automatically advances focus to the next box upon typing, and retreats focus on backspace. Prevents non-alphanumeric character entry.
* **Migration Note**: In JavaFX, this would require a composite control made of an array of `TextField`s with custom `ChangeListener`s on their `textProperty()` to manage focus traversal and regex validation dynamically.

### 2.2. `SplitName` (Name Parser)
* **Purpose**: Presents a single text input for a "Full Name", but internally parses and splits it into First Name, Middle Name, Last Name, and Suffix upon blur/submit.
* **Migration Note**: Requires an NLP-light or robust RegEx algorithm to detect common suffixes (JR, SR, III) and split strings by spaces intelligently.

### 2.3. `ClearableInput`
* **Purpose**: A standard text field equipped with an absolute-positioned "X" vector icon that clears the input state when clicked.

---

## 3. Strict Validation Rules (Minute Details)

The application enforces extreme data integrity before any network request is made. A migrating system **must** implement these identical rules:

### 3.1. Field-Level Constraints
| Field Name | Exact Length Required | Format Mask |
| :--- | :--- | :--- |
| **SS Number** | 10 Digits | `##-#######-#` |
| **CRN** | 12 Digits | `####-#######-#` |
| **Taxpayer ID** | 12 Digits | `###-###-###-###` |
| **Employer Number** | 13 Digits | `##-########-###` |
| **Employer Tax ID** | 12 Digits | `###-###-###-###` |
| **Mobile Number** | 11 Digits | `####-#######` |

* **Rule**: Validation must strip all dashes and spaces before counting lengths. If the stripped length does not exactly match the required length, submission must be blocked.

### 3.2. Password Security Policy
* Minimum 8 characters in length.
* Contains at least one **uppercase** letter (`A-Z`).
* Contains at least one **lowercase** letter (`a-z`).
* Contains at least one **number** (`0-9`).
* Contains at least one **special symbol** (e.g., `!@#$%^&*`).

### 3.3. Age & Date Validation
* **Rule**: Applicant must be at least **18 years old** based on their inputted Date of Birth compared to the system's current date. 

---

## 4. Application State & Layout Rules

### 4.1. Edge-to-Edge "App-Like" Layout
The current web application mimics a native desktop application using Flexbox. 
* **Behavior**: Tables do not float loosely on the page. The table container stretches to `100%` of the available vertical viewport (`flex-1 flex flex-col h-full`). 
* **Pagination Footer**: The "Show More / Show Less" button is anchored permanently to the bottom edge of the screen (`mt-auto`).
* **Migration Note**: In Java, use `BorderPane` (JavaFX) or `BorderLayout` (Swing) placing the table in the `CENTER` and the pagination controls in the `BOTTOM` region to recreate this fluid stretching.

### 4.2. Responsive Pagination Defaults
* **Desktop (Width >= 768px)**: Defaults to **15** items per page to fill the larger vertical space.
* **Mobile (Width < 768px)**: Defaults to **10** items per page.

---

## 5. Security Edge Cases & Custom APIs

### 5.1. The "Secure Email Change" Bypass
* **Problem**: Native Supabase/GoTrue auth requires a "double-confirmation" (an email sent to both the old and new addresses) to change an email. When using custom external SMTPs (like Microsoft Graph API), routing these two distinct secure tokens reliably is highly volatile.
* **Solution**: The application uses a custom, secure backend endpoint (`/api/change-email`).
* **Flow**:
  1. User authenticates securely in the app.
  2. User inputs a new email in the Settings tab.
  3. The frontend sends the new email and the user's secure session JWT to the custom endpoint.
  4. The endpoint verifies the JWT, initializes a Supabase Admin client (bypassing RLS), and directly updates the user's email in the Auth database, requiring NO email confirmation links.
* **Migration Note**: A Java backend must implement a similar secure RPC or Admin-level REST controller to manually execute email updates based on verified Bearer tokens.

---

## 6. Database Schema Mapping

```text
Table: applications
+-------------------------+-------------------+------------------------------------------+
| Column Name             | Data Type         | Notes                                    |
+-------------------------+-------------------+------------------------------------------+
| app_number              | BIGINT (PK)       | Auto-increment, Zero-padded to 12 digits |
| user_id                 | UUID (FK)         | References auth.users                    |
| status                  | VARCHAR           | 'pending', 'approved', 'rejected'        |
| notes                   | TEXT              | Admin remarks                            |
| applicant_name          | VARCHAR           | Full name string                         |
| ap_ss_num               | VARCHAR(15)       | Stored as raw string (often w/ dashes)   |
| ap_mobile_no            | VARCHAR(15)       | Stored as raw string                     |
| ...                     | ...               |                                          |
| created_at              | TIMESTAMP         | Auto-generated                           |
+-------------------------+-------------------+------------------------------------------+

Table: profiles
+-------------------------+-------------------+------------------------------------------+
| Column Name             | Data Type         | Notes                                    |
+-------------------------+-------------------+------------------------------------------+
| id                      | UUID (PK)         | References auth.users                    |
| role                    | VARCHAR           | 'admin' or 'user'                        |
| full_name               | VARCHAR           | Derived from registration                |
+-------------------------+-------------------+------------------------------------------+
```

---

## 7. Module / View Routing Map

```text
[ Root App / Entry Point ]
       |
       +--> [ /auth ]  -------------> Login / Register / Forgot Password
       |
       +--> [ Protected Routes (Requires JWT Session) ]
               |
               +--> [ /dashboard ] -----> User's Housing Loan History
               |
               +--> [ /apply ]     -----> Multi-section Interactive Form
               |
               +--> [ /settings ]  -----> Security & Profile Management
               |
               +--> [ /admin ]     -----> (Requires 'admin' role) Queue & User Management
                      |
                      +--> [ /application/$id ] --> Detailed review panel
```

## Summary for Java Migration
To successfully port this to Java:
1. Rebuild the UI using **JavaFX FXML** mapped to MVC controllers.
2. Implement **Java Beans / POJOs** mirroring the exact validation algorithms mapped out in Section 3.
3. Replace the Vercel `/api/*` endpoints with **Spring Boot `@RestController`** mappings.
4. Replace the Supabase React Client with standard **JDBC/Hibernate ORM** to connect directly to the PostgreSQL database, managing JWT sessions via Spring Security.
