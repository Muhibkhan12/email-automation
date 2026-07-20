from fastapi import FastAPI
from routes.auth import router as auth_router
from routes.sender_account import router as sender_account_router


app = FastAPI(
    title="Email Automater",
    description="Backend API",
)

app.include_router(auth_router)
app.include_router(sender_account_router)