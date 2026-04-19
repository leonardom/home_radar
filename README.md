# Home Radar

Home Radar is composed of:

- scraper: collects property listings
- backend-api: syncs listings, computes matches, and sends notifications

For MVP, a job-driven schedule is acceptable and simple to operate.

## Dedicated Cron Service (Recommended for Production)

For a containerized deployment, use a dedicated scheduler service in Docker Compose.

Configured files:

- compose file: /Users/leomarcelino/Development/lab/home-radar/infra/docker/docker-compose.yml
- cron file: /Users/leomarcelino/Development/lab/home-radar/infra/docker/scheduler.crontab

This keeps scheduling in its own container lifecycle and avoids host-level crontab drift.

### Included schedules

The scheduler container currently runs:

- Incremental sync every 5 minutes
- Notification delivery every 1 minute
- Optional nightly backfill at 02:30

Current scheduler crontab:

```cron
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# Incremental sync every 5 minutes
*/5 * * * * node /app/dist/modules/properties/sync.cli.js incremental >> /proc/1/fd/1 2>> /proc/1/fd/2

# Notification sender every minute
* * * * * node /app/dist/modules/notifications/delivery.cli.js >> /proc/1/fd/1 2>> /proc/1/fd/2

# Optional nightly backfill at 02:30
30 2 * * * node /app/dist/modules/properties/sync.cli.js backfill >> /proc/1/fd/1 2>> /proc/1/fd/2
```

## Container notes

- Start all services (including scheduler):

```bash
docker compose -f /Users/leomarcelino/Development/lab/home-radar/infra/docker/docker-compose.yml up -d
```

- Check scheduler logs:

```bash
docker compose -f /Users/leomarcelino/Development/lab/home-radar/infra/docker/docker-compose.yml logs -f scheduler
```

- Keep required job environment variables in scheduler service config (for example: SCRAPER_DATABASE_URL, SENDGRID_API_KEY).

## Host crontab fallback (optional)

If you cannot run a scheduler container, host crontab remains a fallback option.

## Recommended MVP defaults

- sync: every 5 minutes
- notifications: every 1 minute
- backfill: nightly (optional)

This keeps operations simple while still giving near-real-time behavior for most users.
