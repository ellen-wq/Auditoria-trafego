# 📋 ESPECIFICAÇÕES - PÁGINA DE PERFIL

## 🎯 OBJETIVO

Criar a página de visualização do perfil do usuário após o preenchimento do formulário.

---

## 🧩 ESTRUTURA DA TELA

### 1️⃣ HEADER DO PERFIL
- **Foto** (avatar)
- **Nome**
- **Headline profissional** (campo novo)
- **CTA principal:** Botão "Propor Projeto"
- **Botão secundário:** "Editar Perfil"

### 2️⃣ STATUS DE DISPONIBILIDADE
- **Disponível para projetos** (boolean)
- **Horas semanais disponíveis**
- **Modelo de trabalho** → remoto | híbrido | presencial
- **Idiomas** (lista)

### 3️⃣ MÉTRICAS DO PERFIL
- **Total de projetos concluídos**
- **Média de avaliações** (rating)
- **Anos de experiência**

### 4️⃣ SOBRE
- Renderizar: **bio_busca**

### 5️⃣ PROJETOS CONCLUÍDOS
Lista dinâmica contendo:
- **Nome do projeto**
- **Descrição curta**
- **Ano**
- **Tags**
- **Link do portfólio** (opcional)

### 6️⃣ HABILIDADES

#### PRINCIPAIS
Categorias:
- **copywriter**
- **trafego_pago**
- **automacao_ia**

Com nível (0-100).

#### EXTRAS
Lista livre com:
- **Nome**
- **Nível** (0-100)

### 7️⃣ INTERESSES EM PARCERIA
Vem do campo: **objetivo**

Transformar em lista de interesses.

### 8️⃣ DADOS ESPECÍFICOS POR PERFIL

#### 🟣 EXPERT (se mentorado + expert)
Mostrar:
- **tipo_produto**
- **preco**
- **modelo** (perpétuo, lançamento, assinatura)
- **Precisa de:**
  - Tráfego
  - Coprodutor
  - Copy

#### 🤝 COPRODUTOR (se mentorado + coprodutor)
Mostrar:
- **Capacidades:**
  - Faz tráfego
  - Faz lançamento
  - Faz perpétuo
- **Parceria:**
  - Ticket mínimo
  - Percentual mínimo
  - Aceita sociedade
  - Aceita fee + percentual

#### 🔵 PRESTADOR (se aluno)
Mostrar:
- **Serviços** (multi-select: trafego, copy, automacao)
- **Valor mínimo**
- **Modelo de contratação** (remoto, presencial, híbrido, indiferente)

### 9️⃣ DEPOIMENTOS
Estrutura para renderizar:
- **Nome do autor**
- **Texto**
- **Rating**

### 🔘 BOTÃO EDITAR PERFIL
Redireciona para: `/tinder-do-fluxo/perfil`

---

## 🌐 API - RESPONSE ESPERADO

```json
{
  "user": {
    "nome": "Nome do Usuário"
  },
  "profile": {
    "photo_url": "url",
    "headline": "Headline profissional",
    "cidade": "Cidade",
    "whatsapp": "WhatsApp",
    "objetivo": "Objetivo",
    "bio_busca": "Bio de busca",
    "modelo_trabalho": "remoto|presencial|hibrido",
    "disponivel": true,
    "horas_semanais": 20,
    "anos_experiencia": 5,
    "idiomas": ["Português", "Inglês"]
  },
  "expertDetails": {
    "tipo_produto": "Tipo",
    "preco": 1000,
    "modelo": "perpétuo",
    "precisa_trafego": true,
    "precisa_coprodutor": false,
    "precisa_copy": true
  },
  "coprodutorDetails": {
    "faz_trafego": true,
    "faz_lancamento": true,
    "faz_perpetuo": false,
    "ticket_minimo": 5000,
    "percentual_minimo": 30,
    "aceita_sociedade": true,
    "aceita_fee_percentual": true
  },
  "prestadorDetails": {
    "servicos": ["trafego", "copy"],
    "valor_minimo": 2000,
    "modelo_contratacao": "remoto"
  },
  "skills": [
    {
      "categoria": "copywriter",
      "nivel": 80
    }
  ],
  "skillsExtra": [
    {
      "nome": "Design",
      "nivel": 60
    }
  ],
  "projects": [
    {
      "nome": "Projeto X",
      "descricao": "Descrição",
      "ano": 2024,
      "tags": ["tag1", "tag2"],
      "link": "https://..."
    }
  ],
  "metrics": {
    "total_projetos": 5,
    "rating": 4.5
  },
  "isExpert": true,
  "isCoprodutor": false
}
```

---

## 🧠 COMPORTAMENTO POR TIPO DE USUÁRIO

### 🟣 MENTORADO
- Pode ter: **Expert** OU **Coprodutor** OU **ambos**
- Mostrar seções condicionais baseado em `isExpert` e `isCoprodutor`

### 🔵 ALUNO
- Perfil é automaticamente do tipo: **Prestador**
- Mostrar seção de Prestador sempre

---

## 🪝 HOOKS

### `useProfileView(userId?)`
- Busca dados via `GET /api/tinder-do-fluxo/profile/me`
- Se `userId` for fornecido, busca perfil de outro usuário
- Retorna: `{ data, isLoading, error }`

---

## ⚡ UX

- **Skeleton loading** enquanto busca dados
- **Estado de erro** com retry
- **Botão "Propor Projeto"** (funcionalidade futura)

---

## ✅ RESULTADO FINAL

Após salvar o formulário:
1. Usuário vê mensagem: "Perfil salvo com sucesso!"
2. Redirecionamento automático para `/tinder-do-fluxo/profile-view`
3. Página renderiza com todas as seções preenchidas
4. Dados específicos aparecem condicionalmente (Expert/Coprodutor/Prestador)

---

## 🔗 ROTAS

- **Formulário:** `/tinder-do-fluxo/perfil`
- **Visualização:** `/tinder-do-fluxo/profile-view`
- **Editar:** Botão no header redireciona para `/tinder-do-fluxo/perfil`
