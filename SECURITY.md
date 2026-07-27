# Security policy

## Secrets

- Store credentials and deployment-specific service endpoints in ignored
  environment files or the deployment platform's secret manager.
- Commit only `.env.example` files containing safe development examples.
- Treat every `NEXT_PUBLIC_` value as public browser data.
- Keep `AUTH_BYPASS=false` in shared, staging, and production deployments.
- Rotate a credential immediately if it is ever committed, even if the commit
  is later removed.

## Before pushing

Run:

```bash
node scripts/scan-secrets.mjs
python3 ai_models/verify_models.py
```

The GitHub Actions workflow runs the same checks along with backend syntax,
web lint, and TypeScript validation.

