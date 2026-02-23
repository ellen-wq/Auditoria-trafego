# Fluxer Auditoria de Tráfego

Sistema de auditoria semanal automatizada de tráfego Facebook Ads para mentores e mentorados.

## Tecnologias

### Backend
- **Node.js** + **Express** (TypeScript)
- **sql.js** (SQLite em memória com persistência)
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
│   ├── db/database.ts      # Banco de dados SQLite
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
