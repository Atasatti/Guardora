# Guardora architecture

Guardora is organised as a web-first application with an API, an MVVM web
client, and locally versioned computer-vision models.

## Active applications

- `backend/` — Express API, Socket.IO events, persistence models, and web
  administration endpoints.
- `frontend/` — Next.js web dashboard. Domain contracts live in `models/`,
  presentation state and orchestration live in `view-models/`, and React
  components make up the views.
- `ai_models/` — pinned model files, provenance metadata, integrity checks, and
  runtime smoke tests.

## Deferred application

`mobile_deferred/` contains mobile/resident-only backend modules that are kept
out of the active server. They remain available for a later mobile phase.

## Dependency direction

Views depend on view-models, view-models call the action/API layer, and both use
domain models. Backend routes delegate to controllers, which use persistence
models and shared utilities.
