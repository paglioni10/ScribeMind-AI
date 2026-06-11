from pydantic import BaseModel
from fastapi import APIRouter, Depends

from app.services.auth_service import CurrentUser, get_current_user
from app.services.rag_service import answer_question
from app.services import conversation_service


router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    question: str
    conversation_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sources: list = []
    conversation_id: str
    conversation_title: str | None = None


@router.post("/", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    user: CurrentUser = Depends(get_current_user),
):
    # Garante uma conversa (existente ou nova) e persiste a pergunta
    conversation = conversation_service.get_or_create_conversation(
        organization_id=user.organization_id,
        user_id=user.user_id,
        conversation_id=request.conversation_id,
        first_question=request.question,
    )

    conversation_service.save_message(
        conversation_id=conversation["id"],
        role="user",
        content=request.question,
    )

    result = answer_question(request.question, user.organization_id)

    # Persiste a resposta com as fontes e a flag de resposta encontrada
    conversation_service.save_message(
        conversation_id=conversation["id"],
        role="assistant",
        content=result["answer"],
        sources=result.get("sources", []),
        answered=result.get("answered"),
    )

    return {
        "answer": result["answer"],
        "sources": result.get("sources", []),
        "conversation_id": conversation["id"],
        "conversation_title": conversation.get("title"),
    }
