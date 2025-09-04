-- Create email_tracking table for tracking email sends, opens, clicks, replies
CREATE TABLE IF NOT EXISTS email_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL DEFAULT 'initial', -- 'initial', 'follow_up_1', 'follow_up_2', etc.
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced'
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounce_reason TEXT,
  tracking_pixel_id UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_tracking_campaign_id ON email_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_lead_id ON email_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_status ON email_tracking(status);
CREATE INDEX IF NOT EXISTS idx_email_tracking_pixel_id ON email_tracking(tracking_pixel_id);

-- Enable RLS
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own email tracking" ON email_tracking
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own email tracking" ON email_tracking
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own email tracking" ON email_tracking
  FOR UPDATE USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_email_tracking_updated_at
  BEFORE UPDATE ON email_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_email_tracking_updated_at();
