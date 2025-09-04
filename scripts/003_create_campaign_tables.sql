-- Create campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_content TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  total_leads INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  follow_up_sequence JSONB,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign_leads junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'opened', 'replied', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  tracking_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, lead_id)
);

-- Create email_tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_lead_id UUID REFERENCES campaign_leads(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'opened', 'clicked', 'replied', 'bounced')),
  event_data JSONB,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaigns
CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for campaign_leads
CREATE POLICY "Users can view campaign leads for their campaigns" ON campaign_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create campaign leads for their campaigns" ON campaign_leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update campaign leads for their campaigns" ON campaign_leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = campaign_leads.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create RLS policies for email_tracking
CREATE POLICY "Users can view email tracking for their campaigns" ON email_tracking
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaign_leads cl
      JOIN campaigns c ON c.id = cl.campaign_id
      WHERE cl.id = email_tracking.campaign_lead_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create email tracking for their campaigns" ON email_tracking
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaign_leads cl
      JOIN campaigns c ON c.id = cl.campaign_id
      WHERE cl.id = email_tracking.campaign_lead_id 
      AND c.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_id ON campaign_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_tracking_id ON campaign_leads(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign_lead_id ON email_tracking(campaign_lead_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_event_type ON email_tracking(event_type);
