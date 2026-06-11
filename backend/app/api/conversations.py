from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.services.auth_service import CurrentUser, get_current_user
from app.services import conversation_service


router = APIRouter(prefix="/conversations", tags=["Conversations"])


class RenameRequest(BaseModel):
    title: str


@router.get("/")
def list_conversations(user: CurrentUser = Depends(get_current_user)):
    return {
        "conversations": conversation_service.list_conversations(
            user.organization_id, user.user_id
        )
    }


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    result = conversation_service.get_conversation_messages(
        user.organization_id, user.user_id, conversation_id
    )
    if result is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")
    return result


@router.patch("/{conversation_id}")
def rename_conversation(
    conversation_id: str,
    request: RenameRequest,
    user: CurrentUser = Depends(get_current_user),
):
    updated = conversation_service.rename_conversation(
        user.organization_id, user.user_id, conversation_id, request.title
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")
    return {"conversation": updated}


@router.delete("/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    deleted = conversation_service.delete_conversation(
        user.organization_id, user.user_id, conversation_id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversa não encontrada.")
    return {"message": "Conversa excluída.", "conversation_id": conversation_id}
