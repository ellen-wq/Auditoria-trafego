#!/bin/bash

echo "🔄 Forçando atualização completa..."

# Parar processos na porta 5174
echo "⏹️  Parando servidor..."
lsof -ti:5174 | xargs kill -9 2>/dev/null || true

# Limpar todos os caches
echo "🧹 Limpando caches..."
cd client
rm -rf node_modules/.vite .vite dist .vite-cache
touch src/main.tsx src/pages/ProfileViewPage.tsx src/pages/ProfileFormPage.tsx

# Adicionar timestamp ao main.tsx para forçar reload
TIMESTAMP=$(date +%s)
sed -i.bak "1s|^|// FORCE-RELOAD: $TIMESTAMP\n|" src/main.tsx 2>/dev/null || \
sed -i '' "1s|^|// FORCE-RELOAD: $TIMESTAMP\n|" src/main.tsx

echo "✅ Cache limpo!"
echo ""
echo "🚀 Iniciando servidor..."
echo "   Acesse: http://localhost:5174/tinder-do-fluxo/perfil"
echo ""
echo "⚠️  IMPORTANTE: No navegador, faça:"
echo "   1. Abra DevTools (F12)"
echo "   2. Clique com botão direito no botão de recarregar"
echo "   3. Escolha 'Esvaziar cache e atualizar forçadamente'"
echo "   OU use: Cmd+Shift+R (Mac) ou Ctrl+Shift+R (Windows)"
echo ""

npm run dev
