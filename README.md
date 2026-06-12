# ScribeMind AI

ScribeMind AI é um Knowledge Engine corporativo com foco em automação de processos, IA generativa, RAG multimodal e treinamento corporativo.

A proposta é transformar documentos internos, guias operacionais, manuais e guias visuais em uma interface de chat consultável, permitindo que colaboradores encontrem respostas com base nas fontes oficiais da empresa — inclusive interpretando as **imagens** dos documentos.

O projeto nasceu com foco em guias do tipo Scribe/ScribeHow, onde processos são documentados com texto, prints de tela e passo a passo visual.

## Objetivo

Empresas costumam armazenar processos em PDFs, manuais, pastas internas ou ferramentas de documentação visual. Com o tempo, esses materiais viram arquivos pouco consultados, difíceis de encontrar e dependentes de pessoas mais experientes para interpretação.

O ScribeMind AI busca transformar essa documentação passiva em um assistente ativo, capaz de:

- receber documentos;
- indexar conteúdos (texto e imagens);
- recuperar trechos relevantes;
- responder perguntas em linguagem natural;
- mostrar fontes;
- descrever e associar imagens extraídas de PDFs às respostas;
- atender múltiplos usuários e organizações com controle de acesso;
- oferecer acessibilidade completa (visual, auditiva, por voz e em Libras).

## Funcionalidades

### Documentos e indexação
- Upload de documentos `.md`, `.txt` e `.pdf`
- Extração de texto de PDFs
- Extração de imagens de PDFs e salvamento no Supabase Storage
- Separação de documentos em chunks com embeddings
- Listagem e exclusão de documentos
- Bloqueio de documentos duplicados por título
- Busca mock por texto para desenvolvimento sem gastar a cota da IA

### IA Vision e RAG multimodal
- Geração de descrição real das imagens via IA Vision (Google Gemini)
- Persistência da descrição, status (`completed` / `mock`) e provider no banco
- Criação de *chunks visuais* a partir das descrições, vinculados à imagem de origem (`chunks.image_id`)
- Chat que combina **texto do documento + descrições das imagens**, permitindo respostas como
  *"na imagem dessa etapa, clique no botão Salvar"*
- Exibição das fontes usadas na resposta, com badge indicando fontes visuais
- Exibição das imagens relacionadas, com descrição, status e provider

### Multiusuário e organizações
- Cadastro e login via Supabase Auth (e-mail + senha)
- Criação de organização (vira **owner**) ou entrada via **código de convite** (vira **member**)
- Controle de permissões por papel: `owner` > `admin` > `member`
- Isolamento total de dados por organização
- Painel de gestão de equipe: código de convite, troca de papéis e remoção de membros
- Refresh automático de token no frontend
- **Acesso granular ao dashboard**: membros solicitam acesso pelo próprio site; owner/admin
  recebem a solicitação num banner e aprovam/recusam. A aprovação concede apenas a visão do
  dashboard, sem promover o membro a admin

### Gestão do conhecimento
- Histórico de conversas persistido por usuário, com sidebar para retomar conversas anteriores
- Título de conversa gerado automaticamente a partir da primeira pergunta
- Biblioteca de documentos com busca por título, filtro por tipo e metadados
  (contagem de chunks, chunks visuais e imagens por documento)
- Reprocessamento de um documento já indexado (re-gera embeddings dos chunks e
  re-descreve as imagens via Vision) sem precisar reenviar o arquivo

### Inteligência operacional (dashboard)
- Métricas de uso: perguntas feitas, taxa de resposta, conversas, tamanho da base
- Gráfico de perguntas nos últimos 7 dias
- Dashboard de perguntas sem resposta (o que os usuários perguntaram e o bot não soube responder)
- Identificação de lacunas na base: termos mais frequentes nas perguntas sem resposta

### Governança e segurança
- Histórico de auditoria: registra ações sensíveis (upload, exclusão,
  reprocessamento, mudança de papel, aprovação de acesso) com autor, alvo e data
- Painel de auditoria restrito a admin/owner (mais estrito que o dashboard)
- Validação de upload: limite de tamanho (configurável), bloqueio de arquivo
  vazio e de conteúdo não-UTF-8
- Row Level Security (RLS) no banco como defesa em profundidade: cada usuário
  só acessa os dados da própria organização, mesmo em caso de vazamento de chave

### Acessibilidade (WCAG 2.2 / ARIA)
- Descrições das imagens usadas como `alt text` e legendas acessíveis
- Text-to-Speech: botão "Ouvir resposta" no chat
- Speech-to-Text: perguntas por comando de voz
- Integração com VLibras (Língua Brasileira de Sinais)
- Navegação completa por teclado, *skip links* e foco visível
- Alto contraste e ajuste de tamanho de fonte (persistidos)
- Componentes compatíveis com leitores de tela (semântica ARIA, *live regions*)
- Auditoria de acessibilidade com axe-core em modo desenvolvimento

## Stack

### Backend
- Python
- FastAPI
- Supabase (Auth + Postgres + Storage)
- pgvector
- SDK compatível com OpenAI (provider configurável: **Google Gemini** por padrão, OpenAI ou Ollama)
- Uvicorn
- pypdf
- PyMuPDF
- Pillow
- email-validator

### Frontend
- React
- Vite
- Tailwind CSS
- @axe-core/react

### Banco de dados
- Supabase Postgres
- Supabase Storage
- pgvector

Tabelas principais:

- `organizations` (com `invite_code`)
- `profiles`
- `organization_members` (papel: owner / admin / member; flag `dashboard_access`)
- `dashboard_access_requests` (solicitações de acesso ao dashboard)
- `documents`
- `document_versions`
- `chunks` (com `image_id` para chunks visuais)
- `document_images` (com descrição, status e provider)
- `conversations`
- `messages` (com flag `answered` para métricas)
- `feedback`

## Configuração

### Backend

1. Crie o `backend/.env` a partir do `backend/.env.example`:

```env
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_SERVICE_KEY=        # opcional; usado para operações administrativas

# Provider de IA (compatível com OpenAI). Padrão: Google Gemini (free tier).
# Crie a chave gratuita em https://aistudio.google.com/apikey
AI_API_KEY=
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
CHAT_MODEL=gemini-2.5-flash-lite
VISION_MODEL=gemini-2.5-flash-lite
EMBEDDING_MODEL=gemini-embedding-001
EMBEDDING_DIM=768

ENVIRONMENT=development
DEFAULT_ORGANIZATION_ID=      # fallback/seed; o org_id real vem do usuário
USE_MOCK_AI=true              # true = não chama a IA (mock, sem gastar cota)
MAX_UPLOAD_MB=10             # limite de tamanho de upload
```

> **Providers alternativos:** para **OpenAI**, use `AI_BASE_URL=https://api.openai.com/v1`,
> modelos `gpt-4o-mini` / `text-embedding-3-small` e `EMBEDDING_DIM=1536`. Para **Ollama** local,
> use `AI_BASE_URL=http://localhost:11434/v1` e modelos locais. A dimensão dos embeddings precisa
> bater com a do banco (ver migração).

2. No painel do Supabase, em **Authentication > Providers**, habilite **Email** e
   **desligue "Confirm email"** em desenvolvimento (evita rate limit de e-mail e
   permite login imediato após o cadastro).

3. Rode as migrações SQL (em `backend/scripts/`) no **SQL Editor** do Supabase, na ordem:
   - `migration_add_image_id_to_chunks.sql`
   - `migration_multiuser.sql`
   - `migration_analytics.sql`
   - `migration_dashboard_access.sql`
   - `migration_gemini_embeddings.sql` (ajusta a dimensão dos embeddings para 768;
     se já tinha documentos indexados, use o botão **Reprocessar** depois para re-gerar)
   - `migration_audit.sql` (histórico de auditoria)
   - `migration_rls.sql` (Row Level Security — pode escolher "Run and enable RLS")

   Ao avisar sobre RLS, escolha **Run without RLS** (a autorização é feita na camada
   da aplicação).

4. Suba a API:

```bash
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Estrutura do projeto

```txt
scribemind_ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── access_requests.py
│   │   │   ├── analytics.py
│   │   │   ├── audit.py
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── conversations.py
│   │   │   ├── documents.py
│   │   │   ├── health.py
│   │   │   └── members.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   └── supabase_client.py
│   │   ├── services/
│   │   │   ├── ai_client.py
│   │   │   ├── analytics_service.py
│   │   │   ├── audit_service.py
│   │   │   ├── auth_service.py
│   │   │   ├── conversation_service.py
│   │   │   ├── document_image_service.py
│   │   │   ├── document_ingestion_service.py
│   │   │   ├── embedding_service.py
│   │   │   ├── image_description_service.py
│   │   │   ├── pdf_image_service.py
│   │   │   ├── pdf_service.py
│   │   │   ├── rag_service.py
│   │   │   └── reprocess_service.py
│   │   └── main.py
│   ├── documents/
│   ├── scripts/
│   │   ├── ingest_markdown.py
│   │   ├── migration_add_image_id_to_chunks.sql
│   │   ├── migration_multiuser.sql
│   │   ├── migration_analytics.sql
│   │   ├── migration_dashboard_access.sql
│   │   └── migration_gemini_embeddings.sql
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── AuthScreen.jsx
│   │   │   ├── AccessibilityBar.jsx
│   │   │   ├── AccessRequestButton.jsx
│   │   │   ├── AuditLog.jsx
│   │   │   ├── ChatPanel.jsx
│   │   │   ├── ConversationSidebar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DashboardRequestsBanner.jsx
│   │   │   ├── DocumentList.jsx
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── ImageGallery.jsx
│   │   │   ├── Lightbox.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── MembersPanel.jsx
│   │   │   └── VLibras.jsx
│   │   ├── context/
│   │   │   ├── AccessibilityContext.jsx
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useSpeechRecognition.js
│   │   │   └── useSpeechSynthesis.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## API

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/auth/register` | público | Cadastro + criação/entrada em organização |
| POST | `/auth/login` | público | Login (retorna tokens) |
| POST | `/auth/refresh` | público | Renova o access token |
| GET | `/auth/me` | autenticado | Dados do usuário, papel, organização e acesso ao dashboard |
| GET | `/members/` | autenticado | Lista membros da organização |
| PATCH | `/members/{id}` | admin/owner | Altera papel de um membro |
| DELETE | `/members/{id}` | admin/owner | Remove um membro |
| POST | `/chat/` | membro | Pergunta ao RAG multimodal (cria/usa conversa) |
| GET | `/conversations/` | autenticado | Lista as conversas do usuário |
| GET | `/conversations/{id}` | autenticado | Mensagens de uma conversa |
| PATCH | `/conversations/{id}` | autenticado | Renomeia uma conversa |
| DELETE | `/conversations/{id}` | autenticado | Exclui uma conversa |
| GET | `/documents/` | membro | Lista documentos da organização (com metadados) |
| POST | `/documents/upload` | membro | Indexa um documento |
| POST | `/documents/{id}/reprocess` | admin/owner | Reprocessa embeddings e descrições |
| DELETE | `/documents/{id}` | admin/owner | Exclui um documento |
| GET | `/documents/{id}/images` | membro | Lista imagens de um documento |
| GET | `/analytics/metrics` | dashboard | Métricas de uso |
| GET | `/analytics/unanswered` | dashboard | Perguntas sem resposta |
| GET | `/analytics/gaps` | dashboard | Lacunas na base de conhecimento |
| GET | `/audit/` | admin/owner | Histórico de auditoria da organização |
| GET | `/access-requests/mine` | autenticado | Status do próprio pedido de acesso |
| POST | `/access-requests/` | membro | Solicita acesso ao dashboard |
| GET | `/access-requests/` | admin/owner | Lista pedidos pendentes |
| POST | `/access-requests/{id}/approve` | admin/owner | Aprova um pedido |
| POST | `/access-requests/{id}/deny` | admin/owner | Recusa um pedido |
