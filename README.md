# ScribeMind AI

ScribeMind AI é um MVP de Knowledge Engine corporativo com foco em automação de processos, IA generativa, RAG e treinamento corporativo.

A proposta é transformar documentos internos, guias operacionais, manuais e guias visuais em uma interface de chat consultável, permitindo que colaboradores encontrem respostas com base nas fontes oficiais da empresa.

O projeto nasceu com foco em guias do tipo Scribe/ScribeHow, onde processos são documentados com texto, prints de tela e passo a passo visual.

## Objetivo

Empresas costumam armazenar processos em PDFs, manuais, pastas internas ou ferramentas de documentação visual. Com o tempo, esses materiais viram arquivos pouco consultados, difíceis de encontrar e dependentes de pessoas mais experientes para interpretação.

O ScribeMind AI busca transformar essa documentação passiva em um assistente ativo, capaz de:

- receber documentos;
- indexar conteúdos;
- recuperar trechos relevantes;
- responder perguntas em linguagem natural;
- mostrar fontes;
- associar imagens extraídas de PDFs às respostas.

## Funcionalidades atuais

- Upload de documentos `.md`, `.txt` e `.pdf`
- Extração de texto de PDFs
- Extração de imagens de PDFs
- Salvamento de imagens no Supabase Storage
- Registro de metadados das imagens no banco
- Indexação de documentos no Supabase
- Separação de documentos em chunks
- Chat para consulta dos documentos
- Exibição das fontes usadas na resposta
- Exibição de imagens relacionadas às fontes do chat
- Listagem de documentos indexados
- Visualização de imagens extraídas por documento
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
- Supabase Storage
- pgvector
- OpenAI SDK
- Uvicorn
- pypdf
- PyMuPDF
- Pillow

### Frontend

- React
- Vite
- Tailwind CSS

### Banco de dados

- Supabase Postgres
- Supabase Storage
- pgvector

Tabelas principais:

- `organizations`
- `documents`
- `document_versions`
- `chunks`
- `document_images`
- `conversations`
- `messages`
- `feedback`

## Estrutura do projeto

```txt
scribemind_ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat.py
│   │   │   ├── documents.py
│   │   │   └── health.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   └── supabase_client.py
│   │   ├── services/
│   │   │   ├── document_image_service.py
│   │   │   ├── document_ingestion_service.py
│   │   │   ├── embedding_service.py
│   │   │   ├── pdf_image_service.py
│   │   │   ├── pdf_service.py
│   │   │   └── rag_service.py
│   │   └── main.py
│   ├── documents/
│   ├── scripts/
│   ├── tests/
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md