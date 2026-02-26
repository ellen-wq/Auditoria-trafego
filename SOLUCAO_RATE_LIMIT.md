# Solução para "email rate limit exceeded"

## Problema
O Supabase tem um limite de envio de emails por hora. Em desenvolvimento, isso pode ser um problema.

## Soluções

### Opção 1: Desabilitar confirmação de email no Supabase (Recomendado para desenvolvimento)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Authentication** > **Settings**
4. Em **Email Auth**, desabilite:
   - ✅ **Enable email confirmations** (desmarque)
   - Ou configure para **"Auto Confirm"** (usuários são confirmados automaticamente)

### Opção 2: Usar Admin API para criar usuários (já implementado no código)

O código já foi atualizado para não enviar email de confirmação. Mas se ainda der erro, você pode:

1. Verificar se o Supabase está configurado para não exigir confirmação de email
2. Usar a Admin API diretamente (já está sendo usada no código de seed)

### Opção 3: Aguardar o rate limit resetar

O rate limit geralmente reseta após 1 hora. Você pode:
- Aguardar 1 hora
- Ou usar uma conta de email diferente temporariamente

## Verificação

Após desabilitar a confirmação de email no Supabase Dashboard, tente registrar novamente.

## Nota

O código já foi atualizado para não enviar email de confirmação (`emailRedirectTo: undefined`), mas o Supabase ainda pode tentar enviar se a configuração do projeto exigir confirmação.
