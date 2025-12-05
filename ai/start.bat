@echo off
echo Starting NEPSE AI Service...
echo.
echo Service will be available at: http://localhost:8001 (local) or http://[your-ip]:8001 (network)
echo API Documentation: http://localhost:8001/docs (local) or http://[your-ip]:8001/docs (network)
echo Health Check: http://localhost:8001/health (local) or http://[your-ip]:8001/health (network)
echo.
cd /d %~dp0
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
pause

