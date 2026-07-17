from fastapi import FastAPI
from routes.auth import router as auth_router


app = FastAPI(
    title="Email Automater",
    description="Backend API",
)

app.include_router(auth_router)