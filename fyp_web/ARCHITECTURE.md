# Web MVVM architecture

The Next.js dashboard uses a pragmatic MVVM layout:

- `src/models/` contains framework-independent domain types.
- `src/view-models/` loads and shapes data for each screen and owns UI state
  such as login submission state.
- `src/views/` contains reusable view-only components.
- `src/app/` contains Next.js routes and feature views.
- `src/lib/actions/` is the backend access layer used by view-models.

Page components should load a view-model and render it. They should avoid
repeating API orchestration or response-shaping logic.

