# nail-frontend

React + Vite dashboard for **nail-backend**.

## Setup

```bash
cp .env.example .env
# Set VITE_API_URL to match nail-backend (e.g. http://localhost:5001 on macOS if 5000 is taken by AirPlay)
npm install
npm run dev
```

## Backend

Start PostgreSQL, run `nail-backend` (`npm run dev`). CORS is open by default.

Default admin (after seed): `admin` / `admin123`.
