# Página do perfil – `/tinder-do-fluxo/perfil`

## Implementado (atual)

### Visualização do perfil (meu perfil, mentorado)

- Em **`/tinder-do-fluxo/perfil`** (sem `?edit=true`), quando o usuário tem perfil e é **Expert ou Coprodutor**, é exibido o **ProfileMentoradoLayout** (layout novo):
  - Card com faixa gradient no topo, foto, **badge Expert ou Coprodutor** (não "PRO"), nome, cidade, botão "Editar Perfil".
  - **Sobre mim** = bio (`bio_busca`).
  - **Objetivos de parceria** = texto do objetivo (`goal_text` / `objetivo`).
  - **Grid de cards** logo abaixo (sem título "Projetos"/"Produtos"): **Coprodutor** → cards de Projetos; **Expert** → cards de Produtos (estilo spec: ícone check_circle, título, descrição). Variável `--bg-secondary: #f8fafc` para fundo dos cards.
  - **Depoimentos** na sequência.
  - Coluna direita: **Necessidades** (Expert) ou **Capacidades** (Coprodutor), **Nível no Fluxo** (barra + "Próximo nível: [nome do próximo nível]"), **Avaliação** (estrelas).

### Nível no Fluxo

- **Valor salvo:** o nível "Pro +" é persistido como **"Pro +"** (não `pro-plus`). No formulário, opção com `value: 'Pro +', label: 'Pro +'`.
- **Card na view:** exibe "Próximo nível: [nome]" na ordem: **Newbie → Soft → Hard → Pro → Pro + → Master**. Quem está em Master não exibe linha de próximo nível.
- **Dados antigos:** perfis com `nivel_fluxo_label = 'pro-plus'` podem ser corrigidos com o script `scripts/fix-nivel-fluxo-pro-plus.sql`. O formulário exibe "Pro +" ao carregar valor antigo.

### Componentes do layout mentorado

- `ProfileMentoradoLayout`, `ProfileMentoradoIdentity`, `ProfileMentoradoProjectsCards`, `ProfileMentoradoProductsCards`, `ProfileMentoradoNeedsOrCapabilities`, `ProfileMentoradoNivelFluxo`, `ProfileMentoradoRatingStars`.

---

## Como funciona hoje

### Roteamento

- **Rota:** `App.tsx` → `/tinder-do-fluxo/perfil` → `ProfileRouterPage` (protegida por `ProtectedRoute`).
- **Query `?edit=true`:**
  - Em `ProfileRouterPage`, `forceEdit = searchParams.get('edit') === 'true'`.
  - Se `forceEdit === true` → **sempre** renderiza o formulário (`ProfileFormPage`), mesmo que o usuário já tenha perfil.
  - Se não tiver `edit=true`: primeiro chama `/api/tinder-do-fluxo/profile-check`; se tiver perfil → `ProfileViewPage`; se não tiver → `ProfileFormPage`.

Ou seja: **`/tinder-do-fluxo/perfil?edit=true` sempre abre o formulário de edição.**

### Fluxo de dados do formulário atual

1. **Carregamento:** `useProfileFormNew` chama `GET /api/tinder-do-fluxo/profile/me` (via `ProfileService.getProfile`), que lê:
   - `user_roles` (nome)
   - `tinder_mentor_profiles` (ou `tinder_service_profiles` para aluno)
   - `expert_products`, `profile_skills`, `profile_skills_extra`, `profile_projects`, etc.
2. **Estado:** Os dados são normalizados para `ProfileFormData` (headline, cidade, whatsapp, bio_busca, skills, expert/coprodutor/prestador, etc.) e mantidos em estado local em `ProfileFormPage` (`localFormData`).
3. **Salvar:** No submit, o cliente monta um payload com `profile`, `skills`, `projects`, `expert`/`coprodutor`/`prestador` e chama `PUT /api/tinder-do-fluxo/profile`. O `ProfileService.updateProfile` persiste em:
   - `tinder_mentor_profiles` (campos base + `nivel_fluxo_label`, `nivel_fluxo_percent`, flags expert/coprodutor, necessidades/capacidades)
   - `expert_products`, `profile_skills`, `profile_skills_extra`, `profile_projects`, etc.

### Campos que o formulário atual já tem

- **Foto:** upload via `POST /api/tinder-do-fluxo/profile/avatar`; valor em `photo_url`.
- **Nome:** exibido como somente leitura vindo de `user?.name` (não editável no form).
- **Headline:** campo “Headline Profissional” → `headline` no perfil.
- **Cidade:** → `city` em `tinder_mentor_profiles`.
- **WhatsApp:** DDD + número → `whatsapp`.
- **Anos de experiência / Horas semanais / Idiomas:** salvos no perfil.
- **Bio:** textarea → `bio_busca` (mapeado para `bio` / `search_bio` no backend).
- **Disponibilidade:** checkboxes (Projetos, Parcerias, Coprodução, Sociedade) → `availability_tags`.
- **Tipo mentorado:** Expert ou Coprodutor (mutuamente exclusivo) → `is_expert` / `is_coproducer`.
- **Seções Expert/Coprodutor/Prestador:** produtos, necessidades, capacidades, serviços, etc.
- **Habilidades e projetos:** `SkillsSection`, `ProjectsSection`.

O backend já suporta no perfil mentorado, entre outros:

- `nivel_fluxo_label` e `nivel_fluxo_percent` (usados na Profile View).
- Colunas `instagram` e `niche` existem em migrações em `tinder_mentor_profiles`, mas **não** são preenchidas pelo formulário nem pelo `ProfileService.updateProfile` hoje.

---

## Sua especificação (HTML “Perfil do Mentorado”)

O HTML que você descreveu é uma versão **enxuta** do formulário, com:

| Campo no HTML | Descrição |
|---------------|-----------|
| Foto | Upload + “Alterar” / “Remover” |
| Nome completo | Texto (no HTML: “Alexandre Silva”) |
| Cidade | Ex: “Curitiba, PR” |
| Instagram | Com prefixo “@” (ex: “alexfluxo”) |
| Nicho | Ex: “Marketing Digital” |
| Nível no Fluxo | Select: Newbie, Soft, Hard, Pro, **Pro +** (valor salvo `"Pro +"`), Master |
| Bio | Textarea, máx. 250 caracteres |
| Botão “Ver como outros veem” | Abre a visualização do perfil |
| Botão “Salvar Alterações” | Submete o formulário |

Estilo: Tailwind (primary `#A3E635`), Public Sans, card branco, cantos arredondados, Material Symbols.

---

## Como funcionaria com essa especificação

### Mapeamento direto (já existente no sistema)

- **Foto** → mesmo fluxo atual: `photo_url` + endpoint de avatar.
- **Cidade** → `localFormData.cidade` → `city` em `tinder_mentor_profiles`.
- **Bio** → `localFormData.bio_busca`; no backend já existe limite de tamanho; no front basta `maxLength={250}` e o aviso “Máximo 250 caracteres”.
- **Nome completo** → hoje vem de `user?.name` (somente leitura). Na spec pode continuar só leitura ou, se no futuro o nome for editável, aí seria preciso campo em `user_roles.name` (ou onde o nome for armazenado) e enviar no payload.
- **“Ver como outros veem”** → `navigate('/tinder-do-fluxo/profile-view')` (ou a rota que for a view pública do próprio perfil).
- **“Salvar Alterações”** → mesmo `handleSubmit` que chama `save(localFormData)` e depois pode redirecionar para a view ou manter na página com mensagem de sucesso.

### Campos que precisam ser adicionados no form e no fluxo de dados

1. **Instagram**
   - No **front:** adicionar em `ProfileFormData` algo como `instagram?: string` (só o usuário, sem “@”; na UI exibir “@” fixo).
   - No **backend:** em `ProfileService.updateProfile`, ao montar `profileData` para `tinder_mentor_profiles`, incluir `instagram: payload.profile.instagram ?? ''` (e no `getProfile` já retornar `instagram` do `mentorProfile` no objeto `profile`).
   - A coluna `instagram` já existe em `tinder_mentor_profiles` em várias migrações.

2. **Nicho**
   - No **front:** adicionar em `ProfileFormData` algo como `nicho?: string`.
   - No **backend:** incluir no `profileData` do mentorado `niche: payload.profile.nicho ?? ''` (ou o nome da coluna que for `niche` na tabela) e no `getProfile` mapear para `profile.nicho` se a coluna existir.
   - A coluna `niche` em `tinder_mentor_profiles` aparece em migrações (ex.: `supabase-migration.sql`).

3. **Nível no Fluxo** *(implementado)*
   - No **front:** select com valores `newbie` | `soft` | `hard` | `pro` | **`Pro +`** | `master`. O valor salvo para "Pro +" é **"Pro +"** (não `pro-plus`). Guardado em `nivel_fluxo_label` e opcionalmente `nivel_fluxo_percent`.
   - No **backend:** `ProfileService.updateProfile` persiste `nivel_fluxo_label` e `nivel_fluxo_percent` em `tinder_mentor_profiles`.
   - Na **view:** o card "Nível no Fluxo" mostra "Próximo nível: [nome do próximo na ordem]". Ordem: Newbie → Soft → Hard → Pro → Pro + → Master.

### Ajustes de UI para ficar igual ao HTML

- **Layout:** trocar o formulário atual por um layout alinhado ao HTML: header com título “Perfil do Mentorado” e botão “Ver como outros veem”; card único com foto (circular, botão de edição), depois grid 2 colunas (Nome, Cidade, Instagram, Nicho, Nível no Fluxo), bio em largura total, contador “Máximo 250 caracteres”, rodapé com “Salvar Alterações”.
- **Estilo:** usar os tokens do projeto (ou, se for aceitável, Tailwind como no HTML) com primary `#A3E635`, bordas arredondadas e tipografia alinhada ao spec.
- **Foto:** manter upload atual; “Remover” pode setar `photo_url` para `''` e chamar um endpoint de “remover avatar” se existir, ou apenas limpar no estado e salvar.

### Comportamento de `?edit=true`

Continua igual: **`/tinder-do-fluxo/perfil?edit=true`** sempre mostra o formulário (agora no layout “Perfil do Mentorado” com os campos acima). Não é necessário mudar a lógica do `ProfileRouterPage`.

### Resumo do que implementar

1. **Front (ProfileFormPage + useProfileFormNew):**
   - Incluir no estado e no payload: `instagram`, `nicho`, `nivel_fluxo_label` (e opcionalmente `nivel_fluxo_percent`).
   - Adicionar no formulário: campo Instagram (com “@” fixo), campo Nicho, select Nível no Fluxo, e limite de 250 caracteres na bio com texto de ajuda.
   - Adicionar botão “Ver como outros veem” que navega para a view do perfil.
   - (Opcional) Refatorar o layout do form para o card único do HTML (foto, grid, bio, botão salvar e card de dica “Mantenha seu perfil atualizado”).

2. **Back (ProfileService):**
   - Em `getProfile` (mentorado): garantir que `profile` inclua `instagram` e `niche` (ou `nicho`) a partir de `tinder_mentor_profiles`.
   - Em `updateProfile` (mentorado): em `profileData`, setar `instagram` e `niche` a partir de `payload.profile` (e já está setando `nivel_fluxo_label` / `nivel_fluxo_percent`).

3. **Banco:** Colunas `instagram`, `niche` e `nivel_fluxo_label`/`nivel_fluxo_percent` já aparecem em migrações; basta garantir que estejam aplicadas no ambiente em que você roda.

Com isso, a página **`/tinder-do-fluxo/perfil?edit=true`** passa a funcionar de acordo com a especificação do HTML “Perfil do Mentorado” e a persistir todos os campos no mesmo fluxo atual de perfil (profile-check → profile/me → PUT profile).
