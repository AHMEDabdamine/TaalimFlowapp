-- Create financial_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS financial_entries (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id),
    type TEXT NOT NULL CHECK (type IN ('gain', 'loss')),
    amount DECIMAL(10, 2) NOT NULL,
    remarks TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_entries_school_id ON financial_entries(school_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_date ON financial_entries(year, month);
CREATE INDEX IF NOT EXISTS idx_financial_entries_type ON financial_entries(type);