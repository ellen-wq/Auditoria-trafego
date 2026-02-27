# 📋 Resumo das Mudanças: Expert/Coprodutor Obrigatório

## ✅ Mudanças Implementadas

### 1. **Expert/Coprodutor Obrigatório para MENTORADOS**

#### Frontend (`TinderPerfilPage`):
- ✅ Campo Expert/Coprodutor agora é **obrigatório**
- ✅ Validação no frontend: deve selecionar pelo menos um (Expert OU Coprodutor, ou ambos)
- ✅ Mensagem de erro se não selecionar nenhum
- ✅ Campos "Objetivo" e "Bio de busca" sempre visíveis (não dependem mais de seleção)
- ✅ Indicador visual (*) mostrando que é obrigatório

#### Backend (`/api/tinder-do-fluxo/expert-profile`):
- ✅ Validação no backend: retorna erro 400 se MENTORADO não selecionar Expert ou Coprodutor
- ✅ Sempre salva expert profile quando salva mentor profile (cria padrão se não existir)

### 2. **Feed Expert/Coprodutor Mostra TODOS os MENTORADOS**

#### Backend (`/api/tinder-do-fluxo/feed/expert`):
- ✅ **Removido filtro** que mostrava apenas quem tinha `is_expert` ou `is_coproducer`
- ✅ Agora mostra **TODOS os MENTORADOS** com perfil mentor
- ✅ Como Expert/Coprodutor é obrigatório, todos devem aparecer

### 3. **Scripts SQL Criados**

#### `ensure-all-mentorados-have-expert-profile.sql`:
- Cria perfil expert padrão (ambos marcados) para MENTORADOS que não têm
- Execute este script para garantir que todos os mentorados existentes tenham perfil expert

#### `cleanup-invalid-profiles.sql`:
- Remove perfis órfãos (sem user_roles correspondente)
- Remove perfis expert de PRESTADORES (não podem ser expert)
- Remove perfis service de não-PRESTADORES
- Lista todos os perfis mentor com nomes para verificação

### 4. **Comunidade - Apenas Feed (Sem Criar Posts)**

A página Comunidade já está correta:
- ✅ Apenas mostra lista de mentorados
- ✅ Não tem funcionalidade de criar posts/insights
- ✅ É apenas um feed de visualização

## 📝 Próximos Passos

### 1. Execute os Scripts SQL no Supabase:

1. **Primeiro:** `cleanup-invalid-profiles.sql`
   - Limpa dados inválidos
   - Remove perfis órfãos

2. **Depois:** `ensure-all-mentorados-have-expert-profile.sql`
   - Garante que todos os MENTORADOS tenham perfil expert

### 2. Teste no Sistema:

1. Acesse `/tinder-do-fluxo/perfil` como MENTORADO
2. Tente salvar sem selecionar Expert/Coprodutor → deve dar erro
3. Selecione Expert OU Coprodutor (ou ambos) → deve salvar
4. Acesse `/tinder-do-fluxo/expert` → deve mostrar TODOS os mentorados

### 3. Verificar Logs:

Quando acessar as páginas, verifique os logs:
- `[Feed Expert] Retornando X usuários (todos os mentorados com perfil)`
- `[POST /mentor-profile] Criando perfil expert padrão para MENTORADO`

## 🔍 Estrutura Final

### MENTORADO deve ter:
1. ✅ `tinder_mentor_profiles` - Perfil básico (obrigatório)
2. ✅ `tinder_expert_profiles` - Perfil Expert/Coprodutor (obrigatório, pelo menos um marcado)

### PRESTADOR deve ter:
1. ✅ `tinder_service_profiles` - Perfil de prestador (obrigatório)

### LIDERANCA:
- Pode ter perfis opcionais (não obrigatório)
