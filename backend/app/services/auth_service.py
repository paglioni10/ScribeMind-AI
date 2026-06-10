from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.db.supabase_client import get_supabase_auth_client, get_supabase_client


bearer_scheme = HTTPBearer(auto_error=True)

# Hierarquia de papéis (maior número = mais permissões)
ROLE_LEVEL = {"member": 1, "admin": 2, "owner": 3}


class CurrentUser:
    def __init__(self, user_id: str, email: str, organization_id: str, role: str):
        self.user_id = user_id
        self.email = email
        self.organization_id = organization_id
        self.role = role

    @property
    def level(self) -> int:
        return ROLE_LEVEL.get(self.role, 0)


def _verify_token(token: str) -> dict:
    auth_client = get_supabase_auth_client()
    try:
        response = auth_client.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )

    user = getattr(response, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )

    return {"id": user.id, "email": user.email}


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    """Resolve usuário autenticado + sua organização + papel."""
    token_user = _verify_token(credentials.credentials)

    supabase = get_supabase_client()
    membership = (
        supabase.table("organization_members")
        .select("organization_id, role")
        .eq("user_id", token_user["id"])
        .limit(1)
        .execute()
    )

    if not membership.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário não pertence a nenhuma organização.",
        )

    member = membership.data[0]

    return CurrentUser(
        user_id=token_user["id"],
        email=token_user["email"],
        organization_id=member["organization_id"],
        role=member["role"],
    )


def require_role(minimum_role: str):
    """Dependency factory: exige papel mínimo (member < admin < owner)."""
    required_level = ROLE_LEVEL[minimum_role]

    def checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Ação requer papel '{minimum_role}' ou superior.",
            )
        return user

    return checker
