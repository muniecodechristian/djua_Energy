import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'

const root = document.documentElement
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
const THEME_KEY = 'djua-theme'

const applyTheme = (isDark) => {
  root.classList.toggle('dark', isDark)
  root.dataset.theme = isDark ? 'dark' : 'light'
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

const getPreferredTheme = () => {
  const savedTheme = localStorage.getItem(THEME_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme === 'dark'
  return mediaQuery.matches
}

applyTheme(getPreferredTheme())

const syncSystemTheme = () => {
  if (localStorage.getItem(THEME_KEY) === 'dark' || localStorage.getItem(THEME_KEY) === 'light') {
    return
  }

  applyTheme(mediaQuery.matches)
}

if (typeof mediaQuery.addEventListener === 'function') {
  mediaQuery.addEventListener('change', syncSystemTheme)
} else if (typeof mediaQuery.addListener === 'function') {
  mediaQuery.addListener(syncSystemTheme)
}

// 1. Initialisation du Query Client de TanStack
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Évite de recharger les données dès que tu changes d'onglet
      retry: 1,                   // Nombre de tentatives en cas d'échec d'une requête
      staleTime: 1000 * 60 * 5,   // Les données sont considérées comme fraîches pendant 5 minutes
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter> 
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)