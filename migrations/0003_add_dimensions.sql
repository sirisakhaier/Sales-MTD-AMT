-- 0003_add_dimensions.sql

CREATE TABLE IF NOT EXISTS dim_stores (
    store_id_cust TEXT PRIMARY KEY,
    index_store TEXT,
    customer TEXT,
    store_name_cust TEXT,
    customer_name TEXT,
    store_id TEXT,
    store_name TEXT,
    province TEXT,
    store_type TEXT,
    region TEXT,
    channel TEXT,
    latitude REAL,
    longitude REAL,
    store_size TEXT,
    hub_store TEXT,
    top_store TEXT,
    store_rank TEXT,
    remark TEXT
);

CREATE TABLE IF NOT EXISTS dim_models (
    sku_no TEXT PRIMARY KEY,
    index_model TEXT,
    customer TEXT,
    barcode TEXT,
    sku_name TEXT,
    model TEXT,
    sku_type TEXT,
    use_sellout TEXT,
    use_stock TEXT,
    chk_cat TEXT,
    chk_sub_cat TEXT,
    size TEXT,
    remark TEXT
);

-- Add dimension columns to sales_mtd_data table if not present
ALTER TABLE sales_mtd_data ADD COLUMN province TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN region TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN store_type TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN channel TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN store_size TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN top_store TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN model TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN sku_name TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN chk_cat TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN chk_sub_cat TEXT;
ALTER TABLE sales_mtd_data ADD COLUMN size TEXT;
