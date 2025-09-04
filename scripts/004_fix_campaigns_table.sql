-- Add missing user_id column to campaigns table and set up proper constraints
ALTER TABLE campaigns ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Update RLS policies for campaigns table
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;

-- Create RLS policies for campaigns
CREATE POLICY "Users can view their own campaigns" ON campaigns
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own campaigns" ON campaigns
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own campaigns" ON campaigns
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own campaigns" ON campaigns
    FOR DELETE USING (user_id = auth.uid());

-- Set default values for existing campaigns (if any)
UPDATE campaigns SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;

-- Make user_id NOT NULL after setting defaults
ALTER TABLE campaigns ALTER COLUMN user_id SET NOT NULL;
