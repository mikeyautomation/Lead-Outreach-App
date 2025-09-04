-- Add sender_email column to email_tracking table to track which Gmail Workspace account sent each email
ALTER TABLE email_tracking ADD COLUMN sender_email TEXT;

-- Add index for better performance when sorting by sender email
CREATE INDEX idx_email_tracking_sender_email ON email_tracking(sender_email);

-- Update existing records to have a default sender email (optional)
-- UPDATE email_tracking SET sender_email = 'unknown@domain.com' WHERE sender_email IS NULL;
