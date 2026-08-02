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

CREATE TABLE IF NOT EXISTS dim_categories (
    chk_cat TEXT PRIMARY KEY,
    category_name TEXT,
    department TEXT,
    manager TEXT,
    remark TEXT
);
