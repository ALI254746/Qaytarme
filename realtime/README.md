# QaytarMe realtime chat

The messages page uses this Socket.IO service and the `Conversation` /
`realtime_messages` collections. The Next.js app and this service must point to
the same MongoDB database and use the same `SOCKET_JWT_SECRET` (at least 32
characters). Keep the secret server-side; only `NEXT_PUBLIC_SOCKET_URL` belongs
in the browser-visible environment.

## Local setup

1. Copy the root `.env.example` to the Next.js app's `.env.local`. Set
   `MONGODB_URI` and a private `SOCKET_JWT_SECRET`.
2. Copy this directory's `.env.example` to `realtime/.env`. Use the same
   `MONGODB_URI` and `SOCKET_JWT_SECRET`, then set the allowed web origin.
3. From this directory run `npm install`, then `npm run dev`. The default socket
   port is `4001`; the existing NestJS API is not stopped or modified.

Build and run the standalone service with `npm run build` and `npm start`.
Configure the production `SOCKET_ALLOWED_ORIGIN` and the Next.js
`NEXT_PUBLIC_SOCKET_URL` to the deployed web and socket URLs.

## Legacy messages

The migration reads the existing `messages` collection and writes separate
conversation and realtime-message records. It does not delete or modify legacy
messages. A dry run is the default:

```sh
npm run migrate:legacy
```

After checking the counts and taking a database backup, run the migration
explicitly:

```sh
npm run migrate:legacy -- --apply
```

It is safe to rerun for already migrated legacy message IDs. Run it before
switching users to the new messages page so legacy chats are visible there.
