from fastapi import FastAPI
from routes.auth import router as auth_router
from routes.sender_account import router as sender_account_router
from routes.upload_file import router as upload_file_router
from routes.recipients import router as recipients_router
from routes.html_templates import router as html_templates_router
from routes.checking import router as checking_router

app = FastAPI(
    title="Email Automation",
    description="Backend API",
)

app.include_router(auth_router)
app.include_router(sender_account_router)
app.include_router(upload_file_router)
app.include_router(recipients_router)
app.include_router(html_templates_router)
app.include_router(checking_router)