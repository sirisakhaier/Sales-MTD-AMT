# Sales MTD Data Management System

A production-ready internal web application for managing Sales Month-to-Date (MTD) historical snapshot data built on **Cloudflare Infrastructure** (Cloudflare Pages, Workers, Cloudflare D1, Cloudflare R2, and Cloudflare Access).

---

## 🌟 Key Features

1. **Wide-Format Report Unpivoting Engine**:
   - Accepts XLS, XLSX, and CSV wide-format monthly report files.
   - Automatically detects report metadata and table headers (e.g. Row 13).
   - Extracts `mtd_report_date` from filenames (e.g., `Sales MTD 20260621.xls` -> `2026-06-21`).
   - Unpivots wide monthly columns into rows and filters strictly for the user-selected Sales Month.

2. **Historical MTD Snapshot Isolation**:
   - Every uploaded MTD file is preserved as an independent historical snapshot.
   - Unique key: `sales_month` + `mtd_report_date` + `store_code` + `product_code` + `sku`.
   - Deleting one snapshot date (e.g., June 25) does not alter or overwrite other dates (June 21 or June 30).

3. **Cloudflare Security & Deduplication**:
   - SHA-256 file hashing prevents accidental duplicate uploads.
   - Preserves original files in Cloudflare R2 object storage (`sales-mtd/YYYY/YYYY-MM/YYYYMMDD/filename`).
   - Integrates with Cloudflare Access (`CF-Access-Authenticated-User-Email`) for authentication.

4. **Analytics & Performance Dashboard**:
   - Interactive Recharts visualizing cumulative revenue growth across MTD snapshot dates.
   - Store performance rankings, top product items, and category breakdown.

5. **Complete Admin Suite**:
   - **User Management** (`/admin/users`): Manage system access roles (`ADMIN`, `MANAGER`, `VIEWER`).
   - **Sales Data Explorer** (`/admin/sales-data`): Search, filter, paginate, edit, delete raw records, and export CSV.
   - **Snapshot Management** (`/admin/snapshots`): Manage, inspect, or delete individual snapshot datasets.
   - **Audit Logs** (`/admin/audit-logs`): Full audit log history.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend / Workers**: Cloudflare Workers / Next.js Server API endpoints.
- **Database**: Cloudflare D1 (SQLite compatible) with indexing on `sales_month`, `mtd_report_date`, `store_code`, `product_code`, `source_filename`.
- **File Storage**: Cloudflare R2.
- **Auth**: Cloudflare Access.

---

## 🚀 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Local Dev Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Production Build**:
   ```bash
   npm run build
   ```

---

## ☁️ Deploying to Cloudflare

1. **Initialize D1 Database**:
   ```bash
   npx wrangler d1 create sales-mtd-db
   ```

2. **Apply Database Migrations**:
   ```bash
   npx wrangler d1 migrations apply sales-mtd-db --remote
   ```

3. **Create R2 Storage Bucket**:
   ```bash
   npx wrangler r2 bucket create sales-mtd-files
   ```

4. **Deploy Application to Cloudflare Pages**:
   ```bash
   npx wrangler pages deploy .next/out
   ```
