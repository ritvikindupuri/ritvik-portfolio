-- Schedule the cleanup job to run daily at midnight UTC
-- This calls the cleanup-expired-blocks edge function
SELECT cron.schedule(
  'cleanup-expired-blocks-daily',
  '0 0 * * *',
  $$
  SELECT extensions.http((
    'POST',
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/cleanup-expired-blocks',
    ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key'))
    ],
    'application/json',
    '{}'
  )::extensions.http_request);
  $$
);