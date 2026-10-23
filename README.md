# NexServe Corporate Management Portal

Production-quality, enterprise corporate management web application for **NexServe**, engineered with Next.js 15, TypeScript, Tailwind CSS, Supabase PostgreSQL, and ExcelJS.

---

## 1. System Overview & Technology Stack

* **Frontend**: Next.js 15 (App Router, React 19, Server Components & Server Actions)
* **Styling & Design System**: Tailwind CSS v4, Radix UI primitives, Sonner toasts, Lucide icons
* **Design Philosophy**: Premium corporate brand identity sampled directly from the supplied official logo (`#0C2448` Navy, `#187890` Teal, `#484848` Muted Grey). Strictly zero neon glow, zero flashy effects.
* **Database & Auth**: PostgreSQL via Supabase with Row Level Security (RLS) policies, foreign key constraints, and database-level audit triggers
* **Reporting**: True binary `.xlsx` generation with ExcelJS (formatted header, frozen panes, and auto-filters)
* **Quality Assurance**: 100% strict TypeScript compliance, Vitest test suite, production build verified

---

## 2. Core Modules & Route Hierarchy

### Public Routes
* `/` — Role-aware redirector (routes authenticated users to their departmental dashboard)
* `/login` — Secure corporate sign-in (Department selector: HR vs. Sales, credential verification, remember-me session persistence)
* `/about` — Corporate About Us overview, mission, vision, core services, and contact form
* `/forgot-password` — Password recovery flow
* `/reset-password` — Secure password update

### Protected Sales Module (`/sales`)
* `/sales/dashboard` — Four real-time database-driven KPIs: *Clients Contacted*, *Follow-ups Pending*, *Deals Won*, *Work Duration*
* `/sales/clients` — Client directory with search, status filtering, and contact source filters
* `/sales/clients/new` — Full client interaction logging supporting Sections A–F (Contact info, Contact source, Client review, Work status, Criteria, Follow-up scheduling)
* `/sales/clients/[id]` — Detailed view and edit screen for client activity records
* `/sales/follow-ups` — Tracking of scheduled follow-ups with overdue highlighting
* `/sales/attendance` — Real-time clock widget with Check-In and Check-Out functionality

### Protected HR Module (`/hr`)
* `/hr/dashboard` — Workforce monitoring, active employee count, organisation-wide sales metrics
* `/hr/employees` — Searchable corporate employee directory
* `/hr/activity` — Granular inspection of sales team client interactions and reviews
* `/hr/reports` — One-click downloadable `.xlsx` activity reports containing the exact 16 required columns
* `/hr/attendance` — Full historical check-in/out records and duration breakdown

### Super Admin Module (`/admin`)
* `/admin/dashboard` — Executive administration overview
* `/admin/users` — Employee provisioning, role and department assignment, account activation/deactivation
* `/admin/settings` — Configuration of company name, business timezone, contact info, and public About Us content
* `/admin/inquiries` — Inbox of inquiries submitted through the public About Us contact form
* `/admin/audit` — Immutable audit trail of administrative actions

---

## 3. Verified Seed Accounts

The database includes the following seeded accounts (all passwords set to `Password123!`):

| Role | Department | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | Administration | `admin@nexserve.com` | `Password123!` | Full access to Super Admin, Sales, and HR portals |
| **HR** | HR | `hr@nexserve.com` | `Password123!` | HR portal, employee directory, activity inspection, Excel reports |
| **Sales** | Sales | `sales@nexserve.com` | `Password123!` | Sales dashboard, client management, check-in/out attendance |
| **Sales** | Sales | `priya@nexserve.com` | `Password123!` | Sales dashboard, client management, check-in/out attendance |

---

## 4. Setup & Running Locally

### Prerequisites
* **Node.js**: v20 or newer
* **Docker Desktop**: Running locally (used by Supabase local stack)

### 1. Environment Configuration
Ensure `.env.local` contains the local or cloud Supabase connection parameters (see `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_jwt_token>
SUPABASE_SERVICE_ROLE_KEY=<service_role_token>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database Migrations
Migrations are managed via the Supabase CLI in `supabase/migrations/`:
* `20261023000001_core_schema.sql` — Profiles, Clients, Client Activities, Attendance, Audit Logs, Settings
* `20261023000002_security_and_metrics.sql` — Row Level Security policies, metric aggregation RPCs, attendance session validation

To start the local database and apply migrations:
```bash
npx supabase start
```

To seed test accounts and sample sales interactions:
```bash
npx tsx scripts/seed.ts
npx tsx scripts/seed-clients.ts
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build and Verification
```bash
# Type check
npx tsc --noEmit

# Unit tests
npx vitest run

# Production compilation
npm run build
```

---

## 5. Security & Business Logic Guarantees

1. **Role-Based Access Control**: Route access is enforced server-side in `src/lib/auth.ts` and `src/middleware.ts`. URL manipulation cannot bypass permissions.
2. **Row Level Security (RLS)**: Sales employees can only access their own assigned clients and activity records. HR and Super Admin have read access across records.
3. **Attendance Integrity**: All check-in and check-out timestamps are stamped authoritatively on the PostgreSQL server via the `check_in()` and `check_out()` functions. Browsers cannot submit artificial durations.
4. **Distinct Metrics**: The `Clients Contacted` KPI counts distinct client entities during the selected period, avoiding duplicate inflation from multiple contacts with the same client.
5. **Exact 16-Column Excel Reporting**: The report export strictly implements the client-specified column schema in proper sequence:
   1. Employee ID
   2. Name of the Employee
   3. Department of the Employee
   4. Date of Work
   5. Name of the Client
   6. Business Name
   7. Location
   8. Client Number
   9. Source of Contact
   10. Review of the Client
   11. Status of the Work
   12. Criteria
   13. Clients Contacted
   14. Follow-up Pending
   15. Deals Done
   16. Work Duration
