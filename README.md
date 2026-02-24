# Fluxer Auditoria de Tráfego

Sistema de auditoria semanal automatizada de tráfego Facebook Ads para mentores e mentorados.

## Tecnologias

### Backend
- **Node.js** + **Express** (TypeScript)
- **Supabase** (PostgreSQL) via `@supabase/supabase-js`
- **JWT** para autenticação
- **Multer** para upload de arquivos
- **SheetJS** + **PapaParse** para parsing de planilhas

### Frontend
- **React 18** + **TypeScript**
- **Vite** como build tool
- **React Router** para navegação SPA
- Design system customizado (Fluxer)

## Estrutura do Projeto

```
├── src/                    # Backend TypeScript
│   ├── server.ts           # Entry point
│   ├── types.ts            # Interfaces e tipos
│   ├── db/database.ts      # Cliente Supabase
│   ├── middleware/          # Auth e Upload
│   ├── routes/             # Rotas da API
│   ├── engine/rules.ts     # Motor de regras
│   └── utils/parser.ts     # Parser de planilhas
├── client/                 # Frontend React
│   ├── src/
│   │   ├── main.tsx        # Entry point
│   │   ├── App.tsx         # Rotas
│   │   ├── components/     # Sidebar, Layout, ProtectedRoute
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # API service
│   │   ├── utils/          # Formatação
│   │   └── styles/         # CSS global
│   ├── vite.config.ts
│   └── package.json
├── dist/                   # Backend compilado
├── public_dist/            # Frontend compilado
├── tsconfig.json           # Config TS backend
└── package.json            # Dependências backend
```

## Scripts

```bash
# Instalar dependências
npm install
cd client && npm install

# Desenvolvimento
npm run dev              # Backend com ts-node
npm run dev:client       # Frontend com Vite (HMR)

# Build de produção
npm run build            # Compila backend + frontend
npm start                # Inicia servidor de produção
```

## API Endpoints

- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do usuário
- `POST /api/audits` - Nova auditoria (upload)
- `GET /api/audits` - Listar auditorias
- `GET /api/audits/:id` - Detalhe da auditoria
- `GET /api/admin/summary` - Dashboard liderança
- `GET /api/admin/users` - Listar mentorados
- `GET /api/creatives/*` - Engenharia reversa de criativos

## Rotas Frontend (SPA)

- `/login` - Login
- `/register` - Cadastro
- `/app/upload` - Nova auditoria
- `/app/resultado/:id` (ou `/app/resultado?id=...`) - Resultado da auditoria
- `/app/historico` - Histórico de auditorias
- `/app/criativos` - Engenharia reversa (mentorado)
- `/app/perfil` - Perfil
- `/admin/dashboard` - Dashboard liderança
- `/admin/mentorados` - Lista de mentorados
- `/admin/mentorados/:id` - Detalhe do mentorado
- `/admin/criativos` - Criativos consolidados da liderança

## Mapeamento Legado -> React

- `/index.html` -> `/login`
- `/login.html` -> `/login`
- `/register.html` -> `/register`
- `/app/dashboard.html` -> `/app/upload`
- `/app/auditoria-upload.html` -> `/app/upload`
- `/app/auditoria-resultado.html?id=123` -> `/app/resultado/123` (compatível também com querystring)
- `/app/historico.html` -> `/app/historico`
- `/app/criativos.html` -> `/app/criativos`
- `/app/perfil.html` -> `/app/perfil`
- `/admin/dashboard.html` -> `/admin/dashboard`
- `/admin/mentorados.html` -> `/admin/mentorados`
- `/admin/mentorados-detalhe.html?id=7` -> `/admin/mentorados/7`
- `/admin/criativos.html` -> `/admin/criativos`
