import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import auth, submit, dashboard

app = FastAPI(
    title="Employee Daily Pay Automation System API",
    description="Automated API processing Google Forms, calculations, ReportLab PDF, and Meta WhatsApp dispatches.",
    version="1.0.0"
)

# Configure CORS for React frontend (Vite defaults to port 5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"  # Allow all for development flexibility
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(submit.router)
app.include_router(dashboard.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Employee Daily Pay Automation API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
