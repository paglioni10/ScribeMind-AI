from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.auth import router as auth_router
from app.api.members import router as members_router
from app.api.conversations import router as conversations_router
from app.api.analytics import router as analytics_router
from app.api.access_requests import router as access_requests_router
from app.api.audit import router as audit_router


app = FastAPI(
    title="ScribeMind AI API",
    description="Knowledge Engine com RAG para documentação corporativa.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(members_router)
app.include_router(conversations_router)
app.include_router(analytics_router)
app.include_router(access_requests_router)
app.include_router(audit_router)
app.include_router(chat_router)
app.include_router(documents_router)


@app.get("/")
def root():
    return {
        "message": "ScribeMind AI API está rodando.",
    }