from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.db_service import init_db
from routes import upload, sign, verify, stamp, auth

app = FastAPI(title="Secure Document Signing System")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB
init_db()

# Include Routers
app.include_router(upload.router)
app.include_router(sign.router)
app.include_router(verify.router)
app.include_router(stamp.router)
app.include_router(auth.router, tags=["Authentication"])

@app.get("/")
def root():
    return {"message": "Secure Document Signing API is running"}
