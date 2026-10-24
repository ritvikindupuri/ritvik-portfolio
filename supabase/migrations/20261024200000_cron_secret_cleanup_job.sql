-- Re-schedule the cleanup-expired-blocks job so it sends the x-cron-secret header
-- required by the edge function. Requires a Vault secret named 'cron_secret'
-- whose value equals the CRON_SECRET edge-function secret.
SELECT cron.unschedule('cleanup-expired-blocks-daily');

SELECT cron.schedule(
  'cleanup-expired-blocks-daily',
  '0 0 * * *',
  $$
  SELECT extensions.http((
    'POST',
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/cleanup-expired-blocks',
    ARRAY[
      extensions.http_header('Content-Type', 'application/json'),
      extensions.http_header('Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')),
      extensions.http_header('x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret'))
    ],
    'application/json',
    '{}'
  )::extensions.http_request);
  $$
);
