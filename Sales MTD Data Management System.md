# AI Coding Prompt --- Sales MTD Data Management System

## Google Antigravity + GitHub + Cloudflare Only

You are a senior full-stack architect and Cloudflare developer.

Build a production-ready internal web application for managing Sales
Month-to-Date (MTD) data.

The application must use ONLY Cloudflare infrastructure for hosting,
backend, database, file storage, authentication, and deployment.

Do NOT use:

-   Supabase
-   Vercel
-   Firebase
-   AWS
-   Google Cloud
-   Other external backend platforms

------------------------------------------------------------------------

# 1. Development and Deployment

## AI Coding

Google Antigravity

## Source Code

GitHub

## Frontend Hosting

Cloudflare Pages

## Backend

Cloudflare Workers

## Database

Cloudflare D1

## File Storage

Cloudflare R2

## Authentication

Cloudflare Access or secure Cloudflare-based authentication

## DNS

Cloudflare DNS

------------------------------------------------------------------------

# 2. Architecture

``` text
User
  ↓
Cloudflare Access
  ↓
Cloudflare Pages
  ↓
Cloudflare Workers
  ├── Authentication / authorization
  ├── MTD file processing
  ├── Unpivot logic
  ├── Data validation
  └── Database API
       ↓
Cloudflare D1

Original MTD Files
       ↓
Cloudflare R2
```

------------------------------------------------------------------------

# 3. Technology Stack

## Frontend

-   Next.js or React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   TanStack Table
-   Recharts

## Backend

-   Cloudflare Workers
-   TypeScript
-   Hono framework if useful

## Database

-   Cloudflare D1
-   SQLite-compatible SQL

## File Storage

-   Cloudflare R2

## Deployment

-   GitHub
-   Cloudflare Pages
-   Cloudflare Workers

------------------------------------------------------------------------

# 4. Main Business Workflow

The main user workflow is:

``` text
USER SELECTS SALES MONTH
        ↓
USER UPLOADS MTD FILES
        ↓
SYSTEM DETECTS REPORT DATE FROM FILENAME
        ↓
SYSTEM READS FILE
        ↓
SYSTEM DETECTS MONTHLY COLUMNS
        ↓
SYSTEM UNPIVOTS MONTH COLUMNS
        ↓
SYSTEM KEEPS ONLY SELECTED SALES MONTH
        ↓
SYSTEM ADDS MTD REPORT DATE
        ↓
SYSTEM ADDS SOURCE FILENAME
        ↓
SYSTEM CALCULATES FILE HASH
        ↓
SYSTEM CHECKS DUPLICATES
        ↓
SYSTEM APPENDS NEW MTD SNAPSHOT
        ↓
SYSTEM STORES DATA IN D1
        ↓
USER VIEWS DASHBOARD
```

------------------------------------------------------------------------

# 5. MTD Snapshot Business Rule

Every uploaded MTD file is a separate historical snapshot.

Example:

Selected Month:

``` text
June 2026
```

Uploaded files:

``` text
Sales MTD 20260621.xls
Sales MTD 20260625.xls
Sales MTD 20260630.xls
```

Database:

  Sales Month   MTD Report Date     Sales Source File
  ------------- ----------------- ------- --------------
  2026-06       2026-06-21            250 20260621.xls
  2026-06       2026-06-25            280 20260625.xls
  2026-06       2026-06-30            320 20260630.xls

The June 21 data must never be automatically overwritten by June 25
data.

New MTD files must be appended as new historical snapshots.

------------------------------------------------------------------------

# 6. Important File Processing Requirement

The actual Sales MTD report is a wide-format monthly report.

Example:

  -----------------------------------------------------------------------------
  Store   Product      Jan-26    Feb-26    Mar-26    Apr-26    May-26    Jun-26
  ------- --------- --------- --------- --------- --------- --------- ---------
  S001    P001            100       120       150       180       200       250

  S002    P002             80        90       110       130       160       190
  -----------------------------------------------------------------------------

The application must:

1.  Read the file
2.  Detect the monthly columns
3.  UNPIVOT the monthly columns into rows
4.  Filter only the user-selected Sales Month
5.  Add the MTD Report Date
6.  Add the original filename
7.  Append the new snapshot to the database

Example after unpivot:

  Store   Product   Sales Month     Sales
  ------- --------- ------------- -------
  S001    P001      2026-01           100
  S001    P001      2026-02           120
  S001    P001      2026-03           150
  S001    P001      2026-06           250

If the user selected:

``` text
June 2026
```

Only this data should be imported:

  Store   Product   Sales Month     Sales
  ------- --------- ------------- -------
  S001    P001      2026-06           250

------------------------------------------------------------------------

# 7. Source Filename

The original filename must be preserved in the final data.

Example:

``` text
Sales by Item - Monthly - Amt_Sales by Item - Monthly - Amt 20260621.xls
```

The final data must contain:

``` text
source_filename =
Sales by Item - Monthly - Amt_Sales by Item - Monthly - Amt 20260621.xls
```

Every imported record must contain the source filename.

------------------------------------------------------------------------

# 8. MTD Report Date

The MTD Report Date is extracted from the filename.

Example:

``` text
Sales MTD 20260621.xls
```

Extract:

``` text
20260621
```

Convert to:

``` text
2026-06-21
```

Store as:

``` text
mtd_report_date
```

The database must distinguish:

``` text
sales_month:
2026-06-01

mtd_report_date:
2026-06-21

source_filename:
Sales MTD 20260621.xls
```

------------------------------------------------------------------------

# 9. Cloudflare D1 Database

Create the following D1 tables.

## Table: users

``` sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    last_login_at TEXT
);
```

Roles:

-   ADMIN
-   MANAGER
-   VIEWER

------------------------------------------------------------------------

## Table: sales_months

``` sql
CREATE TABLE sales_months (
    id TEXT PRIMARY KEY,
    sales_month TEXT NOT NULL UNIQUE,
    month_name TEXT,
    year INTEGER,
    status TEXT,
    created_at TEXT,
    updated_at TEXT
);
```

------------------------------------------------------------------------

## Table: import_batches

``` sql
CREATE TABLE import_batches (
    id TEXT PRIMARY KEY,
    sales_month_id TEXT,
    batch_name TEXT,
    uploaded_by TEXT,
    total_files INTEGER,
    total_source_rows INTEGER,
    total_unpivot_rows INTEGER,
    total_selected_month_rows INTEGER,
    new_records INTEGER,
    duplicate_records INTEGER,
    error_records INTEGER,
    status TEXT,
    created_at TEXT
);
```

------------------------------------------------------------------------

## Table: import_files

``` sql
CREATE TABLE import_files (
    id TEXT PRIMARY KEY,
    batch_id TEXT,
    sales_month_id TEXT,
    mtd_report_date TEXT,
    source_filename TEXT,
    source_file_hash TEXT UNIQUE,
    file_size INTEGER,
    file_type TEXT,
    r2_object_key TEXT,
    total_source_rows INTEGER,
    total_unpivot_rows INTEGER,
    total_selected_month_rows INTEGER,
    new_records INTEGER,
    duplicate_records INTEGER,
    error_records INTEGER,
    status TEXT,
    uploaded_by TEXT,
    created_at TEXT
);
```

------------------------------------------------------------------------

## Table: sales_mtd_data

``` sql
CREATE TABLE sales_mtd_data (
    id TEXT PRIMARY KEY,
    sales_month_id TEXT NOT NULL,
    import_file_id TEXT NOT NULL,
    import_batch_id TEXT NOT NULL,
    sales_month TEXT NOT NULL,
    mtd_report_date TEXT NOT NULL,
    source_filename TEXT NOT NULL,
    store_code TEXT,
    store_name TEXT,
    product_code TEXT,
    product_name TEXT,
    sku TEXT,
    category TEXT,
    brand TEXT,
    sales_units REAL,
    sales_amount REAL,
    created_at TEXT,
    updated_at TEXT
);
```

------------------------------------------------------------------------

# 10. Database Indexes

Create indexes for common queries.

``` sql
CREATE INDEX idx_sales_mtd_month
ON sales_mtd_data(sales_month);

CREATE INDEX idx_sales_mtd_report_date
ON sales_mtd_data(mtd_report_date);

CREATE INDEX idx_sales_mtd_store
ON sales_mtd_data(store_code);

CREATE INDEX idx_sales_mtd_product
ON sales_mtd_data(product_code);

CREATE INDEX idx_sales_mtd_source_file
ON sales_mtd_data(source_filename);
```

------------------------------------------------------------------------

# 11. Unique Business Key

The unique business key must include the MTD report date.

Recommended:

``` text
sales_month
+
mtd_report_date
+
store_code
+
product_code
+
sku
```

This allows:

``` text
June 21 + P001
June 25 + P001
June 30 + P001
```

to be separate records.

Do not use only:

``` text
sales_month + product_code
```

because that would incorrectly overwrite previous snapshots.

------------------------------------------------------------------------

# 12. Cloudflare R2 Storage

Store the original uploaded MTD files in Cloudflare R2.

Bucket:

``` text
sales-mtd-files
```

Recommended object key:

``` text
sales-mtd/
  2026/
    2026-06/
      20260621/
        original-file.xls
```

Store:

``` text
r2_object_key
```

in the `import_files` table.

The original file must be preserved for:

-   Audit
-   Reprocessing
-   Verification
-   Download
-   Troubleshooting

------------------------------------------------------------------------

# 13. File Processing

For each uploaded file:

1.  Receive file
2.  Calculate SHA-256 hash
3.  Check whether hash already exists
4.  Extract report date from filename
5.  Validate report month
6.  Read XLS, XLSX, or CSV
7.  Detect worksheet
8.  Detect header row
9.  Detect monthly columns
10. Unpivot monthly columns
11. Filter selected Sales Month
12. Add report date
13. Add source filename
14. Add file ID
15. Insert into D1
16. Store original file in R2

------------------------------------------------------------------------

# 14. Unpivot Process

Original:

  Product     Jan-26   Feb-26   Mar-26   Jun-26
  --------- -------- -------- -------- --------
  P001           100      120      150      250

After UNPIVOT:

  Product   Sales Month     Value
  --------- ------------- -------
  P001      2026-01           100
  P001      2026-02           120
  P001      2026-03           150
  P001      2026-06           250

If the user selected:

``` text
June 2026
```

Keep only:

  Product   Sales Month     Value
  --------- ------------- -------
  P001      2026-06           250

Then add:

-   mtd_report_date
-   source_filename
-   import_file_id
-   import_batch_id

------------------------------------------------------------------------

# 15. Landing Page

URL:

``` text
/
```

The Landing Page must contain:

## Select Sales Month

``` text
[ June 2026 ▼ ]
```

## Month Status

``` text
MTD Snapshots:
3

Latest MTD:
June 30, 2026

Latest File:
Sales MTD 20260630.xls
```

## File Upload Module

``` text
[ Drag and Drop Files ]

[ Select Files ]
```

## Snapshot History

  MTD Date   Filename         Records Status
  ---------- -------------- --------- ----------
  Jun 21     20260621.xls       5,000 Complete
  Jun 25     20260625.xls       5,000 Complete
  Jun 30     20260630.xls       5,000 Complete

------------------------------------------------------------------------

# 16. Admin Page

URL:

``` text
/admin
```

Only ADMIN users may access this page.

Admin features:

-   Manage users
-   Add user
-   Delete user
-   Activate user
-   Deactivate user
-   Change user role
-   View all sales data
-   Delete sales data
-   Manage MTD snapshots
-   Delete MTD snapshots
-   Reprocess files
-   View import batches
-   View errors
-   View audit logs
-   Manage system settings

------------------------------------------------------------------------

# 17. Admin User Management

URL:

``` text
/admin/users
```

Display:

-   Full Name
-   Email
-   Role
-   Status
-   Created Date
-   Last Login

Actions:

-   Add User
-   Edit User
-   Change Role
-   Activate
-   Deactivate
-   Delete

## Roles

### ADMIN

Full system access.

### MANAGER

Can:

-   Upload files
-   View data
-   View dashboard
-   Compare snapshots
-   Export data

Cannot:

-   Manage users
-   Delete all system data

### VIEWER

Can:

-   View dashboards
-   View reports

Cannot:

-   Upload files
-   Delete data

------------------------------------------------------------------------

# 18. Authentication

Preferred architecture:

Cloudflare Access handles user authentication.

The application uses the authenticated email address to identify the
user.

The `users` table stores:

-   email
-   full_name
-   role
-   is_active

The Worker must verify the authenticated identity before allowing
access.

Do not trust only frontend role checks.

Every sensitive API endpoint must verify authorization server-side.

------------------------------------------------------------------------

# 19. Admin Data Management

Create:

``` text
/admin/sales-data
```

Features:

-   Search
-   Filter
-   Sort
-   Pagination
-   Export

Filters:

-   Sales Month
-   MTD Report Date
-   Store
-   Product
-   SKU
-   Category
-   Source Filename

Actions:

-   View
-   Edit
-   Delete

All destructive actions require confirmation.

------------------------------------------------------------------------

# 20. Snapshot Management

Create:

``` text
/admin/snapshots
```

Display:

  Sales Month   MTD Date   File             Records Status
  ------------- ---------- -------------- --------- ----------
  2026-06       Jun 21     20260621.xls       5,000 Complete
  2026-06       Jun 25     20260625.xls       5,000 Complete
  2026-06       Jun 30     20260630.xls       5,000 Complete

Actions:

-   View Snapshot
-   Compare
-   Reprocess
-   Delete

Deleting one snapshot must not affect other snapshots.

Example:

Delete June 25.

Keep:

-   June 21
-   June 30

------------------------------------------------------------------------

# 21. Audit Log

Create:

``` sql
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    description TEXT,
    created_at TEXT
);
```

Log:

-   User Created
-   User Deleted
-   User Deactivated
-   Role Changed
-   File Uploaded
-   File Imported
-   Snapshot Deleted
-   Sales Data Deleted
-   Sales Data Edited

------------------------------------------------------------------------

# 22. Cloudflare Security

Use:

-   Cloudflare Access
-   HTTPS
-   Workers authentication checks
-   D1 database access through backend API
-   R2 private bucket
-   Signed download URLs where appropriate
-   Environment secrets through Cloudflare Secrets

Never expose:

-   Private R2 credentials
-   API tokens
-   Encryption keys

Never commit secrets to GitHub.

------------------------------------------------------------------------

# 23. Cloudflare Deployment

The application must be deployable using:

``` text
GitHub
    ↓
Cloudflare Pages / Workers
    ↓
D1 + R2
```

Create:

``` text
wrangler.toml
```

Create:

``` text
migrations/
  0001_initial_schema.sql
  0002_add_audit_logs.sql
```

Use Cloudflare D1 migrations.

------------------------------------------------------------------------

# 24. Recommended Project Structure

``` text
sales-mtd-app/
│
├── app/
│   ├── login/
│   ├── dashboard/
│   ├── admin/
│   │   ├── users/
│   │   ├── sales-data/
│   │   ├── snapshots/
│   │   ├── import-batches/
│   │   └── audit-logs/
│   │
│   └── page.tsx
│
├── components/
│   ├── sales-month-selector/
│   ├── file-upload/
│   ├── file-preview/
│   ├── snapshot-history/
│   ├── dashboard/
│   └── admin/
│
├── workers/
│   ├── api/
│   ├── auth/
│   ├── import/
│   └── admin/
│
├── lib/
│   ├── file-parser/
│   ├── unpivot/
│   ├── validation/
│   ├── duplicate-detection/
│   └── date-detector/
│
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_add_audit_logs.sql
│
├── tests/
│   ├── unpivot.test.ts
│   ├── date-detector.test.ts
│   ├── duplicate-detection.test.ts
│   └── import.test.ts
│
├── wrangler.toml
├── package.json
├── tsconfig.json
└── README.md
```

------------------------------------------------------------------------

# 25. Development Phases

## PHASE 1

Create GitHub repository.

## PHASE 2

Create Cloudflare project.

## PHASE 3

Create D1 database.

## PHASE 4

Create R2 bucket.

## PHASE 5

Create database migrations.

## PHASE 6

Create Cloudflare authentication.

## PHASE 7

Create user roles.

## PHASE 8

Create Landing Page.

## PHASE 9

Create Sales Month selector.

## PHASE 10

Create MTD file upload.

## PHASE 11

Create XLS/XLSX/CSV parser.

## PHASE 12

Create dynamic month-column detection.

## PHASE 13

Create UNPIVOT engine.

## PHASE 14

Create selected-month filtering.

## PHASE 15

Create MTD snapshot append logic.

## PHASE 16

Create duplicate file detection.

## PHASE 17

Create dashboard.

## PHASE 18

Create Admin user management.

## PHASE 19

Create Admin data management.

## PHASE 20

Create audit logs.

## PHASE 21

Deploy to Cloudflare.

After each phase:

1.  Run tests
2.  Check database
3.  Check permissions
4.  Test with sample MTD files
5.  Commit changes to GitHub
6.  Continue only after the current phase works

------------------------------------------------------------------------

# 26. Final Architecture Principle

Use Cloudflare as the complete platform:

  Requirement      Technology
  ---------------- --------------------
  AI Development   Google Antigravity
  Source Code      GitHub
  Frontend         Cloudflare Pages
  Backend API      Cloudflare Workers
  Database         Cloudflare D1
  File Storage     Cloudflare R2
  Authentication   Cloudflare Access
  DNS              Cloudflare DNS

No Supabase is required.

The application must be simple for normal users and powerful for
administrators.

## Normal User

``` text
SELECT MONTH
    ↓
UPLOAD MTD FILE
    ↓
VALIDATE
    ↓
IMPORT
    ↓
VIEW DASHBOARD
```

## Administrator

``` text
MANAGE USERS
    +
MANAGE ALL DATA
    +
MANAGE MTD SNAPSHOTS
    +
MANAGE FILES
    +
VIEW AUDIT LOGS
    +
MANAGE SYSTEM
```

The most important data principle is:

> Every MTD file is an independent historical snapshot.

Example:

``` text
June 2026

├── June 21 Snapshot
│   └── 20260621.xls
│
├── June 25 Snapshot
│   └── 20260625.xls
│
└── June 30 Snapshot
    └── 20260630.xls
```

Never automatically overwrite a previous MTD snapshot unless the
administrator explicitly chooses to replace it.
