# Guardora backend

Express and Socket.IO API for the Guardora web administration dashboard.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Configure MongoDB, JWT, CORS, mail, AI moderation, and deferred payment values
through `.env`. Never commit that file.

`AUTH_BYPASS=true` supplies a local administrator identity while login is
temporarily disabled. It must remain `false` outside local development.

The server mounts only the web/admin route set. Resident/mobile-only modules
are stored in `../mobile_deferred`.
