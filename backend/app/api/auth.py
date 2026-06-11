import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.db.supabase_client import get_supabase_auth_client, get_supabase_client
from app.services.auth_service import CurrentUser, get_current_user


router = APIRouter(prefix="/auth", tags=["Auth"])


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    organization_name: str | None = None
    invite_code: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


def _generate_invite_code() -> str:
    return secrets.token_hex(4)  # 8 caracteres


@router.post("/register")
def register(request: RegisterRequest):
    if not request.organization_name and not request.invite_code:
        raise HTTPException(
            status_code=400,
            detail="Informe o nome de uma nova organização ou um código de convite.",
        )

    auth_client = get_supabase_auth_client()
    supabase = get_supabase_client()

    # 1) Cria o usuário no Supabase Auth
    try:
        sign_up = auth_client.auth.sign_up(
            {
                "email": request.email,
                "password": request.password,
                "options": {"data": {"full_name": request.full_name}},
            }
        )
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Erro no cadastro: {error}")

    user = getattr(sign_up, "user", None)
    if not user:
        raise HTTPException(status_code=400, detail="Não foi possível criar o usuário.")

    user_id = user.id

    # Garante o profile (caso o trigger não exista ainda)
    supabase.table("profiles").upsert(
        {"id": user_id, "full_name": request.full_name, "email": request.email}
    ).execute()

    # 2a) Entrar numa organização existente por código de convite
    if request.invite_code:
        org_response = (
            supabase.table("organizations")
            .select("id, name")
            .eq("invite_code", request.invite_code.strip())
            .limit(1)
            .execute()
        )
        if not org_response.data:
            raise HTTPException(status_code=404, detail="Código de convite inválido.")

        organization = org_response.data[0]
        role = "member"

    # 2b) Criar nova organização (usuário vira owner)
    else:
        org_response = (
            supabase.table("organizations")
            .insert(
                {
                    "name": request.organization_name.strip(),
                    "invite_code": _generate_invite_code(),
                }
            )
            .execute()
        )
        organization = org_response.data[0]
        role = "owner"

    # 3) Cria o vínculo de membro
    supabase.table("organization_members").insert(
        {
            "organization_id": organization["id"],
            "user_id": user_id,
            "role": role,
        }
    ).execute()

    return {
        "message": "Cadastro realizado com sucesso.",
        "user_id": user_id,
        "organization_id": organization["id"],
        "organization_name": organization.get("name"),
        "role": role,
        "session": getattr(sign_up, "session", None)
        and {
            "access_token": sign_up.session.access_token,
            "refresh_token": sign_up.session.refresh_token,
        },
    }


@router.post("/login")
def login(request: LoginRequest):
    auth_client = get_supabase_auth_client()

    try:
        result = auth_client.auth.sign_in_with_password(
            {"email": request.email, "password": request.password}
        )
    except Exception:
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

    session = getattr(result, "session", None)
    if not session:
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
    }


@router.post("/refresh")
def refresh(request: RefreshRequest):
    auth_client = get_supabase_auth_client()

    try:
        result = auth_client.auth.refresh_session(request.refresh_token)
    except Exception:
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente.")

    session = getattr(result, "session", None)
    if not session:
        raise HTTPException(status_code=401, detail="Sessão expirada. Faça login novamente.")

    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
    }


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    supabase = get_supabase_client()

    profile = (
        supabase.table("profiles")
        .select("full_name, email")
        .eq("id", user.user_id)
        .limit(1)
        .execute()
    )

    org = (
        supabase.table("organizations")
        .select("id, name, invite_code")
        .eq("id", user.organization_id)
        .limit(1)
        .execute()
    )

    profile_data = profile.data[0] if profile.data else {}
    org_data = org.data[0] if org.data else {}

    # invite_code só é exposto para admin/owner
    if user.level < 2:
        org_data.pop("invite_code", None)

    return {
        "user_id": user.user_id,
        "email": user.email,
        "full_name": profile_data.get("full_name"),
        "role": user.role,
        "dashboard_access": user.dashboard_access,
        "can_view_dashboard": user.can_view_dashboard,
        "organization": org_data,
    }
