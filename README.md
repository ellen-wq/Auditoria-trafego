# Fluxer - Auditoria de Tráfego

Sistema de auditoria semanal automática de tráfego de Facebook Ads para mentorados.

## Requisitos

- **Node.js** v18 ou superior — [Download](https://nodejs.org/)

## Instalação

```bash
npm install
```

## Executar

```bash
npm start
```

O sistema estará disponível em **http://localhost:3000**

## Usuários

- **Mentorado**: qualquer email cadastrado
- **Liderança**: `ellen@vtsd.com.br` ou `fernanda@vtsd.com.br` (detectado automaticamente no cadastro)

## Funcionalidades

### Mentorado
- Dashboard pessoal com KPIs
- Upload de planilha do Gerenciador de Anúncios (.xlsx / .csv)
- Análise automática por campanha (Cenários 1, 2 e 3)
- Recomendações práticas e didáticas
- Histórico de auditorias

### Liderança
- Dashboard consolidado com dados de todos os mentorados
- Lista de mentorados com métricas
- Visualização de auditorias de qualquer mentorado (somente leitura)
- Gráfico de distribuição de cenários

## Stack

- **Frontend**: HTML + CSS + JS vanilla
- **Backend**: Node.js + Express
- **Banco**: SQLite (via better-sqlite3)
- **Auth**: JWT
- **Parser**: SheetJS (xlsx) + PapaParse (csv)
