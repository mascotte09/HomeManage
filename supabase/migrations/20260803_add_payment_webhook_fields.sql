ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS invoices_payment_reference_idx ON invoices(payment_reference);
