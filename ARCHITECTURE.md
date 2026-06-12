# SSS SQL Application Architecture

Welcome to the **SSS SQL** codebase! This document provides a high-level overview of how the application is structured.

## Tech Stack
- **Frontend Framework:** React + Vite
- **Routing:** Tanstack Router (File-based routing under `src/routes`)
- **Backend / Database:** Supabase (PostgreSQL, Auth, Edge Functions)
- **Styling:** Vanilla CSS (`src/styles.css`) + Tailwind classes for utility
- **Hosting:** Vercel

---

## High-Level Architecture Diagram

```ascii
+-------------------------------------------------+
|               USER BROWSER / CLIENT             |
|                                                 |
|  [ Apply Page ]   [ Dashboard ]   [ Admin UI ]  |
|   (apply.tsx)     (dashboard.tsx) (admin.tsx)   |
|                                                 |
|   - React State                                 |
|   - Tanstack Query (Data Fetching)              |
+------------------------+------------------------+
                         |
                 (HTTP / Supabase JS)
                         |
                         v
+------------------------+------------------------+
|                SUPABASE PLATFORM                |
|                                                 |
|  [ Auth System ]       [ PostgresSQL Database ]    |
|  (users, sessions)     (applications table)     |
|                                                 |
|             [ Edge RPC Functions ]              |
|        (submitApplication, checkIsAdmin)        |
+-------------------------------------------------+
```

## Folder Structure Explained

Here's a quick map of what lives where in the repository:

```text
sss_sql/
├── api/                # Vercel Edge Functions (e.g., custom mailer, email verification)
├── src/
│   ├── components/         # Reusable UI parts (Headers, Form Inputs, etc.)
│   ├── integrations/       # Supabase client setup & types
│   ├── lib/                # Shared utilities & schema definitions
│   └── routes/             # All pages for the app (Tanstack Router)
│       ├── _authenticated/ # Routes that require user login
│       │   ├── admin.tsx        # Admin panel for reviewing apps
│       │   ├── apply.tsx        # The main Housing Loan form
│       │   ├── dashboard.tsx    # User's personal application list
│       │   └── route.tsx        # Auth check middleware
│       ├── auth.tsx        # Login / Signup page
│       └── __root.tsx      # Base layout template for the app
├── supabase/               # Database configurations & functions
├── .env.example            # Environment variables blueprint
└── package.json            # NPM dependencies & scripts
```

## How Data Flows

1. **User Login**: Users hit `auth.tsx` and authenticate via Supabase Auth.
2. **Form Submission**: In `apply.tsx`, users fill out the form. When submitted, the frontend calls a "Server Function" (`submitApplication`).
3. **Database Saving**: The server function validates the payload and inserts it directly into the `applications` PostgreSQL table on Supabase.
4. **Admin Review**: Admins visit `admin.tsx` where another function checks their permissions. If approved, they see the queue of all applications.

## Custom Email Infrastructure

Because Supabase's default email sending rate is strictly limited on the free tier, the application uses a custom email handler:
- **Webhook Trigger**: Supabase is configured to trigger a webhook whenever an auth email (signup, password reset, email change) needs to be sent.
- **Vercel Edge Function (`api/send-auth-email.ts`)**: This endpoint receives the webhook payload from Supabase.
- **Microsoft Graph API**: The edge function uses Microsoft Entra ID credentials (`MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`) to obtain an OAuth token and send the email from an authorized Microsoft 365 mailbox (`MS_SENDER_EMAIL`).
- **Templates**: The email templates (including wording for signups, password resets, and email changes) are hardcoded and managed directly inside `api/send-auth-email.ts`, completely bypassing the templates configured in the Supabase Dashboard.

## Getting Started Locally

1. Create a `.env.local` file based on `.env.example`.
2. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `npm install`.
4. Run `npm run dev` to start the local Vite server.
