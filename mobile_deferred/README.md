# Deferred mobile code

This directory holds the resident/mobile backend modules that are intentionally
excluded from the active web-focused API.

The files preserve their original `src/`-relative imports. When mobile work
resumes, copy the required controllers, routes, and services back into
`backend/src/`, resolve any overlap with the active web routes, and call
`registerMobileRoutes` from the backend server.

Do not mount these routes in the current web release.
