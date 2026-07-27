# Guardora

Guardora is a web-first residential safety and administration platform. This
repository combines the original backend and web projects, adds an MVVM web
layer, and includes a reproducible computer-vision model pack.

## Repository layout

- `fyp_backend/` — Express, MongoDB, and Socket.IO API for the web dashboard.
- `fyp_web/` — Next.js dashboard using models, view-models, and views.
- `ai_models/` — pinned AI weights, model cards, checksums, and verification
  tools.
- `mobile_deferred/` — mobile-only backend code retained for a later phase and
  not mounted by the active API.

See `ARCHITECTURE.md` for the dependency boundaries.

## Local setup

Use Node.js 20 or newer and a local MongoDB instance.

```bash
cp fyp_backend/.env.example fyp_backend/.env
cp fyp_web/.env.example fyp_web/.env.local
```

Fill the local environment files, then install and start each application in a
separate terminal:

```bash
cd fyp_backend
npm install
npm run dev
```

```bash
cd fyp_web
npm install
npm run dev
```

Login can be temporarily disabled for local development by setting
`AUTH_BYPASS=true` in both local environment files. Keep it disabled in shared
and production environments.

## AI models

The primary model files are committed with immutable source revisions and
SHA-256 checksums:

```bash
python3 ai_models/verify_models.py
```

Read `ai_models/README.md` before integrating them into a detection service.

## Security

Real environment files, credentials, generated output, dependencies, and
uploads are ignored by Git. Commit only `.env.example` templates. Run the
repository scanner before every push:

```bash
node scripts/scan-secrets.mjs
```

## License and ownership

Guardora's original project material is proprietary and exclusively owned by
Ata Ul Haq ([`@Atasatti`](https://github.com/Atasatti)). No use, copying,
modification, hosting, or distribution is permitted without prior written
authorization. See `LICENSE`.

Third-party dependencies and AI models remain under their respective upstream
licenses. See `THIRD_PARTY_NOTICES.md`.
