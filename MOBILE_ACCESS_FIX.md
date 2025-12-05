# Mobile Access Fix for NEPSE Application

This document summarizes the changes made to enable mobile device access to the NEPSE application.

## Problem
The application was only accessible from localhost, preventing mobile devices from connecting to the API server with the error: "Unable to connect to API server. Please ensure the API server is running on http://localhost:8082"

## Solution
Modified the services to bind to all network interfaces (0.0.0.0) instead of just localhost (127.0.0.1).

## Changes Made

### 1. API Service (`api/src/index.ts`)
- Changed server binding from `app.listen(PORT)` to `app.listen(PORT, HOST)`
- Added `const HOST = '0.0.0.0'` to bind to all interfaces
- Updated CORS configuration to explicitly allow all origins

### 2. Frontend Development Server (`frontend/vite.config.ts`)
- Added `host: '0.0.0.0'` to the server configuration
- This allows the frontend development server to be accessed from mobile devices

### 3. AI Service (`ai/start.bat`)
- Changed `--host 127.0.0.1` to `--host 0.0.0.0` in the uvicorn command
- Updated informational messages to indicate network accessibility

### 4. Frontend API Client (`frontend/src/lib/apiClient.ts`)
- Centralized all API calls through a mobile-friendly helper
- Automatically reuses the device/desktop IP when no `VITE_API_BASE_URL` is provided
- Uses the Vite dev proxy (`/api → http://localhost:8082`) by default during `npm run dev` so phones only need access to port 5173
- Allows overriding the API host with `VITE_API_BASE_URL=https://your-api-host`

## How to Access from Mobile

1. Find your computer's IP address:
   - Windows: Run `ipconfig` in Command Prompt
   - macOS/Linux: Run `ifconfig` or `ip addr` in Terminal

2. Make sure all services are running:
   - API: `cd api && npm run dev`
   - Frontend: `cd frontend && npm run dev`
   - AI: `cd ai && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`

3. On your mobile device, navigate to:
   - Frontend: `http://[your-computer-ip]:5173`
   - API Health Check: `http://[your-computer-ip]:8082/health`
   - AI Service: `http://[your-computer-ip]:8001/health`

4. (Optional) Create `frontend/.env` with `VITE_API_BASE_URL=http://[your-computer-ip]:8082` if you want to point the frontend at a remote API regardless of where it is served from. Leave it unset during `npm run dev` to keep using the built-in proxy.

## Firewall Considerations
You may need to allow the following ports through your firewall:
- Port 5173 (Frontend development server)
- Port 8082 (API server)
- Port 8001 (AI service)

## Troubleshooting
If you still can't connect from your mobile device:

1. Verify all services are running
2. Check that your computer and mobile device are on the same network
3. Ensure your firewall allows connections on the required ports
4. Confirm you're using the correct IP address for your computer