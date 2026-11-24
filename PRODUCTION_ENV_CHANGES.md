# Production environment updates

Add these in the production backend environment (Vercel Project Settings → Environment Variables). These are variable names and safe placeholders only—generate and enter the actual secret values directly in Vercel. Do not commit production secrets to this repository.

## Required for production

```dotenv
# Required; at least 32 characters. Use a fresh, random value.
JWT_SECRET=<random-secret-at-least-32-characters>

# Newly required by the admin login; at least 24 characters.
ADMIN_MASTER_KEY=<random-admin-key-at-least-24-characters>

# Newly required for protected scheduled jobs. Use a fresh random secret.
CRON_SECRET=<random-cron-secret>

# Newly required for browser API access. Comma-separated exact frontend origins.
# Replace these with the real deployed frontend origins; do not use wildcards.
CORS_ORIGINS=https://app.nilebooking.co,https://nilebooking.co

# Recommended for generated booking links and reminder emails.
CLIENT_URL=https://app.nilebooking.co
```

`JWT_SECRET` already existed, but the branch now rejects missing or short values instead of using a fallback. If the current value is shorter than 32 characters or was ever a known/public fallback, replace it with a new random value. Changing it invalidates existing login tokens. `ADMIN_MASTER_KEY` is newly mandatory and must be at least 24 characters. Changing it invalidates admin portal access.

`CRON_SECRET` protects the Vercel scheduled endpoints (`/api/availability/sweep`, `/api/notifications/reminders/check`, and `/api/domains/cron/maintenance`). Set it in the same Vercel project/environment as the deployed backend so Vercel Cron can send it as a Bearer token. Without it, cron-protected routes fail closed.

`CORS_ORIGINS` must contain every actual browser-facing frontend origin, comma-separated, without trailing slashes. Include both app and public-site origins only if both call the API from the browser. Incorrect or missing origins cause browser API calls to be rejected by CORS.

## Required only if the corresponding payment gateway is enabled

```dotenv
# Required when initializing Paystack transactions
PAYSTACK_CALLBACK_URL=https://app.nilebooking.co/checkout/callback

# Required when initializing Flutterwave transactions
FLUTTERWAVE_CALLBACK_URL=https://app.nilebooking.co/checkout/callback
```

Use the actual deployed checkout callback URL for each enabled gateway. Payment initialization now fails rather than silently redirecting to localhost when its callback URL is missing.

## Required for Premium custom domains

```dotenv
DOMAINS_ENABLED=true
NAMECHEAP_ENV=production
NAMECHEAP_API_USER=<namecheap-api-user>
NAMECHEAP_API_KEY=<namecheap-api-key>
# The static egress IP registered in Namecheap's API allowlist
NAMECHEAP_CLIENT_IP=<static-egress-ipv4>

# Used only when NAMECHEAP_ENV=sandbox
NAMECHEAP_SANDBOX_API_USER=<sandbox-api-user>
NAMECHEAP_SANDBOX_API_KEY=<sandbox-api-key>
NAMECHEAP_SANDBOX_CLIENT_IP=<sandbox-egress-ipv4>

# Vercel project that serves the client storefront (not the API project)
VERCEL_TOKEN=<vercel-token-scoped-to-project>
VERCEL_PROJECT_ID=<client-project-id>
VERCEL_TEAM_ID=<team-id-if-applicable>

# At least 32 random characters. Encrypts merchant registrant contact data.
DOMAIN_CONTACT_ENCRYPTION_KEY=<random-domain-contact-key>

# Renewal checkout returns here; Paystack appends ?reference=...
DOMAIN_RENEWAL_CALLBACK_URL=https://app.nilebooking.co/dashboard/domains

DOMAIN_DISPLAY_MARKUP=1.30
DOMAIN_CHECKOUT_MARKUP=0.20
DOMAIN_CHECKOUT_MARKUP_CAP_NGN=2000
DOMAIN_FX_FALLBACK=1650
DOMAIN_APEX_IP=76.76.21.21
DOMAIN_WWW_CNAME=cname.vercel-dns.com
```

Namecheap production API access requires account eligibility and a static, allowlisted egress IPv4. Vercel serverless functions use dynamic egress unless Static IPs are enabled; if the API project cannot provide a stable IP, run the registrar calls through a small static-IP proxy or use Namecheap's sandbox while validating. Do not point `NAMECHEAP_CLIENT_IP` at a dynamically discovered address.

`DOMAIN_CONTACT_ENCRYPTION_KEY` must not be rotated casually: existing encrypted registrant records cannot be decrypted with a new key. Plan a re-encryption migration if it must change.

`VERCEL_TOKEN` should be scoped to the client project, not the whole account. `VERCEL_PROJECT_ID` must be the project that serves `nilebooking.co`/merchant storefronts, not the API project.

Merchant custom domains are authorised automatically once their `CustomDomain` record is `ACTIVE`; they do not need to be added to `CORS_ORIGINS` one by one.

## Optional settings (defaults shown)

These can be omitted if the defaults are suitable:

```dotenv
HOLD_MINUTES=30
CASH_HOLD_HOURS=24
DEPOSIT_PERCENT=50
HOLD_REMINDER_LEAD_MINUTES=15
APPOINTMENT_REMINDER_LEAD_MINUTES=1440
JSON_BODY_LIMIT=1mb
URLENCODED_BODY_LIMIT=1mb
RECEIPT_BODY_LIMIT=7mb
RECEIPT_MAX_BYTES=5242880
MAILTRAP_TIMEOUT_MS=10000
CLOUDINARY_UPLOAD_TIMEOUT_MS=20000
ENABLE_IN_PROCESS_CRON=false
```

Vercel Cron is configured in `server/vercel.json`, so leave `ENABLE_IN_PROCESS_CRON=false` on Vercel. It is only for explicitly opted-in, long-lived non-serverless hosts.

Ensure these demo safety flags are unset or explicitly false in production; startup refuses to run if either is true:

```dotenv
PURGE_DEMO_DATA=false
ENABLE_DEMO_SEEDING=false
```

## Deployment check

1. Add/verify the variables above in the production backend environment before deploying this branch.
2. Confirm `JWT_SECRET` is at least 32 characters and `ADMIN_MASTER_KEY` at least 24 characters; use fresh random secrets, not the placeholders in this file.
3. Verify `CORS_ORIGINS` matches the real frontend origins exactly.
4. Set `CRON_SECRET` so the configured Vercel Cron routes can authenticate.
5. Set callback URLs for every enabled payment gateway.
6. Verify the demo safety flags are not `true`.
