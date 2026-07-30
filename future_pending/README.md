# Guardora future backlog

Snapshot date: 2026-07-30

This folder is the hand-off point for work that cannot be completed only from
the current repository. When future work resumes, read this file, then:

1. `EXTERNAL_REQUIREMENTS.md` for the seven SecureNest requirements that still
   depend on native source code, provider credentials, hardware, or production
   infrastructure.
2. `AI_TRAINING_BACKLOG.md` for the models that still need Guardora-specific
   training, validation, or calibration.
3. `models-to-train.json` for a machine-readable version of the AI backlog.

The complete requirement-by-requirement source of truth remains:

- `../SECURENEST_REQUIREMENTS_COVERAGE.md`

Current snapshot:

- 70 of 77 SecureNest requirements are implemented.
- 7 requirements are partially complete because an external dependency is
  still missing.
- The web dashboard, resident PWA, backend APIs, WebRTC signalling, AI lab,
  local face recognition, payments integration code, and internal safe-routing
  engine already exist.
- Do not commit secrets, private camera URLs, resident biometric images, or
  provider credentials to Git.

