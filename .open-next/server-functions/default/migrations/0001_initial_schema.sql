-- 0001_initial_schema.sql

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT,
    full_name TEXT,
    role TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sales_months (
    id TEXT PRIMARY KEY,
    sales_month TEXT NOT NULL UNIQUE,
    month_name TEXT,
    year INTEGER,
    status TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS import_batches (
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

CREATE TABLE IF NOT EXISTS import_files (
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

CREATE TABLE IF NOT EXISTS sales_mtd_data (
    id TEXT PRIMARY KEY,
    sales_month_id TEXT NOT NULL,
    import_file_id TEXT NOT NULL,
    import_batch_id TEXT NOT NULL,
    sales_month TEXT NOT NULL,
    mtd_report_date TEXT NOT NULL,
    source_filename TEXT NOT NULL,
    store_code TEXT,
    store_name TEXT,
    province TEXT,
    region TEXT,
    store_type TEXT,
    channel TEXT,
    store_size TEXT,
    top_store TEXT,
    product_code TEXT,
    product_name TEXT,
    model TEXT,
    sku_name TEXT,
    chk_cat TEXT,
    chk_sub_cat TEXT,
    size TEXT,
    sku TEXT,
    category TEXT,
    brand TEXT,
    sales_units REAL,
    sales_amount REAL,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sales_mtd_month ON sales_mtd_data(sales_month);
CREATE INDEX IF NOT EXISTS idx_sales_mtd_report_date ON sales_mtd_data(mtd_report_date);
CREATE INDEX IF NOT EXISTS idx_sales_mtd_store ON sales_mtd_data(store_code);
CREATE INDEX IF NOT EXISTS idx_sales_mtd_product ON sales_mtd_data(product_code);
CREATE INDEX IF NOT EXISTS idx_sales_mtd_source_file ON sales_mtd_data(source_filename);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_email TEXT,
    action TEXT,
    entity_type TEXT,
    entity_id TEXT,
    description TEXT,
    created_at TEXT
);
