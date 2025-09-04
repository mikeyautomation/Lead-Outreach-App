-- Create link_tracking table for detailed link analytics
CREATE TABLE IF NOT EXISTS link_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_id UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_link_tracking_tracking_id ON link_tracking(tracking_id);
CREATE INDEX IF NOT EXISTS idx_link_tracking_campaign_id ON link_tracking(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_tracking_clicked_at ON link_tracking(clicked_at);

-- Enable RLS
ALTER TABLE link_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own link tracking data" ON link_tracking
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own link tracking data" ON link_tracking
  FOR INSERT WITH CHECK (
    campaign_id IN (
      SELECT id FROM campaigns WHERE user_id = auth.uid()
    )
  );

-- Create function to increment campaign click count
CREATE OR REPLACE FUNCTION increment_campaign_clicks(campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns 
  SET clicked_count = COALESCE(clicked_count, 0) + 1,
      updated_at = NOW()
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION increment_campaign_clicks(UUID) TO authenticated;
