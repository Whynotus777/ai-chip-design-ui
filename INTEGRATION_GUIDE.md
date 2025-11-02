# React UI + Python Backend Integration Guide

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         React TypeScript UI                 │
│         (Port 3000)                         │
│                                             │
│  Components → API Client → React Query     │
└──────────────────┬──────────────────────────┘
                   │ HTTP + WebSocket
                   │
┌──────────────────▼──────────────────────────┐
│       FastAPI Server (Port 8000)            │
│       ~/cda-agent-2C1/react_api/            │
│                                             │
│  REST Endpoints + WebSocket Streams        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│    Python Backend (cda-agent-2C1)           │
│                                             │
│    PipelineOrchestrator → 6 Agents          │
│    (A1, A2, A3, A4, A5, A6) → Yosys        │
└─────────────────────────────────────────────┘
```

## Quick Start

### 1. Start FastAPI Backend

```bash
cd ~/cda-agent-2C1
./launch_react_api.sh
```

This starts the FastAPI server on port 8000 that:
- Wraps the existing PipelineOrchestrator
- Provides REST API for pipeline execution
- Streams real-time logs via WebSocket
- **Does NOT modify existing backend code**

Access API docs at: `http://localhost:8000/docs`

### 2. Start React Frontend

```bash
cd ~/ai-chip-design-ui
npm install  # First time only
npm run dev
```

Access UI at: `http://localhost:3000`

## Key Files

### Backend (Python)

| File | Purpose |
|------|---------|
| `~/cda-agent-2C1/react_api/server.py` | FastAPI server (NEW - isolated) |
| `~/cda-agent-2C1/react_api/__init__.py` | Module init |
| `~/cda-agent-2C1/api/pipeline.py` | PipelineOrchestrator (EXISTING - unchanged) |
| `~/cda-agent-2C1/launch_react_api.sh` | Launch script for FastAPI |

### Frontend (React/TypeScript)

| File | Purpose |
|------|---------|
| `client/src/lib/api.ts` | HTTP + WebSocket client |
| `client/src/hooks/usePipeline.ts` | React Query hooks |
| `client/src/hooks/useLogStream.ts` | WebSocket hook for logs |
| `client/src/pages/AgentFlowLive.tsx` | API-integrated UI component |
| `client/src/App.tsx` | Main app (routes to AgentFlowLive) |

## API Endpoints

### REST API

```
GET  /                          # Health check
GET  /api/health                # Detailed status
POST /api/pipeline/run          # Execute pipeline
GET  /api/pipeline/status/{id}  # Get run status
GET  /api/pipeline/runs         # List all runs
```

### WebSocket

```
WS   /api/pipeline/logs         # Real-time log stream
```

## Data Flow

### Pipeline Execution

1. User fills form in `AgentFlowLive.tsx`
2. Click "Run Pipeline" → calls `usePipelineExecution().run()`
3. React Query sends POST to `/api/pipeline/run`
4. FastAPI creates run_id, starts background execution
5. FastAPI calls `PipelineOrchestrator.run()` (existing backend)
6. Agents execute: A1 → A2 → A3 → A4 → A5 → A6 → Yosys
7. React polls GET `/api/pipeline/status/{id}` every 2 seconds
8. UI updates progress bar and agent status in real-time

### Real-Time Logs

1. On mount, `useLogStream()` connects WebSocket
2. FastAPI broadcasts log messages from agents
3. React receives messages and displays in log feed
4. Automatic reconnection on disconnect

## Testing

### 1. Test Backend Directly

```bash
# Start backend
cd ~/cda-agent-2C1
./launch_react_api.sh

# In another terminal, test with curl
curl http://localhost:8000/api/health

# Run a test pipeline
curl -X POST http://localhost:8000/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "module_name": "test_counter",
    "description": "8-bit up counter with reset",
    "data_width": 8,
    "clock_freq": 100.0
  }'
```

### 2. Test Full Stack

```bash
# Terminal 1: Backend
cd ~/cda-agent-2C1
./launch_react_api.sh

# Terminal 2: Frontend
cd ~/ai-chip-design-ui
npm run dev

# Open browser: http://localhost:3000
# Navigate to "Agent & Flow" view
# Fill form and click "Run Pipeline"
```

## Environment Variables

Create `.env` in `~/ai-chip-design-ui/`:

```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Deployment

### Development (Current)

- React: `npm run dev` (port 3000)
- FastAPI: `./launch_react_api.sh` (port 8000)
- Two separate processes

### Production (Future)

```bash
# Build React
cd ~/ai-chip-design-ui
npm run build  # → dist/public

# Serve from FastAPI
# Update server.py to mount static files:
from fastapi.staticfiles import StaticFiles
app.mount("/", StaticFiles(directory="../ai-chip-design-ui/dist/public", html=True))

# Single process on port 8000
```

## Troubleshooting

### Backend won't start

```bash
cd ~/cda-agent-2C1
source venv/bin/activate
pip install fastapi uvicorn[standard] websockets
```

### Frontend can't connect

1. Check backend is running: `curl http://localhost:8000/api/health`
2. Check CORS in `react_api/server.py` allows `http://localhost:3000`
3. Check `.env` file has correct URLs

### WebSocket disconnects

- Normal behavior if backend restarts
- Auto-reconnects up to 5 times
- Check FastAPI logs for errors

### Pipeline fails

1. Check agent logs in UI
2. Check FastAPI terminal for Python errors
3. Verify existing backend works: `cd ~/cda-agent-2C1 && ./launch_ui.sh`

## Development Notes

### Why separate FastAPI server?

- **Non-invasive**: Doesn't modify existing Gradio UI or backend
- **Clean separation**: React UI and Gradio UI coexist
- **Easy to remove**: Delete `react_api/` folder to revert
- **Professional API**: Auto-generated docs, type safety, async support

### State Management

- **TanStack Query**: Server state (API data, caching, polling)
- **useState**: Local UI state (form inputs)
- **WebSocket**: Real-time updates (logs, events)

### Type Safety

- Python: Pydantic models for validation
- TypeScript: Interfaces for API responses
- **Shared contract**: Both sides agree on data structure

## Next Steps

1. **Add more views**: Connect Dashboard, Analysis to real data
2. **Add authentication**: JWT tokens for multi-user
3. **Add database**: Store run history (SQLite → PostgreSQL)
4. **Add file uploads**: Upload existing RTL for modification
5. **Add downloads**: Download generated RTL, reports
6. **Add visualizations**: Waveforms, PPA charts from synthesis data

## Support

- FastAPI docs: `http://localhost:8000/docs`
- React Query devtools: Built into UI (development mode)
- Backend logs: FastAPI terminal output
- Frontend logs: Browser console (F12)
