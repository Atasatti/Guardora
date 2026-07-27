# Backend architecture

The backend follows a route-controller-model structure:

- `src/routes/` defines the public HTTP surface.
- `src/controllers/` contains application behaviour.
- `src/models/` contains Mongoose persistence models and a model barrel.
- `src/middlewares/` contains authentication and error handling.
- `src/utils/` contains infrastructure helpers such as mail, JWT, and AI
  moderation.
- `src/config/` contains database configuration.

Only web/admin routes are mounted by `src/server.js`. Mobile-specific
controllers and route copies are intentionally stored in `../mobile_deferred/`
until the mobile application is resumed.

