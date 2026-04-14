# Deployment Guide

## Deployment Options

### Option 1: Railway (Recommended for Full-Stack)

Railway supports both the backend (Node.js) and frontend (static) in a single project.

#### Steps

1. **Create a Railway project** at [railway.app](https://railway.app)

2. **Add the backend service**:
   - Connect your GitHub repo
   - Set root directory to `backend`
   - Set build command: `npm install && npm run build`
   - Set start command: `node dist/index.js`
   - Add environment variables:
     ```
     OPENAI_API_KEY=your_key
     NODE_ENV=production
     PORT=3001
     FRONTEND_URL=https://your-frontend-url.railway.app
     ```

3. **Add the frontend service**:
   - Connect same repo
   - Set root directory to `frontend`
   - Choose one deployment mode:
     - **Web Service with Dockerfile**: Railway will detect `frontend/Dockerfile`; do not set an output directory. Add `BACKEND_URL=https://your-backend-url.railway.app` so Nginx can proxy `/api` to the backend service.
     - **Static Site / Nixpacks**: Set build command: `npm install && npm run build`, output directory: `dist`, and add `VITE_API_URL=https://your-backend-url.railway.app/api`

### Option 2: Vercel (Frontend) + Railway (Backend)

1. **Deploy frontend to Vercel**:
   - Connect repo, set root to `frontend`
   - Framework preset: Vite
   - Add `vercel.json` to `frontend/`:
     ```json
     {
       "rewrites": [
         {
           "source": "/api/:path*",
           "destination": "https://your-backend.railway.app/api/:path*"
         }
       ]
     }
     ```

2. **Deploy backend to Railway** (as above)

### Option 3: Render

1. **Backend**: Create a Web Service
   - Root directory: `backend`
   - Build: `npm install && npm run build`
   - Start: `node dist/index.js`
   - Add env vars (OPENAI_API_KEY, NODE_ENV=production)

2. **Frontend**: Create a Static Site
   - Root directory: `frontend`
   - Build: `npm install && npm run build`
   - Publish directory: `dist`
   - Add redirect rule: `/api/*` → `https://your-backend.onrender.com/api/:splat`

## Environment Variables

| Variable         | Required | Production Value                         |
| ---------------- | -------- | ---------------------------------------- |
| `OPENAI_API_KEY` | Yes      | Your OpenAI API key                      |
| `NODE_ENV`       | No       | `production`                             |
| `PORT`           | No       | `3001` (or platform-assigned)            |
| `FRONTEND_URL`   | No       | Your frontend URL (for CORS)             |
| `VITE_API_URL`   | No       | Your backend URL + `/api` (frontend env) |

**Security Note**: Never commit `.env` files or API keys to version control.

## Production Considerations

### File Upload Handling

- Max file size: 100MB (configurable via `MAX_FILE_SIZE` env var)
- Files are stored temporarily during processing, then deleted
- For serverless deployments, consider using `/tmp` storage

### CORS

- In production, set `FRONTEND_URL` to your exact frontend domain
- The backend only allows requests from this origin

### API Rate Limits

- OpenAI GPT-4o-mini is called 4-6 times per document extraction
- Consider implementing request queuing for high-traffic scenarios

### Error Handling

- Backend returns structured error responses
- Frontend displays toast-style error messages
- Processing failures are reported via the status polling endpoint

## Local Development

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:3001` automatically.

## Build for Production

```bash
# Build both
npm run build

# The backend serves the frontend in production mode
cd backend
NODE_ENV=production node dist/index.js
```

In production mode, the Express server serves the frontend static files from `frontend/dist/`.
