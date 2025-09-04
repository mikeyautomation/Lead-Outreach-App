-- Enable RLS on existing tables and create policies for user data isolation

-- Leads table policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_own_leads_select" ON leads;
DROP POLICY IF EXISTS "users_own_leads_insert" ON leads;
DROP POLICY IF EXISTS "users_own_leads_update" ON leads;
DROP POLICY IF EXISTS "users_own_leads_delete" ON leads;

-- Create RLS policies for leads
CREATE POLICY "users_own_leads_select" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_leads_insert" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_leads_update" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_own_leads_delete" ON leads FOR DELETE USING (auth.uid() = user_id);

-- Campaigns table policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_own_campaigns_select" ON campaigns;
DROP POLICY IF EXISTS "users_own_campaigns_insert" ON campaigns;
DROP POLICY IF EXISTS "users_own_campaigns_update" ON campaigns;
DROP POLICY IF EXISTS "users_own_campaigns_delete" ON campaigns;

-- Add user_id column to campaigns if it doesn't exist
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create RLS policies for campaigns
CREATE POLICY "users_own_campaigns_select" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_own_campaigns_insert" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_own_campaigns_update" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_own_campaigns_delete" ON campaigns FOR DELETE USING (auth.uid() = user_id);

-- Campaign leads table policies
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_own_campaign_leads_select" ON campaign_leads;
DROP POLICY IF EXISTS "users_own_campaign_leads_insert" ON campaign_leads;
DROP POLICY IF EXISTS "users_own_campaign_leads_update" ON campaign_leads;
DROP POLICY IF EXISTS "users_own_campaign_leads_delete" ON campaign_leads;

-- Create RLS policies for campaign_leads (through leads table)
CREATE POLICY "users_own_campaign_leads_select" ON campaign_leads FOR SELECT 
USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = campaign_leads.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "users_own_campaign_leads_insert" ON campaign_leads FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM leads WHERE leads.id = campaign_leads.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "users_own_campaign_leads_update" ON campaign_leads FOR UPDATE 
USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = campaign_leads.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "users_own_campaign_leads_delete" ON campaign_leads FOR DELETE 
USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = campaign_leads.lead_id AND leads.user_id = auth.uid()));

-- Email tracking table policies
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_own_email_tracking_select" ON email_tracking;
DROP POLICY IF EXISTS "users_own_email_tracking_insert" ON email_tracking;
DROP POLICY IF EXISTS "users_own_email_tracking_update" ON email_tracking;
DROP POLICY IF EXISTS "users_own_email_tracking_delete" ON email_tracking;

-- Create RLS policies for email_tracking (through leads table)
CREATE POLICY "users_own_email_tracking_select" ON email_tracking FOR SELECT 
USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = email_tracking.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "users_own_email_tracking_insert" ON email_tracking FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM leads WHERE leads.id = email_tracking.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "users_own_email_tracking_update" ON email_tracking FOR UPDATE 
USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = email_tracking.lead_id AND leads.user_id = auth.uid()));

CREATE POLICY "users_own_email_tracking_delete" ON email_tracking FOR DELETE 
USING (EXISTS (SELECT 1 FROM leads WHERE leads.id = email_tracking.lead_id AND leads.user_id = auth.uid()));
