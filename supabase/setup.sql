-- StockHub Database Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- Key-value store for app data
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (for team access)
-- For production, you'd scope this to specific users
CREATE POLICY "Allow all access" ON kv_store
  FOR ALL USING (true) WITH CHECK (true);

-- Also allow anon access for initial setup (can tighten later)
CREATE POLICY "Allow anon access" ON kv_store
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Function to auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kv_store_updated
  BEFORE UPDATE ON kv_store
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
