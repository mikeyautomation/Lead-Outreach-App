-- Add external_id column to campaigns table to store Smartlead campaign ID
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add external_id column to email_tracking table if not exists
ALTER TABLE email_tracking ADD COLUMN IF NOT EXISTS external_id TEXT;
