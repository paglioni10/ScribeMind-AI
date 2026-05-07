from pydantic import BaseModel
from fastapi import APIRouter

from app.services.rag_service import answer_question


router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list = []


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest):
    return answer_question(request.question)