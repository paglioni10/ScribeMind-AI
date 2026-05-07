# ScribeMind AI

ScribeMind AI é um MVP de Knowledge Engine corporativo com foco em automação de processos, documentação inteligente e RAG.

A proposta é transformar documentos internos, guias operacionais e manuais em uma interface de chat consultável, permitindo que colaboradores encontrem respostas com base nas fontes oficiais da empresa.

## Funcionalidades atuais

- Upload de documentos `.md` e `.txt`
- Indexação dos documentos no Supabase
- Separação de documentos em chunks
- Chat para consulta dos documentos
- Exibição das fontes usadas na resposta
- Listagem de documentos indexados
- Exclusão de documentos
- Bloqueio de documentos duplicados por título
- Busca mock por texto para desenvolvimento sem gastar API da OpenAI
- Frontend em React + Tailwind
- Backend em FastAPI

## Stack

### Backend

- Python
- FastAPI
- Supabase
- pgvector
- OpenAI SDK
- Uvicorn

### Frontend

- React
- Vite
- Tailwind CSS

### Banco de dados

- Supabase Postgres
- Tabelas principais:
  - `organizations`
  - `documents`
  - `document_versions`
  - `chunks`
  - `conversations`
  - `messages`
  - `feedback`

## Estrutura do projeto

```txt
scribemind_ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── services/
│   │   └── main.py
│   ├── documents/
│   ├── scripts/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md