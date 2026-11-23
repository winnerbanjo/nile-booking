# Security deployment checklist

This checklist is a merge/deploy gate. It does not authorize a deploy, a
migration, or a change to production data.

## Environment secret status

No Vercel CLI session, project link, or dashboard credentials are available in
this workspace. The table below records what could be verified locally. It must
not be treated as confirmation that a secret is absent.

| Environment | `JWT_SECRET` | `ADMIN_MASTER_KEY` | Verification |
| --- | --- | --- | --- |
| Vercel Production — API (`api.nilebooking.co`) | **Unverified** | **Unverified** | No Vercel access or local project link |
| Vercel Preview — API (all preview deployments) | **Unverified** | **Unverified** | No Vercel access or local project link |
| Vercel Production — client (`app.nilebooking.co`) | Not required by the client | Not required by the client | Client source inspected |
| Vercel Preview — client | Not required by the client | Not required by the client | Client source inspected |

Before merging or deploying:

- [ ] Confirm `JWT_SECRET` exists in **both** Production and Preview and is at least 32 characters.
- [ ] Confirm `ADMIN_MASTER_KEY` exists in **both** Production and Preview and is at least 24 characters.
- [ ] Treat any value that ever matched a previously published fallback or appeared in committed source as compromised and rotate it.
- [ ] Review git history for any committed secret, not just the current tree; this change removes one hard-coded value from a manual test script.
- [ ] Confirm Preview does not point at the production MongoDB database.
- [ ] Confirm `CORS_ORIGINS` lists exact production and preview origins; no wildcards.
- [ ] Confirm `CLIENT_URL` is the customer-facing app URL used in links.
- [ ] Confirm `CRON_SECRET` exists in Production and is not exposed to the client.
- [ ] Confirm `PURGE_DEMO_DATA` and `ENABLE_DEMO_SEEDING` are absent or `false`.
- [ ] Confirm the API has `NODE_ENV=production` so missing secrets fail closed.
- [ ] Do not deploy until the prerequisite security PRs are merged.

The API now refuses to start when `JWT_SECRET` or `ADMIN_MASTER_KEY` is missing or
too short. A preview deployment with incomplete variables will fail closed
rather than mint tokens with a public fallback.

## Vercel Cron

`server/vercel.json` schedules:

- `/api/availability/sweep` every 5 minutes.
- `/api/notifications/reminders/check` every 10 minutes.

Vercel Cron invokes production deployments with a GET request and
`Authorization: Bearer <CRON_SECRET>`. Both endpoints fail closed when the header
is missing or wrong. Confirm the project's `CRON_SECRET` is set before relying on
the schedules. Preview deployments are not scheduled by Vercel Cron.

## Public booking token backfill

**Not executed.** Do not run this against production or preview as part of this
change.

Existing bookings created before this branch have no `publicToken`. New bookings
receive a 32-byte random token automatically. The token is unique, sparse, and
excluded from normal queries. It cannot be guessed from the booking number.

1. Merge and deploy the code only after the secret checks above.
2. Confirm the sparse unique index on `publicToken` exists in the target
   database. Index creation is a schema operation; review it separately if the
   deployment does not build indexes automatically.
3. Print the plan without connecting to a database:

   ```bash
   cd server
   npm run tokens:plan
   ```

4. Run a read-only count against the intended database during an approved
   maintenance window:

   ```bash
   cd server
   npm run tokens:dry-run
   ```

5. Review the total, existing, and missing counts. Stop if missing is zero or
   unexpectedly large.
6. Take a database backup or verified snapshot.
7. Only after approval, apply with both an explicit flag and confirmation:

   ```bash
   cd server
   CONFIRM_TOKEN_BACKFILL=YES npm run tokens:backfill
   ```

The apply step updates only records where `publicToken` is missing, `null`, or an
empty string. It never overwrites a token and can be resumed. Generating a token
does not notify a customer; send links only through an approved support process,
and never paste tokens into PR text, logs, or issue trackers.

## Rollback notes

- Rolling back the API removes the public portal endpoints. Existing tokens stay
  in the database but become unusable until the new code is restored.
- Rolling back the schema index is not required for application rollback.
- Never restore a demo purge or demo seeding default in production.
