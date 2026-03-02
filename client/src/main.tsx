// Version: 2024-02-28-001
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary'
import './styles/global.css'
import './components/skeletons/skeleton.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 segundos
      refetchOnWindowFocus: false,
    },
  },
})

const CHUNK_RELOAD_KEY = 'fluxer_chunk_reload_once'

function getErrorMessage(error: unknown): string {
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message || ''
  return String(error)
}

function isChunkLoadError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return (
    message.includes('loading chunk') ||
    message.includes('failed to fetch dynamically imported module') ||
    message.includes('importing a module script failed') ||
    message.includes('dynamically imported module')
  )
}

function reloadOnceForChunkError(): boolean {
  try {
    const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'
    if (alreadyReloaded) return false
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  } catch {
    // Se storage estiver indisponível, ainda tentamos recarregar uma vez.
  }
  window.location.reload()
  return true
}

window.addEventListener('error', (event) => {
  const candidate = (event as ErrorEvent).error ?? (event as ErrorEvent).message
  if (isChunkLoadError(candidate)) {
    const reloaded = reloadOnceForChunkError()
    if (reloaded) event.preventDefault()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkLoadError(event.reason)) {
    const reloaded = reloadOnceForChunkError()
    if (reloaded) event.preventDefault()
  }
})

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Elemento root não encontrado.')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>
)

// Esconde o fallback "página não carregou" quando o app monta com sucesso
const loadFallback = document.getElementById('load-fallback')
if (loadFallback) loadFallback.remove()

setTimeout(() => {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
  } catch {
    // Ignora indisponibilidade de storage.
  }
}, 3000)
