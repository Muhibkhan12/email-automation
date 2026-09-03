from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.campaigns import router as campaigns_router
from routes.sender_account import router as sender_account_router
from routes.upload_file import router as upload_file_router
from routes.campaign_recipients import router as recipients_router
from routes.html_templates import router as html_templates_router
from routes.email_logs import router as email_logs_router
from routes.worker import router as worker_router
from routes.ms_oauth import router as oauth_router

app = FastAPI(
    title="Email Automation",
    description="Backend API",
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(campaigns_router)
app.include_router(sender_account_router)
app.include_router(upload_file_router)
app.include_router(recipients_router)
app.include_router(html_templates_router)
app.include_router(email_logs_router)
app.include_router(worker_router)
app.include_router(oauth_router)