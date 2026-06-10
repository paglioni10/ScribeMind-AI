from pydantic import BaseModel
from fastapi import APIRouter, Depends

from app.services.auth_service import CurrentUser, get_current_user
from app.services.rag_service import answer_question


router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list = []


@router.post("/", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
):
    return answer_question(request.question, user.organization_id)
