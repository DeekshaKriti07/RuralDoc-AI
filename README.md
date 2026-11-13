# RuralDoc deployment package

Start with [DEPLOYMENT.md](DEPLOYMENT.md). Changes, verification results and remaining release requirements are in [AUDIT.md](AUDIT.md).

Includes React/Vite frontend, Express API, MySQL schema, offline knowledge base, Dockerfile and Docker Compose. First aid contains written instructions and browser speech only; its animated scenes, videos, manifests and render scripts have been removed. Clinical content has not been independently validated.

Local development: use Node 24, MySQL 8 and Ollama. Copy backend/.env.example to backend/.env and configure the database and a random JWT secret. Run `npm ci && npm start` in backend and `npm ci && npm run dev` in frontend. Development API calls proxy through Vite. Existing localStorage login tokens are discarded; sign in again.

Tests: `cd backend && npm test && npm run eval && npm run test:security`.
Build: `cd frontend && npm ci && npm run build`.
