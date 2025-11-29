---
description: Start both the frontend and backend servers
---

To start the application, you need to run two separate terminals.

# Terminal 1: Backend
```powershell
cd backend
.\venv\Scripts\python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

# Terminal 2: Frontend
```powershell
cd frontend
npm run dev
```
