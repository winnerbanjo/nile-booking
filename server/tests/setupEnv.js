// Test-only values. Production has no fallback and validates its own secrets.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-only-jwt-secret-that-is-at-least-32-characters';
process.env.ADMIN_MASTER_KEY =
  process.env.ADMIN_MASTER_KEY || 'test-only-admin-master-key-1234567890';
process.env.CRON_SECRET = process.env.CRON_SECRET || 'test-only-cron-secret-1234567890';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'https://test.nilebooking.local';
delete process.env.MAILTRAP_TOKEN;
