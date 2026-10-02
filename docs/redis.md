# Redis in QaytarMe

Set `REDIS_URL` in **backend/.env** and **realtime/.env**. Both services must use the same Redis and `REDIS_PREFIX` (default: `qaytarme`). Never put the Redis URL in frontend/public variables.

- Local development: use Railway's `REDIS_PUBLIC_URL`, including its proxy port.
- Railway deployment: use the Redis service's private `REDIS_URL` reference.
- Without a URL, the application uses the previous single-server chat, direct Telegram processing and in-memory geocoding cache.
- When a URL is configured, Redis failures surface as service errors rather than bypassing shared limits.

## Chat

Socket.IO publishes room events through `@socket.io/redis-adapter`. Chat history remains in MongoDB's `lostfound` database. Multiple chat instances must also share `SOCKET_JWT_SECRET`. If HTTP polling is used across multiple instances, configure sticky sessions at the load balancer; WebSocket connections do not require polling affinity. See [Socket.IO Redis adapter](https://socket.io/docs/v4/redis-adapter/).

## Telegram

BullMQ queue `telegram-analysis` stores channel/message references. A worker re-fetches posts through the existing Telegram client and runs the AI, Geoapify and listing-save pipeline. Job IDs are hashed channel/message IDs; MongoDB import keys remain the final protection against duplicate listings. Global concurrency is one. Failed jobs retry up to four attempts with exponential backoff. Completed jobs are retained for at most one day/1,000 entries, failed jobs for seven days/1,000 entries.

Keep one Telegram ingestion deployment for the current Telegram session. Redis distributes jobs; it does not make using the same Telegram session in several deployments safe. Redis must use persistent storage and `noeviction` for durable queues. See [BullMQ production guidance](https://docs.bullmq.io/guide/going-to-production).

## Geoapify

Query results are cached in Redis for 24 hours. Keys hash the query and API-key identity; credentials are never stored in key names. Redis Lua atomically enforces the existing 2,800-request daily ceiling and 250ms interval across backend instances. Redis server time determines the UTC quota day. Cached responses do not consume the external request quota.

Restart each server after changing its environment. A configured Redis outage requires restoring Redis before distributed processing resumes. Existing announcements are not bulk re-imported when enabling Redis.
